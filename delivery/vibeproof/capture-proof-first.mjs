import { spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = here
const port = 9242
const userDataDir = path.join(tmpdir(), `vibeproof-proof-first-${Date.now()}`)
const appUrl = process.env.VIBEPROOF_URL || 'http://127.0.0.1:5173/'

const shots = [
  {
    name: 'proof-brief-desktop',
    fileName: 'vibeproof-proof-brief-desktop-1440.png',
    url: appUrl,
    viewport: { width: 1440, height: 900, mobile: false },
  },
  {
    name: 'proof-brief-laptop',
    fileName: 'vibeproof-proof-brief-laptop-1280.png',
    url: appUrl,
    viewport: { width: 1280, height: 720, mobile: false },
  },
  {
    name: 'proof-brief-tablet',
    fileName: 'vibeproof-proof-brief-tablet-834.png',
    url: appUrl,
    viewport: { width: 834, height: 1194, mobile: true },
  },
  {
    name: 'proof-brief-mobile',
    fileName: 'vibeproof-proof-brief-mobile-390.png',
    url: appUrl,
    viewport: { width: 390, height: 844, mobile: true },
  },
  {
    name: 'studio-desktop',
    fileName: 'vibeproof-studio-workspace-desktop-1440.png',
    url: `${appUrl.replace(/#.*$/, '')}#studio`,
    viewport: { width: 1440, height: 900, mobile: false },
  },
]

async function waitForOk(url, timeout = 20000) {
  const started = Date.now()
  let lastError
  while (Date.now() - started < timeout) {
    try {
      const result = await fetch(url)
      if (result.ok) return
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  throw lastError || new Error(`Timed out waiting for ${url}`)
}

async function waitForJson(url, timeout = 15000) {
  const started = Date.now()
  let lastError
  while (Date.now() - started < timeout) {
    try {
      const result = await fetch(url)
      if (result.ok) return result.json()
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw lastError || new Error(`Timed out waiting for ${url}`)
}

async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) reject(new Error(message.error.message))
      else resolve(message.result)
    }
  })

  return {
    send(method, params = {}) {
      const callId = ++id
      ws.send(JSON.stringify({ id: callId, method, params }))
      return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }))
    },
    close() {
      ws.close()
    },
  }
}

async function evalJs(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed')
  }
  return result.result.value
}

async function capture(client, shot) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: shot.viewport.width,
    height: shot.viewport.height,
    deviceScaleFactor: 1,
    mobile: shot.viewport.mobile,
  })
  await client.send('Page.navigate', { url: shot.url })
  await new Promise((resolve) => setTimeout(resolve, 900))

  const state = await evalJs(client, `(() => {
    const root = document.documentElement;
    const body = document.body;
    const buttons = [...document.querySelectorAll('button, a')].map((el) => {
      const rect = el.getBoundingClientRect();
      const text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
      return { text, width: Math.round(rect.width), height: Math.round(rect.height), visible: rect.width > 0 && rect.height > 0 };
    }).filter((item) => item.visible);
    const smallTouchTargets = buttons.filter((item) => item.height < 38 || item.width < 38);
    const visibleText = body.innerText;
    return {
      url: location.href,
      hash: location.hash,
      title: document.title,
      hasProofBrief: /VibeProof Studio/.test(visibleText) && /Local AI app builder that runs in your browser tab/.test(visibleText),
      hasStudioCta: /Launch Local Studio/.test(visibleText),
      hasStudio: /Prompt, compile, verify, repair/.test(visibleText),
      hasVerification: /Verification Path/.test(visibleText),
      hasCloudBoundary: /0 cloud AI prompt APIs/.test(visibleText) || /0 cloud AI \\/ prompt API requests/.test(visibleText),
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      scrollHeight: Math.max(root.scrollHeight, body.scrollHeight),
      clientHeight: root.clientHeight,
      horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
      smallTouchTargets,
    };
  })()`)

  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    fromSurface: true,
  })
  await writeFile(path.join(outDir, shot.fileName), Buffer.from(screenshot.data, 'base64'))
  return { ...shot, state }
}

async function clickStudioCtaCheck(client) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await client.send('Page.navigate', { url: appUrl })
  await new Promise((resolve) => setTimeout(resolve, 700))
  await evalJs(client, `([...document.querySelectorAll('button')].find((button) => /Launch Local Studio/.test(button.textContent || '')))?.dispatchEvent(new MouseEvent('click', { bubbles: true }))`)
  await new Promise((resolve) => setTimeout(resolve, 500))
  return evalJs(client, `(() => ({
    hash: location.hash,
    hasStudio: /Prompt, compile, verify, repair/.test(document.body.innerText),
    hasBuilderPanel: Boolean(document.getElementById('builder-panel')),
  }))()`)
}

async function reducedMotionCheck(client) {
  await client.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  await client.send('Page.navigate', { url: appUrl })
  await new Promise((resolve) => setTimeout(resolve, 500))
  const state = await evalJs(client, `(() => ({
    hasProofBrief: /VibeProof Studio/.test(document.body.innerText),
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  }))()`)
  await client.send('Emulation.setEmulatedMedia', { features: [] })
  return state
}

async function main() {
  await waitForOk(appUrl)
  await mkdir(outDir, { recursive: true })
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ], { stdio: 'ignore' })

  let client
  try {
    const targets = await waitForJson(`http://127.0.0.1:${port}/json/list`)
    const pageTarget = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl)
    if (!pageTarget) throw new Error('No Chrome page target found')
    client = await cdp(pageTarget.webSocketDebuggerUrl)
    await client.send('Page.enable')
    await client.send('Runtime.enable')

    const captured = []
    for (const shot of shots) captured.push(await capture(client, shot))
    const studioCta = await clickStudioCtaCheck(client)
    const reducedMotion = await reducedMotionCheck(client)
    const report = {
      generatedAt: new Date().toISOString(),
      runner: 'local-chrome-cdp',
      appUrl,
      captured,
      studioCta,
      reducedMotion,
    }
    await writeFile(path.join(outDir, 'proof-first-responsive-report.json'), `${JSON.stringify(report, null, 2)}\n`)
    console.log(JSON.stringify(report, null, 2))
  } finally {
    try {
      if (client) client.close()
    } catch {
      // best effort
    }
    chrome.kill()
    await new Promise((resolve) => setTimeout(resolve, 400))
    await rm(userDataDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

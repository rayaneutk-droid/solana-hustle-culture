import { spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const here = path.dirname(fileURLToPath(import.meta.url))
const reportPath = path.join(here, 'public-url-verification.json')
const port = 9243
const userDataDir = path.join(tmpdir(), `vibeproof-public-url-${Date.now()}`)
const rawUrl = process.env.VIBEPROOF_URL || 'http://127.0.0.1:5173/'
const appUrl = rawUrl.endsWith('/') || rawUrl.includes('#') ? rawUrl : `${rawUrl}/`
const studioUrl = `${appUrl.replace(/#.*$/, '')}#studio`
const targetHostname = new URL(appUrl).hostname
const isLocalTarget = ['127.0.0.1', 'localhost'].includes(targetHostname)
const desktopViewport = { name: 'desktop', width: 1440, height: 900, mobile: false }
const mobileViewport = { name: 'mobile', width: 390, height: 844, mobile: true }

const checks = []

function addCheck(label, ok, details = {}) {
  checks.push({ label, ok, details })
}

async function waitForOk(url, timeout = 20000) {
  const started = Date.now()
  let lastError
  while (Date.now() - started < timeout) {
    try {
      const result = await fetch(url, { redirect: 'follow' })
      if (result.ok) return { status: result.status, url: result.url }
      lastError = new Error(`HTTP ${result.status} for ${url}`)
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
      lastError = new Error(`HTTP ${result.status} for ${url}`)
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

async function inspectRoute(client, url, viewport) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  })
  await client.send('Page.navigate', { url })
  await new Promise((resolve) => setTimeout(resolve, 900))
  return evalJs(client, `(() => {
    const root = document.documentElement;
    const text = document.body.innerText;
    const controls = [...document.querySelectorAll('button, a, input, select, textarea, [role="button"]')]
      .map((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return {
          text: (el.textContent || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
        };
      })
      .filter((item) => item.visible);
    const smallTouchTargets = controls.filter((item) => item.width < 38 || item.height < 38);
    return {
      viewport: ${JSON.stringify(viewport)},
      url: location.href,
      hash: location.hash,
      title: document.title,
      hasProofBrief: /VibeProof Studio/.test(text) && /Local AI app builder that runs in your browser tab/.test(text),
      hasStudioCta: /Launch Local Studio/.test(text),
      hasVerificationPath: /Verification Path/.test(text),
      hasCloudBoundary: /0 cloud AI prompt APIs/.test(text) || /0 cloud AI \\/ prompt API requests/.test(text),
      hasStudio: /Prompt, compile, verify, repair/.test(text),
      hasBuilderPanel: Boolean(document.getElementById('builder-panel')),
      hasLocalBackend: /Local backend/.test(text),
      hasPwaPanel: /PWA cache/.test(text) || /PWA\\/offline boundary/.test(text),
      hasNetworkProof: /Network proof/.test(text) || /No cloud AI requests observed/.test(text),
      hasMobileTabbar: Boolean(document.querySelector('.mobile-tabbar')),
      hasForbiddenAccountPrompt: /sign in|connect wallet|api key|openrouter|gemini|groq/i.test(text),
      horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      visibleControlCount: controls.length,
      smallTouchTargets
    };
  })()`)
}

async function checkStaticAsset(relativePath) {
  try {
    const result = await fetch(new URL(relativePath, appUrl))
    return { ok: result.ok, status: result.status, contentType: result.headers.get('content-type') }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

async function main() {
  await mkdir(here, { recursive: true })

  let rootFetch
  try {
    rootFetch = await waitForOk(appUrl)
    addCheck('App URL responds successfully.', true, rootFetch)
  } catch (error) {
    addCheck('App URL responds successfully.', false, { appUrl, error: error.message })
  }

  const manifest = await checkStaticAsset('manifest.webmanifest')
  addCheck('PWA manifest is reachable.', manifest.ok, manifest)
  const sw = await checkStaticAsset('sw.js')
  const swLooksLikeServiceWorker = sw.ok && !/text\/html/i.test(sw.contentType || '')
  addCheck('Service worker asset is reachable, or local dev fallback is documented.', isLocalTarget ? sw.ok : swLooksLikeServiceWorker, {
    ...sw,
    devFallback: isLocalTarget && sw.ok && !swLooksLikeServiceWorker,
  })

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

    const proofBrief = await inspectRoute(client, appUrl, desktopViewport)
    addCheck('Root route opens the reviewer Proof Brief.', proofBrief.hasProofBrief, proofBrief)
    addCheck('Proof Brief exposes the Studio CTA.', proofBrief.hasStudioCta, proofBrief)
    addCheck('Proof Brief exposes verification path and cloud boundary.', proofBrief.hasVerificationPath && proofBrief.hasCloudBoundary, proofBrief)
    addCheck('Proof Brief has no horizontal overflow.', !proofBrief.horizontalOverflow, proofBrief)

    const studio = await inspectRoute(client, studioUrl, desktopViewport)
    addCheck('Studio route opens the usable builder.', studio.hasStudio && studio.hasBuilderPanel, studio)
    addCheck('Studio exposes local backend, PWA, and network proof panels.', studio.hasLocalBackend && studio.hasPwaPanel && studio.hasNetworkProof, studio)
    addCheck('Studio route has no horizontal overflow.', !studio.horizontalOverflow, studio)
    addCheck('No account, wallet, API key, or cloud-provider prompt is visible.', !studio.hasForbiddenAccountPrompt, studio)

    const mobileProofBrief = await inspectRoute(client, appUrl, mobileViewport)
    addCheck('Mobile root opens the Proof Brief with Studio CTA.', mobileProofBrief.hasProofBrief && mobileProofBrief.hasStudioCta, mobileProofBrief)
    addCheck('Mobile Proof Brief has no horizontal overflow.', !mobileProofBrief.horizontalOverflow, mobileProofBrief)
    addCheck('Mobile Proof Brief controls are touch-sized.', mobileProofBrief.smallTouchTargets.length === 0, mobileProofBrief)

    const mobileStudio = await inspectRoute(client, studioUrl, mobileViewport)
    addCheck('Mobile Studio opens with builder and mobile navigation.', mobileStudio.hasStudio && mobileStudio.hasBuilderPanel && mobileStudio.hasMobileTabbar, mobileStudio)
    addCheck('Mobile Studio has no horizontal overflow.', !mobileStudio.horizontalOverflow, mobileStudio)
    addCheck('Mobile Studio controls are touch-sized.', mobileStudio.smallTouchTargets.length === 0, mobileStudio)
  } catch (error) {
    addCheck('Chrome route inspection completed.', false, { error: error.message })
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

  const report = {
    generatedAt: new Date().toISOString(),
    project: 'VibeProof Studio',
    target: appUrl,
    mode: isLocalTarget ? 'local' : 'public-url',
    status: checks.every((check) => check.ok) ? 'pass' : 'fail',
    checks,
  }

  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
  if (report.status !== 'pass') process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

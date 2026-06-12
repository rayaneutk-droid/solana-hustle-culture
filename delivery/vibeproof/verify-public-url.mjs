import { spawn } from 'node:child_process'
import { Buffer } from 'node:buffer'
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
    const mobileTabbar = document.querySelector('.mobile-tabbar');
    const mobileTabbarRect = mobileTabbar?.getBoundingClientRect();
    const mobileTabbarStyle = mobileTabbar ? getComputedStyle(mobileTabbar) : null;
    const hasVisibleMobileTabbar = Boolean(
      mobileTabbar &&
      mobileTabbarRect &&
      mobileTabbarRect.width > 0 &&
      mobileTabbarRect.height > 0 &&
      mobileTabbarStyle?.visibility !== 'hidden' &&
      mobileTabbarStyle?.display !== 'none'
    );
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
      hasVisibleMobileTabbar,
      hasForbiddenAccountPrompt: /sign in|connect wallet|api key|openrouter|gemini|groq/i.test(text),
      horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      visibleControlCount: controls.length,
      smallTouchTargets
    };
  })()`)
}

async function waitForPageState(client, expression, timeout = 7000) {
  const started = Date.now()
  let lastState
  while (Date.now() - started < timeout) {
    lastState = await evalJs(client, expression)
    if (lastState?.ok) return lastState
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return lastState ?? { ok: false, error: 'No page state returned.' }
}

async function runCompileProofCheck(client) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: desktopViewport.width,
    height: desktopViewport.height,
    deviceScaleFactor: 1,
    mobile: desktopViewport.mobile,
  })
  await client.send('Page.navigate', { url: studioUrl })
  await new Promise((resolve) => setTimeout(resolve, 900))

  const readyState = await waitForPageState(client, `(() => {
    const button = [...document.querySelectorAll('button')]
      .find((item) => /Compile proof/.test(item.textContent || ''));
    const bodyText = document.body.innerText;
    return {
      ok: Boolean(button) && !button.disabled,
      hasButton: Boolean(button),
      disabled: Boolean(button?.disabled),
      localBackendConnected: /Local backend\\s+Connected/.test(bodyText) || /Connected/.test(bodyText),
    };
  })()`, 10000)

  if (!readyState.ok) return { ok: false, clicked: false, reason: 'Compile proof button did not become enabled.', readyState }

  const clickState = await evalJs(client, `(() => {
    const button = [...document.querySelectorAll('button')]
      .find((item) => /Compile proof/.test(item.textContent || ''));
    if (!button) return { clicked: false, reason: 'Compile proof button not found after readiness check.' };
    if (button.disabled) return { clicked: false, reason: 'Compile proof button is disabled after readiness check.' };
    button.click();
    return { clicked: true };
  })()`)

  if (!clickState.clicked) return { ok: false, ...clickState }

  return waitForPageState(client, `(() => {
    const consoleText = document.querySelector('.console-log')?.innerText || '';
    const bodyText = document.body.innerText;
    const doneStepCount = [...document.querySelectorAll('.pipeline-step.done')].length;
    const state = {
      hasPreviewReload: /Preview reloaded with deterministic proof app/.test(consoleText),
      hasDeterministicCompile: /Deterministic proof compile replaced workspace files/.test(consoleText),
      hasLocalKitIframeProof: /LocalKit iframe proof OK/.test(consoleText),
      doneStepCount,
      hasNoCloudCopy: /Verified without cloud AI/.test(bodyText),
      consoleTail: consoleText.slice(-900),
    };
    return {
      ok: state.hasPreviewReload && state.hasDeterministicCompile && state.hasLocalKitIframeProof && state.doneStepCount >= 5,
      ...state,
    };
  })()`)
}

function readStoredZipEntries(base64Zip) {
  const buffer = Buffer.from(base64Zip, 'base64')
  const entries = new Map()
  let offset = 0

  while (offset + 30 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset)
    if (signature !== 0x04034b50) break

    const compressionMethod = buffer.readUInt16LE(offset + 8)
    const compressedSize = buffer.readUInt32LE(offset + 18)
    const uncompressedSize = buffer.readUInt32LE(offset + 22)
    const fileNameLength = buffer.readUInt16LE(offset + 26)
    const extraLength = buffer.readUInt16LE(offset + 28)
    const nameStart = offset + 30
    const dataStart = nameStart + fileNameLength + extraLength
    const dataEnd = dataStart + compressedSize
    const name = buffer.subarray(nameStart, nameStart + fileNameLength).toString('utf8')

    if (dataEnd > buffer.length) {
      entries.set(name, { compressionMethod, error: 'Entry exceeds ZIP buffer length.' })
      break
    }

    const content =
      compressionMethod === 0 && uncompressedSize === compressedSize
        ? buffer.subarray(dataStart, dataEnd).toString('utf8')
        : ''

    entries.set(name, {
      compressionMethod,
      compressedSize,
      uncompressedSize,
      content,
    })
    offset = dataEnd
  }

  return entries
}

async function runExportZipCheck(client) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: desktopViewport.width,
    height: desktopViewport.height,
    deviceScaleFactor: 1,
    mobile: desktopViewport.mobile,
  })
  await client.send('Page.navigate', { url: studioUrl })
  await new Promise((resolve) => setTimeout(resolve, 900))

  const capture = await evalJs(client, `(async () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const originalClick = HTMLAnchorElement.prototype.click;
    let capturedBlob = null;
    URL.createObjectURL = (blob) => {
      capturedBlob = blob;
      return 'blob:vibeproof-export-proof';
    };
    URL.revokeObjectURL = () => undefined;
    HTMLAnchorElement.prototype.click = function click() {
      return undefined;
    };
    try {
      const button = [...document.querySelectorAll('button')]
        .find((item) => /Download generated app/.test(item.getAttribute('aria-label') || item.textContent || ''));
      if (!button) return { ok: false, reason: 'Download generated app button not found.' };
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (!capturedBlob) return { ok: false, reason: 'Download button did not create a ZIP blob.' };
      const bytes = new Uint8Array(await capturedBlob.arrayBuffer());
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return {
        ok: true,
        type: capturedBlob.type,
        size: capturedBlob.size,
        base64: btoa(binary),
      };
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      HTMLAnchorElement.prototype.click = originalClick;
    }
  })()`)

  if (!capture.ok) return capture

  const entries = readStoredZipEntries(capture.base64)
  const requiredEntries = ['index.html', 'src/app.html', 'src/app.css', 'src/app.js', 'README.md', 'proof-manifest.json']
  const entryNames = [...entries.keys()]
  const missingEntries = requiredEntries.filter((name) => !entries.has(name))
  const manifestEntry = entries.get('proof-manifest.json')
  const readmeEntry = entries.get('README.md')
  let manifest
  try {
    manifest = JSON.parse(manifestEntry?.content || '{}')
  } catch (error) {
    manifest = { parseError: error.message }
  }

  return {
    ok:
      capture.size > 0 &&
      missingEntries.length === 0 &&
      manifest?.generatedBy === 'VibeProof Studio' &&
      manifest?.runtimeBoundary?.cloudAiPromptApis === false &&
      manifest?.studioProof?.localToolCount >= 62 &&
      /LocalKit/.test(readmeEntry?.content || ''),
    size: capture.size,
    entryNames,
    missingEntries,
    manifestGeneratedBy: manifest?.generatedBy,
    cloudAiPromptApis: manifest?.runtimeBoundary?.cloudAiPromptApis,
    localToolCount: manifest?.studioProof?.localToolCount,
    readmeMentionsLocalKit: /LocalKit/.test(readmeEntry?.content || ''),
    manifestParseError: manifest?.parseError,
  }
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

    const compileProof = await runCompileProofCheck(client)
    addCheck('Compile proof runs and sandboxed LocalKit iframe proof completes.', compileProof.ok, compileProof)

    const exportZip = await runExportZipCheck(client)
    addCheck('Generated app ZIP export includes source files, README, and proof manifest.', exportZip.ok, exportZip)

    const mobileProofBrief = await inspectRoute(client, appUrl, mobileViewport)
    addCheck('Mobile root opens the Proof Brief with Studio CTA.', mobileProofBrief.hasProofBrief && mobileProofBrief.hasStudioCta, mobileProofBrief)
    addCheck('Mobile Proof Brief has no horizontal overflow.', !mobileProofBrief.horizontalOverflow, mobileProofBrief)
    addCheck('Mobile Proof Brief controls are touch-sized.', mobileProofBrief.smallTouchTargets.length === 0, mobileProofBrief)
    addCheck('Mobile Proof Brief does not show a fixed Studio tab bar overlay.', !mobileProofBrief.hasVisibleMobileTabbar, mobileProofBrief)

    const mobileStudio = await inspectRoute(client, studioUrl, mobileViewport)
    addCheck('Mobile Studio opens with builder and visible mobile navigation.', mobileStudio.hasStudio && mobileStudio.hasBuilderPanel && mobileStudio.hasVisibleMobileTabbar, mobileStudio)
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

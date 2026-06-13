import { spawn } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = here
const port = 9241
const userDataDir = path.join(tmpdir(), `vibeproof-submission-visuals-${Date.now()}`)

const assets = {
  proofDesktop: 'vibeproof-proof-brief-desktop-1440.png',
  proofLaptop: 'vibeproof-proof-brief-laptop-1280.png',
  proofTablet: 'vibeproof-proof-brief-tablet-834.png',
  proofMobile: 'vibeproof-proof-brief-mobile-390.png',
  studioDesktop: 'vibeproof-studio-workspace-desktop-1440.png',
}

const pages = [
  {
    name: 'submission-cover-16x9',
    width: 1920,
    height: 1080,
    title: 'VibeProof Studio',
    html: coverPage(),
  },
  {
    name: 'submission-square-card',
    width: 1080,
    height: 1080,
    title: 'VibeProof Studio Proof Card',
    html: squarePage(),
  },
  {
    name: 'submission-story-card',
    width: 1080,
    height: 1920,
    title: 'VibeProof Studio Story Card',
    html: storyPage(),
  },
  {
    name: 'figma-proof-frame-local',
    width: 1920,
    height: 1400,
    title: 'VibeProof Studio Proof Frame',
    html: proofFramePage(),
  },
]

function src(name) {
  return `./${name}`
}

function chips(items) {
  return items.map((item) => `<span>${item}</span>`).join('')
}

function sharedHead(title, width, height) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=${width}, height=${height}, initial-scale=1">
  <title>${title}</title>
  <style>
    :root {
      color: #f7fbff;
      background: #070a10;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Inter, system-ui, sans-serif;
      font-synthesis: none;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      --line: rgba(255,255,255,.14);
      --muted: #aebbd0;
      --soft: #dce7f6;
      --cyan: #72d8ff;
      --mint: #73f0bd;
      --gold: #f8c96b;
    }
    * { box-sizing: border-box; }
    html, body { width: ${width}px; height: ${height}px; margin: 0; overflow: hidden; }
    body {
      background:
        linear-gradient(118deg, rgba(121,184,255,.2), transparent 27%),
        linear-gradient(306deg, rgba(115,240,189,.14), transparent 34%),
        conic-gradient(from 210deg at 62% -12%, rgba(155,140,255,.18), rgba(71,215,255,.1), transparent 31%, rgba(248,201,107,.08), transparent 54%),
        linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px),
        linear-gradient(145deg, #050811, #101827 48%, #041512);
      background-size: auto, auto, auto, 58px 58px, 58px 58px, auto;
    }
    .stage { width: 100%; height: 100%; position: relative; padding: 64px; }
    .glass {
      border: 1px solid var(--line);
      background: linear-gradient(145deg, rgba(255,255,255,.11), rgba(255,255,255,.035) 44%, rgba(71,215,255,.055)), rgba(12,18,29,.74);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 28px 90px rgba(0,0,0,.34);
      backdrop-filter: blur(28px) saturate(155%);
      border-radius: 34px;
      overflow: hidden;
    }
    .label {
      margin: 0;
      color: var(--cyan);
      font-size: 19px;
      font-weight: 800;
      letter-spacing: 0;
      text-transform: uppercase;
    }
    h1, h2, h3, p { margin: 0; letter-spacing: 0; }
    h1 { font-size: 104px; line-height: .93; font-weight: 800; }
    h2 { font-size: 44px; line-height: 1; font-weight: 780; }
    h3 { font-size: 26px; line-height: 1.08; font-weight: 780; }
    p { color: var(--soft); font-size: 26px; line-height: 1.35; }
    .chips { display: flex; flex-wrap: wrap; gap: 14px; }
    .chips span {
      min-height: 46px;
      display: inline-flex;
      align-items: center;
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 999px;
      padding: 0 20px;
      color: #eef8ff;
      background: linear-gradient(135deg, rgba(121,184,255,.18), rgba(115,240,189,.1)), rgba(255,255,255,.07);
      font-size: 18px;
      font-weight: 760;
    }
    .shot {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: inherit;
    }
    .device {
      border: 1px solid rgba(255,255,255,.16);
      background: rgba(5,8,14,.72);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 24px 60px rgba(0,0,0,.34);
      overflow: hidden;
    }
    .note { color: #b9c7da; font-size: 18px; line-height: 1.35; }
    .audit { color: #061015; background: linear-gradient(135deg, #90d8ff, #73f0bd); }
  </style>
</head>
<body>`
}

function pageEnd() {
  return '</body></html>'
}

function coverPage() {
  return `${sharedHead('VibeProof Studio Cover', 1920, 1080)}
  <main class="stage">
    <section class="hero glass">
      <div class="copy">
        <p class="label">Pure-local browser AI app builder</p>
        <h1>VibeProof Studio</h1>
        <p>Proof-first bounty dossier, WebLLM local inference, a real code workspace, LocalKit plus PGlite backend proof, PWA boundary, and 68 local tools in one reviewer-ready URL.</p>
        <div class="chips">${chips(['WebLLM in tab', 'LocalKit + PGlite', '68 local tools', '0 cloud AI prompt APIs', 'PWA after first cache'])}</div>
      </div>
      <div class="visual">
        <div class="device desktop"><img class="shot" src="${src(assets.proofDesktop)}" alt=""></div>
        <div class="device tablet"><img class="shot" src="${src(assets.proofTablet)}" alt=""></div>
        <div class="device phone"><img class="shot" src="${src(assets.proofMobile)}" alt=""></div>
      </div>
      <div class="footer">
        <span class="audit">npm run proof:audit: pass</span>
        <span>First model load may download model assets. Prompts, generated files, toolbox input, and preview data stay out of hosted AI APIs.</span>
      </div>
    </section>
  </main>
  <style>
    .hero { position: relative; height: 952px; padding: 70px; display: grid; grid-template-columns: 660px 1fr; gap: 48px; }
    .copy { display: grid; align-content: center; gap: 30px; z-index: 2; }
    .visual { position: relative; min-width: 0; }
    .desktop { position: absolute; inset: 42px 0 128px 0; border-radius: 30px; }
    .tablet { position: absolute; width: 420px; height: 600px; right: 34px; bottom: 58px; border-radius: 28px; }
    .phone { position: absolute; width: 260px; height: 520px; left: 18px; bottom: 30px; border-radius: 38px; }
    .footer { position: absolute; left: 70px; right: 70px; bottom: 44px; display: flex; align-items: center; gap: 16px; color: #b9c7da; font-size: 18px; }
    .footer span { border: 1px solid rgba(255,255,255,.13); border-radius: 999px; padding: 12px 18px; background: rgba(255,255,255,.06); }
    .footer .audit { font-weight: 850; border: 0; }
  </style>
${pageEnd()}`
}

function squarePage() {
  return `${sharedHead('VibeProof Studio Square', 1080, 1080)}
  <main class="stage">
    <section class="card glass">
      <p class="label">Bounty proof pack</p>
      <h1>Local AI app builder.</h1>
      <div class="device main"><img class="shot" src="${src(assets.proofDesktop)}" alt=""></div>
      <div class="chips">${chips(['WebLLM', 'PGlite', '68 tools', 'No server AI route'])}</div>
      <p class="note">Proof brief first. Studio one click away. Public delivery after approval.</p>
    </section>
  </main>
  <style>
    .stage { padding: 54px; }
    .card { height: 972px; padding: 48px; display: grid; gap: 26px; align-content: start; }
    h1 { font-size: 76px; max-width: 820px; }
    .main { height: 500px; border-radius: 28px; }
    .chips span { min-height: 44px; font-size: 18px; }
  </style>
${pageEnd()}`
}

function storyPage() {
  return `${sharedHead('VibeProof Studio Story', 1080, 1920)}
  <main class="stage">
    <section class="story glass">
      <p class="label">VibeProof Studio</p>
      <h1>One tab. Local model. Real proof.</h1>
      <div class="phone-wrap">
        <div class="device phone"><img class="shot" src="${src(assets.proofMobile)}" alt=""></div>
      </div>
      <div class="chips">${chips(['WebLLM local inference', 'LocalKit + PGlite', '68 tools', 'PWA boundary'])}</div>
      <p>Built for reviewers to verify the local runtime, network boundary, generated app backend, and submission dossier without trusting a hidden server.</p>
      <p class="note">First model load can download model assets. Prompt and generated-code data stay out of hosted AI APIs.</p>
    </section>
  </main>
  <style>
    .stage { padding: 58px; }
    .story { height: 1804px; padding: 58px; display: grid; gap: 34px; align-content: start; }
    h1 { font-size: 84px; }
    .phone-wrap { display: grid; justify-items: center; }
    .phone { width: 438px; height: 948px; border-radius: 42px; }
    .chips span { min-height: 54px; font-size: 22px; }
  </style>
${pageEnd()}`
}

function proofFramePage() {
  return `${sharedHead('VibeProof Studio Proof Frame', 1920, 1400)}
  <main class="stage proof">
    <section class="top glass">
      <div>
        <p class="label">Bounty proof layout</p>
        <h1>VibeProof Studio</h1>
      <p>Proof-first local browser AI app builder with WebLLM, LocalKit, PGlite, 68 tools, PWA proof, and an integrated Studio path.</p>
      </div>
      <div class="chips">${chips(['No server AI route', '0 cloud AI prompt APIs', 'local-boundary-audit: pass'])}</div>
    </section>
    <section class="grid">
      <div class="device desktop"><img class="shot" src="${src(assets.proofDesktop)}" alt=""></div>
      <div class="stack">
        <div class="device small"><img class="shot" src="${src(assets.proofTablet)}" alt=""></div>
        <div class="device small"><img class="shot" src="${src(assets.proofMobile)}" alt=""></div>
      </div>
      <div class="glass panel">
        <h2>Reviewer path</h2>
        <ol>
          <li>Open proof brief first</li>
          <li>Launch Local Studio</li>
          <li>Click Compile proof</li>
          <li>Confirm LocalKit iframe proof OK</li>
          <li>Check Network proof</li>
          <li>Run npm run proof:audit</li>
        </ol>
      </div>
      <div class="glass panel">
        <h2>Competitor edge</h2>
        <p>VibeProof keeps the local runtime visible in-product and prepares public source, deployment proof, screenshots, and an audit trail.</p>
      </div>
      <div class="device wide"><img class="shot" src="${src(assets.studioDesktop)}" alt=""></div>
    </section>
  </main>
  <style>
    .proof { padding: 44px; display: grid; gap: 24px; }
    .top { height: 300px; padding: 42px; display: grid; grid-template-columns: 1fr 560px; gap: 30px; align-items: end; }
    .top h1 { font-size: 90px; }
    .top p:not(.label) { max-width: 920px; }
    .grid { display: grid; grid-template-columns: 980px 410px 410px; grid-template-rows: 612px 352px; gap: 24px; }
    .desktop { grid-column: 1; grid-row: 1; border-radius: 30px; }
    .proof .device .shot { object-fit: cover; background: #080d16; }
    .stack { display: grid; gap: 24px; }
    .small { height: 294px; border-radius: 28px; }
    .panel { padding: 32px; display: grid; align-content: start; gap: 20px; }
    .panel p, li { color: var(--soft); font-size: 24px; line-height: 1.35; }
    ol { margin: 0; padding-left: 28px; }
    .wide { grid-column: 1; grid-row: 2; border-radius: 30px; }
    .panel:last-of-type { grid-column: 2 / 4; grid-row: 2; }
  </style>
${pageEnd()}`
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

async function renderPage(client, page) {
  const htmlPath = path.join(outDir, `${page.name}.html`)
  const pngPath = path.join(outDir, `${page.name}.png`)
  await writeFile(htmlPath, page.html)
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: page.width,
    height: page.height,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await client.send('Page.navigate', { url: pathToFileURL(htmlPath).href })
  await new Promise((resolve) => setTimeout(resolve, 750))
  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    fromSurface: true,
  })
  await writeFile(pngPath, Buffer.from(screenshot.data, 'base64'))
  return { name: page.name, width: page.width, height: page.height, html: path.basename(htmlPath), png: path.basename(pngPath) }
}

async function visualStatus() {
  try {
    const report = JSON.parse(await readFile(path.join(outDir, 'proof-first-responsive-report.json'), 'utf8'))
    const appUrl = report.appUrl ?? ''
    return /^https:\/\//i.test(appUrl) ? 'deployed_evidence_rendered' : 'local_only_not_published'
  } catch {
    return 'local_only_not_published'
  }
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--allow-file-access-from-files',
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
    const rendered = []
    for (const page of pages) rendered.push(await renderPage(client, page))
    const manifest = {
      generatedAt: new Date().toISOString(),
      status: await visualStatus(),
      sourceScreenshots: assets,
      rendered,
    }
    await writeFile(path.join(outDir, 'submission-visuals-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
    console.log(JSON.stringify(manifest, null, 2))
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

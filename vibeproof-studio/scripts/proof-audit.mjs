import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '..')
const repoRoot = path.resolve(projectRoot, '..')
const sourceRoot = path.join(projectRoot, 'src')
const distRoot = path.join(projectRoot, 'dist')
const deliveryPath = path.join(repoRoot, 'delivery', 'vibeproof', 'local-boundary-audit.json')

const forbiddenRuntimePackages = [
  'openai',
  '@openai/agents',
  '@anthropic-ai/sdk',
  'groq-sdk',
  '@google/generative-ai',
  '@google/genai',
  'openrouter',
  'cohere-ai',
  '@mistralai/mistralai',
  'together-ai',
]

const forbiddenNetworkApis = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\s*\(/,
  /\bEventSource\s*\(/,
]

const cloudHostHints = [
  'api.openai.com',
  'generativelanguage.googleapis.com',
  'gemini.googleapis.com',
  'api.groq.com',
  'openrouter.ai',
  'api.anthropic.com',
  'api.cohere.ai',
  'api.mistral.ai',
  'api.together.xyz',
  'api.fireworks.ai',
  'api.perplexity.ai',
]

const forbiddenBuiltPromptEndpointPatterns = [
  /api\.openai\.com\/v1/i,
  /generativelanguage\.googleapis\.com\/v1/i,
  /gemini\.googleapis\.com\/v1/i,
  /api\.groq\.com\/openai\/v1/i,
  /openrouter\.ai\/api\/v1/i,
  /api\.anthropic\.com\/v1/i,
  /api\.cohere\.ai\/v1/i,
  /api\.mistral\.ai\/v1/i,
  /api\.together\.xyz\/v1/i,
  /api\.fireworks\.ai\/inference/i,
  /api\.perplexity\.ai\/chat\/completions/i,
  /chat\/completions/i,
  /messages\/batches/i,
]

const forbiddenSecretMarkers = [
  /OPENAI_API_KEY/i,
  /ANTHROPIC_API_KEY/i,
  /GEMINI_API_KEY/i,
  /GOOGLE_API_KEY/i,
  /GROQ_API_KEY/i,
  /OPENROUTER_API_KEY/i,
  /MISTRAL_API_KEY/i,
  /TOGETHER_API_KEY/i,
  /COHERE_API_KEY/i,
  /FIREWORKS_API_KEY/i,
  /PERPLEXITY_API_KEY/i,
  /Authorization["']?\s*:\s*["']?Bearer/i,
]

async function walk(dir) {
  const entries = await readdir(dir)
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    const info = await stat(fullPath)
    if (info.isDirectory()) {
      files.push(...await walk(fullPath))
      continue
    }

    if (/\.(ts|tsx|js|jsx|css|html|svg|webmanifest)$/.test(entry)) {
      files.push(fullPath)
    }
  }

  return files
}

async function walkExisting(dir, extensions) {
  try {
    const files = await walk(dir)
    return files.filter((filePath) => extensions.some((extension) => filePath.endsWith(extension)))
  } catch {
    return []
  }
}

function relative(filePath) {
  return path.relative(projectRoot, filePath).replaceAll(path.sep, '/')
}

function countToolDefinitions(source) {
  const matches = source.match(/\bid:\s*['"][a-z0-9-]+['"]/gi)
  return matches?.length ?? 0
}

function check(condition, label, details) {
  return {
    label,
    ok: Boolean(condition),
    details,
  }
}

const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'))
const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
}

const sourceFiles = await walk(sourceRoot)
const sourceEntries = await Promise.all(
  sourceFiles.map(async (filePath) => ({
    filePath,
    relativePath: relative(filePath),
    text: await readFile(filePath, 'utf8'),
  })),
)

const distFiles = await walkExisting(distRoot, ['.html', '.js', '.css', '.webmanifest', '.svg'])
const distEntries = await Promise.all(
  distFiles.map(async (filePath) => ({
    filePath,
    relativePath: path.relative(projectRoot, filePath).replaceAll(path.sep, '/'),
    text: await readFile(filePath, 'utf8'),
  })),
)

const packageHits = forbiddenRuntimePackages.filter((name) => Object.hasOwn(dependencies, name))
const networkApiHits = sourceEntries.flatMap((entry) =>
  forbiddenNetworkApis
    .filter((pattern) => pattern.test(entry.text))
    .map((pattern) => ({
      file: entry.relativePath,
      pattern: pattern.source,
    })),
)
const cloudHostHits = sourceEntries.flatMap((entry) =>
  cloudHostHints
    .filter((host) => entry.text.includes(host))
    .map((host) => ({
      file: entry.relativePath,
      host,
    })),
)
const builtPromptEndpointHits = distEntries.flatMap((entry) =>
  forbiddenBuiltPromptEndpointPatterns
    .filter((pattern) => pattern.test(entry.text))
    .map((pattern) => ({
      file: entry.relativePath,
      pattern: pattern.source,
    })),
)
const builtSecretMarkerHits = distEntries.flatMap((entry) =>
  forbiddenSecretMarkers
    .filter((pattern) => pattern.test(entry.text))
    .map((pattern) => ({
      file: entry.relativePath,
      pattern: pattern.source,
    })),
)

const appSource = sourceEntries.find((entry) => entry.relativePath === 'src/App.tsx')?.text ?? ''
const workerSource = sourceEntries.find((entry) => entry.relativePath === 'src/engine/aiWorker.ts')?.text ?? ''
const toolboxSource = sourceEntries.find((entry) => entry.relativePath === 'src/lib/toolbox.ts')?.text ?? ''
const vercelConfig = await readFile(path.join(projectRoot, 'vercel.json'), 'utf8')
const vercelConfigJson = JSON.parse(vercelConfig)
const builtIndexHtml = distEntries.find((entry) => entry.relativePath === 'dist/index.html')?.text ?? ''
const externalScriptHits = [...builtIndexHtml.matchAll(/<script[^>]+src=["']https?:\/\//gi)].map((match) => match[0])

const toolCount = countToolDefinitions(toolboxSource)
const cloudHostFiles = new Set(cloudHostHits.map((hit) => hit.file))
const vercelHeaders = vercelConfigJson.headers ?? []
const allVercelHeaderPairs = vercelHeaders.flatMap((entry) =>
  (entry.headers ?? []).map((header) => ({
    source: entry.source,
    key: header.key,
    value: header.value,
  })),
)
const headerValue = (source, key) =>
  allVercelHeaderPairs.find(
    (header) => header.source === source && header.key.toLowerCase() === key.toLowerCase(),
  )?.value ?? ''
const hasHeaderValue = (source, key, pattern) => pattern.test(headerValue(source, key))
const disallowedIsolationHeaders = allVercelHeaderPairs.filter((header) =>
  /cross-origin-(opener|embedder)-policy/i.test(header.key),
)
const rewrites = vercelConfigJson.rewrites ?? []
const staticBypassRewrite = rewrites.find((rewrite) => rewrite.destination === '/index.html')?.source ?? ''
const staticBypassTokens = ['assets/', 'sw.js', 'workbox-.*\\.js', 'manifest.webmanifest', 'favicon.svg', 'icons.svg']
const checks = [
  check(packageHits.length === 0, 'No cloud AI runtime packages are installed.', { packageHits }),
  check(networkApiHits.length === 0, 'No direct browser network APIs are used in app source.', { networkApiHits }),
  check(
    cloudHostFiles.size === 1 && cloudHostFiles.has('src/App.tsx'),
    'Known cloud AI host strings are confined to the in-app network classifier.',
    { cloudHostHits },
  ),
  check(workerSource.includes('@mlc-ai/web-llm'), 'WebLLM is the local model runtime.', {
    importsWebLlm: workerSource.includes('@mlc-ai/web-llm'),
  }),
  check(appSource.includes("new PGlite('idb://vibeproof-studio')"), 'PGlite is initialized in IndexedDB.', {
    pgliteIndexedDb: appSource.includes("new PGlite('idb://vibeproof-studio')"),
  }),
  check(
    appSource.includes('window.LocalKit') && appSource.includes('store:set') && appSource.includes('db:query'),
    'LocalKit store and db.query bridge is injected into the sandbox preview.',
    {
      hasLocalKit: appSource.includes('window.LocalKit'),
      hasStoreSet: appSource.includes('store:set'),
      hasDbQuery: appSource.includes('db:query'),
    },
  ),
  check(toolCount >= 62, 'Local toolbox has at least 62 tools.', { toolCount }),
  check(
    !/"functions"\s*:/.test(vercelConfig) && !/"builds"\s*:/.test(vercelConfig),
    'Vercel config does not define serverless functions.',
    { config: 'vibeproof-studio/vercel.json' },
  ),
  check(
    hasHeaderValue('/assets/(.*)', 'Cache-Control', /max-age=31536000/i) &&
      hasHeaderValue('/assets/(.*)', 'Cache-Control', /immutable/i) &&
      hasHeaderValue('/assets/(.*)', 'X-Content-Type-Options', /^nosniff$/i),
    'Vercel config gives hashed assets immutable cache headers and nosniff.',
    {
      cacheControl: headerValue('/assets/(.*)', 'Cache-Control'),
      xContentTypeOptions: headerValue('/assets/(.*)', 'X-Content-Type-Options'),
    },
  ),
  check(
    hasHeaderValue('/sw.js', 'Cache-Control', /max-age=0/i) &&
      hasHeaderValue('/sw.js', 'Cache-Control', /must-revalidate/i) &&
      hasHeaderValue('/manifest.webmanifest', 'Cache-Control', /max-age=0/i) &&
      hasHeaderValue('/manifest.webmanifest', 'Cache-Control', /must-revalidate/i),
    'Vercel config keeps service worker and manifest revalidatable.',
    {
      swCacheControl: headerValue('/sw.js', 'Cache-Control'),
      manifestCacheControl: headerValue('/manifest.webmanifest', 'Cache-Control'),
    },
  ),
  check(
    hasHeaderValue('/(.*)', 'Permissions-Policy', /camera=\(\)/i) &&
      hasHeaderValue('/(.*)', 'Permissions-Policy', /microphone=\(\)/i) &&
      hasHeaderValue('/(.*)', 'Permissions-Policy', /geolocation=\(\)/i) &&
      hasHeaderValue('/(.*)', 'Permissions-Policy', /payment=\(\)/i) &&
      hasHeaderValue('/(.*)', 'Referrer-Policy', /^strict-origin-when-cross-origin$/i) &&
      hasHeaderValue('/(.*)', 'X-Content-Type-Options', /^nosniff$/i),
    'Vercel config blocks sensitive browser prompts and sets baseline static security headers.',
    {
      permissionsPolicy: headerValue('/(.*)', 'Permissions-Policy'),
      referrerPolicy: headerValue('/(.*)', 'Referrer-Policy'),
      xContentTypeOptions: headerValue('/(.*)', 'X-Content-Type-Options'),
    },
  ),
  check(
    disallowedIsolationHeaders.length === 0,
    'Vercel config does not force COOP/COEP headers that could block WebLLM/PGlite assets.',
    { disallowedIsolationHeaders },
  ),
  check(
    staticBypassTokens.every((token) => staticBypassRewrite.includes(token)),
    'Vercel SPA rewrite preserves direct access to assets, service worker, manifest, and icons.',
    { staticBypassRewrite, staticBypassTokens },
  ),
  check(distEntries.length > 0, 'Production build artifacts are present for audit.', {
    distFilesScanned: distEntries.length,
  }),
  check(builtPromptEndpointHits.length === 0, 'Built artifacts do not contain cloud prompt API endpoint paths.', {
    builtPromptEndpointHits,
  }),
  check(builtSecretMarkerHits.length === 0, 'Built artifacts do not contain cloud AI secret or bearer-token markers.', {
    builtSecretMarkerHits,
  }),
  check(externalScriptHits.length === 0, 'Built index.html does not load remote scripts.', {
    externalScriptHits,
  }),
]

const report = {
  generatedAt: new Date().toISOString(),
  project: 'VibeProof Studio',
  status: checks.every((item) => item.ok) ? 'pass' : 'fail',
  summary: {
    sourceFilesScanned: sourceEntries.length,
    distFilesScanned: distEntries.length,
    toolCount,
    forbiddenRuntimePackageHits: packageHits.length,
    directNetworkApiHits: networkApiHits.length,
    knownCloudAiHostStrings: cloudHostHits.length,
    builtPromptEndpointHits: builtPromptEndpointHits.length,
    builtSecretMarkerHits: builtSecretMarkerHits.length,
  },
  checks,
  note: 'Model downloads may contact WebLLM/model asset hosts. This audit checks the submitted app source and built static artifacts for cloud AI runtime packages, direct prompt API network calls, cloud prompt endpoints, secret markers, LocalKit/PGlite proof wiring, and serverless function config.',
}

await writeFile(deliveryPath, `${JSON.stringify(report, null, 2)}\n`)

if (report.status !== 'pass') {
  console.error(JSON.stringify(report, null, 2))
  process.exit(1)
}

console.log(`VibeProof local-boundary audit passed. Report: ${path.relative(repoRoot, deliveryPath)}`)

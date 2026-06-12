import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '..')
const repoRoot = path.resolve(projectRoot, '..')
const sourceRoot = path.join(projectRoot, 'src')
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

    if (/\.(ts|tsx|js|jsx|css|html)$/.test(entry)) {
      files.push(fullPath)
    }
  }

  return files
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

const appSource = sourceEntries.find((entry) => entry.relativePath === 'src/App.tsx')?.text ?? ''
const workerSource = sourceEntries.find((entry) => entry.relativePath === 'src/engine/aiWorker.ts')?.text ?? ''
const toolboxSource = sourceEntries.find((entry) => entry.relativePath === 'src/lib/toolbox.ts')?.text ?? ''
const vercelConfig = await readFile(path.join(projectRoot, 'vercel.json'), 'utf8')

const toolCount = countToolDefinitions(toolboxSource)
const cloudHostFiles = new Set(cloudHostHits.map((hit) => hit.file))
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
]

const report = {
  generatedAt: new Date().toISOString(),
  project: 'VibeProof Studio',
  status: checks.every((item) => item.ok) ? 'pass' : 'fail',
  summary: {
    sourceFilesScanned: sourceEntries.length,
    toolCount,
    forbiddenRuntimePackageHits: packageHits.length,
    directNetworkApiHits: networkApiHits.length,
    knownCloudAiHostStrings: cloudHostHits.length,
  },
  checks,
  note: 'Model downloads may contact WebLLM/model asset hosts. This audit checks the submitted app source for cloud AI runtime packages, direct prompt API network calls, LocalKit/PGlite proof wiring, and serverless function config.',
}

await writeFile(deliveryPath, `${JSON.stringify(report, null, 2)}\n`)

if (report.status !== 'pass') {
  console.error(JSON.stringify(report, null, 2))
  process.exit(1)
}

console.log(`VibeProof local-boundary audit passed. Report: ${path.relative(repoRoot, deliveryPath)}`)

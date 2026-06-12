export type ToolCategory =
  | 'Code'
  | 'Data'
  | 'Security'
  | 'Writing'
  | 'Media'
  | 'Docs'
  | 'Dev'
  | 'AI'

export type ToolDefinition = {
  id: string
  title: string
  category: ToolCategory
  description: string
  placeholder: string
  requiresModel?: boolean
}

export type ToolRunResult = {
  ok: boolean
  output: string
}

const placeholder = 'Paste text, JSON, code, notes, or parameters here.'

export const toolDefinitions: ToolDefinition[] = [
  { id: 'json-format', title: 'JSON format', category: 'Code', description: 'Pretty print JSON locally.', placeholder: '{"name":"VibeProof"}' },
  { id: 'json-minify', title: 'JSON minify', category: 'Code', description: 'Compress JSON without network calls.', placeholder: '{"name":"VibeProof"}' },
  { id: 'json-to-ts', title: 'JSON to TS type', category: 'Code', description: 'Create a lightweight TypeScript shape.', placeholder: '{"name":"VibeProof","local":true}' },
  { id: 'csv-to-json', title: 'CSV to JSON', category: 'Data', description: 'Convert simple CSV rows to JSON.', placeholder: 'name,score\nlocal,100' },
  { id: 'json-to-csv', title: 'JSON to CSV', category: 'Data', description: 'Convert an array of objects to CSV.', placeholder: '[{"name":"local","score":100}]' },
  { id: 'markdown-table', title: 'CSV to markdown table', category: 'Docs', description: 'Render a CSV snippet as a markdown table.', placeholder: 'feature,status\nWebLLM,ready' },
  { id: 'base64-encode', title: 'Base64 encode', category: 'Security', description: 'Encode text in the tab.', placeholder },
  { id: 'base64-decode', title: 'Base64 decode', category: 'Security', description: 'Decode Base64 in the tab.', placeholder: 'VmliZVByb29m' },
  { id: 'url-encode', title: 'URL encode', category: 'Dev', description: 'Encode URL components.', placeholder },
  { id: 'url-decode', title: 'URL decode', category: 'Dev', description: 'Decode URL components.', placeholder: 'VibeProof%20Studio' },
  { id: 'html-escape', title: 'HTML escape', category: 'Code', description: 'Escape HTML entities.', placeholder: '<button>Local</button>' },
  { id: 'html-unescape', title: 'HTML unescape', category: 'Code', description: 'Unescape common HTML entities.', placeholder: '&lt;button&gt;Local&lt;/button&gt;' },
  { id: 'sha256', title: 'SHA-256 digest', category: 'Security', description: 'Hash text with WebCrypto.', placeholder },
  { id: 'uuid', title: 'UUID v4', category: 'Dev', description: 'Generate a browser UUID.', placeholder: 'Optional label' },
  { id: 'password', title: 'Password generator', category: 'Security', description: 'Generate a local random password.', placeholder: '24' },
  { id: 'jwt-decode', title: 'JWT decode', category: 'Security', description: 'Decode JWT header and payload locally.', placeholder: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature' },
  { id: 'regex-test', title: 'Regex tester', category: 'Dev', description: 'Test a regex against sample text.', placeholder: '/local/gi\nLocal AI stays local.' },
  { id: 'query-parse', title: 'Query parser', category: 'Dev', description: 'Parse URL query strings.', placeholder: '?model=qwen&local=true' },
  { id: 'query-build', title: 'Query builder', category: 'Dev', description: 'Build a query string from JSON.', placeholder: '{"model":"qwen","local":true}' },
  { id: 'slugify', title: 'Slugify', category: 'Writing', description: 'Create URL slugs.', placeholder: 'Premium Local AI App Builder' },
  { id: 'kebab-case', title: 'Kebab case', category: 'Writing', description: 'Transform text to kebab-case.', placeholder },
  { id: 'snake-case', title: 'Snake case', category: 'Writing', description: 'Transform text to snake_case.', placeholder },
  { id: 'camel-case', title: 'Camel case', category: 'Writing', description: 'Transform text to camelCase.', placeholder },
  { id: 'pascal-case', title: 'Pascal case', category: 'Writing', description: 'Transform text to PascalCase.', placeholder },
  { id: 'title-case', title: 'Title case', category: 'Writing', description: 'Transform text to title case.', placeholder },
  { id: 'upper-case', title: 'Uppercase', category: 'Writing', description: 'Uppercase text.', placeholder },
  { id: 'lower-case', title: 'Lowercase', category: 'Writing', description: 'Lowercase text.', placeholder },
  { id: 'word-count', title: 'Word count', category: 'Writing', description: 'Count words, lines, and characters.', placeholder },
  { id: 'reading-time', title: 'Reading time', category: 'Writing', description: 'Estimate reading time.', placeholder },
  { id: 'extract-todos', title: 'Extract TODOs', category: 'Code', description: 'Find TODO/FIXME style lines.', placeholder: '// TODO: verify offline mode' },
  { id: 'sort-lines', title: 'Sort lines', category: 'Data', description: 'Sort lines alphabetically.', placeholder: 'beta\nalpha' },
  { id: 'unique-lines', title: 'Unique lines', category: 'Data', description: 'Remove duplicate lines.', placeholder: 'local\nlocal\nprivate' },
  { id: 'trim-lines', title: 'Trim lines', category: 'Data', description: 'Trim whitespace on every line.', placeholder: '  local  ' },
  { id: 'number-lines', title: 'Number lines', category: 'Docs', description: 'Add line numbers.', placeholder },
  { id: 'sql-in-list', title: 'SQL IN list', category: 'Dev', description: 'Quote line values for SQL IN clauses.', placeholder: 'webgpu\npglite' },
  { id: 'sql-create-table', title: 'SQL table sketch', category: 'Data', description: 'Sketch a CREATE TABLE from JSON keys.', placeholder: '{"id":1,"label":"local"}' },
  { id: 'css-clamp', title: 'CSS clamp scale', category: 'Code', description: 'Generate responsive clamp tokens.', placeholder: '16 42' },
  { id: 'css-shadow', title: 'CSS shadow stack', category: 'Code', description: 'Generate a premium layered shadow.', placeholder: 'soft' },
  { id: 'color-hex-rgb', title: 'HEX to RGB', category: 'Media', description: 'Convert HEX colors.', placeholder: '#9bd3ff' },
  { id: 'color-rgb-hex', title: 'RGB to HEX', category: 'Media', description: 'Convert RGB colors.', placeholder: '155, 211, 255' },
  { id: 'palette-proof', title: 'Palette contrast notes', category: 'Media', description: 'Check a palette note for contrast risks.', placeholder: '#090a0f\n#f6f7fb\n#9bd3ff' },
  { id: 'svg-data-uri', title: 'SVG data URI', category: 'Media', description: 'Turn inline SVG into a CSS data URI.', placeholder: '<svg xmlns="http://www.w3.org/2000/svg"></svg>' },
  { id: 'image-alt', title: 'Alt text checklist', category: 'Media', description: 'Create a local accessibility checklist.', placeholder: 'Screenshot of the workspace' },
  { id: 'audio-cue-sheet', title: 'Audio cue sheet', category: 'Media', description: 'Draft simple cue markers from lines.', placeholder: '00:00 Intro\n00:20 Demo' },
  { id: 'meta-tags', title: 'Meta tag pack', category: 'Docs', description: 'Create basic HTML meta tags.', placeholder: 'VibeProof Studio' },
  { id: 'readme-checklist', title: 'README checklist', category: 'Docs', description: 'Generate a proof-ready README checklist.', placeholder: 'local AI app builder' },
  { id: 'release-notes', title: 'Release notes skeleton', category: 'Docs', description: 'Draft local release notes.', placeholder: 'Added LocalKit DB bridge' },
  { id: 'changelog-entry', title: 'Changelog entry', category: 'Docs', description: 'Create a concise changelog entry.', placeholder },
  { id: 'bug-report', title: 'Bug report template', category: 'Docs', description: 'Create a reproducible bug report shell.', placeholder: 'Preview blank on mobile' },
  { id: 'test-plan', title: 'Test plan', category: 'Docs', description: 'Generate a verification checklist.', placeholder: 'PWA, WebLLM, LocalKit' },
  { id: 'threat-model', title: 'Privacy threat model', category: 'Security', description: 'Make a local-first privacy checklist.', placeholder: 'prompt never leaves browser' },
  { id: 'csp-sketch', title: 'CSP sketch', category: 'Security', description: 'Sketch a conservative Content Security Policy.', placeholder: 'self wasm blob' },
  { id: 'robots-txt', title: 'robots.txt', category: 'Dev', description: 'Generate a simple robots.txt.', placeholder: 'https://example.com/sitemap.xml' },
  { id: 'manifest-json', title: 'PWA manifest', category: 'Dev', description: 'Generate a minimal manifest.', placeholder: 'VibeProof Studio' },
  { id: 'service-worker-notes', title: 'Service worker notes', category: 'Dev', description: 'Explain what is cached locally.', placeholder: 'app shell after first load' },
  { id: 'localstorage-inspect', title: 'LocalStorage keys', category: 'Dev', description: 'List VibeProof localStorage keys.', placeholder: 'vibeproof' },
  { id: 'network-proof', title: 'Network proof summary', category: 'Security', description: 'Format a network proof claim.', placeholder: 'model CDN, app chunks, no prompt API' },
  { id: 'webgpu-check', title: 'WebGPU check copy', category: 'Dev', description: 'Create user-facing WebGPU status copy.', placeholder: 'Chrome with WebGPU enabled' },
  { id: 'prompt-splitter', title: 'Prompt splitter', category: 'AI', description: 'Split a product prompt into build sections.', placeholder, requiresModel: true },
  { id: 'code-review-ai', title: 'Local AI code review', category: 'AI', description: 'Review code with the loaded local model.', placeholder, requiresModel: true },
  { id: 'ui-copy-ai', title: 'Local AI UI copy', category: 'AI', description: 'Rewrite UI copy using the local model.', placeholder, requiresModel: true },
  { id: 'repair-ai', title: 'Local AI repair plan', category: 'AI', description: 'Ask the local model for a repair plan.', placeholder, requiresModel: true },
  { id: 'component-ai', title: 'Local AI component', category: 'AI', description: 'Generate a browser component locally.', placeholder, requiresModel: true },
  { id: 'sql-ai', title: 'Local AI SQL helper', category: 'AI', description: 'Draft PGlite SQL using the local model.', placeholder, requiresModel: true },
  { id: 'a11y-ai', title: 'Local AI accessibility audit', category: 'AI', description: 'Audit UI text locally.', placeholder, requiresModel: true },
  { id: 'docs-ai', title: 'Local AI docs draft', category: 'AI', description: 'Draft docs with local inference.', placeholder, requiresModel: true },
  { id: 'bounty-ai', title: 'Local AI bounty pitch', category: 'AI', description: 'Improve bounty reply copy locally.', placeholder, requiresModel: true },
  { id: 'diff-ai', title: 'Local AI diff summary', category: 'AI', description: 'Summarize changes with the loaded model.', placeholder, requiresModel: true },
]

export const LOCAL_TOOL_COUNT = toolDefinitions.length

export const toolCategories: ToolCategory[] = ['Code', 'Data', 'Security', 'Writing', 'Media', 'Docs', 'Dev', 'AI']

const encoder = new TextEncoder()

export async function runTool(tool: ToolDefinition, input: string): Promise<ToolRunResult> {
  if (tool.requiresModel) {
    return {
      ok: false,
      output: 'This tool is intentionally locked until a local WebLLM model is loaded. No cloud fallback is used.',
    }
  }

  try {
    return { ok: true, output: await runDeterministic(tool.id, input) }
  } catch (error) {
    return {
      ok: false,
      output: error instanceof Error ? error.message : 'The local tool could not finish.',
    }
  }
}

async function runDeterministic(id: string, input: string): Promise<string> {
  const text = input.trim()
  switch (id) {
    case 'json-format':
      return JSON.stringify(JSON.parse(text), null, 2)
    case 'json-minify':
      return JSON.stringify(JSON.parse(text))
    case 'json-to-ts':
      return jsonToType(JSON.parse(text), 'LocalShape')
    case 'csv-to-json':
      return JSON.stringify(csvToObjects(text), null, 2)
    case 'json-to-csv':
      return objectsToCsv(JSON.parse(text))
    case 'markdown-table':
      return csvToMarkdown(text)
    case 'base64-encode':
      return btoa(unescape(encodeURIComponent(input)))
    case 'base64-decode':
      return decodeURIComponent(escape(atob(text)))
    case 'url-encode':
      return encodeURIComponent(input)
    case 'url-decode':
      return decodeURIComponent(text)
    case 'html-escape':
      return escapeHtml(input)
    case 'html-unescape':
      return unescapeHtml(input)
    case 'sha256':
      return digestHex(input)
    case 'uuid':
      return `${text ? `${text}: ` : ''}${crypto.randomUUID()}`
    case 'password':
      return randomPassword(Number.parseInt(text, 10) || 24)
    case 'jwt-decode':
      return decodeJwt(text)
    case 'regex-test':
      return regexTest(input)
    case 'query-parse':
      return JSON.stringify(Object.fromEntries(new URLSearchParams(text.replace(/^\?/, ''))), null, 2)
    case 'query-build':
      return new URLSearchParams(JSON.parse(text)).toString()
    case 'slugify':
    case 'kebab-case':
      return toWords(input).join('-')
    case 'snake-case':
      return toWords(input).join('_')
    case 'camel-case':
      return toCamel(input)
    case 'pascal-case':
      return capitalize(toCamel(input))
    case 'title-case':
      return toWords(input).map(capitalize).join(' ')
    case 'upper-case':
      return input.toUpperCase()
    case 'lower-case':
      return input.toLowerCase()
    case 'word-count':
      return textStats(input)
    case 'reading-time':
      return readingTime(input)
    case 'extract-todos':
      return extractTodos(input)
    case 'sort-lines':
      return lines(input).sort((a, b) => a.localeCompare(b)).join('\n')
    case 'unique-lines':
      return Array.from(new Set(lines(input))).join('\n')
    case 'trim-lines':
      return lines(input).map((line) => line.trim()).join('\n')
    case 'number-lines':
      return lines(input).map((line, index) => `${index + 1}. ${line}`).join('\n')
    case 'sql-in-list':
      return `(${lines(input).map((line) => `'${line.replace(/'/g, "''")}'`).join(', ')})`
    case 'sql-create-table':
      return sqlCreateTable(text)
    case 'css-clamp':
      return cssClamp(text)
    case 'css-shadow':
      return 'box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08), 0 18px 48px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.34);'
    case 'color-hex-rgb':
      return hexToRgb(text)
    case 'color-rgb-hex':
      return rgbToHex(text)
    case 'palette-proof':
      return paletteProof(input)
    case 'svg-data-uri':
      return `url("data:image/svg+xml,${encodeURIComponent(input)}")`
    case 'image-alt':
      return checklist('Alt text', ['Describe the actual visible subject.', 'Skip phrases like image of.', 'Mention state only when it matters.', `Draft: ${text || 'Workspace screenshot with local model and preview panels.'}`])
    case 'audio-cue-sheet':
      return cueSheet(input)
    case 'meta-tags':
      return metaTags(text || 'VibeProof Studio')
    case 'readme-checklist':
      return checklist('README proof checklist', ['Install command', 'Local run command', 'Build command', 'No cloud AI note', 'WebGPU support note', 'Offline after first cache note'])
    case 'release-notes':
      return releaseNotes(input)
    case 'changelog-entry':
      return `## ${new Date().toISOString().slice(0, 10)}\n\n- ${text || 'Added local-first bounty proof features.'}`
    case 'bug-report':
      return bugReport(text || 'Issue summary')
    case 'test-plan':
      return checklist('Verification plan', ['Load app shell', 'Load or gracefully reject WebLLM model', 'Run deterministic proof compile', 'Use LocalKit store', 'Run PGlite query', 'Inspect network proof', 'Reload with service worker'])
    case 'threat-model':
      return checklist('Local-first threat model', ['Prompts remain in tab memory', 'No server AI endpoint', 'Sandboxed preview iframe', 'Parent-owned PGlite database', 'Network panel lists runtime resources'])
    case 'csp-sketch':
      return "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob:; worker-src 'self' blob:; connect-src 'self' https://huggingface.co https://*.huggingface.co https://cdn-lfs.huggingface.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;"
    case 'robots-txt':
      return `User-agent: *\nAllow: /\n${text ? `Sitemap: ${text}` : ''}`.trim()
    case 'manifest-json':
      return JSON.stringify({ name: text || 'VibeProof Studio', short_name: 'VibeProof', start_url: '/', display: 'standalone', background_color: '#090a0f', theme_color: '#f7fbff' }, null, 2)
    case 'service-worker-notes':
      return checklist('Offline scope', ['App shell caches after first load', 'Model weights are browser/HTTP cached after first model download', 'PGlite persists in IndexedDB/OPFS', 'External model download is not hidden'])
    case 'localstorage-inspect':
      return inspectLocalStorage(text || 'vibeproof')
    case 'network-proof':
      return checklist('Network proof summary', ['Allowed: static app chunks', 'Allowed: first model download from model host', 'Allowed: PWA/service worker assets', 'Not allowed: prompt or code sent to AI APIs'])
    case 'webgpu-check':
      return navigator.gpu
        ? 'WebGPU is exposed in this browser. Model load can be attempted.'
        : 'WebGPU is not exposed in this browser. The app should keep proof mode available and explain the requirement.'
    default:
      return genericWorksheet(id, input)
  }
}

function lines(input: string): string[] {
  return input.split(/\r?\n/).filter((line) => line.length > 0)
}

function toWords(input: string): string[] {
  return input
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean)
}

function capitalize(input: string): string {
  return input ? input[0].toUpperCase() + input.slice(1) : input
}

function toCamel(input: string): string {
  const words = toWords(input)
  return words.map((word, index) => (index === 0 ? word : capitalize(word))).join('')
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function unescapeHtml(input: string): string {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
}

async function digestHex(input: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(input))
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function randomPassword(length: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  const bytes = crypto.getRandomValues(new Uint8Array(Math.min(Math.max(length, 8), 80)))
  return Array.from(bytes).map((byte) => alphabet[byte % alphabet.length]).join('')
}

function csvToObjects(input: string): Record<string, string>[] {
  const [headerLine, ...rows] = lines(input)
  if (!headerLine) return []
  const headers = headerLine.split(',').map((header) => header.trim())
  return rows.map((row) => Object.fromEntries(row.split(',').map((cell, index) => [headers[index] || `column_${index + 1}`, cell.trim()])))
}

function objectsToCsv(value: unknown): string {
  if (!Array.isArray(value)) throw new Error('Expected an array of objects.')
  const rows = value as Record<string, unknown>[]
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  return [headers.join(','), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(','))].join('\n')
}

function csvToMarkdown(input: string): string {
  const rows = lines(input).map((row) => row.split(',').map((cell) => cell.trim()))
  if (rows.length === 0) return ''
  const [headers, ...body] = rows
  return [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`, ...body.map((row) => `| ${row.join(' | ')} |`)].join('\n')
}

function jsonToType(value: unknown, name: string): string {
  if (Array.isArray(value)) return `type ${name} = ${jsonValueToType(value[0])}[]`
  return `type ${name} = ${jsonValueToType(value)}`
}

function jsonValueToType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return `${jsonValueToType(value[0]) || 'unknown'}[]`
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    return `{\n${entries.map(([key, entry]) => `  ${key}: ${jsonValueToType(entry)}`).join('\n')}\n}`
  }
  return typeof value
}

function decodeJwt(input: string): string {
  const [header, payload] = input.split('.')
  if (!header || !payload) throw new Error('Expected a JWT with header.payload.signature')
  return JSON.stringify({ header: decodeBase64Url(header), payload: decodeBase64Url(payload) }, null, 2)
}

function decodeBase64Url(input: string): unknown {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=')
  return JSON.parse(decodeURIComponent(escape(atob(normalized))))
}

function regexTest(input: string): string {
  const [patternLine, ...sampleLines] = input.split(/\r?\n/)
  const match = patternLine.match(/^\/(.+)\/([gimsuy]*)$/)
  if (!match) throw new Error('First line must look like /pattern/flags')
  const regex = new RegExp(match[1], match[2])
  const sample = sampleLines.join('\n')
  const matches = Array.from(sample.matchAll(regex))
  return JSON.stringify({ count: matches.length, matches: matches.map((entry) => entry[0]) }, null, 2)
}

function textStats(input: string): string {
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0
  return `Characters: ${input.length}\nWords: ${wordCount}\nLines: ${input.split(/\r?\n/).length}`
}

function readingTime(input: string): string {
  const words = input.trim() ? input.trim().split(/\s+/).length : 0
  const minutes = Math.max(1, Math.ceil(words / 220))
  return `${words} words, about ${minutes} minute${minutes === 1 ? '' : 's'} at 220 wpm.`
}

function extractTodos(input: string): string {
  const found = lines(input).filter((line) => /\b(TODO|FIXME|HACK|NOTE)\b/i.test(line))
  return found.length ? found.join('\n') : 'No TODO-style markers found.'
}

function sqlCreateTable(input: string): string {
  const value = JSON.parse(input) as Record<string, unknown>
  const columns = Object.entries(value).map(([key, entry]) => `  ${key} ${sqlType(entry)}`)
  return `create table local_items (\n${columns.join(',\n')}\n);`
}

function sqlType(value: unknown): string {
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'numeric'
  if (typeof value === 'boolean') return 'boolean'
  return 'text'
}

function cssClamp(input: string): string {
  const [min = 16, max = 42] = input.split(/\s+/).map((part) => Number.parseFloat(part)).filter(Number.isFinite)
  return `font-size: clamp(${min}px, ${(min / 16).toFixed(2)}rem + 3vw, ${max}px);`
}

function hexToRgb(input: string): string {
  const clean = input.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const value = Number.parseInt(full, 16)
  if (Number.isNaN(value)) throw new Error('Expected a HEX color.')
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`
}

function rgbToHex(input: string): string {
  const values = input.match(/\d+/g)?.slice(0, 3).map(Number)
  if (!values || values.length < 3) throw new Error('Expected three RGB numbers.')
  return `#${values.map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

function paletteProof(input: string): string {
  const swatches = lines(input)
  return checklist('Palette proof notes', [
    `${swatches.length} swatches supplied.`,
    'Check text/background contrast before final submission.',
    'Avoid one-hue dominance; mix neutral, accent, and status colors.',
    swatches.join(', ') || 'No swatches supplied.',
  ])
}

function cueSheet(input: string): string {
  return lines(input)
    .map((line, index) => {
      const hasTime = /^\d{2}:\d{2}/.test(line)
      return hasTime ? line : `${String(index).padStart(2, '0')}:00 ${line}`
    })
    .join('\n')
}

function metaTags(title: string): string {
  const safeTitle = escapeHtml(title)
  return `<title>${safeTitle}</title>\n<meta name="description" content="${safeTitle} runs local AI in your browser." />\n<meta property="og:title" content="${safeTitle}" />\n<meta property="og:type" content="website" />`
}

function releaseNotes(input: string): string {
  const items = lines(input)
  return `# Release notes\n\n## Added\n${items.map((item) => `- ${item}`).join('\n') || '- Local-first workspace proof.'}\n\n## Verification\n- Build passes.\n- Browser proof captured.`
}

function bugReport(summary: string): string {
  return `# ${summary}\n\n## Steps\n1. Open VibeProof Studio.\n2. Describe the exact action.\n3. Capture console/proof panel output.\n\n## Expected\n\n## Actual\n\n## Environment\n- Browser:\n- WebGPU exposed:\n- Service worker state:`
}

function checklist(title: string, items: string[]): string {
  return `# ${title}\n\n${items.map((item) => `- [ ] ${item}`).join('\n')}`
}

function inspectLocalStorage(prefix: string): string {
  const entries = Object.keys(localStorage)
    .filter((key) => key.includes(prefix))
    .map((key) => `${key}: ${localStorage.getItem(key)}`)
  return entries.length ? entries.join('\n') : `No localStorage keys containing "${prefix}" found.`
}

function genericWorksheet(id: string, input: string): string {
  return `# ${id}\n\nInput length: ${input.length} characters\n\nLocal worksheet ready. No network request was made.`
}

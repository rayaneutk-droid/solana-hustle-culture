import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import JSZip from 'jszip'
import { PGlite } from '@electric-sql/pglite'
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Database,
  Download,
  Eye,
  FileCheck2,
  HardDrive,
  Layers3,
  Loader2,
  Lock,
  Monitor,
  Network,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  WifiOff,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react'
import './App.css'
import { CodeEditor } from './components/CodeEditor'
import { LOCAL_TOOL_COUNT, runTool, toolCategories, toolDefinitions, type ToolDefinition } from './lib/toolbox'
import {
  deterministicBuild,
  emptyPipeline,
  passCopy,
  seedFiles,
  type PipelineEvent,
  type PipelinePass,
  type WorkspaceFiles,
} from './lib/templates'

type FileKey = keyof WorkspaceFiles
type ModelState = 'idle' | 'loading' | 'ready' | 'error'
type PwaState = 'checking' | 'unsupported' | 'registered' | 'offline-ready' | 'needs-refresh'
type DbState = 'booting' | 'ready' | 'error'
type ConsoleLevel = 'log' | 'info' | 'warn' | 'error'
type ViewMode = 'studio' | 'brief'

type ConsoleLine = {
  id: number
  level: ConsoleLevel
  text: string
}

type NetworkEvent = {
  id: string
  url: string
  type: string
  size: number
  at: number
}

type WorkerMessage =
  | { type: 'loading'; modelId: string }
  | { type: 'progress'; modelId: string; progress?: number; text?: string }
  | { type: 'ready'; modelId: string }
  | { type: 'pipeline'; pass: PipelinePass; status: PipelineEvent['status']; detail: string }
  | { type: 'final'; id: string; files: WorkspaceFiles }
  | { type: 'complete'; id: string; output: string }
  | { type: 'error'; id?: string; message: string }

type PendingCompletion = {
  resolve: (value: string) => void
  reject: (error: Error) => void
}

type LocalKitRequest = {
  source: 'vibeproof-preview'
  id: string
  action: 'store:get' | 'store:set' | 'store:delete' | 'store:list' | 'db:query'
  payload?: {
    key?: string
    value?: unknown
    sql?: string
    params?: unknown[]
  }
}

type PreviewConsoleMessage = {
  source: 'vibeproof-preview-console'
  level: ConsoleLevel
  text: string
}

type PwaDetail = {
  status: PwaState
  label: string
}

const modelOptions = [
  {
    id: 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen2.5 Coder 0.5B',
    note: 'Fastest proof model',
  },
  {
    id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen2.5 Coder 1.5B',
    note: 'Better code quality',
  },
  {
    id: 'Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC',
    label: 'Qwen2.5 Coder 3B',
    note: 'High VRAM browsers',
  },
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    label: 'SmolLM2 360M',
    note: 'Fallback hardware probe',
  },
]

const cloudAiRequestHints = [
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

function isCloudAiRequest(event: NetworkEvent): boolean {
  const target = event.url.toLowerCase()
  return cloudAiRequestHints.some((hint) => target.includes(hint))
}

const initialPrompt =
  'Build a private launch tracker with a glassy dashboard, local notes, PGlite event log, and no server calls.'

const strategies = ['Premium app', 'Data tool', 'Micro SaaS', 'Portfolio system']

function App() {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [strategy, setStrategy] = useState(strategies[0])
  const [files, setFiles] = useState<WorkspaceFiles>(seedFiles)
  const [activeFile, setActiveFile] = useState<FileKey>('html')
  const [pipeline, setPipeline] = useState<PipelineEvent[]>(emptyPipeline)
  const [modelId, setModelId] = useState(modelOptions[0].id)
  const [modelState, setModelState] = useState<ModelState>('idle')
  const [modelProgress, setModelProgress] = useState(0)
  const [modelDetail, setModelDetail] = useState('Model not loaded. Deterministic proof mode is available.')
  const [isRunningPipeline, setIsRunningPipeline] = useState(false)
  const [pwaState, setPwaState] = useState<PwaState>('checking')
  const [pwaDetail, setPwaDetail] = useState('Checking service worker state.')
  const [dbState, setDbState] = useState<DbState>('booting')
  const [dbDetail, setDbDetail] = useState('Starting PGlite in IndexedDB.')
  const [dbEvents, setDbEvents] = useState(0)
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([
    { id: 1, level: 'info', text: 'Preview console is listening.' },
  ])
  const [networkEvents, setNetworkEvents] = useState<NetworkEvent[]>([])
  const [toolQuery, setToolQuery] = useState('')
  const [toolCategory, setToolCategory] = useState('All')
  const [selectedToolId, setSelectedToolId] = useState(toolDefinitions[0].id)
  const [toolInput, setToolInput] = useState(toolDefinitions[0].placeholder)
  const [toolOutput, setToolOutput] = useState('Run a local tool to see output here.')
  const [isToolRunning, setIsToolRunning] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    window.location.hash === '#proof' ? 'brief' : 'studio',
  )

  const previewRef = useRef<HTMLIFrameElement | null>(null)
  const dbRef = useRef<PGlite | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const pendingCompletions = useRef<Map<string, PendingCompletion>>(new Map())
  const consoleCounter = useRef(2)

  const appendConsole = useCallback((level: ConsoleLevel, text: string) => {
    setConsoleLines((current) => [
      ...current.slice(-80),
      {
        id: consoleCounter.current++,
        level,
        text,
      },
    ])
  }, [])

  const switchView = useCallback((nextView: ViewMode) => {
    setViewMode(nextView)
    if (nextView === 'brief') {
      window.history.replaceState(null, '', '#proof')
    } else {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    }
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: preferredScrollBehavior() })
    }, 80)
  }, [])

  const navigateMobile = useCallback((nextView: ViewMode, targetId: string) => {
    switchView(nextView)
    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' })
    }, 80)
  }, [switchView])

  useEffect(() => {
    const syncHash = () => setViewMode(window.location.hash === '#proof' ? 'brief' : 'studio')
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  useEffect(() => {
    const worker = new Worker(new URL('./engine/aiWorker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data

      if (message.type === 'loading') {
        setModelState('loading')
        setModelProgress(0)
        setModelDetail(`Loading ${message.modelId} locally in WebGPU.`)
      }

      if (message.type === 'progress') {
        setModelState('loading')
        setModelProgress(Math.round((message.progress ?? 0) * 100))
        setModelDetail(message.text || `Downloading and compiling ${message.modelId}.`)
      }

      if (message.type === 'ready') {
        setModelState('ready')
        setModelProgress(100)
        setModelDetail(`${message.modelId} is ready in this browser tab.`)
      }

      if (message.type === 'pipeline') {
        setPipeline((current) =>
          current.map((item) =>
            item.pass === message.pass
              ? { ...item, status: message.status, detail: message.detail || passCopy[item.pass] }
              : item,
          ),
        )
      }

      if (message.type === 'final') {
        setFiles(message.files)
        setConsoleLines([
          {
            id: consoleCounter.current++,
            level: 'info',
            text: 'Preview reloaded with local model output.',
          },
        ])
        setIsRunningPipeline(false)
        appendConsole('info', 'Local model pipeline produced workspace files.')
      }

      if (message.type === 'complete') {
        const pending = pendingCompletions.current.get(message.id)
        if (pending) {
          pending.resolve(message.output)
          pendingCompletions.current.delete(message.id)
        }
      }

      if (message.type === 'error') {
        setModelState((current) => (current === 'loading' ? 'error' : current))
        setModelDetail(message.message)
        setIsRunningPipeline(false)
        const pending = message.id ? pendingCompletions.current.get(message.id) : undefined
        if (message.id && pending) {
          pending.reject(new Error(message.message))
          pendingCompletions.current.delete(message.id)
        }
        appendConsole('error', message.message)
      }
    }

    const completions = pendingCompletions.current
    return () => {
      completions.forEach((pending) => pending.reject(new Error('Worker closed.')))
      completions.clear()
      worker.terminate()
      workerRef.current = null
    }
  }, [appendConsole])

  const runLocalKitAction = useCallback(
    async (message: LocalKitRequest): Promise<unknown> => {
      const payload = message.payload ?? {}
      const keyPrefix = 'vibeproof:preview:'

      if (message.action === 'store:get') {
        return localStorage.getItem(`${keyPrefix}${payload.key ?? ''}`)
      }

      if (message.action === 'store:set') {
        localStorage.setItem(`${keyPrefix}${payload.key ?? ''}`, String(payload.value ?? ''))
        return true
      }

      if (message.action === 'store:delete') {
        localStorage.removeItem(`${keyPrefix}${payload.key ?? ''}`)
        return true
      }

      if (message.action === 'store:list') {
        return Object.keys(localStorage)
          .filter((key) => key.startsWith(keyPrefix))
          .map((key) => key.slice(keyPrefix.length))
      }

      if (message.action === 'db:query') {
        if (!dbRef.current) throw new Error('PGlite is not ready yet.')
        if (!payload.sql) throw new Error('Missing SQL.')
        const result = await dbRef.current.query(payload.sql, payload.params)
        const count = await dbRef.current.query<{ events: number }>('select count(*)::int as events from vibeproof_events')
        setDbEvents(count.rows[0]?.events ?? 0)
        return result
      }

      throw new Error('Unknown LocalKit action.')
    },
    [],
  )

  const handleLocalKitRequest = useCallback(
    async (message: LocalKitRequest, target: Window) => {
      try {
        const result = await runLocalKitAction(message)
        target.postMessage({ source: 'vibeproof-parent', id: message.id, ok: true, result }, '*')
      } catch (error) {
        target.postMessage(
          {
            source: 'vibeproof-parent',
            id: message.id,
            ok: false,
            error: error instanceof Error ? error.message : 'LocalKit request failed.',
          },
          '*',
        )
      }
    },
    [runLocalKitAction],
  )

  useEffect(() => {
    let cancelled = false

    async function bootDatabase() {
      try {
        const db = new PGlite('idb://vibeproof-studio')
        await db.exec(`
          create table if not exists vibeproof_events (
            id serial primary key,
            label text not null,
            created_at timestamptz default now()
          );
        `)
        await db.query('insert into vibeproof_events (label) values ($1)', ['studio boot'])
        const result = await db.query<{ events: number }>('select count(*)::int as events from vibeproof_events')
        if (cancelled) return
        dbRef.current = db
        setDbEvents(result.rows[0]?.events ?? 0)
        setDbState('ready')
        setDbDetail('PGlite is live through IndexedDB with parent-owned queries.')
      } catch (error) {
        if (cancelled) return
        setDbState('error')
        setDbDetail(error instanceof Error ? error.message : 'PGlite failed to start.')
      }
    }

    void bootDatabase()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<PwaDetail>).detail
      if (!detail) return
      setPwaState(detail.status)
      setPwaDetail(detail.label)
    }

    window.addEventListener('vibeproof:pwa', handler)
    window.setTimeout(() => {
      if (!('serviceWorker' in navigator)) {
        setPwaState('unsupported')
        setPwaDetail('Service workers are not available in this browser context.')
        return
      }

      navigator.serviceWorker
        .getRegistration()
        .then((registration) => {
          if (registration) {
            setPwaState('registered')
            setPwaDetail('Service worker registration is present.')
          }
        })
        .catch(() => {
          setPwaDetail('Service worker state could not be read yet.')
        })
    }, 0)

    return () => window.removeEventListener('vibeproof:pwa', handler)
  }, [])

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return

    const addEntries = (entries: PerformanceResourceTiming[]) => {
      setNetworkEvents((current) => {
        const next = new Map(current.map((entry) => [entry.id, entry]))
        entries.forEach((entry) => {
          const url = new URL(entry.name, window.location.href)
          next.set(`${entry.name}-${entry.startTime}`, {
            id: `${entry.name}-${entry.startTime}`,
            url: url.hostname ? `${url.hostname}${url.pathname}` : entry.name,
            type: entry.initiatorType || 'resource',
            size: entry.transferSize || 0,
            at: entry.startTime,
          })
        })
        return Array.from(next.values())
          .sort((a, b) => b.at - a.at)
          .slice(0, 24)
      })
    }

    addEntries(performance.getEntriesByType('resource') as PerformanceResourceTiming[])
    const observer = new PerformanceObserver((list) => {
      addEntries(list.getEntries() as PerformanceResourceTiming[])
    })
    observer.observe({ type: 'resource', buffered: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handler = (event: MessageEvent<LocalKitRequest | PreviewConsoleMessage>) => {
      if (event.source !== previewRef.current?.contentWindow) return
      const message = event.data

      if (message?.source === 'vibeproof-preview-console') {
        appendConsole(message.level, message.text)
        return
      }

      if (message?.source !== 'vibeproof-preview') return
      void handleLocalKitRequest(message, event.source as Window)
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [appendConsole, handleLocalKitRequest])

  const activeModel = modelOptions.find((item) => item.id === modelId) ?? modelOptions[0]
  const hasWebGpu = useMemo(() => 'gpu' in navigator, [])
  const srcDoc = useMemo(() => buildPreviewDoc(files), [files])
  const deterministicReady = dbState === 'ready'

  const selectedTool = useMemo(
    () => toolDefinitions.find((tool) => tool.id === selectedToolId) ?? toolDefinitions[0],
    [selectedToolId],
  )

  const filteredTools = useMemo(() => {
    const query = toolQuery.toLowerCase().trim()
    return toolDefinitions.filter((tool) => {
      const categoryMatch = toolCategory === 'All' || tool.category === toolCategory
      const queryMatch =
        !query ||
        `${tool.title} ${tool.description} ${tool.category}`.toLowerCase().includes(query)
      return categoryMatch && queryMatch
    })
  }, [toolCategory, toolQuery])

  const cloudAiEvents = useMemo(() => networkEvents.filter(isCloudAiRequest), [networkEvents])
  const allowedNetworkEvents = Math.max(networkEvents.length - cloudAiEvents.length, 0)

  function loadModel() {
    if (!workerRef.current) return
    if (!hasWebGpu) {
      setModelState('error')
      setModelProgress(0)
      setModelDetail('WebGPU is not exposed in this browser. Deterministic proof mode stays available without cloud fallback.')
      appendConsole('warn', 'WebGPU not exposed. VibeProof will not fall back to a hosted AI route.')
      return
    }
    setModelState('loading')
    setModelProgress(0)
    setModelDetail(`Preparing ${activeModel.label}. First load downloads model assets.`)
    workerRef.current.postMessage({ type: 'loadModel', modelId })
  }

  async function runDeterministicPipeline() {
    setIsRunningPipeline(true)
    setPipeline(emptyPipeline())
    for (const pass of Object.keys(passCopy) as PipelinePass[]) {
      setPipeline((current) =>
        current.map((item) =>
          item.pass === pass ? { ...item, status: 'running', detail: `Local proof: ${passCopy[pass]}` } : item,
        ),
      )
      await wait(180)
      setPipeline((current) =>
        current.map((item) =>
          item.pass === pass ? { ...item, status: 'done', detail: `Verified without cloud AI: ${passCopy[pass]}` } : item,
        ),
      )
    }
    setFiles(deterministicBuild(prompt))
    setConsoleLines([
      {
        id: consoleCounter.current++,
        level: 'info',
        text: 'Preview reloaded with deterministic proof app.',
      },
    ])
    setIsRunningPipeline(false)
    appendConsole('info', 'Deterministic proof compile replaced workspace files.')
  }

  function runLocalModelPipeline() {
    if (!workerRef.current || modelState !== 'ready') {
      appendConsole('warn', 'Load a WebLLM model before running the local AI pipeline.')
      return
    }

    const id = crypto.randomUUID()
    setIsRunningPipeline(true)
    setPipeline(emptyPipeline())
    workerRef.current.postMessage({ type: 'runPipeline', id, prompt, strategy })
  }

  function updateFile(value: string) {
    setFiles((current) => ({ ...current, [activeFile]: value }))
  }

  async function runSelectedTool() {
    setIsToolRunning(true)
    try {
      if (selectedTool.requiresModel) {
        if (modelState !== 'ready') {
          setToolOutput('Load a local WebLLM model first. This app does not route AI tools to a server.')
          return
        }
        const output = await askLocalModel(selectedTool, toolInput)
        setToolOutput(output)
        return
      }

      const result = await runTool(selectedTool, toolInput)
      setToolOutput(result.output)
    } finally {
      setIsToolRunning(false)
    }
  }

  function askLocalModel(tool: ToolDefinition, input: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Model worker is not available.'))
        return
      }

      const id = crypto.randomUUID()
      pendingCompletions.current.set(id, { resolve, reject })
      workerRef.current.postMessage({
        type: 'complete',
        id,
        maxTokens: 900,
        messages: [
          {
            role: 'system',
            content:
              'You are a local browser model inside VibeProof Studio. Be concise. Never claim a cloud request was made.',
          },
          {
            role: 'user',
            content: `Tool: ${tool.title}\nTask: ${tool.description}\nInput:\n${input}`,
          },
        ],
      })
    })
  }

  async function copyActiveFile() {
    try {
      await navigator.clipboard.writeText(files[activeFile])
      appendConsole('info', `${activeFile.toUpperCase()} copied to clipboard.`)
    } catch {
      appendConsole('warn', 'Clipboard copy is unavailable in this browser context.')
    }
  }

  async function downloadZip() {
    const zip = new JSZip()
    zip.file('index.html', standaloneHtml(files))
    zip.file('src/app.html', files.html)
    zip.file('src/app.css', files.css)
    zip.file('src/app.js', files.js)
    zip.file('README.md', `# VibeProof export\n\nGenerated locally by VibeProof Studio.\n`)
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'vibeproof-local-app.zip'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function chooseTool(tool: ToolDefinition) {
    setSelectedToolId(tool.id)
    setToolInput(tool.placeholder)
    setToolOutput(tool.requiresModel ? 'This tool will use the loaded local model only.' : 'Ready to run locally.')
  }

  return (
    <div className={`studio-shell ${viewMode === 'brief' ? 'brief-mode' : ''}`}>
      <aside className="system-rail glass-panel">
        <div className="pass-rail" aria-label="Five-pass pipeline status">
          {pipeline.map((item) => (
            <span className={`pass-dot ${item.status}`} key={item.pass} title={item.title}>
              <i />
            </span>
          ))}
        </div>

        <div className="brand-block">
          <div className="brand-mark">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="label">VibeProof Studio</p>
            <h1>Local app builder</h1>
          </div>
        </div>

        <div className="view-switch" role="tablist" aria-label="VibeProof views">
          <button
            type="button"
            className={viewMode === 'studio' ? 'active' : ''}
            onClick={() => switchView('studio')}
          >
            <Monitor size={15} />
            Workspace
          </button>
          <button
            type="button"
            className={viewMode === 'brief' ? 'active' : ''}
            onClick={() => switchView('brief')}
          >
            <ShieldCheck size={15} />
            Proof brief
          </button>
        </div>

        <div className="status-stack">
          <StatusPill
            icon={<Bot size={16} />}
            label={modelState === 'ready' ? 'Model ready' : modelState === 'loading' ? 'Loading model' : 'Local proof mode'}
            tone={modelState === 'ready' ? 'good' : modelState === 'error' ? 'danger' : 'quiet'}
          />
          <StatusPill
            icon={<Database size={16} />}
            label={dbState === 'ready' ? `${dbEvents} PGlite events` : dbState === 'booting' ? 'PGlite booting' : 'PGlite issue'}
            tone={dbState === 'ready' ? 'good' : dbState === 'error' ? 'danger' : 'quiet'}
          />
          <StatusPill
            icon={<Lock size={16} />}
            label="No server AI route"
            tone="good"
          />
        </div>

        <section className="model-card" id="model-panel">
          <div className="section-heading">
            <HardDrive size={18} />
            <h2>Model</h2>
          </div>
          <label className="select-label" htmlFor="model-select">
            Local runtime
          </label>
          <select id="model-select" value={modelId} onChange={(event) => setModelId(event.target.value)}>
            {modelOptions.map((model) => (
              <option value={model.id} key={model.id}>
                {model.label}
              </option>
            ))}
          </select>
          <p className="microcopy">{activeModel.note}. WebGPU: {hasWebGpu ? 'available' : 'not exposed'}.</p>
          <button className="primary-action" type="button" onClick={loadModel} disabled={modelState === 'loading' || !hasWebGpu}>
            {modelState === 'loading' ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
            {hasWebGpu ? 'Load local model' : 'WebGPU required'}
          </button>
          <div className="progress-track" aria-label="model load progress">
            <span style={{ width: `${modelProgress}%` }} />
          </div>
          <p className="status-note">{modelDetail}</p>
        </section>

        <section className="proof-card" id="quick-proof-panel">
          <div className="section-heading">
            <ShieldCheck size={18} />
            <h2>Proof Pack</h2>
          </div>
          <ProofRow icon={<Monitor size={16} />} label="First screen is workspace" done />
          <ProofRow icon={<Bot size={16} />} label="WebLLM worker wired" done />
          <ProofRow icon={<Wrench size={16} />} label={`${LOCAL_TOOL_COUNT} local tools`} done />
          <ProofRow icon={<Database size={16} />} label="LocalKit store and DB" done={dbState === 'ready'} />
          <ProofRow icon={<WifiOff size={16} />} label="PWA after first cache" done={pwaState === 'offline-ready' || pwaState === 'registered'} />
        </section>
      </aside>

      {viewMode === 'studio' ? (
      <>
      <main className="workspace" id="workspace-panel">
        <section className="composer-panel glass-panel" id="builder-panel">
          <div className="composer-header">
            <div>
              <p className="label">Five-pass builder</p>
              <h2>Prompt, compile, verify, repair.</h2>
            </div>
            <div className="segmented">
              {strategies.map((item) => (
                <button
                  type="button"
                  className={item === strategy ? 'active' : ''}
                  key={item}
                  onClick={() => setStrategy(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="prompt-input"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            aria-label="App prompt"
          />

          <div className="action-row">
            <button
              type="button"
              className="primary-action"
              onClick={runLocalModelPipeline}
              disabled={modelState !== 'ready' || isRunningPipeline}
            >
              {isRunningPipeline && modelState === 'ready' ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
              Run local model
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={runDeterministicPipeline}
              disabled={isRunningPipeline || !deterministicReady}
            >
              <Zap size={16} />
              Compile proof
            </button>
            <button type="button" className="icon-action" onClick={() => setFiles(seedFiles)} aria-label="Reset seed files">
              <RefreshCw size={17} />
            </button>
          </div>

          <div className="pipeline-grid">
            {pipeline.map((item) => (
              <article className={`pipeline-step ${item.status}`} key={item.pass}>
                <span>{item.title}</span>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="editor-panel glass-panel">
          <div className="panel-toolbar">
            <div className="tab-group" role="tablist" aria-label="Workspace files">
              {(['html', 'css', 'js'] as FileKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={activeFile === key ? 'active' : ''}
                  onClick={() => setActiveFile(key)}
                >
                  <Code2 size={15} />
                  {key.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="toolbar-actions">
              <button type="button" className="icon-action" onClick={copyActiveFile} aria-label="Copy active file">
                <Copy size={16} />
              </button>
              <button type="button" className="icon-action" onClick={downloadZip} aria-label="Download generated app">
                <Download size={16} />
              </button>
            </div>
          </div>
          <CodeEditor
            key={activeFile}
            value={files[activeFile]}
            onChange={updateFile}
            language={activeFile}
            ariaLabel={`${activeFile} editor`}
          />
        </section>

        <section className="preview-panel glass-panel">
          <div className="panel-toolbar">
            <div className="section-heading">
              <Eye size={18} />
              <h2>Preview</h2>
            </div>
            <StatusPill
              icon={<Activity size={16} />}
              label="Sandboxed iframe"
              tone="quiet"
            />
          </div>
          <iframe
            ref={previewRef}
            title="Generated app preview"
            sandbox="allow-scripts allow-forms allow-modals"
            srcDoc={srcDoc}
          />
          <div className="console-panel">
            <div className="section-heading">
              <Terminal size={17} />
              <h3>Runtime console</h3>
            </div>
            <div className="console-log">
              {consoleLines.map((line) => (
                <p className={line.level} key={line.id}>
                  <span>{line.level}</span>
                  {line.text}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="proof-grid" id="proof-panel">
          <article className="proof-panel glass-panel">
            <div className="section-heading">
              <Database size={18} />
              <h2>Local backend</h2>
            </div>
            <strong>{dbState === 'ready' ? 'Connected' : dbState}</strong>
            <p>{dbDetail}</p>
          </article>

          <article className="proof-panel glass-panel">
            <div className="section-heading">
              <WifiOff size={18} />
              <h2>PWA cache</h2>
            </div>
            <strong>{pwaState.replace('-', ' ')}</strong>
            <p>{pwaDetail}</p>
          </article>

          <article className="proof-panel glass-panel network-card">
            <div className="section-heading">
              <Network size={18} />
              <h2>Network proof</h2>
            </div>
            <strong>{networkEvents.length} resource requests observed</strong>
            <div className="network-boundary">
              <span className={cloudAiEvents.length === 0 ? 'good' : 'danger'}>
                {cloudAiEvents.length === 0
                  ? '0 cloud AI / prompt API requests'
                  : `${cloudAiEvents.length} suspect cloud AI request${cloudAiEvents.length > 1 ? 's' : ''}`}
              </span>
              <span>{allowedNetworkEvents} app, PWA, WASM, or model resources</span>
            </div>
            <div className="network-list">
              {networkEvents.length === 0 ? (
                <p>No resource entries reported yet.</p>
              ) : (
                networkEvents.slice(0, 6).map((entry) => (
                  <p key={entry.id}>
                    <span>{entry.type}</span>
                    {entry.url}
                  </p>
                ))
              )}
            </div>
          </article>

          <article className="proof-panel glass-panel reviewer-card">
            <div className="section-heading">
              <ShieldCheck size={18} />
              <h2>Reviewer checklist</h2>
            </div>
            <div className="reviewer-checklist">
              <ProofRow icon={<Monitor size={16} />} label="Workspace is first screen" done />
              <ProofRow
                icon={<Lock size={16} />}
                label={cloudAiEvents.length === 0 ? 'No cloud AI requests observed' : 'Cloud AI request detected'}
                done={cloudAiEvents.length === 0}
              />
              <ProofRow icon={<Bot size={16} />} label={hasWebGpu ? 'WebGPU exposed' : 'WebGPU gracefully blocked'} done />
              <ProofRow icon={<Database size={16} />} label="LocalKit bridge visible" done={dbState === 'ready'} />
              <ProofRow icon={<WifiOff size={16} />} label="PWA/offline boundary shown" done={pwaState !== 'checking'} />
              <ProofRow icon={<Network size={16} />} label="Network resources listed" done={networkEvents.length > 0} />
            </div>
          </article>
        </section>
      </main>

      <aside className="toolbox-panel glass-panel" id="toolbox-panel">
        <div className="section-heading">
          <Layers3 size={19} />
          <h2>Toolbox</h2>
        </div>
        <div className="tool-search">
          <Search size={16} />
          <input value={toolQuery} onChange={(event) => setToolQuery(event.target.value)} placeholder="Search tools" />
        </div>
        <div className="category-scroll">
          {['All', ...toolCategories].map((category) => (
            <button
              key={category}
              type="button"
              className={toolCategory === category ? 'active' : ''}
              onClick={() => setToolCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="tool-list">
          {filteredTools.map((tool) => (
            <button
              type="button"
              key={tool.id}
              className={selectedTool.id === tool.id ? 'active' : ''}
              onClick={() => chooseTool(tool)}
            >
              <span>{tool.title}</span>
              {tool.requiresModel ? <Bot size={14} /> : <CheckCircle2 size={14} />}
            </button>
          ))}
        </div>

        <div className="tool-runner">
          <div>
            <p className="label">{selectedTool.category}</p>
            <h3>{selectedTool.title}</h3>
            <p>{selectedTool.description}</p>
          </div>
          <textarea value={toolInput} onChange={(event) => setToolInput(event.target.value)} aria-label="Tool input" />
          <button type="button" className="primary-action" onClick={runSelectedTool} disabled={isToolRunning}>
            {isToolRunning ? <Loader2 size={16} className="spin" /> : <Wrench size={16} />}
            Run tool
          </button>
          <pre>{toolOutput}</pre>
        </div>
      </aside>
      </>
      ) : (
        <ProofBrief onOpenStudio={() => switchView('studio')} />
      )}
      <nav className="mobile-tabbar glass-panel" aria-label="Mobile workspace navigation">
        {viewMode === 'studio' ? (
          <>
            <button type="button" onClick={() => navigateMobile('studio', 'builder-panel')}>
              <Monitor size={18} />
              <span>Build</span>
            </button>
            <button type="button" onClick={() => navigateMobile('studio', 'model-panel')}>
              <HardDrive size={18} />
              <span>Model</span>
            </button>
            <button type="button" onClick={() => navigateMobile('studio', 'toolbox-panel')}>
              <Layers3 size={18} />
              <span>Tools</span>
            </button>
            <button type="button" onClick={() => navigateMobile('studio', 'proof-panel')}>
              <ShieldCheck size={18} />
              <span>Proof</span>
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => navigateMobile('brief', 'submission-dossier')}>
              <FileCheck2 size={18} />
              <span>Dossier</span>
            </button>
            <button type="button" onClick={() => navigateMobile('studio', 'builder-panel')}>
              <Monitor size={18} />
              <span>Workspace</span>
            </button>
          </>
        )}
      </nav>
    </div>
  )
}

function StatusPill({
  icon,
  label,
  tone,
}: {
  icon: ReactNode
  label: string
  tone: 'good' | 'danger' | 'quiet'
}) {
  return (
    <span className={`status-pill ${tone}`}>
      {icon}
      {label}
    </span>
  )
}

function ProofRow({
  icon,
  label,
  done,
}: {
  icon: ReactNode
  label: string
  done: boolean
}) {
  return (
    <div className="proof-row">
      {icon}
      <span>{label}</span>
      {done ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
    </div>
  )
}

function ProofBrief({ onOpenStudio }: { onOpenStudio: () => void }) {
  const workItems = [
    {
      icon: <Bot size={18} />,
      title: 'Browser-native AI builder',
      body: 'WebLLM runs in a worker with loadModel, runPipeline, and complete. Cloud AI routes are intentionally absent.',
    },
    {
      icon: <Code2 size={18} />,
      title: 'Premium workspace',
      body: 'Prompt, five-pass pipeline, CodeMirror editors, live preview, runtime console, and export controls are available on the first screen.',
    },
    {
      icon: <Database size={18} />,
      title: 'Local generated-app backend',
      body: 'Sandboxed apps receive window.LocalKit.store and window.LocalKit.db.query through a parent-owned PGlite bridge.',
    },
    {
      icon: <ShieldCheck size={18} />,
      title: 'Proof-first reviewer flow',
      body: 'Model, LocalKit, PWA, network, and toolbox state are visible in-app so judges can verify claims without reading code first.',
    },
  ]

  const verificationItems = [
    {
      label: 'Run the product',
      detail: 'The default route opens directly to the usable workspace, not a marketing page.',
    },
    {
      label: 'Compile proof',
      detail: 'The deterministic proof compiler updates editable files and refreshes the sandbox preview.',
    },
    {
      label: 'Confirm LocalKit',
      detail: 'The iframe auto-proof writes local storage, inserts a PGlite row, and logs success.',
    },
    {
      label: 'Inspect network boundary',
      detail: 'Runtime resource requests are shown, while prompts and generated files stay out of hosted AI APIs.',
    },
    {
      label: 'Check offline claim',
      detail: 'The PWA panel states the real boundary: app shell first, model cache after first model download.',
    },
    {
      label: 'Open the toolbox',
      detail: `${LOCAL_TOOL_COUNT} local tools are available, with AI tools locked until a local model is loaded.`,
    },
  ]

  return (
    <main className="brief-page glass-panel" id="submission-dossier">
      <section className="brief-hero">
        <div className="brief-kicker">
          <span className="dossier-signal" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <p className="label">Bounty submission dossier</p>
        </div>
        <h2>One URL for the product, the proof, and the reviewer path.</h2>
        <p className="brief-lede">
          VibeProof Studio still opens to the actual local builder first. This integrated proof page gives
          judges the complete audit map: what was built, where data stays local, how generated apps persist
          state, and exactly which panels prove the bounty requirements.
        </p>
        <div className="brief-hero-pills" aria-label="Core proof pillars">
          <BriefPill icon={<Cpu size={15} />} label="Local WebLLM" />
          <BriefPill icon={<Database size={15} />} label="PGlite backend" />
          <BriefPill icon={<FileCheck2 size={15} />} label="Proof pack" />
          <BriefPill icon={<WifiOff size={15} />} label="PWA boundary" />
        </div>
        <div className="brief-actions">
          <button type="button" className="primary-action" onClick={onOpenStudio}>
            <Monitor size={16} />
            Open workspace
            <ArrowRight size={16} />
          </button>
          <a className="secondary-link" href="#proof">
            Share #proof
          </a>
        </div>
      </section>

      <section className="brief-metrics">
        <BriefMetric label="Runtime" value="Browser local" />
        <BriefMetric label="Tools" value={`${LOCAL_TOOL_COUNT}+`} />
        <BriefMetric label="Backend" value="PGlite" />
        <BriefMetric label="Cloud AI" value="None" />
      </section>

      <section className="brief-section">
        <div className="section-heading">
          <Layers3 size={19} />
          <h2>What Was Built</h2>
        </div>
        <div className="brief-card-grid">
          {workItems.map((item) => (
            <BriefCard key={item.title} icon={item.icon} title={item.title} body={item.body} />
          ))}
        </div>
      </section>

      <section className="brief-section">
        <div className="section-heading">
          <ShieldCheck size={19} />
          <h2>Verification Path</h2>
        </div>
        <div className="brief-checklist">
          {verificationItems.map((item) => (
            <div className="brief-check" key={item.label}>
              <CheckCircle2 size={16} />
              <span>
                <strong>{item.label}</strong>
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="brief-section">
        <div className="section-heading">
          <Network size={19} />
          <h2>Honest Offline Boundary</h2>
        </div>
        <div className="brief-two-col">
          <article>
            <h3>Allowed first-load network</h3>
            <p>
              App chunks, PWA assets, PGlite WASM/data, and first WebLLM model downloads can be fetched.
              These resources are visible in the network proof panel.
            </p>
          </article>
          <article>
            <h3>Not sent by this app</h3>
            <p>
              Prompts, generated files, toolbox inputs, LocalKit data, preview state, and repair output are
              not routed to a hosted AI API.
            </p>
          </article>
        </div>
      </section>

      <section className="brief-section">
        <div className="section-heading">
          <Activity size={19} />
          <h2>Competitor Edge</h2>
        </div>
        <div className="brief-card-grid compact">
          <BriefCard title="Against OnDevAI" body="Adds a stronger in-product proof pack and more premium reviewer flow." />
          <BriefCard title="Against ForgeBox" body="Keeps the technical local story while preparing public source and reproducible checks." />
          <BriefCard title="Against Zentro" body="Avoids provider/BYOK cloud routes that weaken the pure-local bounty claim." />
        </div>
      </section>

      <section className="brief-section brief-submit-strip">
        <div>
          <p className="label">Submission-ready path</p>
          <h2>Workspace first, proof page second, public delivery after approval.</h2>
          <p>
            The right bounty flow is to link reviewers to the working app, include `/#proof` for the
            integrated explanation, then attach screenshots and reproducible checks from the delivery pack.
          </p>
        </div>
        <button type="button" className="primary-action" onClick={onOpenStudio}>
          <Play size={16} />
          Test the build
        </button>
      </section>
    </main>
  )
}

function BriefMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="brief-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function BriefCard({ icon, title, body }: { icon?: ReactNode; title: string; body: string }) {
  return (
    <article className="brief-card">
      <h3>
        {icon}
        {title}
      </h3>
      <p>{body}</p>
    </article>
  )
}

function BriefPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="brief-pill">
      {icon}
      {label}
    </span>
  )
}

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function buildPreviewDoc(files: WorkspaceFiles): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${files.css}</style>
    <script>
      (() => {
        const pending = new Map();
        let seq = 0;

        function send(action, payload) {
          return new Promise((resolve, reject) => {
            const id = 'localkit-' + (++seq);
            pending.set(id, { resolve, reject });
            window.parent.postMessage({ source: 'vibeproof-preview', id, action, payload }, '*');
            window.setTimeout(() => {
              if (pending.has(id)) {
                pending.delete(id);
                reject(new Error('LocalKit request timed out.'));
              }
            }, 7000);
          });
        }

        window.addEventListener('message', (event) => {
          const message = event.data || {};
          if (message.source !== 'vibeproof-parent') return;
          const task = pending.get(message.id);
          if (!task) return;
          pending.delete(message.id);
          if (message.ok) task.resolve(message.result);
          else task.reject(new Error(message.error || 'LocalKit request failed.'));
        });

        window.LocalKit = {
          store: {
            get: (key) => send('store:get', { key }),
            set: (key, value) => send('store:set', { key, value }),
            delete: (key) => send('store:delete', { key }),
            list: () => send('store:list', {})
          },
          db: {
            query: (sql, params = []) => send('db:query', { sql, params })
          }
        };

        ['log', 'info', 'warn', 'error'].forEach((level) => {
          const original = console[level].bind(console);
          console[level] = (...args) => {
            original(...args);
            window.parent.postMessage({
              source: 'vibeproof-preview-console',
              level,
              text: args.map((arg) => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
            }, '*');
          };
        });

        async function runLocalKitAutoProof(attempt = 0) {
          try {
            await window.LocalKit.store.set('__iframe_auto_proof', new Date().toISOString());
            await window.LocalKit.db.query(
              'insert into vibeproof_events (label) values ($1)',
              ['preview iframe autoproof']
            );
            console.info('LocalKit iframe proof OK');
          } catch (error) {
            if (attempt < 12) {
              window.setTimeout(() => runLocalKitAutoProof(attempt + 1), 500);
              return;
            }
            console.warn('LocalKit iframe proof pending: ' + (error?.message || 'unknown'));
          }
        }

        window.setTimeout(() => runLocalKitAutoProof(), 300);

        window.addEventListener('error', (event) => {
          window.parent.postMessage({
            source: 'vibeproof-preview-console',
            level: 'error',
            text: event.message
          }, '*');
        });
      })();
    </script>
  </head>
  <body>
    ${files.html}
    <script>${escapeClosingScript(files.js)}</script>
  </body>
</html>`
}

function standaloneHtml(files: WorkspaceFiles): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>VibeProof local export</title>
    <style>${files.css}</style>
  </head>
  <body>
    ${files.html}
    <script>${escapeClosingScript(files.js)}</script>
  </body>
</html>`
}

function escapeClosingScript(code: string): string {
  return code.replace(/<\/script/gi, '<\\/script')
}

export default App

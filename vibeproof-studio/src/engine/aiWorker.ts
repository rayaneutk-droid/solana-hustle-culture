import { CreateMLCEngine, type InitProgressReport, type MLCEngineInterface } from '@mlc-ai/web-llm'
import type { PipelinePass, WorkspaceFiles } from '../lib/templates'

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type LoadModelRequest = {
  type: 'loadModel'
  modelId: string
}

type CompleteRequest = {
  type: 'complete'
  id: string
  messages: ChatMessage[]
  maxTokens?: number
}

type PipelineRequest = {
  type: 'runPipeline'
  id: string
  prompt: string
  strategy: string
}

type WorkerRequest = LoadModelRequest | CompleteRequest | PipelineRequest

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null
  postMessage: (message: unknown) => void
}
const passes: PipelinePass[] = ['research', 'plan', 'generate', 'verify', 'repair']
let engine: MLCEngineInterface | null = null
let loadedModelId = ''

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  void handleRequest(event.data)
}

async function handleRequest(request: WorkerRequest): Promise<void> {
  try {
    if (request.type === 'loadModel') {
      await loadModel(request.modelId)
      return
    }

    if (!engine) {
      throw new Error('Load a local WebLLM model before running AI tools.')
    }

    if (request.type === 'complete') {
      const output = await complete(request.messages, request.maxTokens ?? 900)
      ctx.postMessage({ type: 'complete', id: request.id, output })
      return
    }

    if (request.type === 'runPipeline') {
      const files = await runPipeline(request.prompt, request.strategy)
      ctx.postMessage({ type: 'final', id: request.id, files })
    }
  } catch (error) {
    ctx.postMessage({
      type: 'error',
      id: 'id' in request ? request.id : undefined,
      message: error instanceof Error ? error.message : 'The local model worker failed.',
    })
  }
}

async function loadModel(modelId: string): Promise<void> {
  ctx.postMessage({ type: 'loading', modelId })
  engine = await CreateMLCEngine(modelId, {
    initProgressCallback: (report: InitProgressReport) => {
      ctx.postMessage({
        type: 'progress',
        modelId,
        progress: report.progress,
        text: report.text,
      })
    },
  })
  loadedModelId = modelId
  ctx.postMessage({ type: 'ready', modelId })
}

async function complete(messages: ChatMessage[], maxTokens: number): Promise<string> {
  if (!engine) throw new Error('No local model is loaded.')
  const response = await engine.chat.completions.create({
    messages,
    temperature: 0.25,
    max_tokens: maxTokens,
  })
  return response.choices[0]?.message.content ?? ''
}

async function runPipeline(prompt: string, strategy: string): Promise<WorkspaceFiles> {
  const notes: Record<PipelinePass, string> = {
    research: '',
    plan: '',
    generate: '',
    verify: '',
    repair: '',
  }

  for (const pass of passes) {
    ctx.postMessage({ type: 'pipeline', pass, status: 'running', detail: passStart(pass) })
    notes[pass] = await complete(passMessages(pass, prompt, strategy, notes), pass === 'generate' || pass === 'repair' ? 1800 : 700)
    ctx.postMessage({
      type: 'pipeline',
      pass,
      status: 'done',
      detail: notes[pass].slice(0, 420),
    })
  }

  return extractWorkspaceFiles(notes.repair || notes.generate, prompt)
}

function passStart(pass: PipelinePass): string {
  const labels: Record<PipelinePass, string> = {
    research: 'Reading the product request and local-only constraints.',
    plan: 'Planning components, state, storage, and preview behavior.',
    generate: 'Generating the browser app files in memory.',
    verify: 'Checking LocalKit, sandbox, accessibility, and runtime risks.',
    repair: 'Returning repaired strict JSON for the workspace.',
  }
  return labels[pass]
}

function passMessages(
  pass: PipelinePass,
  prompt: string,
  strategy: string,
  notes: Record<PipelinePass, string>,
): ChatMessage[] {
  const system = [
    'You are VibeProof Studio running fully inside a browser tab through WebLLM.',
    'Never mention cloud providers. Do not invent server APIs.',
    'Generated apps must use only HTML, CSS, JavaScript, and the injected window.LocalKit API.',
    'window.LocalKit.store has async get, set, delete, list. window.LocalKit.db.query(sql, params) returns rows.',
    `Loaded local model: ${loadedModelId}.`,
  ].join(' ')

  const common = `User prompt: ${prompt}\nStrategy: ${strategy}\nPrior notes: ${JSON.stringify(notes)}`

  if (pass === 'generate' || pass === 'repair') {
    return [
      { role: 'system', content: system },
      {
        role: 'user',
        content: `${common}\nReturn strict JSON only with exactly these string keys: html, css, js. No markdown fences. The app should feel premium and run in a sandboxed iframe.`,
      },
    ]
  }

  return [
    { role: 'system', content: system },
    {
      role: 'user',
      content: `${common}\nPerform the ${pass} pass. Be concise and focus on a working local-first browser app.`,
    },
  ]
}

function extractWorkspaceFiles(raw: string, prompt: string): WorkspaceFiles {
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  try {
    const value = JSON.parse(cleaned) as Partial<WorkspaceFiles>
    if (typeof value.html === 'string' && typeof value.css === 'string' && typeof value.js === 'string') {
      return value as WorkspaceFiles
    }
  } catch {
    return fallbackFromModelText(raw, prompt)
  }
  return fallbackFromModelText(raw, prompt)
}

function fallbackFromModelText(raw: string, prompt: string): WorkspaceFiles {
  const title = escapeHtml(prompt.trim().split(/\s+/).slice(0, 7).join(' ') || 'Local model app')
  const safeRaw = escapeHtml(raw.slice(0, 1400))
  return {
    html: `<main class="model-fallback"><p class="eyebrow">Local model output needed repair</p><h1>${title}</h1><pre>${safeRaw}</pre><button id="proof">Run LocalKit proof</button><output id="out">Ready.</output></main>`,
    css: `body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0f17;color:#f7fbff;font-family:ui-sans-serif,system-ui}.model-fallback{width:min(860px,calc(100vw - 32px));display:grid;gap:16px;padding:32px;border:1px solid rgba(255,255,255,.16);border-radius:28px;background:rgba(255,255,255,.08);backdrop-filter:blur(24px)}.eyebrow{color:#9bd3ff;text-transform:uppercase;letter-spacing:0;font-size:12px;font-weight:800}h1{font-size:64px;line-height:.95;margin:0;letter-spacing:0}pre{white-space:pre-wrap;max-height:300px;overflow:auto;color:#c9d8ef}button{min-height:48px;border:0;border-radius:16px;background:#9bd3ff;color:#07111e;font-weight:800}@media(max-width:720px){h1{font-size:42px}}`,
    js: `document.querySelector('#proof').addEventListener('click', async () => {
  await window.LocalKit.store.set('model-fallback-proof', 'ok');
  const result = await window.LocalKit.db.query('select count(*)::int as events from vibeproof_events');
  document.querySelector('#out').textContent = 'LocalKit OK, events: ' + result.rows[0]?.events;
});`,
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

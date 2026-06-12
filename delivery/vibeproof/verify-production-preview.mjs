import { spawn } from 'node:child_process'
import path from 'node:path'

const root = process.cwd()
const previewUrl = process.env.VIBEPROOF_PREVIEW_URL || 'http://127.0.0.1:4173/'
const reportPath = 'delivery/vibeproof/production-url-verification.json'
const viteBin = path.join(root, 'vibeproof-studio', 'node_modules', 'vite', 'bin', 'vite.js')

async function waitForOk(url, timeout = 30000) {
  const started = Date.now()
  let lastError
  while (Date.now() - started < timeout) {
    try {
      const result = await fetch(url, { redirect: 'follow' })
      if (result.ok) return { status: result.status, url: result.url }
      lastError = new Error(`HTTP ${result.status}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  throw lastError || new Error(`Timed out waiting for ${url}`)
}

function runNode(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: 'inherit',
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${process.execPath} ${args.join(' ')} exited ${code}`))
    })
    child.on('error', reject)
  })
}

async function main() {
  const preview = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    cwd: path.join(root, 'vibeproof-studio'),
    stdio: 'inherit',
  })

  try {
    await waitForOk(previewUrl)
    await runNode(['delivery/vibeproof/verify-public-url.mjs'], {
      VIBEPROOF_URL: previewUrl,
      VIBEPROOF_URL_REPORT: reportPath,
    })
  } finally {
    preview.kill()
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  console.log(`VibeProof production preview verification wrote ${path.relative(root, path.resolve(root, reportPath))}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

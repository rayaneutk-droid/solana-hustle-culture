import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function parseStatusLine(line) {
  const status = line.slice(0, 2)
  const rawPath = line.slice(2).trim()
  return { status, path: rawPath.replace(/\\/g, '/') }
}

const expectedBranch = 'codex/vibeproof-studio'
const allowedDirtyPrefixes = ['delivery/social/']
const requiredFiles = [
  'vibeproof-studio/package.json',
  'vibeproof-studio/vercel.json',
  'delivery/vibesterz-submission.md',
  'delivery/vibeproof/public-launch-approval.md',
  'delivery/vibeproof/completion-audit.md',
  'delivery/vibeproof/delivery-audit.json',
  'delivery/vibeproof/local-boundary-audit.json',
  'delivery/vibeproof/proof-first-responsive-report.json',
]

const checks = []

function addCheck(label, ok, details = {}) {
  checks.push({ label, ok, details })
}

const branch = runGit(['branch', '--show-current'])
addCheck('Current branch is the VibeProof branch.', branch === expectedBranch, {
  currentBranch: branch,
  expectedBranch,
})

const statusLines = runGit(['status', '--porcelain=v1'])
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter(Boolean)
const entries = statusLines.map(parseStatusLine)
const disallowedDirty = entries.filter((entry) =>
  !allowedDirtyPrefixes.some((prefix) => entry.path.startsWith(prefix)),
)
addCheck('No dirty files outside the explicitly excluded delivery/social scope.', disallowedDirty.length === 0, {
  disallowedDirty,
  allowedDirtyPrefixes,
})

const missingFiles = []
for (const file of requiredFiles) {
  try {
    await readFile(file)
  } catch {
    missingFiles.push(file)
  }
}
addCheck('Required VibeProof launch files exist.', missingFiles.length === 0, { missingFiles })

const manifest = JSON.parse(await readFile('delivery/vibeproof/submission-assets-manifest.json', 'utf8'))
addCheck('Public actions remain gated in the manifest.', manifest.public_actions_require_confirmation === true, {
  public_actions_require_confirmation: manifest.public_actions_require_confirmation,
})
addCheck('Public URL placeholders are not filled before approval.', Object.values(manifest.public_placeholders ?? {}).every((value) => /TODO|optional/i.test(value)), {
  publicPlaceholders: manifest.public_placeholders,
})

const deliveryAudit = JSON.parse(await readFile('delivery/vibeproof/delivery-audit.json', 'utf8'))
addCheck('Delivery artifact audit is passing.', deliveryAudit.status === 'pass', {
  status: deliveryAudit.status,
  failedChecks: deliveryAudit.summary?.failedChecks,
})

const boundaryAudit = JSON.parse(await readFile('delivery/vibeproof/local-boundary-audit.json', 'utf8'))
addCheck('Local boundary audit is passing.', boundaryAudit.status === 'pass', {
  status: boundaryAudit.status,
  toolCount: boundaryAudit.summary?.toolCount,
})

const report = {
  generatedAt: new Date().toISOString(),
  project: 'VibeProof Studio',
  status: checks.every((check) => check.ok) ? 'pass' : 'fail',
  branch,
  dirtyEntries: entries,
  checks,
}

await writeFile('delivery/vibeproof/public-preflight.json', `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))

if (report.status !== 'pass') {
  process.exit(1)
}

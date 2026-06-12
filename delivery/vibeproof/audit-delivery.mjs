import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const deliveryDir = path.join(root, 'delivery', 'vibeproof')
const manifestPath = path.join(deliveryDir, 'submission-assets-manifest.json')
const reportPath = path.join(deliveryDir, 'delivery-audit.json')

const stalePatterns = [
  /Workspace first/i,
  /Open workspace first/i,
  /\/#proof/i,
  /local-glass-workbench-responsive/i,
  /vibeproof-local-glass-workspace/i,
  /bottom tab bar for Proof and Studio on the brief/i,
  /bottom tab bar jumps between Proof and Studio/i,
  /Tablet\/mobile keep touch-sized controls and a bottom tab bar/i,
]

const checks = []

function addCheck(label, ok, details = {}) {
  checks.push({ label, ok, details })
}

function toAbs(relativePath) {
  return path.join(root, relativePath.replaceAll('/', path.sep))
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function fileInfo(relativePath) {
  const absolute = toAbs(relativePath)
  const info = await stat(absolute)
  return { relativePath, absolute, size: info.size }
}

async function hasPngSignature(relativePath) {
  const bytes = await readFile(toAbs(relativePath))
  return (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
}

async function main() {
  const manifest = await readJson(manifestPath)
  const allArtifacts = [
    ...manifest.core_artifacts,
    ...manifest.screenshots,
    ...manifest.local_submission_visuals,
  ]

  const generatedByThisAudit = 'delivery/vibeproof/delivery-audit.json'
  const uniqueArtifacts = [...new Set(allArtifacts)].filter((item) => item !== generatedByThisAudit)
  const missing = []
  const empty = []

  for (const relativePath of uniqueArtifacts) {
    try {
      const info = await fileInfo(relativePath)
      if (info.size <= 0) empty.push(relativePath)
    } catch {
      missing.push(relativePath)
    }
  }

  addCheck('All manifest artifacts exist.', missing.length === 0, { missing })
  addCheck('All manifest artifacts are nonempty.', empty.length === 0, { empty })

  const pngs = [...manifest.screenshots, ...manifest.local_submission_visuals.filter((item) => item.endsWith('.png'))]
  const badPngs = []
  for (const relativePath of pngs) {
    if (!(await hasPngSignature(relativePath))) badPngs.push(relativePath)
  }
  addCheck('All screenshot and visual PNGs have PNG signatures.', badPngs.length === 0, { badPngs })

  const boundaryAudit = await readJson(toAbs('delivery/vibeproof/local-boundary-audit.json'))
  addCheck('Local boundary audit status is pass.', boundaryAudit.status === 'pass', {
    status: boundaryAudit.status,
  })
  addCheck('Local toolbox count is at least 62.', boundaryAudit.summary?.toolCount >= 62, {
    toolCount: boundaryAudit.summary?.toolCount,
  })
  addCheck('No forbidden cloud runtime package hits.', boundaryAudit.summary?.forbiddenRuntimePackageHits === 0, {
    forbiddenRuntimePackageHits: boundaryAudit.summary?.forbiddenRuntimePackageHits,
  })
  addCheck('No direct prompt API network hits.', boundaryAudit.summary?.directNetworkApiHits === 0, {
    directNetworkApiHits: boundaryAudit.summary?.directNetworkApiHits,
  })

  const responsive = await readJson(toAbs('delivery/vibeproof/proof-first-responsive-report.json'))
  const captures = responsive.captured ?? []
  const requiredCaptures = [
    'proof-brief-desktop',
    'proof-brief-laptop',
    'proof-brief-tablet',
    'proof-brief-mobile',
    'studio-desktop',
  ]
  const captureNames = captures.map((item) => item.name)
  const missingCaptures = requiredCaptures.filter((name) => !captureNames.includes(name))
  const overflowCaptures = captures.filter((item) => item.state?.horizontalOverflow)
  const proofCapturesMissingCta = captures.filter((item) =>
    item.name.startsWith('proof-brief') && !item.state?.hasStudioCta,
  )
  const mobileTouchIssues = captures.filter((item) =>
    ['proof-brief-tablet', 'proof-brief-mobile'].includes(item.name) &&
    (item.state?.smallTouchTargets?.length ?? 0) > 0,
  )

  addCheck('Responsive report has all required captures.', missingCaptures.length === 0, { missingCaptures })
  addCheck('Responsive captures have no horizontal overflow.', overflowCaptures.length === 0, {
    overflowCaptures: overflowCaptures.map((item) => item.name),
  })
  addCheck('Proof brief captures expose the Studio CTA.', proofCapturesMissingCta.length === 0, {
    proofCapturesMissingCta: proofCapturesMissingCta.map((item) => item.name),
  })
  addCheck('Tablet and mobile captures have no tiny touch targets.', mobileTouchIssues.length === 0, {
    mobileTouchIssues: mobileTouchIssues.map((item) => item.name),
  })
  addCheck('Reduced-motion check is present and true.', Boolean(responsive.reducedMotion?.reducedMotion), {
    reducedMotion: responsive.reducedMotion,
  })

  const visuals = await readJson(toAbs('delivery/vibeproof/submission-visuals-manifest.json'))
  const expectedVisuals = ['submission-cover-16x9', 'submission-square-card', 'submission-story-card', 'figma-proof-frame-local']
  const renderedNames = (visuals.rendered ?? []).map((item) => item.name)
  const missingVisuals = expectedVisuals.filter((name) => !renderedNames.includes(name))
  addCheck('Submission visual manifest has all expected renders.', missingVisuals.length === 0, { missingVisuals })

  const docsToScan = [
    'delivery/vibesterz-submission.md',
    'delivery/vibeproof/public-action-briefs.md',
    'delivery/vibeproof/deployment-runbook.md',
    'delivery/vibeproof/public-launch-approval.md',
    'delivery/vibeproof/figma-proof-frame-brief.md',
    'delivery/vibeproof/canva-cover-brief.md',
    'vibeproof-studio/README.md',
  ]
  const staleHits = []
  for (const relativePath of docsToScan) {
    const text = await readFile(toAbs(relativePath), 'utf8')
    for (const pattern of stalePatterns) {
      if (pattern.test(text)) staleHits.push({ file: relativePath, pattern: pattern.source })
    }
  }
  addCheck('Active delivery docs avoid stale workspace-first artifact references.', staleHits.length === 0, { staleHits })

  const publicPlaceholders = manifest.public_placeholders ?? {}
  const placeholderValues = Object.values(publicPlaceholders)
  addCheck('Public URLs remain gated placeholders.', placeholderValues.every((value) => /TODO|optional/i.test(value)), {
    publicPlaceholders,
  })

  const report = {
    generatedAt: new Date().toISOString(),
    project: 'VibeProof Studio',
    status: checks.every((check) => check.ok) ? 'pass' : 'fail',
    summary: {
      artifactCount: uniqueArtifacts.length,
      screenshotCount: manifest.screenshots.length,
      localVisualCount: manifest.local_submission_visuals.length,
      checkCount: checks.length,
      failedChecks: checks.filter((check) => !check.ok).length,
    },
    checks,
  }

  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  if (report.status !== 'pass') {
    console.error(`VibeProof delivery audit failed. Report: ${path.relative(root, reportPath)}`)
    process.exit(1)
  }

  console.log(`VibeProof delivery audit passed. Report: ${path.relative(root, reportPath)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

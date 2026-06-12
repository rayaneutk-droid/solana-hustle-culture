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
  addCheck('No telemetry or analytics package hits.', boundaryAudit.summary?.telemetryPackageHits === 0, {
    telemetryPackageHits: boundaryAudit.summary?.telemetryPackageHits,
  })
  addCheck('No forbidden cloud AI package hits in lockfile.', boundaryAudit.summary?.lockCloudPackageHits === 0, {
    lockCloudPackageHits: boundaryAudit.summary?.lockCloudPackageHits,
  })
  addCheck('No forbidden telemetry or analytics SDK package hits in lockfile.', boundaryAudit.summary?.lockTelemetryPackageHits === 0, {
    lockTelemetryPackageHits: boundaryAudit.summary?.lockTelemetryPackageHits,
  })
  addCheck('No forbidden wallet or chain connector package hits in lockfile.', boundaryAudit.summary?.lockWalletPackageHits === 0, {
    lockWalletPackageHits: boundaryAudit.summary?.lockWalletPackageHits,
  })
  addCheck('No wallet or chain connector package hits.', boundaryAudit.summary?.walletPackageHits === 0, {
    walletPackageHits: boundaryAudit.summary?.walletPackageHits,
  })
  addCheck('No direct prompt API network hits.', boundaryAudit.summary?.directNetworkApiHits === 0, {
    directNetworkApiHits: boundaryAudit.summary?.directNetworkApiHits,
  })
  addCheck('No telemetry collection host hits in source or built artifacts.', boundaryAudit.summary?.telemetryHostHits === 0, {
    telemetryHostHits: boundaryAudit.summary?.telemetryHostHits,
  })
  addCheck('Built index has no remote static asset loads.', boundaryAudit.summary?.externalIndexAssetHits === 0, {
    externalIndexAssetHits: boundaryAudit.summary?.externalIndexAssetHits,
  })
  addCheck('Built CSS has no remote font, image, or stylesheet imports.', boundaryAudit.summary?.remoteCssAssetHits === 0, {
    remoteCssAssetHits: boundaryAudit.summary?.remoteCssAssetHits,
  })

  const reviewerSummary = await readJson(toAbs('delivery/vibeproof/reviewer-proof-summary.json'))
  addCheck('Reviewer proof summary status is pass.', reviewerSummary.status === 'pass', {
    status: reviewerSummary.status,
  })
  addCheck('Reviewer proof summary keeps public actions gated.', reviewerSummary.publicActionsRequireConfirmation === true, {
    publicActionsRequireConfirmation: reviewerSummary.publicActionsRequireConfirmation,
  })
  addCheck('Reviewer proof summary captures pure-local boundary counters.', reviewerSummary.localBoundary?.toolCount >= 62 &&
    reviewerSummary.localBoundary?.forbiddenRuntimePackageHits === 0 &&
    reviewerSummary.localBoundary?.directNetworkApiHits === 0 &&
    reviewerSummary.localBoundary?.builtPromptEndpointHits === 0 &&
    reviewerSummary.localBoundary?.externalIndexAssetHits === 0 &&
    reviewerSummary.localBoundary?.remoteCssAssetHits === 0, {
    localBoundary: reviewerSummary.localBoundary,
  })
  addCheck('Reviewer proof summary captures runtime network proof.', (reviewerSummary.browserRuntimeNetwork?.dev?.cloudAiRequestHits?.length ?? -1) === 0 &&
    (reviewerSummary.browserRuntimeNetwork?.productionPreview?.cloudAiRequestHits?.length ?? -1) === 0, {
    browserRuntimeNetwork: reviewerSummary.browserRuntimeNetwork,
  })
  addCheck('Reviewer proof summary captures production service worker and ZIP export proof.', reviewerSummary.productionPreview?.serviceWorkerDevFallback === false &&
    reviewerSummary.productionPreview?.generatedZipExportOk === true &&
    reviewerSummary.productionPreview?.generatedZipLocalToolCount >= 62 &&
    reviewerSummary.productionPreview?.generatedZipCloudAiPromptApis === false, {
    productionPreview: reviewerSummary.productionPreview,
  })
  const digestPaths = (reviewerSummary.artifactDigests ?? []).map((artifact) => artifact.path)
  const duplicateDigestPaths = digestPaths.filter((item, index) => digestPaths.indexOf(item) !== index)
  const expectedDigestPaths = [
    'delivery/vibeproof/local-boundary-audit.json',
    'delivery/vibeproof/public-url-verification.json',
    'delivery/vibeproof/production-url-verification.json',
    'delivery/vibeproof/proof-first-responsive-report.json',
    ...manifest.screenshots,
    ...manifest.local_submission_visuals,
  ]
  const missingDigestPaths = [...new Set(expectedDigestPaths)].filter((item) => !digestPaths.includes(item))
  const malformedDigestEntries = (reviewerSummary.artifactDigests ?? []).filter((artifact) =>
    !artifact.path || !(artifact.bytes > 0) || !/^[a-f0-9]{64}$/.test(artifact.sha256 ?? ''),
  )
  addCheck('Reviewer proof summary includes SHA-256 digests for visual and source proof artifacts.', missingDigestPaths.length === 0 &&
    duplicateDigestPaths.length === 0 &&
    malformedDigestEntries.length === 0, {
    digestCount: reviewerSummary.artifactDigests?.length,
    missingDigestPaths,
    duplicateDigestPaths,
    malformedDigestEntries,
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

  const urlVerification = await readJson(toAbs('delivery/vibeproof/public-url-verification.json'))
  const failedUrlChecks = (urlVerification.checks ?? []).filter((check) => !check.ok)
  const exportZipCheck = (urlVerification.checks ?? []).find((check) =>
    check.label === 'Generated app ZIP export includes source files, README, and proof manifest.'
  )
  const runtimeNetworkCheck = (urlVerification.checks ?? []).find((check) =>
    check.label === 'Runtime browser requests contain no cloud AI prompt API hosts.'
  )
  addCheck('Public URL verification report status is pass.', urlVerification.status === 'pass', {
    status: urlVerification.status,
    failedUrlChecks: failedUrlChecks.map((check) => check.label),
  })
  addCheck('Public URL verification proves generated app ZIP export contents.', Boolean(exportZipCheck?.ok), {
    exportZipCheck: exportZipCheck
      ? {
          ok: exportZipCheck.ok,
          missingEntries: exportZipCheck.details?.missingEntries,
          localToolCount: exportZipCheck.details?.localToolCount,
          cloudAiPromptApis: exportZipCheck.details?.cloudAiPromptApis,
        }
      : null,
  })
  addCheck('Public URL verification proves runtime browser requests avoid cloud AI hosts.', Boolean(runtimeNetworkCheck?.ok), {
    runtimeNetworkCheck: runtimeNetworkCheck
      ? {
          ok: runtimeNetworkCheck.ok,
          requestCount: runtimeNetworkCheck.details?.requestCount,
          hosts: runtimeNetworkCheck.details?.hosts,
          cloudAiRequestHits: runtimeNetworkCheck.details?.cloudAiRequestHits,
        }
      : null,
  })

  const productionUrlVerification = await readJson(toAbs('delivery/vibeproof/production-url-verification.json'))
  const failedProductionUrlChecks = (productionUrlVerification.checks ?? []).filter((check) => !check.ok)
  const productionSwCheck = (productionUrlVerification.checks ?? []).find((check) =>
    check.label === 'Service worker asset is reachable, or local dev fallback is documented.'
  )
  const productionExportZipCheck = (productionUrlVerification.checks ?? []).find((check) =>
    check.label === 'Generated app ZIP export includes source files, README, and proof manifest.'
  )
  const productionRuntimeNetworkCheck = (productionUrlVerification.checks ?? []).find((check) =>
    check.label === 'Runtime browser requests contain no cloud AI prompt API hosts.'
  )
  addCheck('Production preview URL verification report status is pass.', productionUrlVerification.status === 'pass', {
    status: productionUrlVerification.status,
    target: productionUrlVerification.target,
    failedProductionUrlChecks: failedProductionUrlChecks.map((check) => check.label),
  })
  addCheck('Production preview serves a real service worker asset, not the dev HTML fallback.', Boolean(productionSwCheck?.ok) && productionSwCheck.details?.devFallback !== true, {
    serviceWorker: productionSwCheck?.details ?? null,
  })
  addCheck('Production preview verification proves generated app ZIP export contents.', Boolean(productionExportZipCheck?.ok), {
    exportZipCheck: productionExportZipCheck
      ? {
          ok: productionExportZipCheck.ok,
          missingEntries: productionExportZipCheck.details?.missingEntries,
          localToolCount: productionExportZipCheck.details?.localToolCount,
          cloudAiPromptApis: productionExportZipCheck.details?.cloudAiPromptApis,
        }
      : null,
  })
  addCheck('Production preview verification proves runtime browser requests avoid cloud AI hosts.', Boolean(productionRuntimeNetworkCheck?.ok), {
    runtimeNetworkCheck: productionRuntimeNetworkCheck
      ? {
          ok: productionRuntimeNetworkCheck.ok,
          requestCount: productionRuntimeNetworkCheck.details?.requestCount,
          hosts: productionRuntimeNetworkCheck.details?.hosts,
          cloudAiRequestHits: productionRuntimeNetworkCheck.details?.cloudAiRequestHits,
        }
      : null,
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
  const staleCommandOrderPatterns = [
    /npm run proof:audit\s*\r?\n\s*npm run build/i,
    /cd vibeproof-studio && npm run proof:audit\s*\r?\n\s*-\s*cd vibeproof-studio && npm run build/i,
  ]
  const staleCommandOrderHits = []
  for (const relativePath of docsToScan) {
    const text = await readFile(toAbs(relativePath), 'utf8')
    for (const pattern of stalePatterns) {
      if (pattern.test(text)) staleHits.push({ file: relativePath, pattern: pattern.source })
    }
    for (const pattern of staleCommandOrderPatterns) {
      if (pattern.test(text)) staleCommandOrderHits.push({ file: relativePath, pattern: pattern.source })
    }
  }
  addCheck('Active delivery docs avoid stale workspace-first artifact references.', staleHits.length === 0, { staleHits })
  addCheck('Active launch docs run build before proof audit when commands are sequenced.', staleCommandOrderHits.length === 0, {
    staleCommandOrderHits,
  })

  const manifestChecks = manifest.local_checks ?? []
  const manifestBuildIndex = manifestChecks.indexOf('cd vibeproof-studio && npm run build')
  const manifestProofAuditIndex = manifestChecks.indexOf('cd vibeproof-studio && npm run proof:audit')
  addCheck(
    'Submission manifest lists build before proof audit because proof audit scans dist artifacts.',
    manifestBuildIndex >= 0 && manifestProofAuditIndex >= 0 && manifestBuildIndex < manifestProofAuditIndex,
    { manifestBuildIndex, manifestProofAuditIndex },
  )

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

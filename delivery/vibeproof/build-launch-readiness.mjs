import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const outputPath = path.join(root, 'delivery', 'vibeproof', 'launch-readiness.json')

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'))
}

function findCheck(report, label) {
  return (report.checks ?? []).find((check) => check.label === label)
}

function addCheck(checks, label, ok, details = {}) {
  checks.push({ label, ok, details })
}

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function parseStatusLine(line) {
  const status = line.slice(0, 2)
  const rawPath = line.slice(2).trim()
  return { status, path: rawPath.replace(/\\/g, '/') }
}

async function main() {
  const manifest = await readJson('delivery/vibeproof/submission-assets-manifest.json')
  const boundary = await readJson('delivery/vibeproof/local-boundary-audit.json')
  const publicUrl = await readJson('delivery/vibeproof/public-url-verification.json')
  const productionUrl = await readJson('delivery/vibeproof/production-url-verification.json')
  const responsive = await readJson('delivery/vibeproof/proof-first-responsive-report.json')
  const preflight = await readJson('delivery/vibeproof/public-preflight.json')
  const reviewerSummary = await readJson('delivery/vibeproof/reviewer-proof-summary.json')

  const checks = []
  const rootProofBrief = findCheck(publicUrl, 'Root route opens the reviewer Proof Brief.')
  const studioRoute = findCheck(publicUrl, 'Studio route opens the usable builder.')
  const localKitProof = findCheck(publicUrl, 'Compile proof runs and sandboxed LocalKit iframe proof completes.')
  const networkProof = findCheck(publicUrl, 'Runtime browser requests contain no cloud AI prompt API hosts.')
  const productionWorker = findCheck(productionUrl, 'Service worker asset is reachable, or local dev fallback is documented.')
  const productionZip = findCheck(productionUrl, 'Generated app ZIP export includes source files, README, and proof manifest.')
  const captures = responsive.captured ?? []
  const publicPlaceholders = manifest.public_placeholders ?? {}
  const allowedDirtyPrefixes = ['delivery/social/']
  const generatedEvidencePaths = [
    'delivery/vibeproof/public-preflight.json',
    'delivery/vibeproof/delivery-audit.json',
    'delivery/vibeproof/local-boundary-audit.json',
    'delivery/vibeproof/public-url-verification.json',
    'delivery/vibeproof/production-url-verification.json',
    'delivery/vibeproof/reviewer-proof-summary.json',
    'delivery/vibeproof/launch-readiness.json',
  ]
  const statusLines = runGit(['status', '--porcelain=v1'])
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
  const dirtyEntries = statusLines.map(parseStatusLine)
  const disallowedDirtyEntries = dirtyEntries.filter((entry) =>
    !generatedEvidencePaths.includes(entry.path) && !allowedDirtyPrefixes.some((prefix) => entry.path.startsWith(prefix)),
  )

  addCheck(checks, 'Pure-local boundary audit is passing.', boundary.status === 'pass' &&
    boundary.summary?.toolCount >= 62 &&
    boundary.summary?.forbiddenRuntimePackageHits === 0 &&
    boundary.summary?.directNetworkApiHits === 0 &&
    boundary.summary?.builtPromptEndpointHits === 0 &&
    boundary.summary?.telemetryHostHits === 0, {
    status: boundary.status,
    toolCount: boundary.summary?.toolCount,
    forbiddenRuntimePackageHits: boundary.summary?.forbiddenRuntimePackageHits,
    directNetworkApiHits: boundary.summary?.directNetworkApiHits,
    builtPromptEndpointHits: boundary.summary?.builtPromptEndpointHits,
    telemetryHostHits: boundary.summary?.telemetryHostHits,
  })
  addCheck(checks, 'Reviewer summary is passing and includes artifact digests.', reviewerSummary.status === 'pass' &&
    (reviewerSummary.artifactDigests?.length ?? 0) >= 17, {
    status: reviewerSummary.status,
    artifactDigestCount: reviewerSummary.artifactDigests?.length ?? 0,
  })
  addCheck(checks, 'Root opens the reviewer Proof Brief.', Boolean(rootProofBrief?.ok), {
    ok: rootProofBrief?.ok,
    hasStudioCta: rootProofBrief?.details?.hasStudioCta,
  })
  addCheck(checks, 'Studio route opens the usable builder.', Boolean(studioRoute?.ok), {
    ok: studioRoute?.ok,
    hasBuilderPanel: studioRoute?.details?.hasBuilderPanel,
    hasLocalBackend: studioRoute?.details?.hasLocalBackend,
    hasNetworkProof: studioRoute?.details?.hasNetworkProof,
  })
  addCheck(checks, 'LocalKit iframe proof completes from the public URL verifier.', Boolean(localKitProof?.ok), {
    ok: localKitProof?.ok,
    consoleTail: localKitProof?.details?.consoleTail,
  })
  addCheck(checks, 'Runtime browser requests avoid cloud AI prompt API hosts.', Boolean(networkProof?.ok), {
    ok: networkProof?.ok,
    hosts: networkProof?.details?.hosts ?? [],
    cloudAiRequestHits: networkProof?.details?.cloudAiRequestHits ?? [],
  })
  addCheck(checks, 'Production preview serves a real service worker and exportable ZIP.', Boolean(productionWorker?.ok) &&
    productionWorker.details?.devFallback !== true &&
    Boolean(productionZip?.ok) &&
    productionZip.details?.cloudAiPromptApis === false, {
    serviceWorker: productionWorker?.details ?? null,
    exportZip: productionZip
      ? {
          ok: productionZip.ok,
          localToolCount: productionZip.details?.localToolCount,
          cloudAiPromptApis: productionZip.details?.cloudAiPromptApis,
          missingEntries: productionZip.details?.missingEntries,
        }
      : null,
  })
  addCheck(checks, 'Responsive proof covers desktop, laptop, tablet, mobile, and Studio.', captures.length >= 5 &&
    captures.every((capture) => capture.state?.horizontalOverflow === false), {
    captures: captures.map((capture) => ({
      name: capture.name,
      width: capture.viewport?.width,
      height: capture.viewport?.height,
      horizontalOverflow: capture.state?.horizontalOverflow,
      smallTouchTargetCount: capture.state?.smallTouchTargets?.length ?? 0,
    })),
    reducedMotion: responsive.reducedMotion?.reducedMotion,
  })
  addCheck(checks, 'Public preflight is passing.', preflight.status === 'pass', {
    status: preflight.status,
    generatedEvidenceDirtyEntries: preflight.generatedEvidenceDirtyEntries ?? [],
  })
  addCheck(checks, 'Current worktree has no dirty VibeProof source or docs outside generated evidence.', disallowedDirtyEntries.length === 0, {
    disallowedDirtyEntries,
    allowedDirtyPrefixes,
    generatedEvidencePaths,
  })
  addCheck(checks, 'Public actions remain gated placeholders.', manifest.public_actions_require_confirmation === true &&
    Object.values(publicPlaceholders).every((value) => /TODO|optional/i.test(value)), {
    public_actions_require_confirmation: manifest.public_actions_require_confirmation,
    publicPlaceholders,
  })

  const localReady = checks.every((check) => check.ok)
  const report = {
    generatedAt: new Date().toISOString(),
    project: 'VibeProof Studio',
    status: localReady ? 'local_ready_public_gated' : 'fail',
    localReady,
    publicActionStatus: 'pending_explicit_approval',
    publicGates: [
      { action: 'github_source_publication', status: 'pending_explicit_approval', placeholder: publicPlaceholders.github_source_url },
      { action: 'vercel_deployment', status: 'pending_explicit_approval', placeholder: publicPlaceholders.vercel_demo_url },
      { action: 'figma_proof_frame', status: 'pending_explicit_approval', placeholder: publicPlaceholders.figma_frame_url },
      { action: 'canva_submission_visuals', status: 'pending_explicit_approval', placeholder: publicPlaceholders.canva_design_url },
      { action: 'pump_fun_submission', status: 'pending_explicit_approval', placeholder: publicPlaceholders.pump_fun_reply },
    ],
    proofRoutes: {
      reviewerEntry: '/',
      studio: '/#studio',
    },
    checks,
  }

  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`VibeProof launch readiness wrote ${path.relative(root, outputPath)}`)
  if (!localReady) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

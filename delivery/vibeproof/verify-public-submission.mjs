import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const outputPath = path.join(root, 'delivery', 'vibeproof', 'public-submission-verification.json')

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'))
}

function findCheck(report, label) {
  return (report.checks ?? []).find((check) => check.label === label)
}

function addCheck(checks, label, ok, details = {}) {
  checks.push({ label, ok, details })
}

function isTodo(value) {
  return /TODO/i.test(value ?? '')
}

function isOptionalTodo(value) {
  return /TODO|optional/i.test(value ?? '')
}

function parseHttpsUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

function isLocalhost(url) {
  return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
}

async function main() {
  const manifest = await readJson('delivery/vibeproof/submission-assets-manifest.json')
  const publicUrl = await readJson('delivery/vibeproof/public-url-verification.json')
  const boundary = await readJson('delivery/vibeproof/local-boundary-audit.json')
  const deliveryAudit = await readJson('delivery/vibeproof/delivery-audit.json')
  const reviewerSummary = await readJson('delivery/vibeproof/reviewer-proof-summary.json')
  const publicPlaceholders = manifest.public_placeholders ?? {}
  const checks = []

  const githubUrl = parseHttpsUrl(publicPlaceholders.github_source_url)
  const vercelUrl = parseHttpsUrl(publicPlaceholders.vercel_demo_url)
  const figmaValue = publicPlaceholders.figma_frame_url
  const canvaValue = publicPlaceholders.canva_design_url
  const pumpFunValue = publicPlaceholders.pump_fun_reply
  const publicTarget = parseHttpsUrl(publicUrl.target)
  const rootProofBrief = findCheck(publicUrl, 'Root route opens the reviewer Proof Brief.')
  const studioRoute = findCheck(publicUrl, 'Studio route opens the usable builder.')
  const localKitProof = findCheck(publicUrl, 'Compile proof runs and sandboxed LocalKit iframe proof completes.')
  const networkProof = findCheck(publicUrl, 'Runtime browser requests contain no cloud AI prompt API hosts.')
  const zipProof = findCheck(publicUrl, 'Generated app ZIP export includes source files, README, and proof manifest.')

  addCheck(checks, 'GitHub source URL is filled with a public HTTPS URL.', Boolean(githubUrl) && !isTodo(publicPlaceholders.github_source_url) && !isLocalhost(githubUrl), {
    github_source_url: publicPlaceholders.github_source_url,
  })
  addCheck(checks, 'Vercel demo URL is filled with a deployed HTTPS URL.', Boolean(vercelUrl) && !isTodo(publicPlaceholders.vercel_demo_url) && !isLocalhost(vercelUrl), {
    vercel_demo_url: publicPlaceholders.vercel_demo_url,
  })
  addCheck(checks, 'Optional Figma URL is either intentionally optional/TODO or a HTTPS URL.', isOptionalTodo(figmaValue) || Boolean(parseHttpsUrl(figmaValue)), {
    figma_frame_url: figmaValue,
  })
  addCheck(checks, 'Optional Canva URL is either intentionally optional/TODO or a HTTPS URL.', isOptionalTodo(canvaValue) || Boolean(parseHttpsUrl(canvaValue)), {
    canva_design_url: canvaValue,
  })
  addCheck(checks, 'Pump.fun reply is not marked submitted before final approval.', isTodo(pumpFunValue), {
    pump_fun_reply: pumpFunValue,
  })
  addCheck(checks, 'Public URL verification was regenerated against the deployed Vercel URL.', Boolean(publicTarget) &&
    Boolean(vercelUrl) &&
    publicTarget.hostname === vercelUrl.hostname &&
    !isLocalhost(publicTarget), {
    verificationTarget: publicUrl.target,
    vercel_demo_url: publicPlaceholders.vercel_demo_url,
  })
  addCheck(checks, 'Public URL verification status is pass.', publicUrl.status === 'pass', {
    status: publicUrl.status,
    failedChecks: (publicUrl.checks ?? []).filter((check) => !check.ok).map((check) => check.label),
  })
  addCheck(checks, 'Deployed root opens Proof Brief and Studio route opens builder.', Boolean(rootProofBrief?.ok) && Boolean(studioRoute?.ok), {
    rootProofBrief: rootProofBrief ? { ok: rootProofBrief.ok, hasStudioCta: rootProofBrief.details?.hasStudioCta } : null,
    studioRoute: studioRoute
      ? {
          ok: studioRoute.ok,
          hasBuilderPanel: studioRoute.details?.hasBuilderPanel,
          hasLocalBackend: studioRoute.details?.hasLocalBackend,
          hasNetworkProof: studioRoute.details?.hasNetworkProof,
        }
      : null,
  })
  addCheck(checks, 'Deployed LocalKit iframe proof and generated ZIP proof pass.', Boolean(localKitProof?.ok) &&
    Boolean(zipProof?.ok) &&
    zipProof.details?.cloudAiPromptApis === false &&
    zipProof.details?.localToolCount >= 62, {
    localKitProof: localKitProof ? { ok: localKitProof.ok, consoleTail: localKitProof.details?.consoleTail } : null,
    zipProof: zipProof
      ? {
          ok: zipProof.ok,
          localToolCount: zipProof.details?.localToolCount,
          cloudAiPromptApis: zipProof.details?.cloudAiPromptApis,
          missingEntries: zipProof.details?.missingEntries,
        }
      : null,
  })
  addCheck(checks, 'Deployed runtime browser requests avoid cloud AI prompt API hosts.', Boolean(networkProof?.ok) &&
    (networkProof.details?.cloudAiRequestHits?.length ?? -1) === 0, {
    hosts: networkProof?.details?.hosts ?? [],
    cloudAiRequestHits: networkProof?.details?.cloudAiRequestHits ?? [],
  })
  addCheck(checks, 'Local boundary, delivery audit, and reviewer summary are passing.', boundary.status === 'pass' &&
    deliveryAudit.status === 'pass' &&
    reviewerSummary.status === 'pass', {
    localBoundary: boundary.status,
    deliveryAudit: deliveryAudit.status,
    reviewerSummary: reviewerSummary.status,
  })

  const report = {
    generatedAt: new Date().toISOString(),
    project: 'VibeProof Studio',
    status: checks.every((check) => check.ok) ? 'public_submission_ready' : 'blocked',
    checks,
  }

  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`VibeProof public submission verification wrote ${path.relative(root, outputPath)}`)
  if (report.status !== 'public_submission_ready') process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

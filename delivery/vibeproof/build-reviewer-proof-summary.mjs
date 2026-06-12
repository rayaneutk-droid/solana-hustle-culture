import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const outputPath = path.join(root, 'delivery', 'vibeproof', 'reviewer-proof-summary.json')

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'))
}

function findCheck(report, label) {
  return (report.checks ?? []).find((check) => check.label === label)
}

function countFailed(report) {
  return (report.checks ?? []).filter((check) => !check.ok).length
}

async function main() {
  const manifest = await readJson('delivery/vibeproof/submission-assets-manifest.json')
  const boundary = await readJson('delivery/vibeproof/local-boundary-audit.json')
  const responsive = await readJson('delivery/vibeproof/proof-first-responsive-report.json')
  const publicUrl = await readJson('delivery/vibeproof/public-url-verification.json')
  const productionUrl = await readJson('delivery/vibeproof/production-url-verification.json')
  const deliveryAudit = await readJson('delivery/vibeproof/delivery-audit.json')
  const preflight = await readJson('delivery/vibeproof/public-preflight.json')

  const publicNetwork = findCheck(publicUrl, 'Runtime browser requests contain no cloud AI prompt API hosts.')
  const productionNetwork = findCheck(productionUrl, 'Runtime browser requests contain no cloud AI prompt API hosts.')
  const productionServiceWorker = findCheck(productionUrl, 'Service worker asset is reachable, or local dev fallback is documented.')
  const productionZip = findCheck(productionUrl, 'Generated app ZIP export includes source files, README, and proof manifest.')

  const summary = {
    generatedAt: new Date().toISOString(),
    project: 'VibeProof Studio',
    status:
      boundary.status === 'pass' &&
      publicUrl.status === 'pass' &&
      productionUrl.status === 'pass' &&
      deliveryAudit.status === 'pass' &&
      preflight.status === 'pass'
        ? 'pass'
        : 'fail',
    publicActionsRequireConfirmation: manifest.public_actions_require_confirmation === true,
    app: {
      appPath: manifest.app_path,
      rootRoute: '/',
      studioRoute: '/#studio',
      runtime: 'pure local browser app; WebLLM model assets may download on first load',
    },
    localBoundary: {
      toolCount: boundary.summary?.toolCount,
      forbiddenRuntimePackageHits: boundary.summary?.forbiddenRuntimePackageHits,
      telemetryPackageHits: boundary.summary?.telemetryPackageHits,
      walletPackageHits: boundary.summary?.walletPackageHits,
      lockCloudPackageHits: boundary.summary?.lockCloudPackageHits,
      lockTelemetryPackageHits: boundary.summary?.lockTelemetryPackageHits,
      lockWalletPackageHits: boundary.summary?.lockWalletPackageHits,
      directNetworkApiHits: boundary.summary?.directNetworkApiHits,
      builtPromptEndpointHits: boundary.summary?.builtPromptEndpointHits,
      builtSecretMarkerHits: boundary.summary?.builtSecretMarkerHits,
      telemetryHostHits: boundary.summary?.telemetryHostHits,
      externalIndexAssetHits: boundary.summary?.externalIndexAssetHits,
      remoteCssAssetHits: boundary.summary?.remoteCssAssetHits,
    },
    browserRuntimeNetwork: {
      dev: {
        target: publicUrl.target,
        requestCount: publicNetwork?.details?.requestCount,
        hosts: publicNetwork?.details?.hosts ?? [],
        cloudAiRequestHits: publicNetwork?.details?.cloudAiRequestHits ?? [],
      },
      productionPreview: {
        target: productionUrl.target,
        requestCount: productionNetwork?.details?.requestCount,
        hosts: productionNetwork?.details?.hosts ?? [],
        cloudAiRequestHits: productionNetwork?.details?.cloudAiRequestHits ?? [],
      },
    },
    productionPreview: {
      status: productionUrl.status,
      serviceWorkerContentType: productionServiceWorker?.details?.contentType,
      serviceWorkerDevFallback: productionServiceWorker?.details?.devFallback,
      generatedZipExportOk: Boolean(productionZip?.ok),
      generatedZipEntries: productionZip?.details?.entryNames ?? [],
      generatedZipLocalToolCount: productionZip?.details?.localToolCount,
      generatedZipCloudAiPromptApis: productionZip?.details?.cloudAiPromptApis,
    },
    responsiveProof: {
      captured: (responsive.captured ?? []).map((item) => ({
        name: item.name,
        width: item.viewport?.width,
        height: item.viewport?.height,
        horizontalOverflow: item.state?.horizontalOverflow,
        smallTouchTargetCount: item.state?.smallTouchTargets?.length ?? 0,
      })),
      reducedMotion: Boolean(responsive.reducedMotion?.reducedMotion),
    },
    delivery: {
      deliveryAuditStatus: deliveryAudit.status,
      deliveryAuditFailedChecks: deliveryAudit.summary?.failedChecks ?? countFailed(deliveryAudit),
      preflightStatus: preflight.status,
      generatedEvidenceDirtyEntries: preflight.generatedEvidenceDirtyEntries?.length ?? 0,
      publicPlaceholders: manifest.public_placeholders,
    },
    evidenceFiles: {
      localBoundaryAudit: 'delivery/vibeproof/local-boundary-audit.json',
      publicUrlVerification: 'delivery/vibeproof/public-url-verification.json',
      productionUrlVerification: 'delivery/vibeproof/production-url-verification.json',
      responsiveReport: 'delivery/vibeproof/proof-first-responsive-report.json',
      deliveryAudit: 'delivery/vibeproof/delivery-audit.json',
      publicPreflight: 'delivery/vibeproof/public-preflight.json',
    },
  }

  await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`)
  console.log(`VibeProof reviewer proof summary wrote ${path.relative(root, outputPath)}`)
  if (summary.status !== 'pass') process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

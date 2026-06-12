# VibeProof Deployment Runbook

Status: prepared only. Do not push, deploy, publish Figma/Canva, or submit Pump.fun without explicit approval.

Approval handoff: `delivery/vibeproof/public-launch-approval.md`.

## Current Branch

```bash
git branch --show-current
```

Expected:

```text
codex/vibeproof-studio
```

Do not include unrelated `delivery/social` changes in the VibeProof publish scope.

## Pre-Push Checks

Run from the repository root:

```bash
npm run vibeproof:launch-check
```

Equivalent expanded commands:

```bash
cd vibeproof-studio
npm run lint
npm run build
npm run proof:audit
cd ..
npm run check
npm run vibeproof:delivery:audit
npm run vibeproof:url-verify
npm run vibeproof:delivery:audit
npm run vibeproof:public-preflight
```

Expected:

- ESLint exits 0.
- `proof:audit` writes `delivery/vibeproof/local-boundary-audit.json` after checking source and built artifacts, then exits 0.
- Vite build exits 0.
- Root TypeScript check exits 0.
- `vibeproof:delivery:audit` writes `delivery/vibeproof/delivery-audit.json` and exits 0.
- `vibeproof:public-preflight` confirms public scope is clean except explicitly excluded `delivery/social/` changes.
- `vibeproof:url-verify` writes `delivery/vibeproof/public-url-verification.json` and confirms the desktop/mobile root Proof Brief plus `#studio` route, `Compile proof`, and sandboxed LocalKit iframe proof on the configured URL.
- `vibeproof:prod-url-verify` serves the local production build with `vite preview`, writes `delivery/vibeproof/production-url-verification.json`, and confirms the same route/export checks against built artifacts with a real service-worker asset.
- `vibeproof:summary` writes `delivery/vibeproof/reviewer-proof-summary.json`, a compact reviewer-facing summary of the local boundary, runtime network, production preview, ZIP export, responsive, and launch-gate evidence.
- Generated evidence reports may refresh during this command; source/docs changes outside those generated reports still fail the public preflight.
- Build warnings about large chunks and PGlite direct `eval` can be accepted as dependency/runtime artifacts, not hosted AI fallback.

## GitHub Scope

Include:

- `vibeproof-studio/`
- `delivery/vibesterz-submission.md`
- `delivery/vibeproof/`

Exclude unless separately requested:

- `delivery/social/`
- Existing `$HUSTLE` bounty site files

Suggested branch:

```text
codex/vibeproof-studio
```

Suggested commit title:

```text
Ship VibeProof Studio local AI bounty MVP
```

## Vercel Preview

Deploy root:

```text
vibeproof-studio/
```

Preview command after approval:

```bash
cd vibeproof-studio
vercel deploy
```

Production should wait until the preview URL is verified. If production is needed later, prefer promoting the verified preview rather than rebuilding.

## Deployed Verification

On the Vercel preview URL:

1. Confirm the default route opens the proof brief first, not a generic marketing page.
2. Click `Launch Local Studio` and confirm the URL moves to `#studio`.
3. Confirm the Studio renders the usable builder, editor, preview, toolbox, and proof panels.
4. Click `Compile proof`.
5. Confirm the preview console reports `LocalKit iframe proof OK`.
6. Confirm the Local backend card reaches `Connected`.
7. Confirm PWA status is visible and the offline claim stays limited to first cache/model cache.
8. Confirm the network proof lists resources and reports `0 cloud AI / prompt API requests`.
9. Confirm no account, wallet, cloud API key, or telemetry prompt appears.
10. Capture deployed proof-brief desktop/laptop/tablet/mobile screenshots plus Studio desktop.
11. Replace local-only URLs/TODOs in the Pump.fun reply only after source and preview links exist.

To refresh deployed screenshots from the repository root after approval:

```powershell
$env:VIBEPROOF_URL = 'https://YOUR-VERCEL-PREVIEW-URL'
npm run vibeproof:url-verify
npm run vibeproof:capture
Remove-Item Env:VIBEPROOF_URL
```

To rebuild the local submission cards from the refreshed screenshots:

```bash
npm run vibeproof:visuals
```

## Figma And Canva

Create only after approval.

Prepared local briefs:

- `delivery/vibeproof/figma-proof-frame-brief.md`
- `delivery/vibeproof/canva-cover-brief.md`
- `delivery/vibeproof/local-glass-workbench-theme.md`

Use real screenshots from `delivery/vibeproof/`. Do not use fake Apple marks, fake OS labels, or unverifiable claims.

## Pump.fun Submission Gate

Submit only after all are true:

- Public GitHub source URL exists.
- Vercel preview or production URL is verified.
- Deployed root proof brief and `#studio` Studio URL are verified.
- Current screenshots exist for the deployed URL.
- Optional Figma/Canva support assets are linked or intentionally skipped.
- User explicitly approves the final Pump.fun reply.

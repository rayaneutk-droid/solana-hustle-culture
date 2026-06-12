# VibeProof Deployment Runbook

Status: prepared only. Do not push, deploy, publish Figma/Canva, or submit Pump.fun without explicit approval.

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
cd vibeproof-studio
npm run lint
npm run proof:audit
npm run build
cd ..
npm run check
```

Expected:

- ESLint exits 0.
- `proof:audit` writes `delivery/vibeproof/local-boundary-audit.json` and exits 0.
- Vite build exits 0.
- Root TypeScript check exits 0.
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

1. Confirm the default route opens the usable workspace, not a marketing page.
2. Open `/#proof` and confirm the proof dossier renders.
3. Click `Compile proof`.
4. Confirm the preview console reports `LocalKit iframe proof OK`.
5. Confirm the Local backend card reaches `Connected`.
6. Confirm PWA status is visible and the offline claim stays limited to first cache/model cache.
7. Confirm the network proof lists resources and reports `0 cloud AI / prompt API requests`.
8. Confirm no account, wallet, cloud API key, or telemetry prompt appears.
9. Capture deployed desktop, laptop, tablet, mobile, and proof-brief screenshots.
10. Replace local-only URLs/TODOs in the Pump.fun reply only after source and preview links exist.

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
- Deployed `/#proof` URL is verified.
- Current screenshots exist for the deployed URL.
- Optional Figma/Canva support assets are linked or intentionally skipped.
- User explicitly approves the final Pump.fun reply.

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
npm run vibeproof:verify
```

Equivalent expanded commands:

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

# VibeProof Figma Proof Brief

Status: prepared locally only. Do not create or publish a Figma file without explicit approval.

## Target File

Name: `VibeProof Studio - Proof Brief First`

Purpose: give bounty reviewers a premium, scannable proof-control-room layout before they enter the working Studio. The Figma board supports the submission; it does not replace the working app, source, deployed URL, or reproducible checks.

## Required Frames

1. `Proof Brief - Desktop 1440x900`
2. `Proof Brief - Laptop 1280x720`
3. `Proof Brief - Tablet 834x1194`
4. `Proof Brief - Mobile 390x844`
5. `Workspace - Desktop 1440x900`

## Required Assets

- `delivery/vibeproof/vibeproof-proof-brief-desktop-1440.png`
- `delivery/vibeproof/vibeproof-proof-brief-laptop-1280.png`
- `delivery/vibeproof/vibeproof-proof-brief-tablet-834.png`
- `delivery/vibeproof/vibeproof-proof-brief-mobile-390.png`
- `delivery/vibeproof/vibeproof-studio-workspace-desktop-1440.png`
- `delivery/vibeproof/local-boundary-audit.json`
- `delivery/vibeproof/proof-first-responsive-report.json`

## Proof Brief First Viewport

- H1: `VibeProof Studio`
- Supporting line: `Local AI app builder that runs in your browser tab`
- Primary CTA: `Launch Local Studio`
- Secondary CTAs: `Verification checklist`, `Evidence pack`
- Proof chips:
  - `Local WebLLM`
  - `0 cloud AI prompt APIs`
  - `PGlite local backend`
  - `PWA/offline after cache`
- Live evidence cards:
  - `Model status`
  - `Network proof`
  - `Local backend`
  - `Reviewer path`
- Honesty note: first model load may request model/WASM/app resources; prompts, generated code, toolbox input, LocalKit data, and preview state should not be sent to hosted AI prompt APIs.

## Visual Direction

- Apple-platform inspired, not Apple-branded.
- Liquid Glass cues: translucent layers, subtle rim lighting, soft depth, compact controls.
- Cool controlled gradients: aurora rails, proof chips, action gradients, evidence strips.
- Avoid fake Apple logos, fake OS labels, decorative blobs, stock imagery, and unverifiable claims.
- Use real screenshots and the compact workspace preview as dominant evidence.
- Keep typography audit-focused; this is a proof board, not a marketing splash.

## Reviewer Path

1. Open root proof brief.
2. Click `Launch Local Studio`.
3. Click `Compile proof`.
4. Confirm `LocalKit iframe proof OK`.
5. Check Network proof for `0 cloud AI / prompt API requests`.
6. Run `npm run proof:audit`.

## Competitor Comparison Strip

- `OnDevAI`: similar local direction; VibeProof adds stronger in-product proof and reviewer entry.
- `ForgeBox`: strong local tech; VibeProof keeps public-source and reproducible delivery prepared.
- `Zentro`: provider/BYOK paths weaken pure-local claim; VibeProof keeps the submitted runtime local.

## Notes For Figma Creation

- Keep all screenshot layers named by filename.
- Build responsive frames from the same tokens, not one stretched desktop frame.
- Add footer placeholder: `TODO: Vercel URL after approval`.
- If the final deployed URL exists, add a QR/link block.

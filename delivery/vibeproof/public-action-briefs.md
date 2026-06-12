# VibeProof Public Action Briefs

These are prepared briefs. Do not execute GitHub push, Vercel deployment, Figma creation, Canva creation, or Pump.fun submission without explicit approval.

## GitHub

Target branch: `codex/vibeproof-studio`

Prepared source scope:

- `vibeproof-studio/`
- `delivery/vibesterz-submission.md`
- `delivery/vibeproof/`

Do not include unrelated `delivery/social` changes unless the user explicitly asks.

Suggested commit title:

```text
Add VibeProof Studio local AI bounty MVP
```

Suggested PR/body summary:

```text
Adds VibeProof Studio, an isolated Vite React TypeScript app for the Vibesterz bounty.

- WebLLM worker with loadModel, runPipeline, and complete
- LocalKit store and PGlite query bridge for sandboxed generated apps
- CodeMirror HTML/CSS/JS workspace with sandboxed live preview
- iOS-style mobile bottom tab bar for Build, Model, Tools, and Proof
- 68-tool local toolbox with deterministic and local-model-only AI tools
- PWA/offline, network, model, and local backend proof panels
- Known cloud-AI host classifier inside the network proof panel
- Workspace reviewer checklist proof panel
- Reproducible `npm run proof:audit` local-boundary report
- Integrated `/#proof` bounty submission dossier
- Browser-verified desktop and mobile screenshots
- Bounty submission pack under delivery/

Checks:
- cd vibeproof-studio && npm run lint
- cd vibeproof-studio && npm run proof:audit
- cd vibeproof-studio && npm run build
- npm run check
```

## Vercel

Deploy root: `vibeproof-studio/`

Expected framework: Vite

Local deployment config: `vibeproof-studio/vercel.json`

Commands after approval:

```bash
cd vibeproof-studio
vercel deploy
```

Post-deploy verification:

1. Open preview URL.
2. Confirm workspace renders on first screen.
3. Click `Compile proof`.
4. Confirm `LocalKit iframe proof OK`.
5. Confirm network and PWA panels render.
6. Confirm the network proof reports `0 cloud AI / prompt API requests`.
7. Confirm the reviewer checklist proof panel renders in the workspace.
8. Run `npm run proof:audit` locally and keep `delivery/vibeproof/local-boundary-audit.json`.
9. Open `/#proof` and confirm the integrated bounty submission dossier renders.
10. Capture desktop, tablet-like, and mobile Browser screenshots from the deployed URL and deployed `/#proof`.

Headers/config checks:

- `sw.js` and `manifest.webmanifest` revalidate instead of being frozen forever.
- Hashed assets use immutable cache headers.
- Permissions Policy blocks camera, microphone, geolocation, and payment prompts.
- No COOP/COEP header is forced, so WebLLM/PGlite cross-origin model and WASM fetches are not accidentally blocked.

Do not deploy production until preview is verified.

## Figma

Purpose: create a proof frame that reviewers can scan quickly without replacing the actual product proof or the integrated `/#proof` dossier.

Frame title:

```text
VibeProof Studio - Bounty Proof Layout
```

Frame sections:

1. Desktop workspace screenshot.
2. Tablet-like workspace screenshot.
3. Mobile workspace screenshot.
4. Desktop and mobile `/#proof` bounty dossier screenshots.
5. Runtime boundary strip:
   - Local WebLLM in tab
   - No server AI route
   - PGlite in IndexedDB
   - PWA after first cache
6. Competitor comparison:
   - OnDevAI: public/source, weaker proof surface
   - ForgeBox: strong local tech, source not found
   - Zentro: cloud provider routes weaken local claim
7. Verification checklist:
   - lint/build/root check
   - npm run proof:audit
   - Browser desktop/tablet/mobile
   - iframe LocalKit proof
   - network cloud-AI boundary
   - workspace reviewer checklist

Visual direction:

- Apple-inspired glass workspace, not Apple-branded.
- Use the real screenshots as the primary evidence.
- Keep the design practical and audit-focused.

## Canva

Purpose: create submission support visuals, not core proof.

Assets:

- `delivery/vibeproof/vibeproof-desktop-proof.png`
- `delivery/vibeproof/vibeproof-tablet-proof.png`
- `delivery/vibeproof/vibeproof-mobile-proof.png`
- `delivery/vibeproof/vibeproof-proof-brief-desktop.png`
- `delivery/vibeproof/vibeproof-proof-brief-mobile.png`

Cover concept:

```text
VibeProof Studio
Local AI app builder in one browser tab
WebLLM + LocalKit + PGlite + 68 tools
No server AI route
```

Recommended exports:

- 16:9 bounty cover
- Square social card
- Tall mobile proof card

Visual direction:

- Use actual screenshots.
- Avoid fake Apple marks, fake OS branding, or unverifiable claims.
- Mention that first model download can contact model/CDN hosts.

## Pump.fun Submission

Only submit after:

- GitHub source URL exists.
- Vercel preview or production URL is verified.
- Browser screenshots are current for the deployed URL.
- Deployed `/#proof` bounty dossier is verified.
- Figma/Canva support assets are optional but ready.

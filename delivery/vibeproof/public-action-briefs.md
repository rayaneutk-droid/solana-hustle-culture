# VibeProof Public Action Briefs

These are prepared briefs. Do not execute GitHub push, Vercel deployment, Figma creation, Canva creation, or Pump.fun submission without explicit approval.

Action approval handoff: `delivery/vibeproof/public-launch-approval.md`.

## GitHub

Target branch: `codex/vibeproof-studio`

Prepared source scope:

- `vibeproof-studio/`
- `delivery/vibesterz-submission.md`
- `delivery/vibeproof/`

Deployment runbook:

- `delivery/vibeproof/deployment-runbook.md`

Do not include unrelated `delivery/social` changes unless the user explicitly asks.

Suggested commit title:

```text
Ship VibeProof Studio local AI bounty MVP
```

Suggested PR/body summary:

```text
Adds VibeProof Studio, an isolated Vite React TypeScript app for the Vibesterz bounty.

- WebLLM worker with loadModel, runPipeline, and complete
- LocalKit store and PGlite query bridge for sandboxed generated apps
- CodeMirror HTML/CSS/JS workspace with sandboxed live preview
- Local Glass Workbench premium UI with iOS/macOS-inspired gradients, glass panels, and Windows-friendly density
- Proof-first root route with `#studio` one click away
- Tablet/mobile proof-first responsive flow with touch-sized controls; Studio mobile keeps the app navigation tab bar
- 68-tool local toolbox with deterministic and local-model-only AI tools
- PWA/offline, network, model, and local backend proof panels
- Known cloud-AI host classifier inside the network proof panel
- Workspace reviewer checklist proof panel
- Reproducible `npm run proof:audit` local-boundary report
- Integrated proof brief bounty submission dossier on the root route
- Browser-inspected workspace plus local Chrome CDP responsive screenshots/report
- Bounty submission pack under delivery/

Checks:
- cd vibeproof-studio && npm run lint
- cd vibeproof-studio && npm run proof:audit
- cd vibeproof-studio && npm run build
- npm run check
- delivery/vibeproof/proof-first-responsive-report.json
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
2. Confirm the proof brief renders on the first screen.
3. Click `Launch Local Studio` and confirm `#studio` opens the usable builder.
4. Click `Compile proof`.
5. Confirm `LocalKit iframe proof OK`.
6. Confirm network and PWA panels render.
7. Confirm the network proof reports `0 cloud AI / prompt API requests`.
8. Confirm the reviewer checklist proof panel renders in the Studio.
9. Run `npm run proof:audit` locally and keep `delivery/vibeproof/local-boundary-audit.json`.
10. From the repository root, run `VIBEPROOF_URL=<preview-url> npm run vibeproof:url-verify` or the PowerShell equivalent.
11. Capture proof-brief desktop/laptop/tablet/mobile screenshots plus Studio desktop from the deployed URL.

Headers/config checks:

- `sw.js` and `manifest.webmanifest` revalidate instead of being frozen forever.
- Hashed assets use immutable cache headers.
- Permissions Policy blocks camera, microphone, geolocation, and payment prompts.
- No COOP/COEP header is forced, so WebLLM/PGlite cross-origin model and WASM fetches are not accidentally blocked.

Do not deploy production until preview is verified.

## Figma

Purpose: create a proof frame that reviewers can scan quickly without replacing the actual proof-first app or the working `#studio` builder.

Frame title:

```text
VibeProof Studio - Proof Brief First
```

Frame sections:

1. Desktop proof brief screenshot.
2. Laptop/Windows-like proof brief screenshot.
3. Tablet proof brief screenshot.
4. Mobile proof brief screenshot.
5. Desktop Studio workspace screenshot.
6. Runtime boundary strip:
   - Local WebLLM in tab
   - No server AI route
   - PGlite in IndexedDB
   - PWA after first cache
7. Competitor comparison:
   - OnDevAI: public/source, weaker proof surface
   - ForgeBox: strong local tech, source not found
   - Zentro: cloud provider routes weaken local claim
8. Verification checklist:
   - lint/build/root check
   - npm run proof:audit
   - Browser inspection and local Chrome CDP desktop/laptop/tablet/mobile report
   - iframe LocalKit proof
   - network cloud-AI boundary
   - proof-first root and `#studio` Studio path

Visual direction:

- Apple-inspired glass workspace, not Apple-branded.
- Use the real screenshots as the primary evidence.
- Keep the design practical and audit-focused.

## Canva

Purpose: create submission support visuals, not core proof.

Assets:

- `delivery/vibeproof/vibeproof-proof-brief-desktop-1440.png`
- `delivery/vibeproof/vibeproof-proof-brief-laptop-1280.png`
- `delivery/vibeproof/vibeproof-proof-brief-tablet-834.png`
- `delivery/vibeproof/vibeproof-proof-brief-mobile-390.png`
- `delivery/vibeproof/vibeproof-studio-workspace-desktop-1440.png`

Cover concept:

```text
VibeProof Studio
Local AI app builder that runs in your browser tab
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
- Deployed root proof brief and `#studio` Studio are verified.
- Figma/Canva support assets are optional but ready.

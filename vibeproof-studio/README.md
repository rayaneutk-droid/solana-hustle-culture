# VibeProof Studio

Premium MVP bounty submission for the Vibesterz replication bounty.

VibeProof Studio is a browser-native AI app builder. The submitted app is designed to run the LLM locally in the tab with WebLLM, generate browser apps into a sandboxed preview, inject a local backend through `window.LocalKit`, and show a visible proof pack for model, network, database, PWA, and toolbox behavior.

The default route opens the reviewer proof brief first. The actual usable builder is one click away at `#studio`, so reviewers see the evidence before entering the workspace.

Visual direction: `Local Glass Workbench`, an iOS/macOS-inspired glass workspace with platform-neutral density so it still feels credible on Windows 11.

## What It Proves

- First screen is a proof/control-room brief, not a generic marketing page.
- `#studio` exposes the builder, preview, proof cards, and toolbox in one dense workspace.
- Tablet and mobile layouts open on the proof brief first, then keep the Studio path touch-friendly.
- Mobile layout adds a bottom tab bar for Proof and Studio on the brief, then Build, Model, Tools, and Proof inside the Studio.
- Local model worker exposes `loadModel`, `runPipeline`, and `complete`.
- Default model is `Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC`, with larger optional WebLLM models.
- No OpenAI, Gemini, Groq, OpenRouter, hosted AI API, account, wallet, or server inference route is used by the app.
- Generated apps run in a sandboxed iframe.
- `window.LocalKit.store` persists through localStorage.
- `window.LocalKit.db.query(sql, params)` proxies to a parent-owned PGlite database in IndexedDB.
- The preview iframe performs an automatic LocalKit proof handshake and logs `LocalKit iframe proof OK` when store and DB calls succeed from inside the sandbox.
- The toolbox includes 62+ local tools. Deterministic tools run immediately; AI tools stay locked until a local model is loaded.
- PWA/service-worker status is visible. Offline scope is honest: app shell after first cache; model weights after first model download/browser cache.
- Network proof panel lists runtime resource requests and explicitly reports whether known cloud AI/prompt API hosts were observed.
- Workspace proof panels include a reviewer checklist for proof-first routing, no hosted AI route, WebGPU handling, LocalKit, PWA, and network visibility.

## Local Run

```bash
npm install
npm run dev
```

Then open the Vite URL, usually `http://localhost:5173`.

## Verification

```bash
npm run build
npm run proof:audit
```

Expected result: TypeScript build and Vite production build pass. The proof audit writes `../delivery/vibeproof/local-boundary-audit.json` and exits 0 when the local-runtime boundary checks pass.

Full local check set from the repository root:

```bash
npm run vibeproof:verify
npm run vibeproof:url-verify
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

Manual browser checks:

1. Open the root route and confirm the proof brief appears first.
2. Click `Launch Local Studio` and confirm the URL moves to `#studio`.
3. Confirm the PGlite panel reaches `Connected`.
4. Click `Compile proof`.
5. Confirm the runtime console shows `LocalKit iframe proof OK`.
6. Optionally click `Write LocalKit store` and `Query PGlite` manually in the preview.
7. Confirm the toolbox count is above 62 and deterministic tools run without a model.
8. Try `Load local model` in a WebGPU browser. If WebGPU is unavailable, the app disables model loading, explains the requirement, and keeps deterministic proof mode available.
9. Reload after service-worker registration and confirm the PWA proof panel updates.
10. Check desktop, laptop, tablet-like, and mobile layouts. Confirm the proof brief has no horizontal overflow and the Studio remains usable.
11. Confirm the network proof reports `0 cloud AI / prompt API requests` while still listing app/PWA/model resources.

Local visual evidence is stored in `../delivery/vibeproof/`:

- `vibeproof-proof-brief-desktop-1440.png`
- `vibeproof-proof-brief-laptop-1280.png`
- `vibeproof-proof-brief-tablet-834.png`
- `vibeproof-proof-brief-mobile-390.png`
- `vibeproof-studio-workspace-desktop-1440.png`
- `proof-first-responsive-report.json`
- `public-url-verification.json`

## Runtime Boundary

The app has no backend AI route. The first model load can contact model/CDN hosts for WebLLM assets. Prompts, code, generated files, toolbox inputs, and preview data are not sent to an AI server by this app.

PGlite bundles PostgreSQL/WASM assets and may produce build warnings about large chunks and dependency internals. Those warnings are expected for a real local database and are documented instead of hidden.

## Deployment Notes

This app is isolated under `vibeproof-studio/` so the existing root bounty site remains untouched.

For Vercel, deploy this directory as the project root or configure the Vercel project root to `vibeproof-studio`.

Public deployment is intentionally gated. Do not push, deploy, publish Figma/Canva, or submit Pump.fun without explicit approval.

Suggested preview flow after approval:

```bash
cd vibeproof-studio
npm run lint
npm run proof:audit
npm run build
vercel deploy
```

After the preview URL is available:

1. Open the deployed root route and confirm the proof brief renders first.
2. Click `Launch Local Studio` and confirm `#studio` renders the usable builder.
3. Confirm no hosted AI route, account, wallet, or telemetry prompt appears.
4. Confirm the network panel reports `0 cloud AI / prompt API requests` after normal app use.
5. From the repository root, rerun `npm run vibeproof:url-verify` with `VIBEPROOF_URL` set to the preview URL.
6. Capture deployed proof brief desktop/laptop/tablet/mobile screenshots plus Studio desktop before any Pump.fun reply.

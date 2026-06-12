# VibeProof Studio

Premium MVP bounty submission for the Vibesterz replication bounty.

VibeProof Studio is a browser-native AI app builder. The submitted app is designed to run the LLM locally in the tab with WebLLM, generate browser apps into a sandboxed preview, inject a local backend through `window.LocalKit`, and show a visible proof pack for model, network, database, PWA, and toolbox behavior.

The default route opens the usable workspace. A reviewer-facing proof brief is available at `/#proof` without replacing the workspace-first requirement.

## What It Proves

- First screen is the usable workspace, not a landing page.
- Mobile layout opens on the builder and adds an iOS-style bottom tab bar for Build, Model, Tools, and Proof.
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
- Workspace proof panels include a reviewer checklist for workspace-first, no hosted AI route, WebGPU handling, LocalKit, PWA, and network visibility.

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

Manual browser checks:

1. Open the workspace.
2. Confirm the PGlite panel reaches `Connected`.
3. Click `Compile proof`.
4. Confirm the runtime console shows `LocalKit iframe proof OK`.
5. Optionally click `Write LocalKit store` and `Query PGlite` manually in the preview.
6. Confirm the toolbox count is above 62 and deterministic tools run without a model.
7. Try `Load local model` in a WebGPU browser. If WebGPU is unavailable, the app disables model loading, explains the requirement, and keeps deterministic proof mode available.
8. Reload after service-worker registration and confirm the PWA proof panel updates.
9. Check desktop, tablet-like, and mobile layouts. On mobile, confirm the bottom tab bar jumps to Build, Model, Tools, and Proof.
10. Confirm the network proof reports `0 cloud AI / prompt API requests` while still listing app/PWA/model resources.
11. Open `/#proof` and confirm the integrated proof brief explains the work without horizontal overflow on desktop or mobile.

## Runtime Boundary

The app has no backend AI route. The first model load can contact model/CDN hosts for WebLLM assets. Prompts, code, generated files, toolbox inputs, and preview data are not sent to an AI server by this app.

PGlite bundles PostgreSQL/WASM assets and may produce build warnings about large chunks and dependency internals. Those warnings are expected for a real local database and are documented instead of hidden.

## Deployment Notes

This app is isolated under `vibeproof-studio/` so the existing root bounty site remains untouched.

For Vercel, deploy this directory as the project root or configure the Vercel project root to `vibeproof-studio`.

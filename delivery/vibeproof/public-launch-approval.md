# VibeProof Public Launch Approval Handoff

Status: prepared only. No public action has been taken from this file.

This file is the approval gate for moving VibeProof Studio from local proof pack to public bounty submission.

## Current Local State

- Branch: `codex/vibeproof-studio`
- Latest VibeProof commit: `dd31af5 Make VibeProof proof-first premium MVP`
- App root: `vibeproof-studio/`
- Reviewer entry route: `/`
- Working Studio route: `/#studio`
- Local proof report: `delivery/vibeproof/proof-first-responsive-report.json`
- Boundary audit: `delivery/vibeproof/local-boundary-audit.json`
- Completion audit: `delivery/vibeproof/completion-audit.md`

Unrelated `delivery/social/` changes are intentionally excluded from this launch scope.

## Approval Options

Approve only the actions you want executed.

1. GitHub source publication
   - Action: push branch `codex/vibeproof-studio`.
   - Scope: `vibeproof-studio/`, `delivery/vibeproof/`, `delivery/vibesterz-submission.md`.
   - Excluded: `delivery/social/`, existing `$HUSTLE` site changes.
   - Public effect: source and delivery artifacts become available on GitHub if pushed to a public remote/PR.

2. Vercel preview deployment
   - Action: deploy `vibeproof-studio/` with Vite settings in `vibeproof-studio/vercel.json`.
   - Public effect: creates a Vercel preview URL.
   - Required post-check: root opens Proof Brief; `Launch Local Studio` opens `#studio`; network proof reports `0 cloud AI / prompt API requests`.

3. Figma proof frame
   - Action: create/update `VibeProof Studio - Proof Brief First` using the local frame brief and real screenshots.
   - Source: `delivery/vibeproof/figma-proof-frame-brief.md` and `delivery/vibeproof/figma-proof-frame-local.png`.
   - Public effect: only if the created Figma file/link is shared.

4. Canva submission visuals
   - Action: create Canva support visuals from `delivery/vibeproof/canva-cover-brief.md`.
   - Local fallback already exists:
     - `delivery/vibeproof/submission-cover-16x9.png`
     - `delivery/vibeproof/submission-square-card.png`
     - `delivery/vibeproof/submission-story-card.png`
   - Public effect: only if the Canva design/export link is shared.

5. Pump.fun reply
   - Action: submit the final bounty reply.
   - Required before submit:
     - GitHub source URL exists.
     - Vercel preview/production URL is verified.
     - Deployed screenshots or current local screenshots are attached/linked as intended.
     - User explicitly approves final copy.

## Pre-Public Checks

Run from repository root:

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

- All commands exit 0.
- Build may warn about large WebLLM/PGlite chunks and PGlite dependency `eval`; these are documented local-runtime artifacts.
- No OpenAI, Gemini, Groq, OpenRouter, BYOK cloud mode, account, wallet, telemetry, or server AI route appears in the app.

## Pump.fun Reply Template

```text
Built: VibeProof Studio

Demo: <VERCEL_URL>
Source: <GITHUB_URL>

VibeProof Studio is a proof-first, pure-local browser AI app builder. The root route opens the reviewer proof brief, and one click launches the working Studio at #studio.

What is inside:
- WebLLM local model worker: loadModel, runPipeline, complete
- Five-pass app builder pipeline: research, plan, generate, verify, repair
- Editable HTML/CSS/JS workspace with sandboxed preview
- LocalKit.store and LocalKit.db.query injected into generated apps
- PGlite local backend in IndexedDB
- 68 local tools, with AI-backed tools locked to the loaded local model
- PWA/offline proof panel with honest first-cache/model-cache boundary
- Network proof panel showing runtime resources and 0 cloud AI / prompt API requests
- Reproducible local-boundary audit

Honesty note: first model load may download WebLLM/model/WASM assets from model/CDN hosts. Prompts, generated code, toolbox input, LocalKit data, and preview state are not sent to hosted AI prompt APIs by this app.

Verification artifacts:
- delivery/vibeproof/local-boundary-audit.json
- delivery/vibeproof/proof-first-responsive-report.json
- delivery/vibeproof/vibeproof-proof-brief-desktop-1440.png
- delivery/vibeproof/vibeproof-proof-brief-laptop-1280.png
- delivery/vibeproof/vibeproof-proof-brief-tablet-834.png
- delivery/vibeproof/vibeproof-proof-brief-mobile-390.png
- delivery/vibeproof/vibeproof-studio-workspace-desktop-1440.png
```

## Public URL Fill-Ins

- GitHub source URL: `TODO after approval`
- Vercel demo URL: `TODO after approval`
- Figma proof frame URL: `optional / TODO after approval`
- Canva design URL: `optional / TODO after approval`
- Pump.fun submitted reply URL: `TODO after approval`

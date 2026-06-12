# VibeProof Figma Proof Frame Brief

Status: prepared only. Do not create or publish a Figma file without explicit approval.

## Purpose

Create a polished proof frame that helps bounty reviewers scan the real product evidence quickly. The Figma frame supports the submission; it does not replace the working app, the source, the deployed URL, or the integrated `/#proof` dossier.

## Frame

Title: `VibeProof Studio - Bounty Proof Layout`

Recommended canvas:

- Desktop frame: `1920 x 1400`
- Companion mobile frame: `390 x 1600`
- Optional social preview frame: `1200 x 630`

## Required Assets

- `delivery/vibeproof/vibeproof-desktop-proof.png`
- `delivery/vibeproof/vibeproof-tablet-proof.png`
- `delivery/vibeproof/vibeproof-mobile-proof.png`
- `delivery/vibeproof/vibeproof-proof-brief-desktop.png`
- `delivery/vibeproof/vibeproof-proof-brief-mobile.png`
- `delivery/vibeproof/local-boundary-audit.json`

## Layout

1. Hero strip
   - Title: `VibeProof Studio`
   - Subtitle: `Pure-local browser AI app builder`
   - Proof line: `WebLLM + LocalKit + PGlite + 68 tools`
   - Status badge: `No server AI route`

2. Product evidence row
   - Large desktop workspace screenshot.
   - Tablet and mobile screenshots as stacked device cards.
   - Small caption: `First screen is the working builder, not a landing page.`

3. Local boundary strip
   - `0 cloud AI / prompt API requests`
   - `WebLLM local worker`
   - `PGlite in IndexedDB`
   - `LocalKit sandbox bridge`
   - `PWA after first cache`

4. Audit evidence
   - Show the JSON report headline:
     `local-boundary-audit.json: pass`
   - Include short metrics:
     - `68 tools`
     - `0 forbidden runtime packages`
     - `0 direct prompt API network calls`
     - `0 Vercel functions`

5. Competitor comparison
   - `OnDevAI: similar local direction; VibeProof adds stronger in-product proof.`
   - `ForgeBox: strong local tech; VibeProof keeps public-source and reviewer path prepared.`
   - `Zentro: cloud provider paths weaken pure-local claim; VibeProof keeps runtime local.`

6. Reviewer path
   - `Open workspace`
   - `Click Compile proof`
   - `Confirm LocalKit iframe proof OK`
   - `Check Network proof`
   - `Open /#proof`
   - `Run npm run proof:audit`

## Visual Direction

- Apple-platform inspired, not Apple-branded.
- Liquid Glass cues: translucent layers, subtle rim lighting, soft depth, compact controls.
- Avoid fake Apple logos, fake OS chrome labels, stock imagery, decorative blobs, and unverifiable claims.
- Use the real screenshots as the dominant evidence.
- Keep typography compact and audit-focused; this is a product proof board, not a marketing splash.

## Notes For Figma Creation

- Keep all screenshot layers named by filename.
- Add a small footer: `First model load may download WebLLM/model assets. Prompts, generated code, toolbox input, and preview data are not sent to hosted AI APIs by this app.`
- If the final deployed URL exists, add a QR/link block. Until deployment approval, leave it as `TODO: Vercel URL after approval`.

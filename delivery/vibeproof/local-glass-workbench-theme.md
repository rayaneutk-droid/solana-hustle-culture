# VibeProof Studio Theme Board

Status: local design board only. Do not create or publish a Figma file without explicit approval.

## Direction

Name: `Local Glass Workbench`

Goal: make VibeProof Studio feel like a premium reviewer-first local app-builder proof, not a generic SaaS dashboard or fake macOS skin.

## Product Principles

- Proof brief first: the root route opens the bounty evidence control room.
- Studio one click away: `#studio` remains the actual usable builder.
- Local proof visible: proof panels are product controls, not marketing badges.
- Platform-neutral premium: inspired by iOS/macOS Liquid Glass, credible on Windows 11.
- Dense but calm: compact controls, readable code/editor areas, no decorative clutter.
- Honest motion: motion explains status changes, pipeline progress, and panel entry.

## Frame Set

- `Proof Brief - Desktop 1440x900`
- `Proof Brief - Laptop 1280x720`
- `Proof Brief - Tablet 834x1194`
- `Proof Brief - Mobile 390x844`
- `Workspace - Desktop 1440x900`

## Typography

Primary stack:

```css
-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Inter, system-ui, sans-serif
```

Use:

- Proof H1: 54-86px, literal product name.
- Proof tagline: 22-31px.
- Workspace display: 28-34px.
- Section titles: 14-17px.
- Labels/status: 11-12px, uppercase only for small labels.
- Body/proof copy: 12-17px with generous line-height.

## Color And Gradient Tokens

- Workbench background: `#070a10`, `#0b1018`, `#101722`
- Panel graphite: rgba black/blue-gray glass, not flat gray.
- Text primary: `#f7fbff`
- Text secondary: `#aab6c8`
- Text tertiary: `#718198`
- Accent blue: `#79b8ff`
- Accent mint: `#73f0bd`
- Warning gold: `#f8c96b`
- Rose accent: `#ff8fb3`
- Violet accent: `#9b8cff`
- Danger red: `#ff8c8c`
- Proof aurora rail: blue -> mint -> gold, used as a thin state cue.
- Action gradient: blue -> mint, used only for primary actions and proof pulses.

## Glass Tokens

- Main panel blur: `blur(28px) saturate(155%)`
- Panel radius: 22-26px
- Nested proof cards: 16-18px
- Rim line: white at 8-14% opacity
- Shadow: soft black, not colorful glow
- Specular highlight: one subtle top-left inset line

## Structural Decisions

- Root `/` is the Proof Brief.
- `#studio` opens the working Studio.
- `#proof` remains only as a compatibility alias to the proof brief.
- Replace decorative window dots with functional five-pass status rails.
- Proof first viewport includes:
  - H1 `VibeProof Studio`
  - tagline `Local AI app builder that runs in your browser tab`
  - proof chips for WebLLM, no cloud AI prompt APIs, PGlite, and PWA/offline after cache
  - live evidence cards for model, network, local backend, and reviewer path
  - compact visual preview of the Studio
  - honesty note about first model/WASM/app resource downloads
- Workspace keeps the full builder, proof panels, toolbox, editor, preview, and LocalKit bridge.
- Tablet/mobile keep touch-sized controls and a bottom tab bar.
- Windows/laptop viewport should feel like a neutral professional app, not Apple cosplay.

## Motion

- Panel entry: subtle translate + fade.
- Pipeline rail: running pulse only on active pass.
- Proof chips/cards: quiet state glow, not decorative blobs.
- Buttons: small translate/press feedback.
- Model progress: smooth width transition.
- Reduced motion: all animations collapse to near-instant.

## Validation Viewports

- Desktop: `1440 x 900`
- Laptop / Windows-like: `1280 x 720`
- Tablet: `834 x 1194`
- Mobile: `390 x 844`

Validation evidence after the proof-first update should include:

- `delivery/vibeproof/proof-first-responsive-report.json`
- `delivery/vibeproof/vibeproof-proof-brief-desktop-1440.png`
- `delivery/vibeproof/vibeproof-proof-brief-laptop-1280.png`
- `delivery/vibeproof/vibeproof-proof-brief-tablet-834.png`
- `delivery/vibeproof/vibeproof-proof-brief-mobile-390.png`
- `delivery/vibeproof/vibeproof-studio-workspace-desktop-1440.png`

## Figma Translation

When Figma creation is approved, create/update a frame set named:

```text
VibeProof Studio - Proof Brief First
```

Use the five frames above, the real screenshots, and this token sheet as the source of truth.

# VibeProof Studio Theme Board

Status: local design board only. Do not create or publish a Figma file without explicit approval.

## Direction

Name: `Local Glass Workbench`

Goal: make VibeProof Studio feel like a premium local app-builder workspace, not a generic SaaS dashboard or a fake macOS skin.

## Product Principles

- Workspace first: the first screen remains the usable builder.
- Local proof visible: proof panels are product controls, not marketing badges.
- Platform-neutral premium: inspired by iOS/macOS Liquid Glass, credible on Windows 11.
- Dense but calm: compact controls, readable code/editor areas, no decorative clutter.
- Honest motion: motion explains status changes, pipeline progress, and panel entry.

## Typography

Primary stack:

```css
-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Inter, system-ui, sans-serif
```

Use:

- Display: 28-34px in workspace cards.
- Section titles: 14-17px.
- Labels/status: 11-12px, uppercase only for small labels.
- Body/proof copy: 12-14px with generous line-height.

## Color Tokens

- Workbench background: `#070a10`, `#0b1018`, `#101722`
- Panel graphite: rgba black/blue-gray glass, not flat gray.
- Text primary: `#f7fbff`
- Text secondary: `#aab6c8`
- Text tertiary: `#718198`
- Accent blue: `#79b8ff`
- Accent mint: `#73f0bd`
- Warning gold: `#f8c96b`
- Danger red: `#ff8c8c`

## Glass Tokens

- Main panel blur: `blur(28px) saturate(155%)`
- Panel radius: 22-26px
- Nested card radius: 16-18px
- Rim line: white at 8-14% opacity
- Shadow: soft black, not colorful glow
- Specular highlight: one subtle top-left inset line

## Structural Changes

- Replace decorative window dots with a functional five-pass status rail.
- Keep segmented Workspace / Proof switch.
- Proof cards become graphite glass panels with compact metric hierarchy.
- Mobile keeps the bottom tab bar and touch targets.
- Tablet now opens workspace-first before the system/proof rail, matching the bounty's first-screen requirement.
- Integrated `/#proof` remains the explanatory page, so the product is not replaced by a marketing landing page.
- Windows/laptop viewport should feel like a neutral professional app, not Apple cosplay.

## Motion

- Panel entry: subtle translate + fade.
- Pipeline rail: running pulse only on active pass.
- Buttons: small translate/press feedback.
- Model progress: smooth width transition.
- Reduced motion: all animations collapse to near-instant.

## Validation Viewports

- Desktop: `1440 x 900`
- Laptop / Windows-like: `1280 x 720`
- Tablet: `834 x 1194`
- Mobile: `390 x 844`

Validation evidence:

- `delivery/vibeproof/local-glass-workbench-responsive-report.json`
- `delivery/vibeproof/vibeproof-local-glass-workspace-desktop-1440.png`
- `delivery/vibeproof/vibeproof-local-glass-workspace-laptop-1280.png`
- `delivery/vibeproof/vibeproof-local-glass-workspace-tablet-834.png`
- `delivery/vibeproof/vibeproof-local-glass-workspace-mobile-390.png`
- `delivery/vibeproof/vibeproof-local-glass-proof-brief-desktop-1440.png`
- `delivery/vibeproof/vibeproof-local-glass-proof-brief-mobile-390.png`

Browser connector was used for interactive inspection. Final screenshot capture used local Chrome CDP after the Browser connector intermittently timed out on `Page.captureScreenshot` during repeated viewport changes.

## Figma Translation

When Figma creation is approved, build three frames:

1. `Workspace / Local Glass Workbench`
2. `Proof Dossier / Boundary Evidence`
3. `Submission Cover / Proof Pack`

Use the real screenshots and this token sheet as the source of truth.

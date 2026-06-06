# $HUSTLE Coin Promo Bounty MVP

Static Codex-built website for the Pump.fun bounty **"Develop an AI website using
Codex"**. The first version was a generic hustle culture page; this version is
rebuilt around the actual coin: **HUSTLE / $HUSTLE** on Solana.

The repo also keeps the original local TypeScript bounty triage CLI.

## Live Deliverable

- Live URL: https://rayaneutk-droid.github.io/solana-hustle-culture/
- GitHub repo: https://github.com/rayaneutk-droid/solana-hustle-culture
- Figma design: https://www.figma.com/design/zjFiLNJFC9LGmfO4e0C8nl
- Pump.fun coin: https://pump.fun/coin/BYkyLgYY23CFjSYeTKKcrUJWxaW3ymu74NRkpF4tpump?clip=20260604_183448%3A2280210_20260604_183339
- Submission note: `delivery/submission-note.md`

## Coin Details Used

- Token: `$HUSTLE`
- Chain: Solana
- Contract address: `BYkyLgYY23CFjSYeTKKcrUJWxaW3ymu74NRkpF4tpump`
- Pump.fun snapshot checked on June 6, 2026: market cap around `$1.74K`

## Website

Open the static MVP directly:

```bash
start site/index.html
```

Or serve it locally:

```bash
python -m http.server 4173 --directory site
```

Then open:

```text
http://localhost:4173
```

## What The Visitor Sees

- Coin-first hero for `$HUSTLE`
- Official Pump.fun outbound CTA
- Real contract address copy button
- Pump.fun coin thumbnail used as a local visual asset
- Community loops: raid board, builder roll call, daily command
- Buy path that tells visitors to open Pump.fun and verify the CA
- Demo-safe positioning: no wallet, no embedded trading, no financial advice

## Original CLI

The existing CLI still works for sorting Pump.fun GO-style bounty examples.

```bash
npm install
npm run list
npm run bounty -- list --keyword telegram --min-reward 100 --tech-only
npm run bounty -- pitch go-demo-001
npm run check
```

## Structure

```text
site/                       static $HUSTLE bounty MVP website
site/assets/hustle-coin.jpg local Pump.fun thumbnail asset
delivery/submission-note.md copy-paste bounty reply and Loom script
delivery/desktop.png        desktop screenshot
delivery/mobile.png         mobile screenshot
data/sample-bounties.json   example bounties to score
src/cli.ts                  original CLI: list + pitch
```

# Solana Hustle Culture Bounty MVP

Static AI website MVP built with Codex for a bounty asking for a website about
hustle culture. The creative direction is a Solana-inspired launch room:
discipline, meme velocity, terminal energy, and a clean demo-safe delivery.

This repo also keeps the original local TypeScript bounty triage CLI.

## Live Deliverable

- Live URL: https://rayaneutk-droid.github.io/solana-hustle-culture/
- GitHub repo: https://github.com/rayaneutk-droid/solana-hustle-culture
- Figma design: https://www.figma.com/design/zjFiLNJFC9LGmfO4e0C8nl
- Submission note and Loom script: `delivery/submission-note.md`

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

- Premium "Solana Hustle Terminal" hero
- Local visual asset in `site/assets/launch-room.svg`
- Fictional launch-room metrics
- Hustle culture manifesto
- Daily command interaction
- Demo contract address copy button
- Proof strip for Figma, static MVP, and bounty delivery

## Safety Notes

This is demo content only. It has no wallet connection, no trading execution, no
private-key flow, no hidden API calls, and no financial advice.

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
site/                       static bounty MVP website
delivery/submission-note.md copy-paste bounty reply and Loom script
data/sample-bounties.json   example bounties to score
src/cli.ts                  original CLI: list + pitch
```

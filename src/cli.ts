import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type BountyStatus = "open" | "submitted" | "paid" | "expired" | string;

type Bounty = {
  id: string;
  title: string;
  rewardUsd?: number;
  rewardSol?: number;
  deadline?: string;
  status?: BountyStatus;
  url?: string;
  description?: string;
  tags?: string[];
};

type ListOptions = {
  source?: string;
  keyword?: string;
  minReward?: number;
  techOnly: boolean;
  limit: number;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSource = path.resolve(__dirname, "../data/sample-bounties.json");

const techKeywords = [
  "api",
  "automation",
  "bot",
  "cli",
  "code",
  "css",
  "dashboard",
  "data",
  "dapp",
  "dev",
  "fix",
  "frontend",
  "github",
  "html",
  "javascript",
  "landing",
  "node",
  "python",
  "script",
  "solana",
  "telegram",
  "typescript",
  "wallet",
  "webhook"
];

const cashKeywords = [
  "telegram",
  "bot",
  "dashboard",
  "wallet",
  "automation",
  "landing",
  "fix",
  "script",
  "solana",
  "alerts"
];

function printHelp() {
  console.log(`Bounty Hunter

Usage:
  npm run bounty -- list [--source data.json|url] [--keyword bot] [--min-reward 50] [--tech-only] [--limit 10]
  npm run bounty -- pitch <bounty-id> [--source data.json|url]

Examples:
  npm run list
  npm run bounty -- list --keyword telegram --min-reward 100 --tech-only
  npm run bounty -- pitch go-demo-001

Notes:
  - Default source: data/sample-bounties.json
  - You can set PUMP_GO_API_URL if Pump.fun exposes an official/public endpoint later.
`);
}

function parseArgs(argv: string[]) {
  const [command = "help", ...rest] = argv;
  const flags = new Map<string, string | boolean>();
  const positionals: string[] = [];

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (!value) continue;

    if (value.startsWith("--")) {
      const key = value.slice(2);
      const next = rest[index + 1];
      if (next && !next.startsWith("--")) {
        flags.set(key, next);
        index += 1;
      } else {
        flags.set(key, true);
      }
    } else {
      positionals.push(value);
    }
  }

  return { command, flags, positionals };
}

async function loadBounties(source?: string): Promise<Bounty[]> {
  const selectedSource = source ?? process.env.PUMP_GO_API_URL ?? defaultSource;

  if (/^https?:\/\//i.test(selectedSource)) {
    const response = await fetch(selectedSource, {
      headers: { "User-Agent": "bounty-hunter-cli/0.1" }
    });

    if (!response.ok) {
      throw new Error(`Could not fetch ${selectedSource}: ${response.status} ${response.statusText}`);
    }

    return normalizePayload(await response.json());
  }

  const filePath = path.resolve(selectedSource);
  if (!existsSync(filePath)) {
    throw new Error(`Source not found: ${filePath}`);
  }

  return normalizePayload(JSON.parse(await readFile(filePath, "utf8")));
}

function normalizePayload(payload: unknown): Bounty[] {
  const raw = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.bounties)
      ? payload.bounties
      : [];

  return raw.filter(isRecord).map((item, index) => ({
    id: readString(item.id) ?? `bounty-${index + 1}`,
    title: readString(item.title) ?? "Untitled bounty",
    rewardUsd: readNumber(item.rewardUsd) ?? readNumber(item.reward_usd),
    rewardSol: readNumber(item.rewardSol) ?? readNumber(item.reward_sol),
    deadline: readString(item.deadline),
    status: readString(item.status) ?? "open",
    url: readString(item.url),
    description: readString(item.description),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : []
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function bountyText(bounty: Bounty) {
  return `${bounty.title} ${bounty.description ?? ""} ${(bounty.tags ?? []).join(" ")}`.toLowerCase();
}

function isTechBounty(bounty: Bounty) {
  const text = bountyText(bounty);
  return techKeywords.some((keyword) => text.includes(keyword));
}

function scoreBounty(bounty: Bounty) {
  const text = bountyText(bounty);
  const reward = bounty.rewardUsd ?? (bounty.rewardSol ? bounty.rewardSol * 150 : 0);
  const keywordScore = cashKeywords.reduce((score, keyword) => score + (text.includes(keyword) ? 8 : 0), 0);
  const rewardScore = Math.min(40, Math.floor(reward / 10));
  const speedScore = bounty.deadline ? deadlineSpeedScore(bounty.deadline) : 8;

  return keywordScore + rewardScore + speedScore;
}

function deadlineSpeedScore(deadline: string) {
  const deadlineMs = Date.parse(deadline);
  if (!Number.isFinite(deadlineMs)) return 0;

  const daysLeft = Math.ceil((deadlineMs - Date.now()) / 86_400_000);
  if (daysLeft < 0) return -20;
  if (daysLeft <= 1) return 14;
  if (daysLeft <= 3) return 10;
  if (daysLeft <= 7) return 6;
  return 2;
}

function filterAndRank(bounties: Bounty[], options: ListOptions) {
  const keyword = options.keyword?.toLowerCase();

  return bounties
    .filter((bounty) => (bounty.status ?? "open") === "open")
    .filter((bounty) => !options.techOnly || isTechBounty(bounty))
    .filter((bounty) => !keyword || bountyText(bounty).includes(keyword))
    .filter((bounty) => (options.minReward ? (bounty.rewardUsd ?? 0) >= options.minReward : true))
    .map((bounty) => ({ bounty, score: scoreBounty(bounty) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit);
}

function formatReward(bounty: Bounty) {
  if (bounty.rewardUsd) return `$${bounty.rewardUsd}`;
  if (bounty.rewardSol) return `${bounty.rewardSol} SOL`;
  return "reward ?";
}

function printBountyList(rows: Array<{ bounty: Bounty; score: number }>) {
  if (rows.length === 0) {
    console.log("No matching bounties.");
    return;
  }

  for (const { bounty, score } of rows) {
    console.log(`\n[${score}] ${bounty.title}`);
    console.log(`  id: ${bounty.id}`);
    console.log(`  reward: ${formatReward(bounty)} | deadline: ${bounty.deadline ?? "?"}`);
    console.log(`  tags: ${(bounty.tags ?? []).join(", ") || "-"}`);
    if (bounty.description) console.log(`  why: ${shorten(bounty.description, 150)}`);
    if (bounty.url) console.log(`  url: ${bounty.url}`);
  }
}

function shorten(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function printPitch(bounty: Bounty) {
  console.log(`Pitch pack for: ${bounty.title}

Reply:
I can ship this fast. I will deliver:
- working prototype/code
- short README with setup steps
- Loom demo showing the full flow
- GitHub repo or zip with the exact files
- screenshots/proof before submission

Proof checklist:
- 1 minute Loom: problem -> demo -> how to run -> result
- GitHub README: install, run command, config needed, limitations
- Screenshot: terminal/app output with bounty title visible
- Delivery note: what is done, what is not included, next upgrade

Risk note:
Avoid market manipulation, fake volume, wallet draining flows, phishing, hidden trading, or anything that needs private keys.`);
}

async function main() {
  const { command, flags, positionals } = parseArgs(process.argv.slice(2));

  if (command === "help" || flags.has("help")) {
    printHelp();
    return;
  }

  if (command === "list") {
    const bounties = await loadBounties(readFlag(flags, "source"));
    const rows = filterAndRank(bounties, {
      source: readFlag(flags, "source"),
      keyword: readFlag(flags, "keyword"),
      minReward: readNumber(readFlag(flags, "min-reward")),
      techOnly: flags.has("tech-only"),
      limit: readNumber(readFlag(flags, "limit")) ?? 10
    });

    printBountyList(rows);
    return;
  }

  if (command === "pitch") {
    const bountyId = positionals[0];
    if (!bountyId) throw new Error("Missing bounty id. Example: npm run bounty -- pitch go-demo-001");

    const bounties = await loadBounties(readFlag(flags, "source"));
    const bounty = bounties.find((item) => item.id === bountyId);
    if (!bounty) throw new Error(`Bounty not found: ${bountyId}`);

    printPitch(bounty);
    return;
  }

  printHelp();
}

function readFlag(flags: Map<string, string | boolean>, key: string) {
  const value = flags.get(key);
  return typeof value === "string" ? value : undefined;
}

main().catch((error: unknown) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

const commands = [
  "Ship one visible thing before the feed gets a vote.",
  "Turn one quiet hour into proof, not noise.",
  "Clean the offer. Tighten the page. Send the link.",
  "Make the demo undeniable, then make the pitch short.",
  "No wallet. No hype. Just a sharper build."
];

const demoCa = "HUSTLE1111111111111111111111111111111111";
const commandOutput = document.querySelector("#commandOutput");
const commandButton = document.querySelector("[data-command-button]");
const copyButton = document.querySelector("[data-copy-ca]");
const toast = document.querySelector("[data-toast]");
const ticker = document.querySelector(".ticker-track");

let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2400);
}

function nextCommand() {
  if (!commandOutput) return;
  const current = commandOutput.textContent?.trim();
  const pool = commands.filter((command) => command !== current);
  const command = pool[Math.floor(Math.random() * pool.length)] ?? commands[0];
  commandOutput.textContent = command;
}

async function copyDemoCa() {
  try {
    await navigator.clipboard.writeText(demoCa);
    showToast("Demo contract address copied.");
  } catch {
    showToast("Copy unavailable. Demo CA is visible on the page.");
  }
}

function duplicateTickerItems() {
  if (!ticker || ticker.dataset.ready === "true") return;
  ticker.innerHTML = `${ticker.innerHTML}${ticker.innerHTML}`;
  ticker.dataset.ready = "true";
}

commandButton?.addEventListener("click", nextCommand);
copyButton?.addEventListener("click", copyDemoCa);
duplicateTickerItems();

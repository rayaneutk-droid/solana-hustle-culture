const commands = [
  "Post the CA with one clean reason to watch $HUSTLE.",
  "Drop one $HUSTLE screenshot, not a paragraph.",
  "Bring one builder into the roll call today.",
  "Turn the hustle into proof before the feed moves on.",
  "Share the Pump.fun link, then tell people to verify the CA."
];

const coinCa = "BYkyLgYY23CFjSYeTKKcrUJWxaW3ymu74NRkpF4tpump";
const commandOutput = document.querySelector("#commandOutput");
const commandButton = document.querySelector("[data-command-button]");
const copyButtons = document.querySelectorAll("[data-copy-ca]");
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

async function copyCa() {
  try {
    await navigator.clipboard.writeText(coinCa);
    showToast("$HUSTLE contract address copied.");
  } catch {
    showToast("Copy unavailable. The CA is visible on the page.");
  }
}

function duplicateTickerItems() {
  if (!ticker || ticker.dataset.ready === "true") return;
  ticker.innerHTML = `${ticker.innerHTML}${ticker.innerHTML}`;
  ticker.dataset.ready = "true";
}

commandButton?.addEventListener("click", nextCommand);
copyButtons.forEach((button) => button.addEventListener("click", copyCa));
duplicateTickerItems();

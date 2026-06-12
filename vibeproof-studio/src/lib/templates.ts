export type WorkspaceFiles = {
  html: string
  css: string
  js: string
}

export type PipelinePass = 'research' | 'plan' | 'generate' | 'verify' | 'repair'

export type PipelineEvent = {
  pass: PipelinePass
  title: string
  detail: string
  status: 'idle' | 'running' | 'done' | 'error'
}

export const passCopy: Record<PipelinePass, string> = {
  research: 'Scope, local data, and app constraints',
  plan: 'UI structure, state, and LocalKit contract',
  generate: 'HTML, CSS, and browser-only JavaScript',
  verify: 'Sandbox, console, PGlite, and offline checks',
  repair: 'Polish, accessibility, and failure handling',
}

export const seedFiles: WorkspaceFiles = {
  html: `<main class="app">
  <section class="hero">
    <p class="eyebrow">LocalKit demo app</p>
    <h1>Private launch notes</h1>
    <p>
      This generated app writes to the parent-owned local store and queries a
      PGlite database through the injected LocalKit API.
    </p>
  </section>

  <section class="composer">
    <input id="noteInput" placeholder="Write a private app note..." />
    <button id="saveNote">Save locally</button>
  </section>

  <section class="result">
    <div>
      <span>Store value</span>
      <strong id="storeValue">Waiting...</strong>
    </div>
    <div>
      <span>PGlite query</span>
      <strong id="dbValue">Waiting...</strong>
    </div>
  </section>
</main>`,
  css: `:root {
  color: #f6f7fb;
  background: #090a0f;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at 20% 0%, rgba(80, 145, 255, 0.26), transparent 34rem),
    linear-gradient(145deg, #090a0f 0%, #161923 60%, #0d1119 100%);
}

.app {
  box-sizing: border-box;
  min-height: 100vh;
  display: grid;
  align-content: center;
  gap: 22px;
  padding: clamp(22px, 6vw, 70px);
}

.hero,
.composer,
.result {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(24px) saturate(145%);
  border-radius: 24px;
}

.hero {
  padding: clamp(26px, 5vw, 56px);
}

.eyebrow {
  margin: 0 0 12px;
  color: #9bd3ff;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0;
  font-weight: 700;
}

h1 {
  margin: 0 0 14px;
  font-size: 68px;
  line-height: 0.96;
  letter-spacing: 0;
}

p {
  margin: 0;
  max-width: 62ch;
  color: rgba(246, 247, 251, 0.74);
  font-size: 18px;
}

.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding: 14px;
}

input,
button {
  min-height: 50px;
  border: 0;
  border-radius: 16px;
  font: inherit;
}

input {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  padding: 0 16px;
  outline: 1px solid rgba(255, 255, 255, 0.08);
}

button {
  cursor: pointer;
  color: #09111e;
  background: #9bd3ff;
  padding: 0 18px;
  font-weight: 800;
}

.result {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
}

.result div {
  display: grid;
  gap: 8px;
  padding: 22px;
  background: rgba(0, 0, 0, 0.14);
}

span {
  color: rgba(246, 247, 251, 0.58);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0;
}

strong {
  font-size: 18px;
}

@media (max-width: 680px) {
  .composer,
  .result {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 42px;
  }
}`,
  js: `const input = document.querySelector('#noteInput');
const saveButton = document.querySelector('#saveNote');
const storeValue = document.querySelector('#storeValue');
const dbValue = document.querySelector('#dbValue');

async function refreshProof(attempt = 0) {
  try {
    const stored = await window.LocalKit.store.get('launch-note');
    storeValue.textContent = stored || 'Nothing saved yet';

    const result = await window.LocalKit.db.query(
      'select count(*)::int as events from vibeproof_events'
    );
    dbValue.textContent = result.rows[0]?.events + ' local events';
  } catch {
    storeValue.textContent = 'LocalKit store ready';
    dbValue.textContent = 'Waiting for PGlite...';
    if (attempt < 8) {
      window.setTimeout(() => refreshProof(attempt + 1), 500);
    }
  }
}

saveButton.addEventListener('click', async () => {
  const value = input.value.trim() || 'Private note from the sandbox';
  await window.LocalKit.store.set('launch-note', value);
  await window.LocalKit.db.query(
    'insert into vibeproof_events (label) values ($1)',
    ['preview saved a note']
  );
  await refreshProof();
});

refreshProof();`,
}

export const emptyPipeline = (): PipelineEvent[] =>
  (Object.keys(passCopy) as PipelinePass[]).map((pass) => ({
    pass,
    title: pass[0].toUpperCase() + pass.slice(1),
    detail: passCopy[pass],
    status: 'idle',
  }))

export function deterministicBuild(prompt: string): WorkspaceFiles {
  const title = prompt.trim().split(/\s+/).slice(0, 6).join(' ') || 'Local proof app'
  const safeTitle = title.replace(/[<>]/g, '')
  return {
    html: `<main class="proof-app">
  <section class="masthead">
    <p class="label">Deterministic local compile</p>
    <h1>${safeTitle}</h1>
    <p>
      This fallback proves the workspace, preview sandbox, LocalKit store, and
      PGlite bridge without pretending a model generated the code.
    </p>
  </section>

  <section class="grid">
    <button id="storeButton">Write LocalKit store</button>
    <button id="dbButton">Query PGlite</button>
    <output id="output">Ready for local checks.</output>
  </section>
</main>`,
    css: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: #10131a;
  background: linear-gradient(135deg, #eef4ff, #f8fbff 45%, #dff8ef);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.proof-app {
  width: min(860px, calc(100vw - 32px));
  display: grid;
  gap: 18px;
}

.masthead,
.grid {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(24px) saturate(150%);
  border-radius: 26px;
  box-shadow: 0 28px 80px rgba(35, 56, 97, 0.18);
}

.masthead {
  padding: clamp(26px, 5vw, 58px);
}

.label {
  margin: 0 0 10px;
  color: #0c6d9d;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 12px;
  font-size: 72px;
  line-height: 0.94;
  letter-spacing: 0;
}

p {
  margin: 0;
  max-width: 62ch;
  color: #4a5568;
  font-size: 18px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 14px;
}

button,
output {
  min-height: 54px;
  border: 0;
  border-radius: 18px;
  font: inherit;
}

button {
  cursor: pointer;
  color: #fff;
  background: #111827;
  font-weight: 800;
}

output {
  display: grid;
  align-items: center;
  padding: 0 18px;
  color: #233044;
  background: rgba(15, 23, 42, 0.06);
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 42px;
  }
}`,
    js: `const output = document.querySelector('#output');

document.querySelector('#storeButton').addEventListener('click', async () => {
  await window.LocalKit.store.set('deterministic-proof', new Date().toISOString());
  const stored = await window.LocalKit.store.get('deterministic-proof');
  output.textContent = 'Store round trip: ' + stored;
});

document.querySelector('#dbButton').addEventListener('click', async () => {
  const result = await window.LocalKit.db.query(
    'select count(*)::int as events from vibeproof_events'
  );
  output.textContent = 'PGlite events table has ' + result.rows[0]?.events + ' rows';
});`,
  }
}

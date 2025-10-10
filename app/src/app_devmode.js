import { kvTable } from "@tugboats/core";

const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

// Dev mode state
let isDevModeActive = false;
let currentDevAlias = null;
let devModeSessions = new Set();

// UI elements
let devModeIndicator = null;
let devModeLogPanel = null;
let devModeLogContent = null;

// Remote module mount state
let currentRemote = { url: null, mod: null };
let tugboatsSlotEl = null;

// Event listeners
let stdoutUnlisten = null;
let urlUnlisten = null;
let stoppedUnlisten = null;

const prefsKV = kvTable("preferences");

// Utility: ensure slot element reference
function ensureSlot() {
  if (!tugboatsSlotEl) {
    tugboatsSlotEl = document.getElementById("tugboats-slot");
  }
  return tugboatsSlotEl;
}

/**
 * Parse dev mode command from raw input
 * @param {string} raw - Raw input string
 * @returns {Object|null} - { alias, command } or null
 */
export function parseDevCommand(raw) {
  const s = (raw || "").trim();
  if (!s) return null;
  // Match pattern: <alias>:dev (allow letters, numbers, underscore, hyphen, dot)
  const match = s.match(/^([A-Za-z0-9._-]+):dev$/);
  if (match) {
    return { alias: match[1], command: "dev" };
  }
  return null;
}

/**
 * Handle dev mode command from input
 * @param {string} raw - Raw input string
 */
export async function handleDevMode(raw) {
  const devCommand = parseDevCommand(raw);
  if (devCommand) {
    const { alias } = devCommand;
    // Check if this alias exists in clones
    const hasClone = await aliasExistsInClones(alias);
    if (!hasClone) {
      showDevModeError(`Clone alias "${alias}" not found in preferences`);
      return;
    }
    // Start dev mode
    await startDevMode(alias);
  } else if (isDevModeActive) {
    // Input changed to non-dev command, deactivate dev mode
    await stopCurrentDevMode();
  }
}

/**
 * Check if alias exists in preferences.clones
 */
async function aliasExistsInClones(alias) {
  try {
    const stored = await prefsKV.get(["user"]);
    if (stored._tag === "Ok") {
      const prefs = stored.result.value;
      if (prefs && Array.isArray(prefs.clones)) {
        return prefs.clones.some((clone) => clone.alias === alias);
      }
    }
  } catch (err) {
    console.error("Error checking clone alias:", err);
  }
  return false;
}

/** Start dev mode for alias */
export async function startDevModeForAlias(alias) { return startDevMode(alias); }

async function startDevMode(alias) {
  try {
    if (currentDevAlias === alias && isDevModeActive) {
      return; // already active
    }
    // Stop any existing dev mode first
    if (isDevModeActive) {
      await stopCurrentDevMode();
    }
    // Setup UI and listeners
    await initializeDevModeUI();
    setupEventListeners();

    // Update state and UI immediately (before backend starts)
    isDevModeActive = true;
    currentDevAlias = alias;
    devModeSessions.add(alias);
    updateDevModeIndicator(alias, "starting");
    showDevModePanel();
    addLogEntry("info", `🚀 Starting Vite dev server for "${alias}"...`);

    // Start backend dev server (await but after UI feedback)
    await invoke("start_dev", { alias });
  } catch (err) {
    console.error("Failed to start dev mode:", err);
    showDevModeError(`Failed to start dev mode: ${err}`);
    await stopCurrentDevMode();
  }
}

/** Stop current dev mode session */
export async function stopDevMode() { return stopCurrentDevMode(); }

async function stopCurrentDevMode() {
  if (!isDevModeActive || !currentDevAlias) return;
  try {
    await invoke("stop_dev");
    devModeSessions.delete(currentDevAlias);
    addLogEntry("info", `🛑 Stopped dev server for "${currentDevAlias}"`);
  } catch (err) {
    console.error("Failed to stop dev mode:", err);
  } finally {
    // Reset state
    isDevModeActive = false;
    currentDevAlias = null;
    updateDevModeIndicator(null, "inactive");

    // Clean up listeners
    if (stdoutUnlisten) { stdoutUnlisten(); stdoutUnlisten = null; }
    if (urlUnlisten) { urlUnlisten(); urlUnlisten = null; }
    if (stoppedUnlisten) { stoppedUnlisten(); stoppedUnlisten = null; }

    // Unmount any mounted dev module
    await unmountCurrentRemote();
  }
}

async function unmountCurrentRemote() {
  const slot = ensureSlot();
  if (currentRemote.mod) {
    try {
      const unmount = currentRemote.mod.unmount || currentRemote.mod.tugboatUnmount;
      if (typeof unmount === "function") {
        await unmount(slot);
      }
    } catch {}
  }
  if (slot) slot.innerHTML = "";
  currentRemote.mod = null;
  currentRemote.url = null;
}

/** Initialize dev mode UI elements */
async function initializeDevModeUI() {
  if (devModeIndicator && devModeLogPanel && devModeLogContent) return;

  devModeIndicator = document.createElement("div");
  devModeIndicator.id = "dev-mode-indicator";
  devModeIndicator.className = "dev-mode-indicator";
  devModeIndicator.style.display = "none";

  // Insert near the input form
  const form = document.querySelector("#the-input-form");
  if (form && form.parentNode) {
    form.parentNode.insertBefore(devModeIndicator, form.nextSibling);
  }

  // Log panel
  devModeLogPanel = document.createElement("div");
  devModeLogPanel.id = "dev-mode-logs";
  devModeLogPanel.className = "dev-mode-logs";
  devModeLogPanel.style.display = "none";

  const logHeader = document.createElement("div");
  logHeader.className = "dev-mode-logs-header";
  // Buttons use global handlers defined later
  logHeader.innerHTML = `
    <span class="dev-mode-logs-title">Dev Mode Logs</span>
    <button class="dev-mode-logs-toggle" onclick="toggleDevModeLogs()">Hide</button>
    <button class="dev-mode-logs-clear" onclick="clearDevModeLogs()">Clear</button>
  `;

  devModeLogContent = document.createElement("div");
  devModeLogContent.className = "dev-mode-logs-content";

  devModeLogPanel.appendChild(logHeader);
  devModeLogPanel.appendChild(devModeLogContent);

  const container = document.querySelector(".container");
  if (container) container.appendChild(devModeLogPanel);

  addDevModeStyles();
}

/** Setup event listeners for dev server events */
function setupEventListeners() {
  if (!stdoutUnlisten) {
    listen("dev:stdout", (event) => {
      const line = typeof event.payload === "string" ? event.payload : event.payload?.line;
      if (line) addLogEntry("stdout", line);
    }).then((u) => (stdoutUnlisten = u));
  }
  if (!urlUnlisten) {
    listen("dev:url", async (event) => {
      const { url } = event.payload;
      if (typeof url !== "string" || !url) return;
      if (currentRemote.url === url) return;
      await unmountCurrentRemote();
      currentRemote.url = url;
      const slot = ensureSlot();
      try {
        const mod = await loadRemoteDevModule(url);
        if (!mod) return;
        currentRemote.mod = mod;
        const mount = mod.tugboatReact || mod.tugboatSvelte || mod.mount || mod.default;
        if (typeof mount === "function") {
          mount(slot);
        } else {
          console.error("No mount function exported from dev module");
        }
      } catch (e) {
        console.error("Failed to load dev module", e);
      }
    }).then((u) => (urlUnlisten = u));

    async function loadRemoteDevModule(baseUrl) {
      const candidates = [
        // Preferred tugboats entry
        "tugboats.ts", "tugboats.tsx", "tugboats.js", "tugboats.jsx",
        "src/tugboats.ts", "src/tugboats.tsx", "src/tugboats.js", "src/tugboats.jsx",
        // Harbor-style entry used in bundler examples
        "harbor.ts", "harbor.tsx", "harbor.js", "harbor.jsx",
        "src/harbor.ts", "src/harbor.tsx", "src/harbor.js", "src/harbor.jsx",
        // Legacy singular fallback
        "tugboat.ts", "tugboat.tsx", "tugboat.js", "tugboat.jsx",
        "src/tugboat.ts", "src/tugboat.tsx", "src/tugboat.js", "src/tugboat.jsx",
      ];
      for (const rel of candidates) {
        try {
          const entry = `${baseUrl}/${rel}`;
          return await import(/* @vite-ignore */ entry);
        } catch (e) {
          // try next
        }
      }
      console.error("No remote dev entry found at", baseUrl);
      return null;
    }
  }
  if (!stoppedUnlisten) {
    listen("dev:stopped", async () => {
      await unmountCurrentRemote();
      updateDevModeIndicator(null, "inactive");
    }).then((u) => (stoppedUnlisten = u));
  }
}

/** Update dev mode indicator */
function updateDevModeIndicator(alias, status) {
  if (!devModeIndicator) return;
  if (!alias || status === "inactive") {
    devModeIndicator.style.display = "none";
    return;
  }
  devModeIndicator.style.display = "block";
  let emoji = "🔧";
  let className = "dev-mode-indicator";
  let statusText = status;
  switch (status) {
    case "starting":
      emoji = "🚀"; className += " starting"; statusText = "Starting..."; break;
    case "active":
      emoji = "👁️"; className += " active"; statusText = "Active"; break;
    case "error":
      emoji = "❌"; className += " error"; statusText = "Error"; break;
  }
  devModeIndicator.className = className;
  devModeIndicator.innerHTML = `${emoji} Dev: ${alias} (${statusText})`;
}

function showDevModePanel() {
  if (devModeLogPanel) devModeLogPanel.style.display = "block";
}
function hideDevModePanel() {
  if (devModeLogPanel) devModeLogPanel.style.display = "none";
}

function addLogEntry(type, content, timestamp) {
  if (!devModeLogContent) return;
  const entry = document.createElement("div");
  entry.className = `dev-log-entry dev-log-${type}`;
  const time = timestamp ? new Date(timestamp * 1000) : new Date();
  const timeStr = time.toLocaleTimeString();
  entry.innerHTML = `
    <span class="dev-log-time">${timeStr}</span>
    <span class="dev-log-content">${escapeHtml(content)}</span>
  `;
  devModeLogContent.appendChild(entry);
  devModeLogContent.scrollTop = devModeLogContent.scrollHeight;
  const entries = devModeLogContent.querySelectorAll(".dev-log-entry");
  if (entries.length > 200) entries[0].remove();
}

function showDevModeError(message) {
  console.error("Dev Mode Error:", message);
  if (devModeLogContent) { addLogEntry("error", message); showDevModePanel(); }
}

function clearDevModeLogs() {
  if (devModeLogContent) devModeLogContent.innerHTML = "";
}
function toggleDevModeLogs() {
  if (!devModeLogPanel) return;
  const isVisible = devModeLogPanel.style.display !== "none";
  if (isVisible) hideDevModePanel(); else showDevModePanel();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text; return div.innerHTML;
}

function addDevModeStyles() {
  const styleId = "dev-mode-styles";
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .dev-mode-indicator { background: #1e293b; color: #94a3b8; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; margin: 8px 0; border-left: 4px solid #475569; animation: pulse 2s infinite; }
    .dev-mode-indicator.starting { background: #0f172a; color: #60a5fa; border-left-color: #3b82f6; }
    .dev-mode-indicator.active { background: #064e3b; color: #6ee7b7; border-left-color: #10b981; animation: none; }
    .dev-mode-indicator.error { background: #7f1d1d; color: #fca5a5; border-left-color: #dc2626; animation: none; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .dev-mode-logs { background: #0f172a; border: 1px solid #334155; border-radius: 8px; margin: 16px 0; max-height: 400px; display: flex; flex-direction: column; }
    .dev-mode-logs-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #1e293b; border-bottom: 1px solid #334155; border-radius: 8px 8px 0 0; }
    .dev-mode-logs-title { color: #e2e8f0; font-weight: 500; flex: 1; }
    .dev-mode-logs-toggle, .dev-mode-logs-clear { background: #475569; color: #e2e8f0; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background-color 0.2s; }
    .dev-mode-logs-toggle:hover, .dev-mode-logs-clear:hover { background: #64748b; }
    .dev-mode-logs-content { flex: 1; padding: 8px; overflow-y: auto; max-height: 300px; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; font-size: 12px; line-height: 1.4; }
    .dev-log-entry { display: flex; gap: 8px; margin-bottom: 4px; padding: 2px 0; }
    .dev-log-time { color: #64748b; font-size: 11px; min-width: 60px; flex-shrink: 0; }
    .dev-log-content { color: #e2e8f0; flex: 1; }
    .dev-log-error .dev-log-content { color: #fca5a5; }
    .dev-log-stdout .dev-log-content { color: #a7f3d0; }
  `;
  document.head.appendChild(style);
}

// Global functions for UI interactions (exposed for buttons in header)
window.toggleDevModeLogs = toggleDevModeLogs;
window.clearDevModeLogs = clearDevModeLogs;

/** Get current dev mode state */
export function getDevModeState() {
  return {
    isActive: isDevModeActive,
    currentAlias: currentDevAlias,
    activeSessions: Array.from(devModeSessions),
  };
}

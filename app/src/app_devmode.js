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
let currentRemote = { url: null, mod: null, cleanup: null };
let tugboatsSlotEl = null;

// Event listeners
let stdoutUnlisten = null;
let urlUnlisten = null;
let remountUnlisten = null;
let stoppedUnlisten = null;

const prefsKV = kvTable("preferences");

// Utility: ensure slot element reference
function ensureSlot() {
  if (!tugboatsSlotEl) {
    tugboatsSlotEl = document.getElementById("tugboats-slot");
  }
  return tugboatsSlotEl;
}

// Utility: recreate slot element to avoid double React createRoot on same container
function recreateSlot() {
  const oldSlot = document.getElementById("tugboats-slot");
  if (oldSlot && oldSlot.parentNode) {
    const newSlot = document.createElement("div");
    newSlot.id = "tugboats-slot";
    oldSlot.parentNode.replaceChild(newSlot, oldSlot);
    tugboatsSlotEl = newSlot;
  } else {
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
export function startDevModeForAlias(alias) {
  return startDevMode(alias);
}

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
export function stopDevMode() {
  return stopCurrentDevMode();
}

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
    if (stdoutUnlisten) {
      stdoutUnlisten();
      stdoutUnlisten = null;
    }
    if (urlUnlisten) {
      urlUnlisten();
      urlUnlisten = null;
    }
    if (remountUnlisten) {
      remountUnlisten();
      remountUnlisten = null;
    }
    if (stoppedUnlisten) {
      stoppedUnlisten();
      stoppedUnlisten = null;
    }

    // Unmount any mounted dev module
    await unmountCurrentRemote();
  }
}

async function unmountCurrentRemote() {
  const slot = ensureSlot();

  // Prefer cleanup function returned by mount if available
  if (typeof currentRemote.cleanup === "function") {
    try {
      await currentRemote.cleanup();
    } catch {}
    currentRemote.cleanup = null;
  }

  // Fallback: call module-provided unmount if exported
  if (currentRemote.mod) {
    try {
      const unmount = currentRemote.mod.unmount ||
        currentRemote.mod.tugboatUnmount;
      if (typeof unmount === "function") {
        await unmount(slot);
      }
    } catch (_e) {
      // Ignore unmount errors
    }
  }

  if (slot) slot.innerHTML = "";
  // Replace the container to ensure React 18 createRoot gets a fresh node
  recreateSlot();

  currentRemote.mod = null;
  currentRemote.url = null;
}

/** Initialize dev mode UI elements */
function initializeDevModeUI() {
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
    listen("dev:build_started", (event) => {
      const alias = event.payload;
      addLogEntry("info", `🔨 Building ${alias}...`);
    }).then((u) => (stdoutUnlisten = u));
  }

  if (!urlUnlisten) {
    listen("dev:build_completed", async (event) => {
      const alias = event.payload;
      addLogEntry("success", `✅ Build completed for ${alias}`);
      await loadDevBundle(alias);
    }).then((u) => (urlUnlisten = u));
  }

  // Listen for build errors
  listen("dev:build_error", (event) => {
    const [alias, error] = event.payload;
    addLogEntry("error", `❌ Build failed for ${alias}:`);
    addLogEntry("error", error);
    showDevModeError(`Build failed: ${error}`);
  });

  // Listen for dev ready
  listen("dev:ready", async (event) => {
    const alias = event.payload;
    addLogEntry("info", `🚀 Dev mode ready for ${alias}`);
    await loadDevBundle(alias);
  });

  // Listen for build success (triggers remount)
  if (!remountUnlisten) {
    listen("dev:build_success", async (event) => {
      const alias = event.payload;
      console.log("Build success, remounting for:", alias);
      if (isDevModeActive && currentDevAlias === alias) {
        await loadDevBundle(alias);
      }
    }).then((u) => (remountUnlisten = u));
  }
  if (!stoppedUnlisten) {
    listen("dev:stopped", async () => {
      await unmountCurrentRemote();
      updateDevModeIndicator(null, "inactive");
    }).then((u) => (stoppedUnlisten = u));
  }
}

// Load and mount dev bundle from filesystem
async function loadDevBundle(alias) {
  await unmountCurrentRemote();

  const slot = ensureSlot();
  try {
    // Get the dev bundle path - look for the dev bundle directly
    const home = await invoke("get_home_dir");
    const bundlePath = `${home}/.tugboats/bundles/${alias}-dev.js`;

    // Read the bundle content
    const bundleContent = await invoke("read_text_file", { path: bundlePath });

    // Create a blob URL from the bundle content
    const blob = new Blob([bundleContent], { type: "application/javascript" });
    const bundleUrl = URL.createObjectURL(blob);

    // Import the module
    const mod = await import(/* @vite-ignore */ bundleUrl);

    // Clean up the blob URL
    URL.revokeObjectURL(bundleUrl);

    if (!mod) return;

    currentRemote.mod = mod;
    currentRemote.url = bundlePath; // Store bundle path for reference

    const mount = mod.tugboatReact || mod.tugboatSvelte || mod.mount ||
      mod.default;
    if (typeof mount === "function") {
      const dispose = await mount(slot);
      if (typeof dispose === "function") {
        currentRemote.cleanup = dispose;
      }
    } else {
      console.error("No mount function exported from dev module");
    }
  } catch (e) {
    console.error("Failed to load or mount dev module", e);
    console.error("[devmode] Failed to load dev bundle:", e);
    showDevModeError(`Failed to load bundle: ${e}`);
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
      emoji = "🚀";
      className += " starting";
      statusText = "Starting...";
      break;
    case "active":
      emoji = "👁️";
      className += " active";
      statusText = "Active";
      break;
    case "error":
      emoji = "❌";
      className += " error";
      statusText = "Error";
      break;
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
  if (devModeLogContent) {
    addLogEntry("error", message);
    showDevModePanel();
  }
}

function clearDevModeLogs() {
  if (devModeLogContent) devModeLogContent.innerHTML = "";
}
function toggleDevModeLogs() {
  if (!devModeLogPanel) return;
  const isVisible = devModeLogPanel.style.display !== "none";
  if (isVisible) hideDevModePanel();
  else showDevModePanel();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
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

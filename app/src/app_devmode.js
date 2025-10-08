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
let devModeToggleButton = null;

// Event listeners
let statusUnlisten = null;
let buildUnlisten = null;
let readyUnlisten = null;

const prefsKV = kvTable("preferences");

/**
 * Parse dev mode command from raw input
 * @param {string} raw - Raw input string
 * @returns {Object|null} - { alias, command } or null
 */
export function parseDevCommand(raw) {
  const s = (raw || "").trim();
  if (!s) return null;
  
  // Match pattern: <alias>:dev
  const match = s.match(/^(\w+):dev$/);
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
 * @param {string} alias - Alias to check
 * @returns {boolean} - True if alias exists
 */
async function aliasExistsInClones(alias) {
  try {
    const stored = await prefsKV.get(["user"]);
    if (stored._tag === "Ok") {
      const prefs = stored.result.value;
      if (prefs && Array.isArray(prefs.clones)) {
        return prefs.clones.some(clone => clone.alias === alias);
      }
    }
  } catch (err) {
    console.error("Error checking clone alias:", err);
  }
  return false;
}

/**
 * Start dev mode for alias
 * @param {string} alias - Clone alias
 */
async function startDevMode(alias) {
  try {
    if (currentDevAlias === alias && isDevModeActive) {
      // Already active for this alias
      return;
    }
    
    // Stop any existing dev mode first
    if (isDevModeActive) {
      await stopCurrentDevMode();
    }
    
    // Setup UI
    await initializeDevModeUI();
    setupEventListeners();
    
    // Start backend dev mode
    await invoke("dev_mode_start", { alias });
    
    // Update state
    isDevModeActive = true;
    currentDevAlias = alias;
    devModeSessions.add(alias);
    
    // Update UI
    updateDevModeIndicator(alias, "starting");
    showDevModePanel();
    
    addLogEntry("info", `🚀 Starting dev mode for "${alias}"...`);
    
  } catch (err) {
    console.error("Failed to start dev mode:", err);
    showDevModeError(`Failed to start dev mode: ${err}`);
    await stopCurrentDevMode();
  }
}

/**
 * Stop current dev mode session
 */
async function stopCurrentDevMode() {
  if (!isDevModeActive || !currentDevAlias) {
    return;
  }
  
  try {
    await invoke("dev_mode_stop", { alias: currentDevAlias });
    devModeSessions.delete(currentDevAlias);
    
    addLogEntry("info", `🛑 Stopped dev mode for "${currentDevAlias}"`);
    
  } catch (err) {
    console.error("Failed to stop dev mode:", err);
  } finally {
    // Reset state
    isDevModeActive = false;
    currentDevAlias = null;
    
    // Update UI
    updateDevModeIndicator(null, "inactive");
    
    // Clean up event listeners
    if (statusUnlisten) {
      statusUnlisten();
      statusUnlisten = null;
    }
    if (buildUnlisten) {
      buildUnlisten();
      buildUnlisten = null;
    }
    if (readyUnlisten) {
      readyUnlisten();
      readyUnlisten = null;
    }
  }
}

/**
 * Initialize dev mode UI elements
 */
async function initializeDevModeUI() {
  if (devModeIndicator) {
    return; // Already initialized
  }
  
  // Create dev mode indicator
  devModeIndicator = document.createElement("div");
  devModeIndicator.id = "dev-mode-indicator";
  devModeIndicator.className = "dev-mode-indicator";
  devModeIndicator.style.display = "none";
  
  // Add to input area
  const greetForm = document.querySelector("#greet-form");
  if (greetForm) {
    greetForm.parentNode.insertBefore(devModeIndicator, greetForm.nextSibling);
  }
  
  // Create log panel
  devModeLogPanel = document.createElement("div");
  devModeLogPanel.id = "dev-mode-logs";
  devModeLogPanel.className = "dev-mode-logs";
  devModeLogPanel.style.display = "none";
  
  // Log panel header
  const logHeader = document.createElement("div");
  logHeader.className = "dev-mode-logs-header";
  logHeader.innerHTML = `
    <span class="dev-mode-logs-title">Dev Mode Logs</span>
    <button class="dev-mode-logs-toggle" onclick="toggleDevModeLogs()">Hide</button>
    <button class="dev-mode-logs-clear" onclick="clearDevModeLogs()">Clear</button>
  `;
  
  // Log content area
  devModeLogContent = document.createElement("div");
  devModeLogContent.className = "dev-mode-logs-content";
  
  devModeLogPanel.appendChild(logHeader);
  devModeLogPanel.appendChild(devModeLogContent);
  
  // Add to main container
  const container = document.querySelector(".container");
  if (container) {
    container.appendChild(devModeLogPanel);
  }
  
  // Add CSS styles
  addDevModeStyles();
}

/**
 * Setup event listeners for dev mode events
 */
function setupEventListeners() {
  if (statusUnlisten || buildUnlisten || readyUnlisten) {
    return; // Already setup
  }
  
  // Listen for dev mode status changes
  listen("tugboats://dev-mode-status", (event) => {
    handleDevModeStatus(event.payload);
  }).then(unlisten => {
    statusUnlisten = unlisten;
  });
  
  // Listen for build logs
  listen("tugboats://dev-mode-build", (event) => {
    handleDevModeBuild(event.payload);
  }).then(unlisten => {
    buildUnlisten = unlisten;
  });
  
  // Listen for build ready events
  listen("tugboats://dev-mode-ready", (event) => {
    handleDevModeReady(event.payload);
  }).then(unlisten => {
    readyUnlisten = unlisten;
  });
}

/**
 * Handle dev mode status updates
 * @param {Object} status - Status event payload
 */
function handleDevModeStatus(status) {
  const { alias, status: statusType, message, watch_path } = status;
  
  if (alias === currentDevAlias) {
    updateDevModeIndicator(alias, statusType);
    
    // Add status message to logs
    let emoji = "ℹ️";
    if (statusType === "active") emoji = "✅";
    else if (statusType === "building") emoji = "🔨";
    else if (statusType === "error") emoji = "❌";
    
    addLogEntry("info", `${emoji} ${message}`);
    
    if (watch_path) {
      addLogEntry("info", `📁 Watching: ${watch_path}`);
    }
  }
}

/**
 * Handle dev mode build logs
 * @param {Object} buildEvent - Build event payload
 */
function handleDevModeBuild(buildEvent) {
  const { alias, event_type, content, timestamp } = buildEvent;
  
  if (alias === currentDevAlias) {
    addLogEntry(event_type, content, timestamp);
  }
}

/**
 * Handle dev mode ready events (new bundle ready)
 * @param {Object} readyEvent - Ready event payload
 */
function handleDevModeReady(readyEvent) {
  const { alias, bundle_path, build_time_ms } = readyEvent;
  
  if (alias === currentDevAlias) {
    addLogEntry("info", `🎉 New bundle ready: ${bundle_path}`);
    addLogEntry("info", `⚡ Build time: ${build_time_ms}ms`);
    
    // Trigger remount of the updated app
    const event = new CustomEvent("tugboats-dev-remount", {
      detail: { alias, bundlePath: bundle_path }
    });
    document.dispatchEvent(event);
  }
}

/**
 * Update dev mode indicator
 * @param {string|null} alias - Current alias or null
 * @param {string} status - Status type
 */
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
      statusText = "Watching";
      break;
    case "building":
      emoji = "🔨";
      className += " building";
      statusText = "Building...";
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

/**
 * Show dev mode panel
 */
function showDevModePanel() {
  if (devModeLogPanel) {
    devModeLogPanel.style.display = "block";
  }
}

/**
 * Hide dev mode panel
 */
function hideDevModePanel() {
  if (devModeLogPanel) {
    devModeLogPanel.style.display = "none";
  }
}

/**
 * Add entry to dev mode logs
 * @param {string} type - Log type (info, error, stdout, stderr)
 * @param {string} content - Log content
 * @param {number} [timestamp] - Optional timestamp
 */
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
  
  // Auto-scroll to bottom
  devModeLogContent.scrollTop = devModeLogContent.scrollHeight;
  
  // Limit log entries (keep last 100)
  const entries = devModeLogContent.querySelectorAll(".dev-log-entry");
  if (entries.length > 100) {
    entries[0].remove();
  }
}

/**
 * Show dev mode error
 * @param {string} message - Error message
 */
function showDevModeError(message) {
  console.error("Dev Mode Error:", message);
  
  // Add to logs if available
  if (devModeLogContent) {
    addLogEntry("error", message);
    showDevModePanel();
  }
  
  // Update indicator
  updateDevModeIndicator(currentDevAlias || "unknown", "error");
}

/**
 * Clear dev mode logs
 */
function clearDevModeLogs() {
  if (devModeLogContent) {
    devModeLogContent.innerHTML = "";
  }
}

/**
 * Toggle dev mode logs visibility
 */
function toggleDevModeLogs() {
  if (!devModeLogPanel) return;
  
  const isVisible = devModeLogPanel.style.display !== "none";
  if (isVisible) {
    hideDevModePanel();
  } else {
    showDevModePanel();
  }
}

/**
 * Escape HTML for safe display
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Add dev mode CSS styles
 */
function addDevModeStyles() {
  const styleId = "dev-mode-styles";
  if (document.getElementById(styleId)) {
    return; // Already added
  }
  
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .dev-mode-indicator {
      background: #1e293b;
      color: #94a3b8;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      margin: 8px 0;
      border-left: 4px solid #475569;
      animation: pulse 2s infinite;
    }
    
    .dev-mode-indicator.starting {
      background: #0f172a;
      color: #60a5fa;
      border-left-color: #3b82f6;
    }
    
    .dev-mode-indicator.active {
      background: #064e3b;
      color: #6ee7b7;
      border-left-color: #10b981;
      animation: none;
    }
    
    .dev-mode-indicator.building {
      background: #451a03;
      color: #fbbf24;
      border-left-color: #f59e0b;
      animation: pulse 1s infinite;
    }
    
    .dev-mode-indicator.error {
      background: #7f1d1d;
      color: #fca5a5;
      border-left-color: #dc2626;
      animation: none;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .dev-mode-logs {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      margin: 16px 0;
      max-height: 400px;
      display: flex;
      flex-direction: column;
    }
    
    .dev-mode-logs-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      border-radius: 8px 8px 0 0;
    }
    
    .dev-mode-logs-title {
      color: #e2e8f0;
      font-weight: 500;
      flex: 1;
    }
    
    .dev-mode-logs-toggle,
    .dev-mode-logs-clear {
      background: #475569;
      color: #e2e8f0;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .dev-mode-logs-toggle:hover,
    .dev-mode-logs-clear:hover {
      background: #64748b;
    }
    
    .dev-mode-logs-content {
      flex: 1;
      padding: 8px;
      overflow-y: auto;
      max-height: 300px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
    }
    
    .dev-log-entry {
      display: flex;
      gap: 8px;
      margin-bottom: 4px;
      padding: 2px 0;
    }
    
    .dev-log-time {
      color: #64748b;
      font-size: 11px;
      min-width: 60px;
      flex-shrink: 0;
    }
    
    .dev-log-content {
      color: #e2e8f0;
      flex: 1;
    }
    
    .dev-log-info .dev-log-content {
      color: #94a3b8;
    }
    
    .dev-log-error .dev-log-content {
      color: #fca5a5;
    }
    
    .dev-log-stdout .dev-log-content {
      color: #a7f3d0;
    }
    
    .dev-log-stderr .dev-log-content {
      color: #fbbf24;
    }
  `;
  
  document.head.appendChild(style);
}

// Global functions for UI interactions
window.toggleDevModeLogs = toggleDevModeLogs;
window.clearDevModeLogs = clearDevModeLogs;

/**
 * Get current dev mode state
 * @returns {Object} - Current state
 */
export function getDevModeState() {
  return {
    isActive: isDevModeActive,
    currentAlias: currentDevAlias,
    activeSessions: Array.from(devModeSessions),
  };
}
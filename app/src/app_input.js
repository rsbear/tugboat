import { input, kvTable } from "@tugboats/core";
import { handlePreferencesTrigger } from "./app_preferences.js";
import {
  getDevModeState,
  handleDevMode,
  parseDevCommand,
  startDevModeForAlias,
  stopDevMode,
} from "./app_devmode.js";

const { invoke } = window.__TAURI__.core;

let theInputEl;
let greetMsgEl;
let listBtnEl;
let tugboatsSlot;

const inputSubmissions = kvTable("InputSubmissions");
const prefsKV = kvTable("preferences");

let appAliasMap = new Map(); // apps alias -> true
let cloneAliasSet = new Set(); // clone aliases
let currentMounted = { alias: null, cleanup: null };

async function refreshPreferencesAliasMap() {
  const stored = await prefsKV.get(["user"]);
  const m = new Map();
  if (stored._tag === "Ok") {
    const prefs = stored.result.value;
    if (prefs && Array.isArray(prefs.apps)) {
      for (const app of prefs.apps) {
        if (app && app.alias) {
          const trimmedAlias = app.alias.trim();
          m.set(trimmedAlias, true);
        }
      }
    }
  }
  appAliasMap = m;
  console.log("🔍 DEBUG: Final appAliasMap:", Array.from(appAliasMap.keys()));
}

async function refreshCloneAliasSet() {
  const stored = await prefsKV.get(["user"]);
  const s = new Set();
  if (stored._tag === "Ok") {
    const prefs = stored.result.value;
    if (prefs && Array.isArray(prefs.clones)) {
      for (const c of prefs.clones) {
        if (c && c.alias) s.add(c.alias.trim());
      }
    }
  }
  cloneAliasSet = s;
}

function parseAlias(raw) {
  const s = (raw || "").trim();
  if (!s) return "";
  const space = s.indexOf(" ");
  return space === -1 ? s : s.slice(0, space);
}

async function mountTugboatForAlias(alias) {
  if (!alias) {
    console.log("🔍 DEBUG: No alias provided, returning");
    return;
  }
  // If same alias is already mounted, nothing to do
  if (currentMounted.alias === alias) {
    return;
  }

  // Unmount previous (best-effort)
  if (currentMounted.cleanup) {
    try {
      currentMounted.cleanup();
    } catch {}
  }
  currentMounted.cleanup = null;
  currentMounted.alias = null;
  if (tugboatsSlot) tugboatsSlot.innerHTML = "";

  try {
    console.log("🔍 DEBUG: Invoking latest_bundle_for_alias with:", alias);
    // Find latest bundle for alias
    const path = await invoke("latest_bundle_for_alias", { alias });
    console.log("🔍 DEBUG: Bundle path received:", path);

    const code = await invoke("read_text_file", { path });
    console.log("🔍 DEBUG: Bundle code length:", code?.length || 0);

    // Import the ESM bundle via blob URL
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    console.log("🔍 DEBUG: Created blob URL:", url);

    const mod = await import(url);
    console.log("🔍 DEBUG: Module imported, exports:", Object.keys(mod));

    const slot = tugboatsSlot;
    let cleanup = null;
    if (mod && typeof mod.harborMount === "function") {
      console.log("🔍 DEBUG: Using harborMount");
      // Harbor-style exports
      mod.harborMount(slot);
      if (typeof mod.unmount === "function") {
        cleanup = () => {
          try {
            mod.unmount();
          } catch {}
        };
      }
    } else if (mod && typeof mod.tugboatReact === "function") {
      console.log("🔍 DEBUG: Using tugboatReact");
      const res = mod.tugboatReact(slot);
      if (typeof res === "function") cleanup = res;
    } else if (mod && typeof mod.tugboatSvelte === "function") {
      console.log("🔍 DEBUG: Using tugboatSvelte");
      const res = mod.tugboatSvelte(slot);
      if (typeof res === "function") cleanup = res;
    } else if (mod && typeof mod.default === "function") {
      console.log("🔍 DEBUG: Using default export");
      const res = mod.default(slot);
      if (typeof res === "function") cleanup = res;
    } else {
      console.warn(
        "No recognized tugboat/harbor mount export found in bundle for alias:",
        alias,
      );
    }

    currentMounted = { alias, cleanup };
    console.log("🔍 DEBUG: Successfully mounted tugboat for alias:", alias);
  } catch (err) {
    console.error("Failed to mount tugboat app for alias", alias, err);
  }
}

async function greet() {
  const raw = theInputEl.value;
  input.set(raw);
  const msg = await invoke("greet", { name: raw });
  greetMsgEl.textContent = msg;
  await inputSubmissions.set(["last"], raw);
  console.log("Saved to ImplTest:", raw);
}

async function listInputSubmissions() {
  const res = await inputSubmissions.list();
  console.log("InputSubmissions list:", res);
}

window.addEventListener("DOMContentLoaded", async () => {
  theInputEl = document.querySelector("#the-input");
  greetMsgEl = document.querySelector("#greet-msg");
  tugboatsSlot = document.querySelector("#tugboats-slot");

  await refreshPreferencesAliasMap();
  await refreshCloneAliasSet();

  theInputEl.addEventListener("input", (e) => {
    input.set(e.target.value);
  });

  input.subscribe(async (s) => {
    handlePreferencesTrigger(s.raw);

    // Handle dev mode commands first
    const devCommand = parseDevCommand(s.raw);
    if (devCommand) {
      await handleDevMode(s.raw);
      console.log("Dev mode command processed:", s.raw);
      return;
    }

    const alias = parseAlias(s.raw);
    console.log("🔍 DEBUG: Parsed alias:", alias, "from input:", s.raw);

    // Refresh maps opportunistically
    await refreshPreferencesAliasMap();
    await refreshCloneAliasSet();

    console.log(
      "🔍 DEBUG: appAliasMap contains:",
      Array.from(appAliasMap.keys()),
    );
    console.log("🔍 DEBUG: cloneAliasSet contains:", Array.from(cloneAliasSet));

    // Auto dev: if alias is a clone alias, start dev mode
    if (alias && cloneAliasSet.has(alias)) {
      console.log("🔍 DEBUG: Starting dev mode for clone alias:", alias);
      await startDevModeForAlias(alias);
      return;
    }

    // Not a clone alias: if dev mode is active, stop it
    const devState = getDevModeState();
    if (devState.isActive) {
      await stopDevMode();
    }

    if (alias && appAliasMap.has(alias)) {
      console.log("🔍 DEBUG: Found app alias, mounting tugboat for:", alias);
      await mountTugboatForAlias(alias);
    } else {
      console.log(
        "🔍 DEBUG: No app alias match found for:",
        alias,
        "or alias is empty",
      );
      // If current mount is not represented by alias anymore, clear
      if (currentMounted.alias) {
        console.log("🔍 DEBUG: Clearing current mount:", currentMounted.alias);
        if (currentMounted.cleanup) {
          try {
            currentMounted.cleanup();
          } catch {}
        }
        currentMounted.cleanup = null;
        currentMounted.alias = null;
        if (tugboatsSlot) tugboatsSlot.innerHTML = "";
      }
    }

    console.log("Input updated:", s.raw);
  });

  document.querySelector("#the-input-form").addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });

  // Listen for dev mode remount events
  document.addEventListener("tugboats-dev-remount", async (event) => {
    const { alias, bundlePath } = event.detail;

    // Only remount if this is the current dev mode alias
    const devState = getDevModeState();
    if (devState.isActive && devState.currentAlias === alias) {
      console.log("Dev mode remount triggered for", alias);
      await mountTugboatForAlias(alias);
    }
  });
});

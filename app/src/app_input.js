import { input, kvTable } from "@tugboats/core";
import { handlePreferencesTrigger } from "./app_preferences.js";
import {
  getDevModeState,
  handleDevMode,
  parseDevCommand,
} from "./app_devmode.js";

const { invoke } = window.__TAURI__.core;

let greetInputEl;
let greetMsgEl;
let listBtnEl;
let tugboatsSlot;

const inputSubmissions = kvTable("InputSubmissions");
const prefsKV = kvTable("preferences");

let aliasMap = new Map(); // alias -> true (or metadata later)
let currentMounted = { alias: null, cleanup: null };

async function refreshPreferencesAliasMap() {
  const stored = await prefsKV.get(["user"]);
  const m = new Map();
  if (stored._tag === "Ok") {
    const prefs = stored.result.value;
    if (prefs && Array.isArray(prefs.apps)) {
      for (const app of prefs.apps) {
        if (app && app.alias) m.set(app.alias.trim(), true);
      }
    }
  }
  aliasMap = m;
}

function parseAlias(raw) {
  const s = (raw || "").trim();
  if (!s) return "";
  const space = s.indexOf(" ");
  return space === -1 ? s : s.slice(0, space);
}

async function mountTugboatForAlias(alias) {
  if (!alias) return;
  // If same alias is already mounted, nothing to do
  if (currentMounted.alias === alias) return;

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
    // Find latest bundle for alias
    const path = await invoke("latest_bundle_for_alias", { alias });
    const code = await invoke("read_text_file", { path });

    // Import the ESM bundle via blob URL
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const mod = await import(url);

    const slot = tugboatsSlot;
    let cleanup = null;
    if (mod && typeof mod.harborMount === "function") {
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
      const res = mod.tugboatReact(slot);
      if (typeof res === "function") cleanup = res;
    } else if (mod && typeof mod.tugboatSvelte === "function") {
      const res = mod.tugboatSvelte(slot);
      if (typeof res === "function") cleanup = res;
    } else if (mod && typeof mod.default === "function") {
      const res = mod.default(slot);
      if (typeof res === "function") cleanup = res;
    } else {
      console.warn(
        "No recognized tugboat/harbor mount export found in bundle for alias:",
        alias,
      );
    }

    currentMounted = { alias, cleanup };
  } catch (err) {
    console.error("Failed to mount tugboat app for alias", alias, err);
  }
}

async function greet() {
  const raw = greetInputEl.value;
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
  greetInputEl = document.querySelector("#the-input");
  greetMsgEl = document.querySelector("#greet-msg");
  tugboatsSlot = document.querySelector("#tugboats-slot");

  await refreshPreferencesAliasMap();

  greetInputEl.addEventListener("input", (e) => {
    input.set(e.target.value);
  });

  input.subscribe(async (s) => {
    handlePreferencesTrigger(s.raw);

    // Handle dev mode commands first
    const devCommand = parseDevCommand(s.raw);
    if (devCommand) {
      await handleDevMode(s.raw);
      // Don't process as regular alias when in dev mode
      console.log("Dev mode command processed:", s.raw);
      return;
    }

    // If not a dev command but dev mode is active, stop it
    const devState = getDevModeState();
    if (devState.isActive) {
      await handleDevMode(""); // This will stop dev mode
    }

    const alias = parseAlias(s.raw);

    // Refresh alias map opportunistically when alias token changes
    await refreshPreferencesAliasMap();

    if (alias && aliasMap.has(alias)) {
      await mountTugboatForAlias(alias);
    } else {
      // If current mount is not represented by alias anymore, clear
      if (currentMounted.alias) {
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

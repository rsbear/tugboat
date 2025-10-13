# Migration Plan: app/ SolidJS Migration

This plan describes how to migrate the following files to SolidJS while preserving Tugboats’ architectural constraints and development workflow.

From (current):
- app/src/index.html
- app/src/app_input.js
- app/src/app_preferences.js
- app/src/app_devmode.js

To (target):
- app/app.html
- app/src/App.tsx
- app/src/AppInput.tsx
- app/src/AppPreferences.tsx
- app/src/AppDevMode.tsx

## Objectives
- Move the host app UI to SolidJS components without changing backend behavior.
- Preserve the singleton @tugboats/core runtime provided by the host via import maps.
- Continue using Tauri backend APIs via `window.__TAURI__.core`.
- Maintain current dev/build flows (`just dev`, Tauri via Deno tasks).

## Out of Scope / Non-Goals
- Rewriting backend (Rust) commands or KV implementation.
- Changing core SDK build or serving path (/assets/core/mod.js).
- Introducing routing unless required by the existing UI.

## Architectural Constraints (from WARP.md)
- Never bundle @tugboats/core inside tugboat apps — always externalize it.
- Always consume core via host import map for singleton behavior.
- Use `window.__TAURI__.core` (not `@tauri-apps/api`) for backend communication.
- KV storage is via namespaced tables with `kvTable(namespace)`.

## Deliverables
- app/app.html with import maps (including @tugboats/core mapping) and a root mount element.
- app/src/App.tsx as the top-level Solid component wiring child components and app state.
- app/src/AppInput.tsx for the reactive input UI integrated with the core input store and KV.
- app/src/AppPreferences.tsx for preferences UI (TOML clones config management and actions).
- app/src/AppDevMode.tsx for developer-mode tooling and flags.
- Updated frontend bootstrap (if applicable) to render <App />.
- Bundler configuration updated to: (a) support SolidJS, (b) externalize @tugboats/core, (c) preserve import maps.

## Risks and Mitigations
- Risk: Accidentally bundling @tugboats/core. Mitigation: Configure bundler external and rely on import map; test via bundle analysis.
- Risk: Event subscription leaks in Solid. Mitigation: Use onCleanup for Tauri event listeners and core subscriptions.
- Risk: TypeScript mismatches with Tauri/global types. Mitigation: Provide ambient type declarations for `window.__TAURI__` and core.

---

## Step-by-Step Plan

### 1) Audit current behavior
- app/src/index.html
  - Identify root DOM element id used for mounting.
  - Capture any existing import maps, scripts, or inline configuration.
- app/src/app_input.js
  - List: DOM bindings, event listeners, how it reads/writes the core input store, persistence to KV, and any debouncing.
- app/src/app_preferences.js
  - List: Where preferences are loaded/stored, TOML schema for `clones` array, save flow, error handling, and any realtime progress event wiring for clone operations.
- app/src/app_devmode.js
  - List: Feature flags, toggles, hotkeys, diagnostics, and any event logging.

Produce an audit checklist of:
- Input store interactions (subscribe, set, initial load, persist).
- KV usage (namespace, keys, JSON shape).
- Tauri commands used (e.g., greet, clone_repo, kv_* operations).
- Events listened to and emitted (names, payload shapes).

### 2) SolidJS foundation
- Add SolidJS dependencies to the frontend build (choose the appropriate approach for the current setup):
  - If using Vite, install and enable the Solid plugin.
  - Ensure TypeScript is enabled for `.tsx`.
- Ensure dev flow still uses `just dev` and Tauri’s Deno tasks.

Notes:
- If using Vite, add `vite-plugin-solid` and set `build.rollupOptions.external = ['@tugboats/core']` and `optimizeDeps.exclude = ['@tugboats/core']`.
- Ensure the import map in app/app.html maps `@tugboats/core` to `/assets/core/mod.js` to enforce singleton runtime.

### 3) Create app/app.html
- Create a root element (e.g., `<div id="root"></div>`).
- Define/import import maps with at least:
  - `@tugboats/core`: `/assets/core/mod.js`
  - Any other libraries that must be resolved at runtime.
- Load the frontend entry script that renders the Solid <App /> to `#root`.

### 4) Implement Solid components (TSX)

General patterns to apply:
- Use `createSignal` / `createStore` for local state.
- Use `onMount`/`onCleanup` to attach/detach subscriptions (core input store, Tauri events).
- Wrap Tauri invoke/event calls behind small utility functions or effects for clarity.

Components:
- App.tsx
  - Acts as composition root and layout frame.
  - Provides any top-level context providers if needed.
  - Hosts AppInput, AppPreferences, and AppDevMode.
- AppInput.tsx
  - Binds to the core `input` store (subscribe on mount, update on input changes).
  - Persists input to a namespaced KV table using `kvTable('Host')` or current namespace.
  - Handles initial load of stored input and real-time updates.
- AppPreferences.tsx
  - Loads current preferences, especially the TOML `clones` array.
  - Provides editing UI and save action.
  - Triggers clone sequence and subscribes to progress events to reflect real-time status.
  - Handles path expansion (`~`) and skip-if-exists UI states if exposed.
- AppDevMode.tsx
  - Exposes developer toggles, verbose logging switches, or diagnostic panels used in devmode.
  - Optional: subscribe to and display internal events for debugging.

### 5) Entry point wiring
- Ensure the main entry (e.g., app/src/main.tsx or equivalent) renders:
  - `render(() => <App />, document.getElementById('root')!)`.
- Ensure this entry is correctly referenced by app/app.html.

### 6) Backend integration via Tauri
- Continue using `window.__TAURI__.core` to invoke commands:
  - `clone_repo`, `kv_*` operations, and any others previously used.
- Define ambient TypeScript types for `window.__TAURI__` references to keep TSX strict and clean.
- Subscribe to any Tauri progress events used for cloning and unsubscribe on cleanup.

### 7) Externalize @tugboats/core and import maps
- Ensure bundler config does NOT bundle `@tugboats/core`.
- Ensure `@tugboats/core` is resolved via import map at runtime to `/assets/core/mod.js`.
- Confirm the host app serves the ESM from `/assets/core/mod.js`.

### 8) Update dev/build tasks
- Confirm `just dev` continues to:
  - Build core package (if needed) and start Tauri.
  - Build/serve frontend with SolidJS enabled.
- Update Deno tasks or package scripts only if necessary to point to the new entry.

### 9) Verification and acceptance criteria
- App boots via `just dev`.
- Core singleton is shared and not duplicated in bundle (verify via bundle analyzer or devtools).
- Input:
  - Typing updates core input store immediately.
  - Reload persists and restores last input via KV.
- Preferences:
  - Editing TOML clones config saves successfully.
  - Triggering clone displays real-time progress and produces the expected directory/results.
- DevMode:
  - Toggles/functionality match prior behavior.
- No console errors regarding `window.__TAURI__` or import map resolution.

### 10) Rollback plan
- Keep a branch with current JS implementation.
- If issues arise, revert to the previous entry and HTML while investigating.

---

## Notes & Optional Enhancements
- Type safety: add `.d.ts` ambient declarations for `window.__TAURI__` and core APIs consumed in TSX.
- Lightweight state modules: consider extracting Tauri event handling and KV calls into small helper modules to keep components concise.
- Telemetry/logging in devmode: if devmode already logs events, keep the same event names and payload shapes for continuity.

## Open Questions (to resolve during audit)
- Exact DOM ids/hooks currently used in index.html.
- Exact payload shape for cloning progress events and their event names.
- The precise KV namespaces and key paths used for input and preferences.
- Whether routing is necessary (if the current UI has multiple screens) or a single screen is sufficient.

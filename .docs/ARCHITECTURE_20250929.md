# Tugboats Host + Core Architecture (Context for LLMs)

## High‑level Concept
Tugboats is a **host/runtime** for pluggable web apps (React, Svelte, etc.). It has one **core runtime SDK** (`@tugboats/core`) that provides canonical APIs (input state, KV/DB access, etc.). The host loads tugboat apps dynamically and ensures they all consume one shared **singleton core**. The architecture avoids version skew, guarantees one source of truth for input state, and centralizes capability enforcement.

---

## Key Pieces

### 1. **@tugboats/core (SDK Runtime)**
- **Distributed as a single ESM** file built with `tsup`.
- **Served by the host** from `/assets/core/mod.js`.
- **Imported at runtime** by both host and tugboat apps via an **import map** in `index.html`.
- **Exports**:
  - `input`: a reactive store (`get`, `subscribe`, `set`) for command input (alias + query).
  - `kvTable`: factory for creating namespaced KV stores, backed by Tauri commands.

### 2. **Import Maps + Externalization**
- Ensures all consumers see the *same* `@tugboats/core` instance.
- Tugboat apps (React/Svelte) declare `@tugboats/core` as a **peerDependency** only.
- Their bundlers (e.g. Vite) are configured to **externalize** `@tugboats/core`, relying on the host’s import map.

```html
<script type="importmap">
{
  "imports": {
    "@tugboats/core": "/assets/core/mod.js"
  }
}
</script>
```

### 3. **Tauri Backend Bridge**
- Core APIs don’t import Node packages. Instead, they call into **Tauri’s injected global**:
  ```ts
  const { invoke } = window.__TAURI__.core;
  ```
- This keeps runtime ESM self‑contained and usable in the browser context without a bundler.
- Example: `kvTable` uses `invoke("kv_get", { key })`, etc.

### 4. **Input State**
- `input` is a singleton “store” inside `@tugboats/core`.
- Host can set input (e.g. when user submits form).
- Apps can also propose input changes (`input.set()`).
- Subscriptions reactively notify listeners in both host and apps.

### 5. **KV Store**
- `kvTable(namespace)` gives each app or host a logical table, namespaced by prefix.
- APIs: `list`, `get`, `set`, `delete`.
- Backed by Tauri commands implemented in Rust; access is mediated by host.

### 6. **Host Responsibilities**
- Defines import map for apps.
- Initializes global `@tugboats/core` runtime once and manages app context.
- Mediates all state changes and persistence.
- Loads tugboat apps dynamically (`import(moduleUrl)`) and sets `appId` context before execution.

---

## Why It’s Structured This Way
- **Single source of truth**: One SDK instance means input state and DB access can’t drift.
- **Security & capability gating**: Host is the authority; apps can’t bypass it.
- **Framework neutrality**: Core is platform‑agnostic ESM; React/Svelte wrappers just adapt it.
- **Runtime simplicity**: Import maps + static ESM avoid complex bundler tricks.
- **Browser/Tauri safe**: By using `window.__TAURI__` instead of `@tauri-apps/api`, runtime code works when shipped as static assets, not just during dev build.

---

## Example Flow
1. User enters text and presses **Greet** in host:
   - Host writes value into `input.set(raw)`.
   - Host calls Rust `greet` command via `invoke`.
   - Host saves `raw` into KV: `kvTable("ImplTest").set(["last"], raw)`.
2. Apps subscribed to `input` react immediately (React Hook / Svelte store).
3. On click **ListImplTest**, host calls `kvTable("ImplTest").list()` and logs/prints results.

---

## Golden Rules
- **Never bundle @tugboats/core** inside tugboat apps. Always external.
- **Always consume core** via the host import map (or global fallback).
- **@tugboats/react / @tugboats/svelte** = tiny wrappers only; peerDeps on core.
- **Runtime vs Dev**: During dev, you can use `npm install @tugboats/core` for types; at runtime, host serves the actual singleton ESM.

---

✅ This summary should give any LLM enough architectural context to answer focused questions, extend APIs, or debug issues without confusion.

---
┌────────────────────────────────────────────────────────┐
│                        Host App                        │
│  (index.html, main.js, import map, UI forms/buttons)   │
│                                                        │
│   - Defines import map → @tugboats/core ESM            │
│   - Loads tugboat apps dynamically (React/Svelte)      │
│   - Mediates all state / DB / capability rules         │
│                                                        │
│   User actions ──► input.set() ──► Core                │
│                                                        │
└─────────────┬──────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────┐
│                   @tugboats/core (SDK)                 │
│    (single ESM singleton, served as /assets/core)      │
│                                                        │
│   Exports:                                             │
│     - input: reactive store { get, subscribe, set }    │
│     - kvTable(ns): { list, get, set, delete }          │
│                                                        │
│   Uses window.__TAURI__.core.invoke for backend calls   │
│   Scoped per appId when loaded by host                 │
│                                                        │
└─────────────┬───────────────────────────────┬──────────┘
              │                               │
              │ shared singleton              │ peerDeps/external
              ▼                               ▼
┌───────────────────────┐          ┌─────────────────────┐
│   React Tugboat App   │          │  Svelte Tugboat App │
│  (imports @tugboats/  │          │ (imports @tugboats/ │
│   core via host)      │          │  core via host)     │
│                       │          │                     │
│ - useInput() hook     │          │ - sdk.input as a    │
│   (from react pkg)    │          │   Svelte store      │
│ - db = useDB()        │          │ - db = sdk.db       │
│ - propose input.set() │          │ - propose input.set()│
└───────────────────────┘          └─────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
                   All changes flow into…
                              ▼
┌────────────────────────────────────────────────────────┐
│                    Tauri Backend (Rust)                │
│                                                        │
│ - Implements commands: kv_get, kv_set, kv_list, greet… │
│ - Persists to SQLite or filesystem                    │
│ - Enforces capability checks (future)                  │
│                                                        │
│ window.__TAURI__.core.invoke("kv_get", { key })        │
└────────────────────────────────────────────────────────┘

Short answer
- Make pkgs/core a host-owned singleton ESM and ship it as a static asset with
  the host. All tugboat apps should consume that one instance.
- Do NOT bundle core into pkgs/react or pkgs/svelte. Those should be tiny
  wrappers with peerDependency on @tugboats/core.
- Resolve @tugboats/core (and the wrappers) at runtime via an import map (or a
  single global fallback), and tell app bundlers to leave them external. This
  guarantees a single source of truth for input state and DB access.

Why this design
- Single instance = single authority over input state and DB. Avoids version
  skew and “two cores” fighting each other.
- Host can enforce capabilities, namespacing, and persistence rules centrally.
- App developer DX stays simple: import the SDK, call input.set(), use hooks.

How to compose the APIs

1) Core: the shared runtime (host-provided)
- Responsibilities:
  - Own the canonical input state.
  - Provide a reactive API to read/subscribe to input and to propose
    mutations.
  - Provide a namespaced DB API backed by the host’s SQLite.
  - Enforce scoping (each app has an appId) and optional capabilities.
- Distribution:
  - Publish @tugboats/core to npm (for types and local dev).
  - The host serves a single built ESM file for the runtime
    (e.g. /runtime/core@1.x.y.js). Use an import map so all apps import the
    host’s copy.
- Initialization:
  - Host creates the core instance with a HostBridge that knows how to talk to
    Tauri/SQLite.
  - Host sets an appId context for each loaded app.

Suggested core API shape (stable, framework-agnostic)
```ts
// @tugboats/core (public surface apps import)
export type InputState = {
  raw: string; // e.g., "websearch risotto recipes"
  alias: string; // "websearch"
  query: string; // "risotto recipes"
  version: number; // monotonic, for conflict handling
};

export type InputUpdate =
  | { setRaw: string }
  | { setAlias: string }
  | { setQuery: string }
  | { patch: Partial<InputState> };

export type InputEvent = {
  prev: InputState;
  next: InputState;
  source: string; // appId or "host"
  meta?: Record<string, unknown>;
};

export interface Store<T> {
  get(): T;
  // React-compatible subscribe, returns unsubscribe
  subscribe(run: (value: T) => void): () => void;
}

export interface InputAPI {
  state: Store<InputState>;
  // Propose a change, host arbitrates & rebroadcasts; resolves with applied state
  set(update: InputUpdate, opts?: { source?: string; meta?: any }): Promise<InputState>;
  onDidChange(listener: (e: InputEvent) => void): () => void;
}

export interface KV {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, val: T): Promise<void>;
  del(key: string): Promise<void>;
  list(prefix?: string): Promise<{ key: string; value: unknown }[]>;
}

export interface SQL {
  query<T = any>(sql: string, params?: unknown[]): Promise<T[]>;
  exec(sql: string, params?: unknown[]): Promise<void>;
}

export interface DB {
  kv: KV; // namespaced to current app
  sql: SQL; // optionally capability-gated
}

export interface TugboatSDK {
  input: InputAPI;
  db: DB;
  // future: events, files, network, secrets, etc.
}

// A way to access the already-initialized singleton (set by the host)
declare const sdk: TugboatSDK;
export default sdk;
export const input: InputAPI;
export const db: DB;
```

Notes
- input.state is a minimal observable with subscribe/get:
  - Works with React’s useSyncExternalStore.
  - Looks/works like a Svelte store for Svelte’s subscribe.
- input.set requires a source; core will automatically fill the current appId
  (see context below), so apps almost never pass it manually.

2) Host-side bridge and initialization
- The host owns the core instance and wires it to platform services.

Host-side-only entry (not visible to apps)
```ts
// @tugboats/core/host (host-only)
export interface HostBridge {
  // Input propagation within the host (e.g., BroadcastChannel or in-memory)
  onInputMutation(
    handler: (proposal: { update: InputUpdate; source: string; meta?: any }) => void,
  ): () => void;

  broadcastAppliedInput(state: InputState, event: InputEvent): void;

  // Persistence/DB via Tauri
  kvGet(appId: string, key: string): Promise<unknown | null>;
  kvSet(appId: string, key: string, value: unknown): Promise<void>;
  kvDel(appId: string, key: string): Promise<void>;
  kvList(appId: string, prefix?: string): Promise<{ key: string; value: unknown }[]>;

  sqlQuery(appId: string, sql: string, params?: unknown[]): Promise<any[]>;
  sqlExec(appId: string, sql: string, params?: unknown[]): Promise<void>;

  // Capability checks (optional)
  hasCapability(appId: string, cap: string): boolean;
}

export function createCore(bridge: HostBridge): TugboatSDK;
export function setGlobalSDK(sdk: TugboatSDK): void; // sets window.__tugboat
export function setAppContext(appId: string): void;  // sets per-app context
```

Host boot flow
```ts
// app/src/main.js (simplified)
import { createCore, setGlobalSDK, setAppContext } from '@tugboats/core/host';
import { tauriBridge } from './hostBridge-tauri';

const sdk = createCore(tauriBridge);
setGlobalSDK(sdk);

// Later, when loading an app:
function loadApp(moduleUrl, alias, domNode) {
  // Give the core a current app scope for the upcoming module execution
  setAppContext(alias);

  import(moduleUrl).then((mod) => {
    // Option A: let the app just import @tugboats/core itself
    mod.tugboatReact?.(domNode);
    // Option B: pass context if you want, but not required
    // mod.tugboatReact?.(domNode, { appId: alias, sdk });
  });
}
```

3) Context/scoping
- Each mutation and DB call is scoped to the current appId.
- setAppContext(alias) sets a thread-local-ish context for the module
  evaluation and subsequent calls (the SDK reads this context when an app calls
  input.set or db.*).
- Under the hood, the SDK attaches { source: appId } on all mutations and passes
  appId to DB methods for namespacing/capability checks.
- To avoid feedback loops, listeners can ignore events with event.source equal
  to themselves if desired.

4) Framework wrappers (peerDeps; never bundle core)
- @tugboats/react: Hooks that sit on top of @tugboats/core.

```ts
// @tugboats/react
import { useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import sdk from '@tugboats/core';

export function useInput() {
  const get = sdk.input.state.get;
  const subscribe = useMemo(() => sdk.input.state.subscribe, []);
  return useSyncExternalStore(subscribe, get, get);
}

export function useDB() {
  return sdk.db;
}
```

- @tugboats/svelte (planned): Re-export a Svelte-friendly store:
  - Either wrap sdk.input.state into a Svelte store interface or design
    sdk.input.state to already satisfy { subscribe } so Svelte can use it
    directly. Optionally provide set/update wrappers that call input.set.

5) App developer usage

React tugboat app (no host plumbing needed)
```ts
// tugboat.ts
import ReactDOM from 'react-dom/client';
import App from './App';
import { useInput, useDB } from '@tugboats/react';

export function tugboatReact(domNode) {
  ReactDOM.createRoot(domNode).render(<App />);
}

// App.tsx
import { useEffect } from 'react';
import { useInput, useDB } from '@tugboats/react';

export default function App() {
  const input = useInput();
  const db = useDB();

  useEffect(() => {
    // react to input changes
    console.log('alias:', input.alias, 'query:', input.query);
  }, [input]);

  async function refine() {
    // propose a change
    await import('@tugboats/core').then(({ input }) =>
      input.set({ setQuery: input.state.get().query + ' vegan' }),
    );
  }

  async function save() {
    await db.kv.set('lastQuery', input.state.get().query);
  }

  return (
    <button onClick={refine}>Refine query</button>
  );
}
```

Svelte tugboat app
```ts
// tugboat.ts
import { mount } from 'svelte';
import App from './App.svelte';

export function tugboatSvelte(domNode) {
  mount(App, { target: domNode });
}

// App.svelte
<script lang="ts">
  import sdk from '@tugboats/core';
  // sdk.input.state.subscribe is Svelte-compatible
  let state = sdk.input.state.get();
  const unsubscribe = sdk.input.state.subscribe((s) => (state = s));
  $: alias = state.alias;
  $: query = state.query;

  async function refine() {
    await sdk.input.set({ setQuery: query + ' gluten-free' });
  }

  onDestroy(unsubscribe);
</script>

<button on:click={refine}>Refine</button>
```

6) Import maps + externalization

Host HTML
```html
<script type="importmap">
{
  "imports": {
    "@tugboats/core": "/runtime/core@1.2.3.js",
    "@tugboats/react": "/runtime/react@1.2.3.js",
    "@tugboats/svelte": "/runtime/svelte@1.0.0.js"
  }
}
</script>
```

Tugboat app vite.config.ts
```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['@tugboats/core', '@tugboats/react', '@tugboats/svelte'],
    },
  },
  optimizeDeps: {
    exclude: ['@tugboats/core', '@tugboats/react', '@tugboats/svelte'],
  },
});
```

This ensures the app does not bundle the SDK; it will resolve via the host’s
import map at runtime. If you can’t use import maps, provide a tiny npm
“shim” for @tugboats/core that re-exports window.__tugboat and have the host
set that global before app modules load.

7) Input semantics and conflict handling
- Host is the final arbiter. Apps propose changes via input.set(). Host:
  - Validates, normalizes (e.g., always updates raw/alias/query together).
  - Bumps version and broadcasts the applied state to all subscribers.
- To avoid loops: input.set adds source=appId. Listeners may ignore events from
  themselves; host may also coalesce rapid updates.
- Optional: support “transient” vs “committed” updates if you later need IME-like
  behavior or debounced pipelines.

8) DB API and capabilities
- Namespacing: The SDK passes appId into all DB calls; the bridge prepends a
  namespace (e.g., kv keys like appId:key) and enforces per-app tables or
  capabilities.
- If you allow raw SQL, gate it by capability. Offer a safe KV by default.

9) Answering your specific questions
- Should pkgs/core be an ESM module that lives as a static asset in the host?
  Yes. Ship a single, host-controlled ESM runtime and make all apps import that
  exact instance (via import maps or a global shim).
- Should pkgs/core be bundled with pkgs/react and pkgs/svelte?
  No. Make react/svelte wrappers tiny peerDeps that depend on @tugboats/core
  being present at runtime. Never bundle core into them.

10) Minimal HostBridge example (Tauri sketch)
```ts
// hostBridge-tauri.ts
import { invoke } from '@tauri-apps/api/tauri';

export const tauriBridge = {
  onInputMutation(handler) {
    // In-process: core can call this directly; if multi-window, use BroadcastChannel
    // Provide a mechanism to register the handler; return unsubscribe
    const dispose = globalThis.__setInputHandler?.(handler);
    return () => dispose?.();
  },
  broadcastAppliedInput(state, event) {
    // Broadcast to other views if needed
    globalThis.__broadcast?.({ state, event });
  },
  async kvGet(appId, key) {
    return invoke('kv_get', { ns: appId, key });
  },
  async kvSet(appId, key, value) {
    await invoke('kv_set', { ns: appId, key, value });
  },
  async kvDel(appId, key) {
    await invoke('kv_del', { ns: appId, key });
  },
  async kvList(appId, prefix) {
    return invoke('kv_list', { ns: appId, prefix });
  },
  async sqlQuery(appId, sql, params) {
    return invoke('sql_query', { appId, sql, params });
  },
  async sqlExec(appId, sql, params) {
    return invoke('sql_exec', { appId, sql, params });
  },
  hasCapability(appId, cap) {
    // Look up from a manifest table or config
    return true;
  },
};
```

What this gives you
- One core to rule them all (host-provided): consistent input state and DB.
- Simple DX for app authors: import @tugboats/core (or hook packages) and go.
- Flexibility to add permissions/pipelining later without breaking app code.
- Clear separation: core = protocol/SDK, react/svelte = ergonomics only.

If you want, I can sketch the internal createCore implementation next, but the
API and packaging above are the key decisions to unblock architecture and
distribution.

# Tugboats

Is a single input and host/runtime for React and Svelte applications. Think of it as an intersection between the more traditional command line and web technologies. It gives users the ability to alias tugboat applications (within the runtime) and forward along an input.

### How it works
Take the following example input: websearch risotto recipes
In the case above, 'websearch' is the tugboat application alias 'risotto recipes' is the query. The input is broken into 2 parts - first word is the application alias, second part is the query. A space character is used to separate the two parts.

### Features
- Leverages Vite to build to build tugboat apps so developers don't have to worry about bundling (TODO)
- Configure the host via TOML (TODO)
- Alias applications to github URLs (TODO)
- Download and build applications from GitHub URLs (TODO)


### Repo structure
```bash
.
├── _test_apps
├── app
│   ├── deno.json
│   ├── deno.lock
│   ├── README.md
│   ├── src
│   │   ├── app_input.js
│   │   ├── app_preferences.js
│   │   ├── assets
│   │   │   ├── core
│   │   │   │   ├── mod.d.ts
│   │   │   │   ├── mod.js
│   │   │   │   └── mod.js.map
│   │   │   ├── javascript.svg
│   │   │   └── tauri.svg
│   │   ├── index.html
│   │   └── styles.css
│   └── src-tauri
│       ├── build.rs
│       ├── capabilities
│       │   └── default.json
│       ├── Cargo.lock
│       ├── Cargo.toml
│       ├── gen
│       │   └── schemas
│       │       ├── acl-manifests.json
│       │       ├── capabilities.json
│       │       ├── desktop-schema.json
│       │       └── macOS-schema.json
│       ├── src
│       │   ├── kv
│       │   │   ├── client.rs
│       │   │   ├── commands.rs
│       │   │   ├── mod.rs
│       │   │   └── types.rs
│       │   ├── lib.rs
│       │   └── main.rs
│       └── tauri.conf.json
├── justfile
├── pkgs
│   ├── core
│   │   ├── deno.lock
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── input.ts
│   │   │   ├── kv.ts
│   │   │   └── mod.ts
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   └── react
│       └── package.json
├── README.md
└── TASK.md

16 directories, 38 files
```

## Tugboat apps overview

A tugboat app can read/write the input. In doing this developers can choose what they want to do with an input value as well as set an input value. This should allow for the chaining of tugboat apps in a pipeline type workflow.

### Example tugboat app project
```bash
.
├── package.json
├── README.md
├── src
│   ├── index.js
│   └── index.test.js
└── tsconfig.json
```

### Example tugboat app (React)
```bash
.
├── package.json
├── App.tsx
└── tugboat.ts
```
```typescript
// tugboat.ts
import App from './App.tsx'
export function tugboatReact(domNode: HTMLElement) {
  const root = ReactDOM.createRoot(targetElement);
	root.render(<App />);
}
```

### Example tugboat app (Svelte)
```bash
.
├── package.json
├── App.svelte
└── tugboat.ts
```
```typescript
// tugboat.ts
import { mount } from "svelte";
import App from './App.svelte'
export function tugboatSvelte(domNode: HTMLElement) {
	mount(App, { target, props: { hello: "world" } });
}
```

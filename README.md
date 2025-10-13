# Tugboats

Is a single input and host/runtime for React and Svelte applications. Think of it as an intersection between the more traditional command line and web technologies. It gives users the ability to alias tugboat applications (within the runtime) and forward along an input.

### How it works
Take the following example input: websearch risotto recipes
In the case above, 'websearch' is the tugboat application alias 'risotto recipes' is the query. The input is broken into 2 parts - first word is the application alias, second part is the query. A space character is used to separate the two parts.

### Features
- [x] Configure the host via TOML
- [x] Host bundles apps from GitHub URLs via Vite
- [x] Host automatically watches clone aliases and rebundles and reloads on filesaves

### Tugboat Preferences Docs (INCOMPLETE)
**tugboat** (base config)
- `git_protocol`: configures backend to use SSH or HTTPS for git clones
- `apps`: On save, bundles each tugboat app from the associated `github_url`
- `clones`: On save, clones repo from associated `github_url` to `dir`

**NOTES**
- `apps` should be thought of as an installation or production version
- `clones` can be any repo. we lookup if a clone has a `tugboat.ts(x)` file and if it does, we
auto start/stop a vite dev instance depending the host input value

---

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

## Licenses

This project is dual-licensed under MIT OR Apache-2.0.
- See LICENSE-MIT and LICENSE-APACHE at the repository root.
- See NOTICE for attribution requirements.

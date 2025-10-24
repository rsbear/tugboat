# Setting up changes that need to be made for baseline tugboat apps

Essentially we want to do some simplification for what it takes to mount a tugboat app.

# DESIRES
For our host to write and manage the mount and unmount lifecycles so that users only have to `export default App`
- For react, our host creates and handles `root.render(App)` in some way
- For svelte, our host creates and handles `mount(App)` in some way
- We require an `app.ts(x)` or `app.js(x)` or `App.svelte` instead of a `tugboat.ts` file

## Desired tugboat react app example
```bash
.
├── package.json
├── app.tsx
```
```tsx
// app.tsx
export default function App() {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  )
}
```
## Desired tugboat svelte app example
```bash
.
├── package.json
├── app.svelte
```

---

# CURRENT STATE

We currently have 2 basic tugboat apps:
- `test-bun-react/`
- `test-bun-svelte/`

## Basic tugboat app examples
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

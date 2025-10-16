# Tugboats
_This project is currently in its' prototype phase_

Is a single input and host/runtime/framework for React and Svelte applications. Think of it as an intersection between the more traditional command line and web technologies. It gives users the ability to alias tugboat applications (within the runtime) and forward along an input.

### Risks to know before you continue reading
- Tugboats downloads and builds JavaScript/NPM applications from any Git URL. **This is a security risk**. We should not be held responsible for any code you download and execute on your machine. Use at your own risk.

### How it works
Take the following example input: websearch risotto recipes
In the case above, 'websearch' is the tugboat application alias 'risotto recipes' is the query. The input is broken into 2 parts - first word is the application alias, second part is the query. A space character is used to separate the two parts.

### Features
- [x] Built in Key Value store via SQLite
- [x] Monaco editor
- [x] Configure the host via TOML
- [x] Bundle apps from GitHub URLs via Vite
- [x] A 'dev environment' for clones, AKA bundles and reloads on file saves
- [x] Tailwind via the Host, albiet just via their PlayCDN lol
- [x] Core SDK distributed via NPM
- [ ] React SDK (wraps the core SDK)
- [ ] Svelte SDK (wraps the core SDK)
- [ ] Vue frontend support
- [ ] Gleam/Lustre frontend support
- [ ] Supports WebWorkers on a per-app basis
- [ ] Built in docs

### Installation
Work in progress, coming soon.


---


## Tugboat apps overview

A tugboat app can read/write the input. In doing this developers can choose what they want to do with an input value as well as set an input value. This should allow for the chaining of tugboat apps in a pipeline type workflow.

### Example tugboat app project
```bash
.
├── package.json
├── README.md
├── tugboat.ts(x) or tugboat.js(x)
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

---


## Development (Tugboat Host aka this repo)
***Prerequisites***
- [Deno](https://deno.com/)
- [Node.js](https://nodejs.org)
- [Cargo](https://doc.rust-lang.org/cargo/)
- [Just](https://github.com/casey/just) (optional)

*Dev Command*
```bash
just dev
```
*Cargo check*
```bash
just check_cargo
```


---


## But.. Why..?
Two main reasons:
1. It's an environment that I personally wanted.
2. I want to, and think it's important that we all, continue to explore localized computing.

Frankly, I'm a serial side project guy and find that managing and/or using the side projects just feels.. lost. What I mean by that is I'll have an idea, build out a little bit of it, and then when I want to revisit the idea or build, I might have lost track of it on my own machine. Aliasing projects within a runtime enables easy viewing and consumption, editing and development, and overall management of projects.

I really prefer local apps over remotes if possible. I like PWA's in theory, but in reality never really use them. Also believe that it's becoming more and more important to become less reliant on servers, especially with the rise of AI. Making web apps work locally and instantly via an 'installed' bundle definitely beats any browser based experience.

## Credits, Thanks, and Inspiration
- [Nix](https://nixos.org/) for the idea to run an app via a Git URL, so sick.
- [Tauri](https://tauri.app/) for the amazing infrastructure and tooling.
- [React](https://reactjs.org/) for the super nice way to build web interfaces.
- [Svelte](https://svelte.dev/) also for the super nice way to build web interfaces.
- [Vite](https://vitejs.dev/) for making bundling fast and easy.
- [SQLite](https://www.sqlite.org/) for the simple way to store data.
- [Tailwind](https://tailwindcss.com/) for making my style life easy and lazy

## Licenses

This project is dual-licensed under MIT OR Apache-2.0.
- See LICENSE-MIT and LICENSE-APACHE at the repository root.
- See NOTICE for attribution requirements.

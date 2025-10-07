# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Core Development Commands

### Build and Run
```bash
# Build core package only
just build_core

# Run development server (builds core + starts Tauri app)
just dev
```

### Manual Commands
```bash
# Build core package manually
cd pkgs/core && deno task build

# Run Tauri development server
cd app && deno task tauri dev

# Build Tauri for production
cd app && deno task tauri build
```

### Testing Repository Cloning Feature
```bash
# Start the app and type "preferences" or "prefs" in the input field
# Edit the TOML clones configuration and click "Save Preferences"
# Watch real-time cloning progress in the UI
```

## Architecture Overview

Tugboats is a **host/runtime** for pluggable web applications (React, Svelte) that uses a unique **singleton core SDK** architecture to maintain state consistency and prevent version conflicts.

### Key Components

**1. @tugboats/core SDK (`pkgs/core/`)**
- Single ESM file built with `tsup` and served from `/assets/core/mod.js`
- Provides reactive input store and namespaced KV storage APIs
- Uses `window.__TAURI__.core` for backend communication (not `@tauri-apps/api`)
- Shared singleton instance across all tugboat apps via import maps

**2. Tauri Backend (`app/src-tauri/`)**
- Rust-based backend with KV storage and repository cloning functionality
- SQLite-backed KV store with namespacing (`~/.tugboats/` directory)
- Git repository cloning with real-time progress events
- Commands: `greet`, `clone_repo`, `kv_*` operations

**3. Host Application (`app/src/`)**
- Defines import maps to ensure singleton core consumption
- Manages input state and preferences UI
- Loads tugboat apps dynamically with proper context setting

**4. Development Packages (`pkgs/`)**
- `core/`: Core SDK implementation (TypeScript → ESM)
- `react/`: React wrapper for tugboat apps (future)

### Critical Architecture Rules

- **Never bundle @tugboats/core** inside tugboat apps - always externalize it
- **Always consume core** via host import map for singleton behavior
- **Runtime vs Dev**: Use `npm install @tugboats/core` for types only; host serves actual runtime ESM
- **Framework neutrality**: Core is platform-agnostic; React/Svelte wrappers adapt it

### Input/State Flow
1. User input → `input.set(raw)` → Core singleton
2. All subscribed apps react immediately via reactive store
3. Input persisted to KV store with namespace isolation
4. Apps can propose state changes via `input.set()`

### Repository Cloning System
- TOML-based configuration in preferences (`clones` array)
- Supports HTTPS and SSH URLs with smart repo name extraction
- Sequential processing with real-time progress events
- Target directory resolution with `~` expansion
- Skip-if-exists behavior for efficiency

### KV Storage Pattern
- `kvTable(namespace)` creates isolated storage per app/feature
- APIs: `list()`, `get(key[])`, `set(key[], value)`, `delete(key[])`
- Backed by Rust Tauri commands with SQLite persistence
- Namespaced keys prevent app data conflicts

## File Structure Context

```
pkgs/core/          # Core SDK (singleton runtime)
├── src/mod.ts      # Main exports (input, kvTable)
├── src/input.ts    # Reactive input store
└── src/kv.ts       # KV table factory

app/                # Host Tauri application
├── src-tauri/      # Rust backend
│   ├── src/lib.rs  # Main commands (greet, clone_repo, kv_*)
│   └── src/kv/     # KV storage implementation
└── src/            # Frontend host
    ├── app_input.js      # Input handling
    └── app_preferences.js # Preferences UI

justfile            # Build automation
```

## Development Context

- **Runtime**: Tauri + Deno for host, TypeScript → ESM for core
- **Build System**: `tsup` for core package, Tauri for app compilation
- **State Management**: Custom reactive stores with subscription pattern
- **Backend**: Rust with async command handlers and event streaming
- **Configuration**: TOML for user preferences, JSON for package configs

## Tugboat App Development

When creating tugboat apps:
- Declare `@tugboats/core` as `peerDependency` only
- Configure bundler (Vite) to externalize `@tugboats/core`
- Use `input.subscribe()` for reactive input handling
- Create namespaced KV tables with `kvTable("AppName")`
- Export framework-specific mount functions (`tugboatReact`, `tugboatSvelte`)
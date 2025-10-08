# Tugboat App Bundling and Live Mounting

This document summarizes the recent work to enable cloning, bundling, and live mounting of tugboat apps declared in preferences, including architectural choices, concerns, and future considerations.

## Overview

We extended the existing cloning feature to handle apps declared in `preferences.apps`, added a backend bundler that produces Vite-based ESM bundles per app, stored bundles in `~/.tugboats/bundles`, and wired the frontend to mount the appropriate bundle as the user types an alias (no submit required). Only one tugboat app is rendered at a time, mounted into the `#tugboats-slot` div.

## What we implemented

- Apps cloning
  - Parse `preferences.apps[]` and clone each app's repository into `~/.tugboats/temp/<repo>`.
  - Normalize GitHub URLs to strip sub-paths so `git clone` works:
    - HTTPS: `.../tree/main/...` is trimmed to `https://github.com/<owner>/<repo>`
    - SSH: `git@github.com:<owner>/<repo>.git/tree/main/...` is trimmed to `git@github.com:<owner>/<repo>.git`
  - Support one-level nested app directories in both HTTPS and SSH URL formats.
  - Skip-if-exists behavior via backend check for `.git`.
  - Progress logging via Tauri events (`tugboats://clone-progress`).

- Bundling backend
  - New Tauri command `bundle_app(app_dir, alias)` in `app/src-tauri/src/bundler.rs`:
    - Resolves `app_dir` (supporting one-level nested subdir from the original URL’s `/tree/<branch>/<subdir>` path).
    - Finds `package.json` at repo root or exactly one level below.
    - Runs `npm install` in the project directory.
    - Detects framework (Svelte or React) by reading `package.json`.
    - Installs Vite and the appropriate framework plugin:
      - React: `@vitejs/plugin-react`
      - Svelte: `@sveltejs/vite-plugin-svelte` (+ ephemeral `svelte.config.mjs` if missing)
    - Writes a temporary `vite.config.mjs` with the correct plugin (per our rule to automatically include framework plugins), externalizes `@tugboats/core`, and builds library-style to `.tugboats-dist/`.
    - Reads the generated bundle and saves artifacts to `~/.tugboats/bundles`.
    - Bundle naming: `<alias>-<timestamp>.js` and a matching `<alias>-<timestamp>.importmap.json` (currently an empty map placeholder).
  - Helper commands:
    - `latest_bundle_for_alias(alias)`: returns the most recent `~/.tugboats/bundles/<alias>-<timestamp>.js` path.
    - `read_text_file(path)`: returns the file contents for dynamic import in the frontend.

- Frontend live mounting
  - In `app/src/app_input.js`:
    - Watches input state via the core SDK (`input.subscribe`).
    - Parses the first token as the alias.
    - Refreshes an alias map from `preferences.apps` (via `kvTable("preferences")`).
    - If the alias matches a known app alias:
      - Resolves the latest bundle path via `latest_bundle_for_alias`.
      - Reads the bundle text via `read_text_file` and dynamically imports it via a Blob URL.
      - Mounts into `#tugboats-slot` using one of the expected exports: `tugboatReact`, `tugboatSvelte`, or default export.
      - Ensures only one app is mounted at a time and calls any returned cleanup function on unmount.
    - If the current token is not a known alias, clears the slot and unmounts the previous app.

## End-to-end flow

1. User updates preferences and saves:
   - Repos declared in `clones[]` and `apps[]` are processed. Apps are cloned to `~/.tugboats/temp/<repo>` (url-normalized) and, if a one-level subdir is in the original URL, the app dir is `~/.tugboats/temp/<repo>/<subdir>`.
   - Each app is bundled via the new backend command and artifacts are saved to `~/.tugboats/bundles/<alias>-<timestamp>.js`.
2. User types in the main input (no submit required):
   - The first token (alias) is resolved.
   - If it matches an alias in `preferences.apps`, the frontend resolves and imports the latest bundle for that alias and mounts it into `#tugboats-slot`.

## Architectural choices

- Singleton Core SDK
  - Continue to externalize `@tugboats/core` from app bundles and provide it via the host’s import map. This preserves a single shared runtime (`/assets/core/mod.js`).

- Filesystem locations
  - `~/.tugboats/temp` for cloned app repos.
  - `~/.tugboats/bundles` for built artifacts per app alias.
  - These directories are created on demand and permitted via Tauri FS scope.

- URL normalization and nested directories
  - For cloning, normalize GitHub URLs down to `<owner>/<repo>` (HTTPS or SSH) so `git clone` won’t fail on `/tree/` paths.
  - For app location, support a single level of nested subdir after `/tree/<branch>/`. If deeper, warn and use only the first-level subdir.

- Bundling and plugins
  - Use Vite library mode with framework plugin chosen by detection:
    - Svelte: `@sveltejs/vite-plugin-svelte` (and ephemeral `svelte.config.mjs` if missing).
    - React: `@vitejs/plugin-react`.
  - Externalize `@tugboats/core`. (React and Svelte packages are bundled in output, which keeps the host’s runtime neutral.)
  - Bundle naming includes the user-defined alias to facilitate lookup and live mounting.

- Dynamic module loading
  - Frontend imports bundle code via a Blob URL created from the file contents loaded with a Tauri command.
  - This approach avoids path and protocol complications while keeping the dev loop simple.

## Concerns

- Security of executing third-party code
  - App bundles are arbitrary JavaScript. While expected in this architecture, we should document and communicate the trust model: bundles run in the host’s webview context with access only to what the host exposes (e.g., `@tugboats/core`). Consider future sandboxing strategies or permissions gating.

- Dependency installation and environment
  - Bundling requires `node`, `npm`, and `npx`. We surface helpful errors if these tools are missing, but dev experience depends on them being installed.
  - Network availability and private repo access can affect cloning and `npm install` steps.

- Latest bundle resolution by filename
  - We use a timestamp (`<alias>-<timestamp>.js`) and select the max timestamp at runtime. This is simple and robust, but we rely on monotonic naming and file presence.
  - Concurrency: repeated bundle operations for the same alias could create multiple files. We always pick the latest.

- Preferences refresh on typing
  - The input subscriber refreshes the alias map opportunistically. This is simple to keep things in sync, but we may add explicit refresh on preferences save events to reduce read frequency.

- Cleanup and memory
  - We attempt to call a cleanup function returned by the mounted module (if provided). If the app does not expose cleanup, it may increase memory usage on rapid alias switching.

## Considerations and future work

- Import maps for frameworks
  - Currently, only `@tugboats/core` is externalized and provided by the host. React/Svelte are bundled into the output. If we want to externalize them, we can generate a richer import map (similar to the historical prototype) and adjust Vite externals accordingly.

- Better UX for missing bundles
  - If no bundle is available for a known alias, we could show a friendly message or trigger a (re)bundle.

- Cancellation and concurrency
  - Add cancellation for long-running `git` or `npm` steps.
  - Consider sequential queueing or controlled parallelism for multiple apps.

- More robust nested project detection
  - Today we support one-level nested `package.json`. If we need deeper nesting or multiple candidates, we’ll add more explicit configuration (e.g., `apps[].subdir`).

- Preferences-driven watch
  - Listen to a dedicated event or state flag when preferences are saved to refresh the alias map immediately instead of opportunistically on typing.

## How to test

1. Build and run the app:
   - `just dev`
   - or `cd app && deno task tauri dev`
2. Open preferences (type `prefs` or `preferences`) and ensure your `apps` entries point to GitHub repos. URLs with `/tree/<branch>/<subdir>` are supported (one level deep) for both HTTPS and SSH formats:
   - HTTPS: `https://github.com/owner/repo/tree/main/subdir`
   - SSH: `git@github.com:owner/repo.git/tree/main/subdir` (for private repos)
3. Save preferences. Watch the progress area for cloning and bundling logs. Bundles will appear in `~/.tugboats/bundles` as `<alias>-<timestamp>.js`.
4. Type the alias in the main input. The app should mount live (without pressing Enter) into the `#tugboats-slot`.
5. Switch aliases to verify unmount/remount behavior.

## File touchpoints

- Frontend
  - `app/src/app_preferences.js`: cloning for `apps[]`, nested subdir logic, and bundling invocation.
  - `app/src/app_input.js`: input subscription, alias parsing, latest bundle resolution, dynamic import, and mounting.
  - `app/src/index.html`: contains the `#tugboats-slot` for mounting.

- Backend
  - `app/src-tauri/src/bundler.rs`: bundling, latest bundle resolution, file reading, and progress emission.
  - `app/src-tauri/src/lib.rs`: registers bundler commands and sets up FS scope for `~/.tugboats`.

## Summary

We now have a cohesive pipeline for apps defined in preferences: clone to a known location, bundle with the right framework plugin, persist uniquely named bundles, and mount them live based on the typed alias. This preserves the singleton core runtime model, keeps app bundles self-contained, and enables rapid iteration with clear points for future hardening and UX improvements.

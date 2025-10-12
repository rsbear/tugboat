Summary

I have successfully implemented the JIT (Just-In-Time) build approach for the Tugboats dev mode. Here's what I changed:

### Changes Made

**1. Modified `devserver.rs`:**
- Replaced the Vite dev server spawning logic with a build-on-save approach
- Uses the same build process as the production bundler but outputs to `<alias>-dev.js`
- Watches for file saves (modify events) on JS/TS/JSX/TSX/Svelte/CSS files
- Triggers `vite build` when files are saved
- Emits events to the frontend for build status (`dev:build_started`, `dev:build_completed`, `dev:build_success`, `dev:build_error`)
- Added `build_dev_bundle` function that runs the same build process as the bundler
- Added `get_home_dir` command to help frontend resolve bundle paths
- Removed child process management since we're not running a persistent server

**2. Modified `app_devmode.js`:**
- Replaced dev server URL loading with bundle file loading from the filesystem
- Loads bundles from `~/.tugboats/bundles/<alias>-dev.js`
- Added event listeners for build status updates
- Shows build progress and errors in the dev mode UI
- Removes the need for Vite client imports and HMR since we're doing full rebuilds
- Maintains the same mounting/unmounting logic but uses bundles instead of dev server modules

**3. Added new Tauri command:**
- `get_home_dir` to help frontend resolve the bundle directory path

### Key Features

1. **File Save Detection**: Only triggers builds on file saves (modify events), not all file changes
2. **Same Build Process**: Uses identical build configuration as production bundles for consistency
3. **Error Handling**: Build errors are captured and displayed in the dev mode UI
4. **Package Manager Support**: Maintains support for npm, bun, and deno package managers
5. **Bundle Overwriting**: Dev bundles use `<alias>-dev.js` format and overwrite on each build
6. **Progress Feedback**: Shows build progress and status in the dev mode indicator

The implementation maintains the same user interface and experience but eliminates the issues with running persistent Vite dev servers. Now when you save a file in dev mode, it will trigger a fresh build and automatically remount the updated bundle in the UI.

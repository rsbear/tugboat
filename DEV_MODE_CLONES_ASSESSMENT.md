# Dev Mode for preferences.clones — Assessment and Remediation Plan

Last updated: 2025-10-08

Summary
- Reported: “dev mode for preferences.clones is completely broken.”
- Finding: The current dev mode assumes every clone is a tugboat app and always attempts a Vite bundle. This contradicts the contract in PREFERENCES_GITURLS.md that clones are not necessarily tugboat apps. There are also a few ergonomics and robustness gaps (alias parsing too strict, no auto-clone, single-session limitations), plus environmental prerequisites (Node/npm) that can make the experience appear broken.

Expected Behavior (from project docs)
- The subpath portion of a github_url determines where dev mode should watch/run for preferences.clones.
- Clones are not necessarily tugboat apps.

Current Implementation Overview
- Frontend input handling triggers dev mode when the user types `<alias>:dev`. This is parsed and routed to start or stop dev mode.
- Frontend UI subscribes to dev mode events and shows logs/status. A successful build emits a remount event to refresh the currently displayed bundle.
- Backend dev mode manager resolves the clone directory from preferences, derives the correct subdirectory from github_url subpath, sets up a file watcher, and triggers a bundle build upon startup and file changes.

Key References
- Frontend dev-mode triggering in input handler:
```js path=/Users/rs/goodtime/tugboats/app/src/app_input.js start=115
input.subscribe(async (s) => {
  handlePreferencesTrigger(s.raw);
  
  // Handle dev mode commands first
  const devCommand = parseDevCommand(s.raw);
  if (devCommand) {
    await handleDevMode(s.raw);
    // Don't process as regular alias when in dev mode
    console.log("Dev mode command processed:", s.raw);
    return;
  }
```

- Frontend dev-mode command parsing (regex only allows [A-Za-z0-9_]):
```js path=/Users/rs/goodtime/tugboats/app/src/app_devmode.js start=29
export function parseDevCommand(raw) {
  const s = (raw || "").trim();
  if (!s) return null;
  
  // Match pattern: <alias>:dev
  const match = s.match(/^(\w+):dev$/);
  if (match) {
    return { alias: match[1], command: "dev" };
  }
  
  return null;
}
```

- Backend dev-mode resolves app_dir using github_url subpath and triggers a bundle build:
```rust path=/Users/rs/goodtime/tugboats/app/src-tauri/src/devmode.rs start=145
// Determine the actual app directory: if subpath exists, point watcher there
let app_dir = if let Some(sub) = parsed.subpath() {
    full_clone_path.join(sub)
} else {
    full_clone_path.clone()
};
...
// Call bundler with dev mode optimizations
match bundler::bundle_app(
    app_dir.to_string_lossy().to_string(),
    session_alias,
    None,
    self.app_handle.clone(),
).await {
```

- Bundler expects a valid tugboat app (package.json present; vite will be installed; tugboats entrypoint required):
```rust path=/Users/rs/goodtime/tugboats/app/src-tauri/src/bundler.rs start=263
fn find_package_json_dir(project_dir: &Path) -> Result<PathBuf, String> {
  let root_pkg = project_dir.join("package.json");
  if root_pkg.exists() {
      return Ok(project_dir.to_path_buf());
  }
  // search one level down ...
  match candidates.len() {
      0 => Err("No package.json found at repo root or one-level nested".to_string()),
      1 => Ok(candidates.remove(0)),
      _ => Err("Multiple package.json files found one-level nested; please specify the subdirectory".to_string()),
  }
}
```

What’s Broken and Why
1) Concept mismatch: clones ≠ tugboat apps
- Behavior: Dev mode always triggers the bundler at the resolved app_dir, assuming it’s a valid tugboat app (has package.json and tugboats entrypoint).
- Impact: For clones that are not tugboat apps (which is explicitly allowed), bundling fails immediately, surfacing as a broken dev mode experience.
- Evidence: devmode.rs unconditionally calls bundler::bundle_app and treats failures as dev-mode errors.

2) No auto-clone if the clone directory doesn’t exist
- Behavior: dev mode expects the clone directory to already be present. If missing, it errors (“Clone directory not found”).
- Impact: If the user configures clones but hasn’t yet run the cloning step (or changed dir), dev mode fails.
- Evidence: find_clone_directory returns a path and dev_mode_start errors if watch_path doesn’t exist.

3) Alias parsing too strict
- Behavior: Aliases are parsed by /^(\w+):dev$/ which restricts to [A-Za-z0-9_]. Hyphens and other common alias characters are rejected.
- Impact: Users with hyphenated aliases (e.g., `my-app:dev`) cannot start dev mode.

4) Single-session watcher lifecycle limitations
- Behavior: The backend watcher is created once and watches session paths present at creation time. Adding additional sessions later won’t add new watches.
- Impact: Multi-session dev mode (if ever enabled) won’t work as expected; today the UI suggests just one session at a time, but code tracks multiple in the set.

5) Environmental prerequisites (node/npm/npx) not met
- Behavior: Dev mode build requires Node/npm/npx; the bundler checks and will error if missing.
- Impact: On a fresh machine, this feels like “dev mode is broken,” though the root cause is missing tooling.

6) Error handling lacks actionable guidance
- Behavior: When bundling fails (e.g., not a tugboat app), frontend shows a generic error status.
- Impact: Users don’t know whether the directory is missing, the app isn’t a tugboat app, or Node tooling is required.

Risk Assessment
- False negatives: Users conclude dev mode is broken when a clone is simply not a tugboat app or hasn’t been cloned yet.
- User confusion: Current UX doesn’t make a clear distinction between “watch my clone” vs “build-and-hot-reload my tugboat app.”
- Scalability: Multi-session support is partially implemented in the UI but not fully supported by the watcher lifecycle.

Recommended Solutions (Prioritized)
P0 — Make dev mode robust and user-friendly
1. Support both modes: watch-only and bundle-enabled
   - Detect app type: On start, check for package.json and a recognized entrypoint (tugboats.ts/tsx or harbor.ts/tsx). If present, enable bundling; otherwise, switch to watch-only mode that emits status logs like “Change detected at …” without bundling.
   - Emit clear status: Inform the user if bundling is disabled because the clone is not a tugboat app.

2. Auto-clone on demand (if missing)
   - If watch_path (or app_dir) does not exist, parse github_url and invoke clone_repo using the user’s git_protocol. Continue with dev mode after cloning.
   - Emit progress via the existing event bus so the user can see what’s happening.

3. Relax alias parsing
   - Update regex to allow hyphens: e.g., /^([A-Za-z0-9_-]+):dev$/. Provide a clear error for invalid formats.

4. Improve error messages and guidance
   - When bundling fails, include the cause and the path used; suggest remedies (install Node, ensure package.json, add tugboats.ts/tsx, or run in watch-only mode).

P1 — Quality and correctness
5. Ensure github_url subpath is always honored
   - This is already implemented in devmode.rs and bundler now supports a githubUrl hint elsewhere. Confirm it is working for clones dev mode by checking app_dir resolution and preventing fallback searches that may hit multiple subprojects.

6. Watcher lifecycle improvements
   - If we ever support concurrent sessions, add new watches dynamically when sessions start and remove them when sessions stop.

P2 — UX and extensibility
7. Explicit dev-apps block (optional)
   - Introduce a preferences.dev_apps array distinct from clones. Only dev_apps are bundled; clones remain watch-only by default.

8. Configurable dev commands (future)
   - Allow per-alias commands (e.g., `pnpm build`) for non-tugboat projects to run on change. Keep non-interactive and safe.

Acceptance Criteria
- Start dev mode with a clone alias that has not yet been cloned → UI shows cloning progress, then begins watching.
- Start dev mode with a non-tugboat clone → watch-only mode, clear status that bundling is disabled.
- Start dev mode with a tugboat app (subpath) → successful initial bundle, then rebuild on change; remount events refresh the running app.
- Hyphenated alias (e.g., my-app:dev) starts dev mode.
- Missing Node/npm shows a clear actionable error (install Node/npm/PNPM, etc.).

Proposed Implementation Plan (Incremental)
1) P0 fixes
- Frontend: update parseDevCommand to allow hyphens; improve errors.
- Backend: in dev_mode_start
  - If clone path missing → auto-clone (using git_protocol from preferences) and proceed.
  - Detect tugboat app presence (package.json + entrypoint). If absent → set session to watch-only; don’t call bundler.
  - When watch-only → emit file change summaries to dev-mode-build channel.
- Frontend: reflect watch-only status in the logs and indicator.

2) P1 fixes
- Confirm subpath handling paths and remove ambiguous fallback if a github_url subpath is present.
- Improve watcher to support future multi-sessions (if needed).

3) P2 enhancements
- Add preferences.dev_apps (opt-in) and configurable non-interactive dev commands per alias.

Notes and Constraints
- Tauri constraints disallow interactive commands; any dev commands must be non-interactive and safe.
- We should avoid watching node_modules et al. The current filter ignores them after events are received; that’s acceptable for now.

Appendix — Additional Code References
- Emitting dev mode events (status/log/ready):
```rust path=/Users/rs/goodtime/tugboats/app/src-tauri/src/devmode.rs start=62
fn emit_status(&self, alias: &str, status: &str, message: &str, watch_path: Option<&Path>) {
  let status_event = DevModeStatus { /* ... */ };
  let _ = self.app_handle.emit("tugboats://dev-mode-status", &status_event);
}

fn emit_build_log(&self, alias: &str, event_type: &str, content: &str) {
  let build_event = DevModeBuildEvent { /* ... */ };
  let _ = self.app_handle.emit("tugboats://dev-mode-build", &build_event);
}

fn emit_ready(&self, alias: &str, bundle_path: &str, build_time_ms: u64) {
  let ready_event = DevModeReadyEvent { /* ... */ };
  let _ = self.app_handle.emit("tugboats://dev-mode-ready", &ready_event);
}
```

- Frontend event handling and remount trigger:
```js path=/Users/rs/goodtime/tugboats/app/src/app_devmode.js start=228
listen("tugboats://dev-mode-status", (event) => {
  handleDevModeStatus(event.payload);
});
...
listen("tugboats://dev-mode-ready", (event) => {
  handleDevModeReady(event.payload);
});
```

- Docs: clones aren’t necessarily tugboat apps:
```md path=/Users/rs/goodtime/tugboats/PREFERENCES_GITURLS.md start=26
### Tugboat apps in a github URL
- At most, a tugboat app path can be 1 level deep from repo root.
...
- Take note that `preferences.clones` are not necessarily 'tugboat apps'
```

If you want, I can implement the P0 fixes next (regex, auto-clone, watch-only mode, clearer errors).
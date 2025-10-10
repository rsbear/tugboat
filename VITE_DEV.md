# Vite Dev Mode: Assessment and Implementation Plan

This document proposes a concrete plan to run a Vite dev server against a preferences clone subpath and render its output within `app/src/index.html` (div id="tugboats-slot"). It synthesizes context from:
- README.md (project overview, clones vs apps, intended auto dev behavior)
- .docs/PREFERENCES_GITURLS.md (git_protocol and github_url parsing, subpath semantics)
- TASK_ASSESS_DEV.md (objectives and relevant files)

## Objectives (from TASK_ASSESS_DEV.md)
- Auto start if the app input equals a <clone-alias>.
- Auto stop if the app input does not equal a <clone-alias>.
- Pipe the Vite dev server stdout from Rust to the frontend via events/listeners and display it.
- Render the dev server output into `#tugboats-slot`.
- Tangent: delete `app/src-tauri/src/devmode.rs` once replaced by the new implementation.

## Context Summary
- Tugboats hosts React and Svelte apps. Input is split into two parts: alias and query. If the input alias matches a clone alias, we enter dev mode for that clone.
- Preferences define:
  - `git_protocol` (ssh or https) which governs how we transform `github_url` for cloning.
  - `apps`: production-bundled entries (built via Vite bundler path resolution).
  - `clones`: arbitrary repos to be cloned locally. If a clone’s subpath contains a tugboat app entry (e.g., `tugboat.ts` or `tugboat.tsx`), we auto start/stop a Vite dev server depending on input alias.
- `github_url`s may include a subpath (e.g., `.../tree/main/mini-react-ts`). For dev mode, the watcher/working directory should be that subpath within the local clone directory.

## Definitions
- clone alias: A key/name in preferences.clones that a user types as the first word of the input.
- repo root dir: The local directory where the repository is cloned.
- subpath: Optional path within the repo where the tugboat app lives and where Vite should run in dev mode.
- tugboat app indicator: A file such as `tugboat.ts` or `tugboat.tsx` in the subpath.

## High-Level Architecture
1. Frontend observes the current input alias.
2. If alias ∈ preferences.clones, request start of dev server for that alias (unless already active). If alias ∉ preferences.clones, stop any active dev server.
3. Rust backend resolves the clone to local directory and subpath, spawns Vite dev server as a child process with stdout/stderr piped.
4. Rust emits events to the frontend for stdout logs and the discovered dev URL.
5. Frontend loads the dev app as a remote ESM module into the main window (no iframe) so it can access window-level tugboats/core and, if allowed, Tauri APIs.
6. On alias change, the previous dev server is stopped and the new one is started.

## Relevant Files
- Frontend:
  - `app/src/app_input.js` (source of the input alias and changes)
  - `app/src/app_preferences.js` (provides preferences including clones and git protocol)
  - `app/src/index.html` (contains `<div id="tugboats-slot"></div>` where dev output will render)
- Backend (Tauri/Rust):
  - `app/src-tauri/src/bundler.rs` (reference for how bundling currently shells out with Vite; dev manager can live adjacent or in a new module)
  - Replace old dev mode file: remove `app/src-tauri/src/devmode.rs` after migration

## Git URL Handling in Dev Mode
- Follow `.docs/PREFERENCES_GITURLS.md`:
  - Respect `git_protocol` (ssh or https) when cloning or otherwise deriving repo.
  - Parse `github_url` into base repo, branch, and subpath. Subpath determines where to run dev within the local clone directory.
- For dev mode we do not need to clone anew (clones are already present). We only resolve subpath for the working directory of Vite.

## Dev Server Lifecycle
- start_dev(alias)
  - Resolve alias → clone metadata → local repo dir → subpath.
  - Verify the subpath is a Vite app candidate, ideally ensure presence of `package.json` and either a `vite.config.*` or a `tugboat.ts(x)` entry. If missing a Vite config and we must generate one, see Plugin Rule below.
  - Choose package manager (prefer pnpm > yarn > npm based on lockfile existence), command is usually `run dev` or direct `vite dev`.
  - Spawn the process with stdout/stderr piped.
  - Stream stdout lines; detect dev server URL(s) (e.g., `Local: http://localhost:5173/`). Emit events to frontend for logs and the URL.
- stop_dev()
  - Gracefully terminate the child (SIGINT). Fallback to kill if not exiting within a timeout.
  - Emit a `dev:stopped` event and clear frontend state.

## Frontend Integration
- Input watcher (in `app/src/app_input.js`):
  - On alias change:
    - If alias ∈ clones: invoke backend command `start_dev(alias)`.
    - Else: invoke backend command `stop_dev()`.
- Rendering into `#tugboats-slot`:
  - Dynamically import the dev app entry module from the discovered dev URL (e.g., `${url}/tugboat.ts`) into the top-level window; no iframe.
  - After import, call the exported mount function (e.g., `tugboatReact`, `tugboatSvelte`, or `mount`) with the slot element.
  - On stop or alias change, unmount via an exported `unmount` (or `tugboatUnmount`) if present; otherwise clear the slot.
- Log display:
  - Subscribe to `dev:stdout` events and show a scrolling log panel.

Example frontend listeners (illustrative):
```ts path=null start=null
import { listen } from '@tauri-apps/api/event'

const slot = document.getElementById('tugboats-slot')
let current = { url: null as string | null, mod: null as any }

async function unmountCurrent() {
  if (current.mod) {
    const unmount = current.mod.unmount || current.mod.tugboatUnmount
    if (typeof unmount === 'function') {
      try { await unmount(slot) } catch {}
    }
    slot.innerHTML = ''
    current.mod = null
    current.url = null
  }
}

listen('dev:url', async ({ payload }) => {
  const { url } = payload as { url: string }
  if (current.url === url) return
  await unmountCurrent()
  current.url = url
  try {
    const entry = `${url}/tugboat.ts`
    // Prevent bundlers from trying to analyze the URL at build time
    const mod = await import(/* @vite-ignore */ entry)
    current.mod = mod
    const mount = mod.tugboatReact || mod.tugboatSvelte || mod.mount
    if (typeof mount === 'function') {
      mount(slot)
    } else {
      console.error('No mount function exported from', entry)
    }
  } catch (e) {
    console.error('Failed to load dev module', e)
  }
})

listen('dev:stopped', () => {
  unmountCurrent()
})

listen('dev:stdout', ({ payload }) => {
  // append payload.line to a log UI component
})
```

## Dev Security and Allowlist (Tauri)
- For development, allow the webview to load remote modules and HMR from the dev server origin (e.g., http://localhost:5173):
  - Permit network access to that origin.
  - Ensure CSP/connect-src allows the dev server and its websocket (ws://localhost:5173) for HMR.
  - If the dev module needs to call Tauri IPC (e.g., `window.__TAURI__.invoke`), explicitly allow that origin for dev-only remote IPC access.
- Restrict this to development profiles only; do not enable in production builds.

Illustrative config fragment (adjust for your Tauri version/profile names):
```json path=null start=null
{
  "tauri": {
    "security": {
      "csp": "default-src 'self'; connect-src 'self' http://localhost:5173 ws://localhost:5173; script-src 'self' 'unsafe-inline' http://localhost:5173"
    },
    "allowlist": {
      "http": {
        "all": true
      }
    },
    "windows": [
      {
        "remote": {
          "urls": ["http://localhost:5173"],
          "enableTauriAPI": true
        }
      }
    ]
  }
}
```
Note: The exact keys differ between Tauri versions. If your dev module uses only window-level tugboats/core and not Tauri IPC, you can omit remote IPC access and keep a tighter policy.

## Backend (Rust/Tauri) Design
- Maintain a DevManager singleton/state:
  - current_active_alias: Option<String>
  - proc: Option<Child> (process handle)
- Commands exposed to frontend:
  - `start_dev(alias: String)`
  - `stop_dev()`
  - `dev_status()` (optional diagnostics)
- Working directory resolution:
  - From preferences, map alias → { dir, github_url }.
  - Parse github_url’s subpath; working_dir = path.join(dir, subpath?).
- Process spawn:
  - Prefer existing project scripts: if `package.json` has `scripts.dev`, run `npm run dev` (or yarn/pnpm equivalent). Otherwise `npx vite dev` as fallback.
  - Environment: ensure `BROWSER=none` (avoid auto-open), inherit other env.
  - Capture stdout/stderr; emit events.
  - Parse lines to find the serving URL; send `dev:url` when detected.

Illustrative Rust pseudo-implementation for spawning:
```rust path=null start=null
#[tauri::command]
pub async fn start_dev(state: tauri::State<'_, DevManager>, alias: String) -> Result<(), String> {
    let mut mgr = state.0.lock().await;

    if mgr.current_active_alias.as_deref() == Some(&alias) {
        return Ok(()); // already running
    }

    if mgr.proc.is_some() {
        mgr.stop_current().await.ok();
    }

    let working_dir = resolve_working_dir_from_alias(&alias)?; // includes subpath

    let (cmd, args) = detect_dev_command(&working_dir)?; // e.g., ("npm", ["run", "dev"]) or ("npx", ["vite", "dev"])    

    let mut child = tokio::process::Command::new(cmd)
        .args(args)
        .current_dir(&working_dir)
        .env("BROWSER", "none")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let stdout = child.stdout.take().unwrap();
    let app_handle = mgr.app_handle.clone();
    tokio::spawn(async move {
        use tokio::io::{AsyncBufReadExt, BufReader};
        let mut lines = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = app_handle.emit_all("dev:stdout", serde_json::json!({"line": line}));
            if let Some(url) = parse_vite_url(&line) {
                let _ = app_handle.emit_all("dev:url", serde_json::json!({"url": url}));
            }
        }
    });

    mgr.proc = Some(child);
    mgr.current_active_alias = Some(alias);
    Ok(())
}
```

Stopping with timeout and SIGINT/SIGKILL fallback:
```rust path=null start=null
impl DevManager {
    pub async fn stop_current(&mut self) -> Result<(), String> {
        if let Some(mut child) = self.proc.take() {
            #[cfg(unix)]
            {
                use nix::sys::signal::{kill, Signal};
                use nix::unistd::Pid;
                let _ = kill(Pid::from_raw(child.id().unwrap() as i32), Signal::SIGINT);
            }
            // On non-unix, try child.kill() or child.start_kill()

            let deadline = tokio::time::sleep(std::time::Duration::from_secs(3));
            tokio::pin!(deadline);
            tokio::select! {
                _ = child.wait() => {}
                _ = &mut deadline => { let _ = child.kill().await; }
            }
        }
        // emit stop event
        let _ = self.app_handle.emit_all("dev:stopped", serde_json::json!({}));
        self.current_active_alias = None;
        Ok(())
    }
}
```

## Discovering the Dev URL
- Vite typically logs lines like:
  - `Local:   http://localhost:5173/`
  - `Network: http://192.168.1.x:5173/`
- Parse stdout lines to detect the first valid http(s) URL and emit `dev:url`. Prefer Local.

## Start/Stop Policy
- On input alias change:
  - if alias ∈ clones and alias != current_active_alias → start_dev(alias) (stop previous first)
  - if alias ∉ clones and current_active_alias.is_some() → stop_dev()
- On app close → stop_dev()

## Error Handling and Edge Cases
- Missing clone directory or subpath: emit user-friendly error event `dev:error` and do not attempt to spawn.
- Missing `package.json`: report not a Vite project; skip dev mode.
- Port conflicts: let Vite auto-select a free port or add `--port` only if needed; always parse the actual URL from stdout rather than assuming a port.
- Unauthorized scripts (e.g., postinstall): do not run; only run `dev`.
- Security: embedding via iframe confines the dev app to its origin. Avoid arbitrary script injection.

## Vite Config Generation (only if required)
- Prefer using the project’s existing Vite config. If a minimal config must be generated for a detected tugboat app:
  - React apps: include `@vitejs/plugin-react`.
  - Svelte apps: include `@sveltejs/vite-plugin-svelte`.
- This aligns with the rule: When generating a Vite config, automatically add the Vite React plugin if the framework is React, and automatically add the Vite Svelte plugin if the framework is Svelte.

## Implementation Checklist
- Frontend
  - [ ] Read `preferences.clones` and map alias → local dir, subpath.
  - [ ] Observe input alias; route to start/stop commands.
  - [ ] Subscribe to `dev:stdout`, `dev:url`, `dev:stopped` events.
  - [ ] Manage iframe in `#tugboats-slot`.
  - [ ] Provide basic log panel and status indicator.
- Backend (Rust/Tauri)
  - [ ] Implement DevManager state (active alias, child handle).
  - [ ] Implement `start_dev`, `stop_dev`, and optional `dev_status` commands.
  - [ ] Resolve working directory from alias (including subpath parsing from github_url).
  - [ ] Detect package manager/command and spawn Vite dev with stdout piping.
  - [ ] Parse URL from stdout and emit events.
  - [ ] Graceful stop with timeout and kill fallback; emit `dev:stopped`.
  - [ ] Delete `app/src-tauri/src/devmode.rs` after migration.

## Future Considerations
- Support additional git providers beyond GitHub.
- Multi-dev support (multiple iframes) if we ever support multiple active aliases.
- More sophisticated framework detection and config scaffolding.
- Persist dev server logs with filtering and levels.

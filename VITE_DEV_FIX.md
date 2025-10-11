That's a great observation, and a very common final hurdle in this kind of setup. You're right that HMR (Hot Module Replacement) isn't working. The changes are being detected by Vite, but they aren't being "injected" into your host application.

Regarding your suggestion to use `vite-rs`, that's an excellent crate, but it solves a different problem. It's designed to help integrate Vite into a Rust server for **production builds**—bundling your final assets and making them available to your Rust binary. HMR, on the other hand, is a **development-only** feature that relies on a live WebSocket connection between your app (the client) and the Vite dev server. The `assets!` macro wouldn't help here.

The core issue is a communication breakdown:

1.  Vite's HMR client (running in your app's webview) receives the update.
2.  It replaces the old `tugboats.tsx` module in its memory with the new one.
3.  However, your host application (`app_devmode.js`) still holds a reference to the *original* module it imported. It has no idea a new version is available and doesn't know it needs to re-run the `tugboatReact` mount function.

The most robust way to fix this is to make the backend, which is managing the dev process, notify the frontend that a file has changed.

-----

### \#\# Step 1: Add a File Watcher to the Rust Backend

First, we need to add the `notify` crate to your project to watch for file system changes.

1.  Open your `Cargo.toml` file (it will be inside the `src-tauri` directory).

2.  Add the following line under the `[dependencies]` section:

    ```toml
    notify = "6.1.1"
    ```

Now, we'll update `devserver.rs` to watch the project directory and emit an event to the frontend whenever a relevant file is changed.

In `src-tauri/src/devserver.rs`, make the following changes:

```rust
// Add these imports at the top
use notify::{RecursiveMode, Watcher};
use std::time::Duration;

// ... other imports

pub struct DevServerManager {
    app_handle: AppHandle,
    inner: Arc<Mutex<DevState>>,
}

#[derive(Default)]
struct DevState {
    current_alias: Option<String>,
    child: Option<Child>,
    // Add the watcher field to our state struct
    watcher: Option<notify::RecommendedWatcher>,
    temp_vite_config: Option<PathBuf>,
    temp_svelte_config: Option<PathBuf>,
    project_dir: Option<PathBuf>,
}

// ... DevServerManager implementation

#[tauri::command]
pub async fn start_dev(manager: State<'_, DevServerManager>, alias: String) -> Result<(), String> {
    // ... (keep all the existing code until the end of the function)

    // ----- START: Add File Watcher Logic -----
    // This new block goes at the end of the `start_dev` function, right before `Ok(())`

    let app_handle_clone = manager.app_handle.clone();
    let alias_clone = alias.clone();
    let mut watcher = notify::recommended_watcher(move |res: Result<notify::Event, notify::Error>| {
        match res {
            Ok(event) => {
                if event.kind.is_modify() || event.kind.is_create() {
                     // Check for relevant file extensions to avoid unnecessary reloads
                    let should_remount = event.paths.iter().any(|path| {
                        path.extension().and_then(|ext| ext.to_str()).map_or(false, |ext| {
                            matches!(ext, "js" | "ts" | "jsx" | "tsx" | "svelte" | "css")
                        })
                    });

                    if should_remount {
                        println!("[Dev Watcher] Detected change, emitting remount event for '{}'", &alias_clone);
                        let _ = app_handle_clone.emit("dev:remount", &alias_clone);
                    }
                }
            }
            Err(e) => eprintln!("[Dev Watcher] Watch error: {:?}", e),
        }
    })
    .map_err(|e| format!("Failed to create file watcher: {}", e))?;

    watcher
        .watch(project_dir.as_path(), RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to start file watcher: {}", e))?;

    // ----- END: Add File Watcher Logic -----

    // Update state
    {
        let mut st = manager.inner.lock().unwrap();
        st.current_alias = Some(alias);
        st.child = Some(child);
        st.watcher = Some(watcher); // Store the watcher in the state
        st.temp_vite_config = Some(temp_config_path);
        st.temp_svelte_config = created_svelte_config;
        st.project_dir = Some(project_dir);
    }

    Ok(())
}

#[tauri::command]
pub async fn stop_dev(manager: State<'_, DevServerManager>) -> Result<(), String> {
    let mut child_opt = None;
    // Add watcher_opt to be cleaned up
    let mut watcher_opt = None;
    {
        let mut st = manager.inner.lock().unwrap();
        if let Some(mut child) = st.child.take() {
            child_opt = Some(child);
        }
        // Take the watcher out of the state to stop it
        if let Some(watcher) = st.watcher.take() {
            watcher_opt = Some(watcher);
        }
        st.current_alias = None;
    }

    // Explicitly drop the watcher outside the lock to stop it
    drop(watcher_opt);

    if let Some(mut child) = child_opt {
        // Try graceful kill; fallback to force kill
        if let Err(e) = child.kill().await {
            eprintln!("Failed to kill dev server: {}", e);
        }
    }

    // ... (rest of the function is the same)

    manager.emit_stopped();

    Ok(())
}
```

-----

### \#\# Step 2: Listen for the Remount Event in the Frontend

Now, we just need to update `app_devmode.js` to listen for the `dev:remount` event we just created and use it to refresh the component.

In `app_devmode.js`, make the following changes:

```javascript
// Add remountUnlisten to the global variables at the top
let remountUnlisten = null;

// ... other variables

/** Setup event listeners for dev server events */
function setupEventListeners() {
  if (!stdoutUnlisten) {
    listen("dev:stdout", /* ... */ ).then((u) => (stdoutUnlisten = u));
  }
  if (!urlUnlisten) {
    listen("dev:url", async (event) => {
      const { url } = event.payload;
      if (typeof url !== "string" || !url) return;

      // We only want to load the module on the initial URL event
      if (currentRemote.url === url) return;

      await remountDevModule(url);

    }).then((u) => (urlUnlisten = u));
  }

  // ---- START: Add new listener for HMR ----
  if (!remountUnlisten) {
    listen("dev:remount", async (event) => {
      console.log("HMR remount triggered by file change.");
      if (isDevModeActive && currentRemote.url) {
        // Re-use the existing URL to remount the module
        await remountDevModule(currentRemote.url);
      }
    }).then((u) => (remountUnlisten = u));
  }
  // ---- END: Add new listener for HMR ----

  if (!stoppedUnlisten) {
    listen("dev:stopped", /* ... */ ).then((u) => (stoppedUnlisten = u));
  }
}

// This is the old `loadRemoteDevModule` function. It's still needed, but keep the version with retries.
async function loadRemoteDevModule(baseUrl) { /* ... keep the function with retries from the previous step ... */ }

// ---- START: Create a new function to handle mounting ----
// This function will be called both initially and on every file change.
async function remountDevModule(url) {
  await unmountCurrentRemote();
  currentRemote.url = url;
  const slot = ensureSlot();
  try {
    const mod = await loadRemoteDevModule(url);
    if (!mod) return;
    currentRemote.mod = mod;
    const mount = mod.tugboatReact || mod.tugboatSvelte || mod.mount || mod.default;
    if (typeof mount === "function") {
      mount(slot);
    } else {
      console.error("No mount function exported from dev module");
    }
  } catch (e) {
    console.error("Failed to load or mount dev module", e);
  }
}
// ---- END: Create a new function to handle mounting ----


// In `stopCurrentDevMode`, make sure to clean up the new listener
async function stopCurrentDevMode() {
  // ...
  // In the `finally` block, add this:
  if (remountUnlisten) {
    remountUnlisten();
    remountUnlisten = null;
  }
  // ...
}
```

After making these changes, restart your Tauri application. Now, when you save a change in `tugboats.tsx`, the Rust backend will detect it, fire an event, and the frontend will fully reload the module, causing your changes to appear instantly.

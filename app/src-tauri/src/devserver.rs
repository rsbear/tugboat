use notify::{RecursiveMode, Watcher};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};
use tokio::sync::mpsc;

use crate::git_url_parser::GitUrl;
use crate::js_app_bases::{detect_app_base, AppBase};
use crate::kv;

pub struct DevServerManager {
    app_handle: AppHandle,
    inner: Arc<Mutex<DevState>>,
}

struct DevState {
    current_alias: Option<String>,
    // File watcher to trigger build on save
    watcher: Option<notify::RecommendedWatcher>,
    temp_vite_config: Option<PathBuf>,
    temp_svelte_config: Option<PathBuf>,
    project_dir: Option<PathBuf>,
    // Channel to signal rebuild requests from file watcher
    rebuild_sender: Option<mpsc::UnboundedSender<()>>,
}

impl Default for DevState {
    fn default() -> Self {
        Self {
            current_alias: None,
            watcher: None,
            temp_vite_config: None,
            temp_svelte_config: None,
            project_dir: None,
            rebuild_sender: None,
        }
    }
}

impl DevServerManager {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle,
            inner: Arc::new(Mutex::new(DevState::default())),
        }
    }

    fn emit_stopped(&self) {
        let _ = self.app_handle.emit("dev:stopped", &serde_json::json!({}));
    }
}

#[tauri::command]
pub async fn start_dev(manager: State<'_, DevServerManager>, alias: String) -> Result<(), String> {
    // If same alias already running, do nothing
    {
        let st = manager.inner.lock().unwrap();
        if st.current_alias.as_deref() == Some(alias.as_str()) {
            return Ok(());
        }
    }

    // Stop any existing dev mode first
    stop_dev(manager.clone()).await.ok();

    // Resolve working directory: clone root and app subpath (if any)
    let (_clone_root, app_dir) = find_clone_directory(&manager.app_handle, &alias).await?;

    // Detect which app base can handle this project
    let app_base = detect_app_base(&app_dir)?;

    // Validate tools are available
    app_base.validate().await?;

    // Prepare build context for dev mode
    let ctx = app_base.prepare_build(&alias, true).await?;

    // Perform initial build
    build_dev_bundle(&manager, &alias, &ctx, &app_base).await?;
    
    // Cleanup temp files after initial build
    app_base.cleanup(&ctx).await?;

    // Set up file watcher for JIT builds with channel-based communication
    let (rebuild_tx, mut rebuild_rx) = mpsc::unbounded_channel();

    // Clone data for the background rebuild task
    let app_handle_clone = manager.app_handle.clone();
    let alias_clone = alias.clone();
    let app_base_boxed = app_base; // Transfer ownership to background task

    // Spawn background task to handle rebuild requests
    tokio::spawn(async move {
        while rebuild_rx.recv().await.is_some() {
            println!(
                "[Dev Watcher] Processing rebuild request for '{}'",
                &alias_clone
            );

            let mgr = DevServerManager {
                app_handle: app_handle_clone.clone(),
                inner: std::sync::Arc::new(std::sync::Mutex::new(DevState::default())),
            };

            // Prepare fresh context for rebuild
            match app_base_boxed.prepare_build(&alias_clone, true).await {
                Ok(rebuild_ctx) => {
                    match build_dev_bundle(&mgr, &alias_clone, &rebuild_ctx, &app_base_boxed).await {
                        Ok(_) => {
                            println!("[Dev Watcher] Build succeeded for '{}'", &alias_clone);
                            
                            // Cleanup temp files after successful build
                            if let Err(e) = app_base_boxed.cleanup(&rebuild_ctx).await {
                                eprintln!("[Dev Watcher] Cleanup warning: {}", e);
                            }
                            
                            let _ = app_handle_clone.emit("dev:build_success", &alias_clone);
                        }
                        Err(e) => {
                            eprintln!("[Dev Watcher] Build failed for '{}': {}", &alias_clone, e);
                            let _ = app_handle_clone.emit("dev:build_error", (&alias_clone, &e));
                        }
                    }
                }
                Err(e) => {
                    eprintln!("[Dev Watcher] Prepare failed for '{}': {}", &alias_clone, e);
                    let _ = app_handle_clone.emit("dev:build_error", (&alias_clone, &e));
                }
            }
        }
    });

    let mut watcher = {
        let alias = alias.clone();
        let rebuild_tx = rebuild_tx.clone();

        notify::recommended_watcher(move |res: Result<notify::Event, notify::Error>| {
            match res {
                Ok(event) => {
                    // Only trigger on modify events (saves), not creates or other changes
                    if event.kind.is_modify() {
                        let should_build = event.paths.iter().any(|path| {
                            // Ignore build artifacts and temp files to prevent infinite loops
                            
                            // Ignore if in excluded directories
                            if path.components().any(|component| {
                                matches!(
                                    component.as_os_str().to_str(),
                                    Some(".tugboats-dist") | Some("node_modules") | Some(".git")
                                )
                            }) {
                                return false;
                            }
                            
                            // Ignore tugboat-generated temp files
                            if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                                if filename == ".tugboats-mount-wrapper.js"
                                    || filename == "vite.config.mjs"
                                    || filename == "svelte.config.mjs"
                                {
                                    return false;
                                }
                            }

                            // Only watch source files
                            path.extension()
                                .and_then(|ext| ext.to_str())
                                .map_or(false, |ext| {
                                    matches!(ext, "js" | "ts" | "jsx" | "tsx" | "svelte" | "css")
                                })
                        });
                        if should_build {
                            println!(
                                "[Dev Watcher] Detected file save, triggering build for '{}'",
                                &alias
                            );

                            // Send rebuild signal through channel
                            if let Err(e) = rebuild_tx.send(()) {
                                eprintln!("[Dev Watcher] Failed to send rebuild signal: {}", e);
                            }
                        }
                    }
                }
                Err(e) => eprintln!("[Dev Watcher] Watch error: {:?}", e),
            }
        })
        .map_err(|e| format!("Failed to create file watcher: {}", e))?
    };

    watcher
        .watch(ctx.project_dir.as_path(), RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to start file watcher: {}", e))?;

    // Update state
    {
        let mut st = manager.inner.lock().unwrap();
        st.current_alias = Some(alias.clone());
        st.watcher = Some(watcher);
        st.temp_vite_config = ctx.temp_files.iter().find(|f| f.ends_with("vite.config.mjs")).cloned();
        st.temp_svelte_config = ctx.temp_files.iter().find(|f| f.ends_with("svelte.config.mjs")).cloned();
        st.project_dir = Some(ctx.project_dir.clone());
        st.rebuild_sender = Some(rebuild_tx);
    }

    // Emit initial success to let frontend know dev mode is ready
    manager.app_handle.emit("dev:ready", &alias).ok();

    Ok(())
}

use crate::js_app_bases::BuildContext;

async fn build_dev_bundle(
    manager: &DevServerManager,
    alias: &str,
    ctx: &BuildContext,
    app_base: &Box<dyn AppBase>,
) -> Result<(), String> {
    manager.app_handle.emit("dev:build_started", alias).ok();

    // Run build using app base
    app_base.build(ctx).await?;

    // Read built bundle
    let built_path = ctx.project_dir.join(".tugboats-dist").join(&ctx.bundle_file);
    let js_code = tokio::fs::read_to_string(&built_path)
        .await
        .map_err(|e| format!("Failed to read built bundle: {}", e))?;

    // Generate import map and mount utils
    let importmap = app_base.generate_importmap();
    let mount_utils = app_base.generate_mount_utils();

    // Save to bundles directory
    let home = dirs::home_dir().ok_or("No home directory found")?;
    let bundles_dir = home.join(".tugboats").join("bundles");
    std::fs::create_dir_all(&bundles_dir)
        .map_err(|e| format!("Failed to create bundles dir: {}", e))?;

    let bundle_path = bundles_dir.join(&ctx.bundle_file);
    std::fs::write(&bundle_path, &js_code).map_err(|e| format!("Failed to write bundle: {}", e))?;

    // Save mount utils (framework-specific mounting code)
    let mount_utils_file = format!("{}.mount-utils.js", alias);
    let mount_utils_path = bundles_dir.join(&mount_utils_file);
    std::fs::write(&mount_utils_path, mount_utils)
        .map_err(|e| format!("Failed to write mount utils: {}", e))?;

    // Save metadata with import map and mount utils path
    let meta_file = format!("{}.meta.json", alias);
    let meta_path = bundles_dir.join(&meta_file);
    
    let metadata = serde_json::json!({
        "framework": ctx.framework,
        "alias": alias,
        "importmap": importmap,
        "mount_utils_path": mount_utils_path.to_string_lossy().to_string()
    });
    
    std::fs::write(&meta_path, serde_json::to_string_pretty(&metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?)
        .map_err(|e| format!("Failed to write metadata: {}", e))?;

    manager.app_handle.emit("dev:build_completed", alias).ok();

    Ok(())
}

#[tauri::command]
pub async fn stop_dev(manager: State<'_, DevServerManager>) -> Result<(), String> {
    let mut watcher_opt = None;
    let mut rebuild_sender_opt = None;
    {
        let mut st = manager.inner.lock().unwrap();
        if let Some(watcher) = st.watcher.take() {
            watcher_opt = Some(watcher);
        }
        if let Some(sender) = st.rebuild_sender.take() {
            rebuild_sender_opt = Some(sender);
        }
        st.current_alias = None;
    }

    // Explicitly drop the watcher and sender outside the lock to stop them
    drop(watcher_opt);
    drop(rebuild_sender_opt);

    // Cleanup temp files
    {
        let st = manager.inner.lock().unwrap();
        if let Some(cfg) = &st.temp_vite_config {
            let _ = std::fs::remove_file(cfg);
        }
        if let Some(svelte_cfg) = &st.temp_svelte_config {
            let _ = std::fs::remove_file(svelte_cfg);
        }
    }

    manager.emit_stopped();

    Ok(())
}

#[tauri::command]
pub async fn dev_status(manager: State<'_, DevServerManager>) -> Result<serde_json::Value, String> {
    let st = manager.inner.lock().unwrap();
    Ok(serde_json::json!({
        "alias": st.current_alias,
        "running": st.watcher.is_some()
    }))
}

async fn find_clone_directory(_app: &AppHandle, alias: &str) -> Result<(PathBuf, PathBuf), String> {
    // Read preferences from KV
    let prefs_key = vec!["preferences".to_string(), "user".to_string()];
    let prefs_result = kv::kv_get(prefs_key)
        .await
        .map_err(|e| format!("Failed to read preferences: {}", e))?;

    let prefs_json = match prefs_result {
        Some(item) => item.value,
        None => return Err("No preferences found".into()),
    };
    let clones = prefs_json
        .get("clones")
        .and_then(|c| c.as_array())
        .ok_or_else(|| "No clones array in preferences".to_string())?;

    for clone in clones {
        let clone_alias = clone.get("alias").and_then(|a| a.as_str()).unwrap_or("");
        if clone_alias == alias {
            let github_url = clone
                .get("github_url")
                .and_then(|u| u.as_str())
                .ok_or_else(|| "Missing github_url for clone".to_string())?;
            let parsed = GitUrl::parse_https(github_url)
                .map_err(|e| format!("Invalid github_url for clone '{}': {}", alias, e))?;
            let dir = clone
                .get("dir")
                .and_then(|d| d.as_str())
                .unwrap_or("~/tugboat_apps");

            let resolved_dir = if dir.starts_with("~/") {
                let home = dirs::home_dir().ok_or("Could not find home directory")?;
                home.join(&dir[2..])
            } else if dir == "~" {
                dirs::home_dir().ok_or("Could not find home directory")?
            } else {
                PathBuf::from(dir)
            };

            let full_clone_path =
                if resolved_dir.file_name().and_then(|n| n.to_str()) == Some("tugboat_apps") {
                    resolved_dir.join(parsed.repo())
                } else {
                    resolved_dir.clone()
                };

            let app_dir = if let Some(sub) = parsed.subpath() {
                full_clone_path.join(sub)
            } else {
                full_clone_path.clone()
            };
            return Ok((full_clone_path, app_dir));
        }
    }

    Err(format!("Clone alias '{}' not found in preferences", alias))
}

#[tauri::command]
pub async fn get_home_dir() -> Result<String, String> {
    let home = dirs::home_dir().ok_or("No home directory found")?;
    Ok(home.to_string_lossy().to_string())
}

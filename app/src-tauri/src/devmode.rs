use notify::{RecommendedWatcher, Watcher, Event, EventKind, RecursiveMode};
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, State};
use tokio::sync::mpsc;
use tokio::time::sleep;

use crate::bundler;
use crate::kv;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevModeStatus {
    pub alias: String,
    pub status: String, // "active", "inactive", "building", "error"
    pub message: String,
    pub watch_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevModeBuildEvent {
    pub alias: String,
    pub event_type: String, // "stdout", "stderr", "info", "error"
    pub content: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevModeReadyEvent {
    pub alias: String,
    pub bundle_path: String,
    pub build_time_ms: u64,
}

pub struct DevModeSession {
    pub alias: String,
    pub watch_path: PathBuf,
    pub app_dir: PathBuf, // Actual directory to bundle (may be subdirectory)
    pub status: String,
    pub last_build: Option<Instant>,
    pub build_debounce_handle: Option<tokio::task::JoinHandle<()>>,
}

pub struct DevModeManager {
    sessions: Arc<Mutex<HashMap<String, DevModeSession>>>,
    app_handle: AppHandle,
    watcher: Arc<Mutex<Option<RecommendedWatcher>>>,
}

impl DevModeManager {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            app_handle,
            watcher: Arc::new(Mutex::new(None)),
        }
    }

    fn emit_status(&self, alias: &str, status: &str, message: &str, watch_path: Option<&Path>) {
        let status_event = DevModeStatus {
            alias: alias.to_string(),
            status: status.to_string(),
            message: message.to_string(),
            watch_path: watch_path.map(|p| p.to_string_lossy().to_string()),
        };
        
        let _ = self.app_handle.emit("tugboats://dev-mode-status", &status_event);
    }

    fn emit_build_log(&self, alias: &str, event_type: &str, content: &str) {
        let build_event = DevModeBuildEvent {
            alias: alias.to_string(),
            event_type: event_type.to_string(),
            content: content.to_string(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        };
        
        let _ = self.app_handle.emit("tugboats://dev-mode-build", &build_event);
    }

    fn emit_ready(&self, alias: &str, bundle_path: &str, build_time_ms: u64) {
        let ready_event = DevModeReadyEvent {
            alias: alias.to_string(),
            bundle_path: bundle_path.to_string(),
            build_time_ms,
        };
        
        let _ = self.app_handle.emit("tugboats://dev-mode-ready", &ready_event);
    }

    async fn find_clone_directory(&self, alias: &str) -> Result<(PathBuf, PathBuf), String> {
        // Get preferences to find clone directory for alias
        let prefs_key = vec!["preferences".to_string(), "user".to_string()];
        let prefs_result = kv::kv_get(prefs_key).await
            .map_err(|e| format!("Failed to read preferences: {}", e))?;
        
        let prefs_json = match prefs_result {
            Some(item) => item.value,
            None => {
                return Err("No preferences found".to_string());
            }
        };
        
        let clones = prefs_json.get("clones")
            .and_then(|c| c.as_array())
            .ok_or_else(|| "No clones array in preferences".to_string())?;

        for clone in clones {
            let clone_alias = clone.get("alias")
                .and_then(|a| a.as_str())
                .unwrap_or("");
            
            if clone_alias == alias {
                let github_url = clone.get("github_url")
                    .and_then(|u| u.as_str())
                    .ok_or_else(|| "Missing github_url for clone".to_string())?;
                
                let dir = clone.get("dir")
                    .and_then(|d| d.as_str())
                    .unwrap_or("~/tugboat_apps");
                
                // Resolve directory path
                let resolved_dir = if dir.starts_with("~/") {
                    let home = dirs::home_dir().ok_or("Could not find home directory")?;
                    home.join(&dir[2..])
                } else if dir == "~" {
                    dirs::home_dir().ok_or("Could not find home directory")?
                } else {
                    PathBuf::from(dir)
                };

                // Build full path without relying on github_url parsing
                let full_clone_path = resolved_dir;

                // For apps, we need to determine the actual app directory
                // This might be a subdirectory if the URL had /tree/branch/subdir
                let app_dir = self.resolve_app_directory(&full_clone_path, github_url).await?;
                
                return Ok((full_clone_path, app_dir));
            }
        }

        Err(format!("Clone alias '{}' not found in preferences", alias))
    }

    async fn resolve_app_directory(&self, clone_path: &Path, _github_url: &str) -> Result<PathBuf, String> {
        // github_url parsing removed; always use clone root
        Ok(clone_path.to_path_buf())
    }

    pub async fn start_dev_mode(&self, alias: String) -> Result<(), String> {
        // Check if already active
        {
            let sessions = self.sessions.lock().unwrap();
            if sessions.contains_key(&alias) {
                return Err(format!("Dev mode already active for alias: {}", alias));
            }
        }

        self.emit_status(&alias, "starting", "Locating clone directory...", None);

        // Find clone directory for alias
        let (watch_path, app_dir) = self.find_clone_directory(&alias).await?;
        
        if !watch_path.exists() {
            return Err(format!("Clone directory not found: {}", watch_path.display()));
        }

        self.emit_status(&alias, "starting", "Setting up file watcher...", Some(&watch_path));

        // Create session
        let session = DevModeSession {
            alias: alias.clone(),
            watch_path: watch_path.clone(),
            app_dir,
            status: "active".to_string(),
            last_build: None,
            build_debounce_handle: None,
        };

        // Store session
        {
            let mut sessions = self.sessions.lock().unwrap();
            sessions.insert(alias.clone(), session);
        }

        // Setup file watcher
        self.setup_file_watcher().await?;

        self.emit_status(&alias, "active", "Watching for file changes...", Some(&watch_path));

        // Perform initial build
        self.trigger_build(&alias).await?;

        Ok(())
    }

    pub async fn stop_dev_mode(&self, alias: String) -> Result<(), String> {
        // Remove session
        let session = {
            let mut sessions = self.sessions.lock().unwrap();
            sessions.remove(&alias)
        };

        if let Some(mut session) = session {
            // Cancel any pending build
            if let Some(handle) = session.build_debounce_handle.take() {
                handle.abort();
            }

            self.emit_status(&alias, "inactive", "Dev mode stopped", None);
            
            // If no more sessions, stop watcher
            {
                let sessions = self.sessions.lock().unwrap();
                if sessions.is_empty() {
                    let mut watcher = self.watcher.lock().unwrap();
                    *watcher = None;
                }
            }
            
            Ok(())
        } else {
            Err(format!("No active dev mode session for alias: {}", alias))
        }
    }

    pub async fn get_active_sessions(&self) -> Result<Vec<String>, String> {
        let sessions = self.sessions.lock().unwrap();
        Ok(sessions.keys().cloned().collect())
    }

    async fn setup_file_watcher(&self) -> Result<(), String> {
        let (tx, mut rx) = mpsc::channel(100);
        let sessions = self.sessions.clone();
        let app_handle = self.app_handle.clone();

        // Create watcher
        let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
            if let Ok(event) = res {
                if let Err(e) = tx.blocking_send(event) {
                    eprintln!("Failed to send file event: {}", e);
                }
            }
        }).map_err(|e| format!("Failed to create file watcher: {}", e))?;

        // Add watches for all active sessions
        {
            let sessions_lock = sessions.lock().unwrap();
            for session in sessions_lock.values() {
                watcher.watch(&session.watch_path, RecursiveMode::Recursive)
                    .map_err(|e| format!("Failed to watch directory: {}", e))?;
            }
        }

        // Store watcher
        {
            let mut watcher_lock = self.watcher.lock().unwrap();
            *watcher_lock = Some(watcher);
        }

        // Spawn event handler
        let manager = DevModeManager {
            sessions: sessions.clone(),
            app_handle: app_handle.clone(),
            watcher: self.watcher.clone(),
        };

        tokio::spawn(async move {
            while let Some(event) = rx.recv().await {
                if let Err(e) = manager.handle_file_event(event).await {
                    eprintln!("Error handling file event: {}", e);
                }
            }
        });

        Ok(())
    }

    async fn handle_file_event(&self, event: Event) -> Result<(), String> {
        // Filter relevant file types
        if !is_relevant_file_change(&event) {
            return Ok(());
        }

        // Find which session(s) this event affects
        let affected_aliases: Vec<String> = {
            let sessions = self.sessions.lock().unwrap();
            sessions.iter()
                .filter(|(_, session)| {
                    event.paths.iter().any(|path| path.starts_with(&session.watch_path))
                })
                .map(|(alias, _)| alias.clone())
                .collect()
        };

        // Trigger builds for affected sessions (debounced)
        for alias in affected_aliases {
            self.debounced_build(alias).await?;
        }

        Ok(())
    }

    async fn debounced_build(&self, alias: String) -> Result<(), String> {
        let alias_clone = alias.clone();
        let sessions_arc = self.sessions.clone();
        let app_handle = self.app_handle.clone();
        let watcher = self.watcher.clone();

        // Cancel existing debounce task and start new one
        {
            let mut sessions_lock = sessions_arc.lock().unwrap();
            if let Some(session) = sessions_lock.get_mut(&alias) {
                if let Some(handle) = session.build_debounce_handle.take() {
                    handle.abort();
                }
            }
        }

        // Clone the arcs for the async task
        let sessions_for_task = sessions_arc.clone();
        let app_handle_for_task = app_handle.clone();
        let watcher_for_task = watcher.clone();
        
        // Start new debounced build task
        let handle = tokio::spawn(async move {
            sleep(Duration::from_millis(500)).await;
            
            let manager = DevModeManager {
                sessions: sessions_for_task,
                app_handle: app_handle_for_task,
                watcher: watcher_for_task,
            };
            
            if let Err(e) = manager.trigger_build(&alias_clone).await {
                eprintln!("Build failed for {}: {}", alias_clone, e);
            }
        });

        // Store the handle back in the session
        {
            let mut sessions_lock = sessions_arc.lock().unwrap();
            if let Some(session) = sessions_lock.get_mut(&alias) {
                session.build_debounce_handle = Some(handle);
            }
        }

        Ok(())
    }

    async fn trigger_build(&self, alias: &str) -> Result<(), String> {
        let (app_dir, session_alias) = {
            let sessions = self.sessions.lock().unwrap();
            let session = sessions.get(alias)
                .ok_or_else(|| format!("No session found for alias: {}", alias))?;
            (session.app_dir.clone(), session.alias.clone())
        };

        self.emit_status(alias, "building", "Starting build...", None);
        self.emit_build_log(alias, "info", "🚧 Starting dev mode build...");

        let build_start = Instant::now();

        // Call bundler with dev mode optimizations
        match bundler::bundle_app(
            app_dir.to_string_lossy().to_string(),
            session_alias,
            self.app_handle.clone(),
        ).await {
            Ok(bundle_path) => {
                let build_time = build_start.elapsed().as_millis() as u64;
                
                self.emit_build_log(alias, "info", 
                    &format!("✅ Build completed in {}ms", build_time));
                self.emit_status(alias, "active", "Build successful, watching for changes...", None);
                self.emit_ready(alias, &bundle_path, build_time);

                // Update last build time
                {
                    let mut sessions = self.sessions.lock().unwrap();
                    if let Some(session) = sessions.get_mut(alias) {
                        session.last_build = Some(Instant::now());
                    }
                }

                Ok(())
            }
            Err(e) => {
                self.emit_build_log(alias, "error", &format!("❌ Build failed: {}", e));
                self.emit_status(alias, "error", &format!("Build failed: {}", e), None);
                Err(e)
            }
        }
    }
}

// Tauri commands
#[tauri::command]
pub async fn dev_mode_start(
    alias: String,
    manager: State<'_, DevModeManager>,
) -> Result<(), String> {
    manager.start_dev_mode(alias).await
}

#[tauri::command]
pub async fn dev_mode_stop(
    alias: String,
    manager: State<'_, DevModeManager>,
) -> Result<(), String> {
    manager.stop_dev_mode(alias).await
}

#[tauri::command]
pub async fn dev_mode_status(
    manager: State<'_, DevModeManager>,
) -> Result<Vec<String>, String> {
    manager.get_active_sessions().await
}

// Helper functions
fn is_relevant_file_change(event: &Event) -> bool {
    match &event.kind {
        EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_) => {
            event.paths.iter().any(|path| {
                let path_str = path.to_string_lossy().to_lowercase();
                
                // Skip irrelevant directories/files
                if path_str.contains("node_modules") ||
                   path_str.contains(".git") ||
                   path_str.contains(".tugboats-dist") ||
                   path_str.contains("target") ||
                   path_str.contains(".DS_Store") ||
                   path_str.ends_with("~") ||
                   path_str.contains(".tmp") ||
                   path_str.contains(".cache") {
                    return false;
                }

                // Include relevant file extensions
                let relevant_extensions = [
                    ".ts", ".tsx", ".js", ".jsx", ".svelte", ".vue",
                    ".css", ".scss", ".sass", ".less", ".styl",
                    ".json", ".toml", ".yaml", ".yml",
                    ".html", ".htm", ".md"
                ];

                relevant_extensions.iter().any(|ext| path_str.ends_with(ext)) ||
                    path_str.ends_with("package.json") ||
                    path_str.ends_with("tsconfig.json") ||
                    path_str.ends_with("vite.config.js") ||
                    path_str.ends_with("vite.config.ts")
            })
        }
        _ => false,
    }
}



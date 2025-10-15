use notify::{RecursiveMode, Watcher};
use serde::Deserialize;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};
use tokio::process::Command;
use tokio::sync::mpsc;

use crate::git_url_parser::GitUrl;
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

    // Determine project directory (where package.json lives)
    let project_dir = if app_dir.join("package.json").exists() {
        app_dir.clone()
    } else {
        find_package_json_dir(&app_dir)?
    };

    // Detect package manager and ensure tools are available
    let package_manager = detect_package_manager(&project_dir);
    ensure_tool("node", &["--version"]).await?;
    match package_manager {
        "npm" => {
            ensure_tool("npm", &["--version"]).await?;
            ensure_tool("npx", &["--version"]).await?;
        }
        "deno" => ensure_tool("deno", &["--version"]).await?,
        "bun" => ensure_tool("bun", &["--version"]).await?,
        _ => {
            ensure_tool("npm", &["--version"]).await?;
            ensure_tool("npx", &["--version"]).await?;
        }
    }

    // Ensure deps installed once
    let node_modules = project_dir.join("node_modules");
    if !node_modules.exists() {
        match package_manager {
            "npm" => run("npm", &["install"], Some(&project_dir)).await?,
            "deno" => {} // Deno doesn't need install step
            "bun" => run("bun", &["install"], Some(&project_dir)).await?,
            _ => run("npm", &["install"], Some(&project_dir)).await?,
        }
    }

    // Read package.json and detect framework
    let pkg = read_package_json(&project_dir).await?;
    let framework =
        detect_framework(&pkg).map_err(|e| format!("Framework detection failed: {}", e))?;

    // Ensure vite and framework plugin present
    match package_manager {
        "npm" => {
            run("npm", &["install", "-D", "vite"], Some(&project_dir)).await?;
            match framework.as_str() {
                "svelte" => {
                    run(
                        "npm",
                        &["install", "-D", "@sveltejs/vite-plugin-svelte"],
                        Some(&project_dir),
                    )
                    .await?;
                }
                "react" => {
                    run(
                        "npm",
                        &["install", "-D", "@vitejs/plugin-react"],
                        Some(&project_dir),
                    )
                    .await?;
                }
                _ => {}
            }
        }
        "bun" => {
            run("bun", &["add", "-d", "vite"], Some(&project_dir)).await?;
            match framework.as_str() {
                "svelte" => {
                    run(
                        "bun",
                        &["add", "-d", "@sveltejs/vite-plugin-svelte"],
                        Some(&project_dir),
                    )
                    .await?;
                }
                "react" => {
                    run(
                        "bun",
                        &["add", "-d", "@vitejs/plugin-react"],
                        Some(&project_dir),
                    )
                    .await?;
                }
                _ => {}
            }
        }
        "deno" => {
            // Deno uses import maps or deps.ts, no install needed
        }
        _ => {
            run("npm", &["install", "-D", "vite"], Some(&project_dir)).await?;
            match framework.as_str() {
                "svelte" => {
                    run(
                        "npm",
                        &["install", "-D", "@sveltejs/vite-plugin-svelte"],
                        Some(&project_dir),
                    )
                    .await?;
                }
                "react" => {
                    run(
                        "npm",
                        &["install", "-D", "@vitejs/plugin-react"],
                        Some(&project_dir),
                    )
                    .await?;
                }
                _ => {}
            }
        }
    }

    // Resolve tugboats entry
    let entry_rel = resolve_tugboats_entry(&project_dir).ok_or_else(|| {
        "No tugboats.ts/tsx/js/jsx entrypoint found (tried root and src/)".to_string()
    })?;

    // Bundle name for dev mode
    let bundle_file = format!("{}-dev.js", alias);

    // Write temporary vite.config.mjs for build
    let vite_config = match framework.as_str() {
        "svelte" => format!(
            r#"import {{ svelte }} from '@sveltejs/vite-plugin-svelte';

export default {{
  define: {{ 'process.env.NODE_ENV': '"production"', 'process.env': {{}}, process: {{}}, global: 'globalThis' }},
  plugins: [svelte()],
  build: {{
    outDir: '.tugboats-dist',
    sourcemap: false,
    manifest: true,
    lib: {{
      entry: './{entry}',
      formats: ['es'],
      fileName: () => '{bundle_file}'
    }},
    rollupOptions: {{
      external: ['@tugboats/core']
    }}
  }}
}};
"#,
            entry = entry_rel,
            bundle_file = bundle_file
        ),
        "react" => format!(
            r#"import react from '@vitejs/plugin-react';

export default {{
  define: {{ 'process.env.NODE_ENV': '"production"', 'process.env': {{}}, process: {{}}, global: 'globalThis' }},
  plugins: [react()],
  build: {{
    outDir: '.tugboats-dist',
    sourcemap: false,
    manifest: true,
    lib: {{
      entry: './{entry}',
      formats: ['es'],
      fileName: () => '{bundle_file}'
    }},
    rollupOptions: {{
      external: ['@tugboats/core']
    }}
  }}
}};
"#,
            entry = entry_rel,
            bundle_file = bundle_file
        ),
        other => return Err(format!("Unsupported framework for dev: {}", other)),
    };

    // Optionally ensure minimal svelte.config.mjs
    let mut created_svelte_config: Option<PathBuf> = None;
    if framework == "svelte" {
        let svelte_cfg = project_dir.join("svelte.config.mjs");
        if !svelte_cfg.exists() {
            let contents = r#"import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('svelte').Config} */
const config = {
  preprocess: vitePreprocess(),
};

export default config;
"#;
            tokio::fs::write(&svelte_cfg, contents)
                .await
                .map_err(|e| format!("Failed to write svelte.config.mjs: {}", e))?;
            created_svelte_config = Some(svelte_cfg);
        }
    }

    let temp_config_path = project_dir.join("vite.config.mjs");
    tokio::fs::write(&temp_config_path, vite_config)
        .await
        .map_err(|e| format!("Failed to write vite.config.mjs: {}", e))?;

    // Perform initial build
    build_dev_bundle(
        &manager,
        &alias,
        &project_dir,
        &package_manager,
        &bundle_file,
    )
    .await?;

    // Set up file watcher for JIT builds with channel-based communication
    let (rebuild_tx, mut rebuild_rx) = mpsc::unbounded_channel();

    // Clone data for the background rebuild task
    let app_handle_clone = manager.app_handle.clone();
    let alias_clone = alias.clone();
    let project_dir_clone = project_dir.clone();
    let package_manager_clone = package_manager.to_string();
    let bundle_file_clone = bundle_file.clone();

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

            match build_dev_bundle(
                &mgr,
                &alias_clone,
                &project_dir_clone,
                &package_manager_clone,
                &bundle_file_clone,
            )
            .await
            {
                Ok(_) => {
                    println!("[Dev Watcher] Build succeeded for '{}'", &alias_clone);
                    let _ = app_handle_clone.emit("dev:build_success", &alias_clone);
                }
                Err(e) => {
                    eprintln!("[Dev Watcher] Build failed for '{}': {}", &alias_clone, e);
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
                            // Ignore changes in .tugboats-dist directory to prevent infinite loops
                            if path
                                .components()
                                .any(|component| component.as_os_str() == ".tugboats-dist")
                            {
                                return false;
                            }

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
        .watch(project_dir.as_path(), RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to start file watcher: {}", e))?;

    // Update state
    {
        let mut st = manager.inner.lock().unwrap();
        st.current_alias = Some(alias.clone());
        st.watcher = Some(watcher);
        st.temp_vite_config = Some(temp_config_path);
        st.temp_svelte_config = created_svelte_config;
        st.project_dir = Some(project_dir);
        st.rebuild_sender = Some(rebuild_tx);
    }

    // Emit initial success to let frontend know dev mode is ready
    manager.app_handle.emit("dev:ready", &alias).ok();

    Ok(())
}

async fn build_dev_bundle(
    manager: &DevServerManager,
    alias: &str,
    project_dir: &Path,
    package_manager: &str,
    bundle_file: &str,
) -> Result<(), String> {
    manager.app_handle.emit("dev:build_started", alias).ok();

    // Choose build command based on detected package manager
    let (cmd, args) = match package_manager {
        "npm" => (
            "npx",
            vec!["--yes", "vite", "build", "--config", "vite.config.mjs"],
        ),
        "deno" => (
            "deno",
            vec![
                "run",
                "--allow-all",
                "npm:vite",
                "build",
                "--config",
                "vite.config.mjs",
            ],
        ),
        "bun" => ("bunx", vec!["vite", "build", "--config", "vite.config.mjs"]),
        _ => (
            "npx",
            vec!["--yes", "vite", "build", "--config", "vite.config.mjs"],
        ),
    };

    // Run build command and capture output
    let output = Command::new(cmd)
        .args(&args)
        .current_dir(project_dir)
        .output()
        .await
        .map_err(|e| format!("Failed to run build command: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        let error_msg = format!("Build failed:\n{}\n{}", stderr, stdout);
        return Err(error_msg);
    }

    // Read built bundle
    let built_path = project_dir.join(".tugboats-dist").join(bundle_file);
    let js_code = tokio::fs::read_to_string(&built_path)
        .await
        .map_err(|e| format!("Failed to read built bundle: {}", e))?;

    // Save to bundles directory
    let home = dirs::home_dir().ok_or("No home directory found")?;
    let bundles_dir = home.join(".tugboats").join("bundles");
    std::fs::create_dir_all(&bundles_dir)
        .map_err(|e| format!("Failed to create bundles dir: {}", e))?;

    let bundle_path = bundles_dir.join(bundle_file);
    std::fs::write(&bundle_path, &js_code).map_err(|e| format!("Failed to write bundle: {}", e))?;

    // Write empty importmap for consistency
    let importmap_stem = bundle_file.strip_suffix(".js").unwrap_or(bundle_file);
    let importmap_path = bundles_dir.join(format!("{}.importmap.json", importmap_stem));
    let empty_map = "{\n  \"imports\": {}\n}";
    std::fs::write(&importmap_path, empty_map)
        .map_err(|e| format!("Failed to write import map: {}", e))?;

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

// Helpers copied/adapted from bundler.rs
#[derive(Debug, Deserialize, Clone, Default)]
struct PackageJson {
    #[serde(default)]
    dependencies: std::collections::HashMap<String, String>,
    #[serde(default)]
    dev_dependencies: std::collections::HashMap<String, String>,
}

async fn ensure_tool(bin: &str, args: &[&str]) -> Result<(), String> {
    let output = Command::new(bin)
        .args(args)
        .output()
        .await
        .map_err(|e| format!("Required tool '{}' not available: {}", bin, e))?;

    if !output.status.success() {
        return Err(format!(
            "Tool '{}' returned non-zero status: {:?}",
            bin,
            output.status.code()
        ));
    }
    Ok(())
}

async fn run(bin: &str, args: &[&str], cwd: Option<&Path>) -> Result<(), String> {
    let mut cmd = Command::new(bin);
    cmd.args(args);
    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }
    let status = cmd
        .status()
        .await
        .map_err(|e| format!("Failed to run '{} {}': {}", bin, args.join(" "), e))?;
    if !status.success() {
        return Err(format!(
            "Command failed ({} {}): {:?}",
            bin,
            args.join(" "),
            status.code()
        ));
    }
    Ok(())
}

async fn read_package_json(project_dir: &Path) -> Result<PackageJson, String> {
    let pkg_path = project_dir.join("package.json");
    let contents = tokio::fs::read_to_string(&pkg_path)
        .await
        .map_err(|e| format!("Failed to read package.json: {}", e))?;
    serde_json::from_str::<PackageJson>(&contents)
        .map_err(|e| format!("Failed to parse package.json: {}", e))
}

fn detect_framework(pkg: &PackageJson) -> Result<String, String> {
    let has = |name: &str| -> bool {
        pkg.dependencies.contains_key(name) || pkg.dev_dependencies.contains_key(name)
    };
    if has("svelte") || has("@sveltejs/kit") || has("@sveltejs/vite-plugin-svelte") {
        return Ok("svelte".to_string());
    }
    if has("react") {
        return Ok("react".to_string());
    }
    Err("Could not detect supported framework (react or svelte)".to_string())
}

fn resolve_tugboats_entry(repo_dir: &Path) -> Option<String> {
    let candidates = [
        "tugboats.ts",
        "tugboats.tsx",
        "tugboats.js",
        "tugboats.jsx",
        // Legacy singular
        "tugboat.ts",
        "tugboat.tsx",
        "tugboat.js",
        "tugboat.jsx",
    ];
    for c in candidates.iter() {
        if repo_dir.join(c).exists() {
            return Some(c.to_string());
        }
    }
    None
}

fn detect_package_manager(project_dir: &Path) -> &'static str {
    match () {
        _ if project_dir.join("package-lock.json").exists() => "npm",
        _ if project_dir.join("deno.lock").exists() => "deno",
        _ if project_dir.join("bun.lock").exists() => "bun",
        _ => "npm", // default fallback
    }
}

#[tauri::command]
pub async fn get_home_dir() -> Result<String, String> {
    let home = dirs::home_dir().ok_or("No home directory found")?;
    Ok(home.to_string_lossy().to_string())
}

fn find_package_json_dir(project_dir: &Path) -> Result<PathBuf, String> {
    let root_pkg = project_dir.join("package.json");
    if root_pkg.exists() {
        return Ok(project_dir.to_path_buf());
    }

    let mut candidates: Vec<PathBuf> = Vec::new();
    let read_dir = std::fs::read_dir(project_dir)
        .map_err(|e| format!("Failed to read directory {}: {}", project_dir.display(), e))?;
    for entry_res in read_dir {
        if let Ok(entry) = entry_res {
            let p = entry.path();
            if p.is_dir() {
                let pkg = p.join("package.json");
                if pkg.exists() {
                    candidates.push(p);
                }
            }
        }
    }

    match candidates.len() {
        0 => Err("No package.json found at repo root or one-level nested".to_string()),
        1 => Ok(candidates.remove(0)),
        _ => Err(
            "Multiple package.json files found one-level nested; please specify the subdirectory"
                .to_string(),
        ),
    }
}

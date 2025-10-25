use notify::{RecursiveMode, Watcher};
use serde::Deserialize;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};
use tokio::sync::mpsc;

use crate::git_url_parser::GitUrl;
use crate::jsrun::{detect_runtime, JSRuntime};
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

    // Detect runtime and ensure tools are available
    let runtime = detect_runtime(&project_dir);
    runtime.ensure_tools_available().await?;

    // Ensure deps installed once
    let node_modules = project_dir.join("node_modules");
    if !node_modules.exists() {
        runtime.install(&project_dir).await?;
    }

    // Read package.json
    let pkg = read_package_json(&project_dir).await?;
    
    // Resolve entry first (needed for framework detection)
    let entry_rel = resolve_tugboats_entry(&project_dir)?;
    
    // Detect framework using entry file and package.json
    let framework = detect_framework(&pkg, &entry_rel);

    // Generate mount wrapper that imports the app and provides mount function
    let mount_wrapper = generate_mount_wrapper(&entry_rel, &framework);
    let mount_wrapper_path = project_dir.join(".tugboats-mount-wrapper.js");
    tokio::fs::write(&mount_wrapper_path, mount_wrapper)
        .await
        .map_err(|e| format!("Failed to write mount wrapper: {}", e))?;

    // Ensure vite and framework plugin present
    runtime.install_dev(&["vite"], &project_dir).await?;
    match framework.as_str() {
        "svelte" => {
            runtime
                .install_dev(&["@sveltejs/vite-plugin-svelte"], &project_dir)
                .await?;
        }
        "react" => {
            runtime
                .install_dev(&["@vitejs/plugin-react"], &project_dir)
                .await?;
        }
        _ => {}
    }

    // Bundle name for dev mode
    let bundle_file = format!("{}-dev.js", alias);

    // Write temporary vite.config.mjs for build - use mount wrapper as entry
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
      entry: './.tugboats-mount-wrapper.js',
      formats: ['es'],
      fileName: () => '{bundle_file}'
    }},
    rollupOptions: {{
      external: ['@tugboats/core']
    }}
  }}
}};
"#,
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
      entry: './.tugboats-mount-wrapper.js',
      formats: ['es'],
      fileName: () => '{bundle_file}'
    }},
    rollupOptions: {{
      external: ['@tugboats/core']
    }}
  }}
}};
"#,
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
    build_dev_bundle(&manager, &alias, &project_dir, &runtime, &bundle_file).await?;

    // Set up file watcher for JIT builds with channel-based communication
    let (rebuild_tx, mut rebuild_rx) = mpsc::unbounded_channel();

    // Clone data for the background rebuild task
    let app_handle_clone = manager.app_handle.clone();
    let alias_clone = alias.clone();
    let project_dir_clone = project_dir.clone();
    let runtime_clone = runtime;
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
                &runtime_clone,
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
    runtime: &JSRuntime,
    bundle_file: &str,
) -> Result<(), String> {
    manager.app_handle.emit("dev:build_started", alias).ok();

    // Run build command using runtime abstraction
    runtime
        .build(&["vite", "build", "--config", "vite.config.mjs"], project_dir)
        .await?;

    // Read built bundle
    let built_path = project_dir.join(".tugboats-dist").join(bundle_file);
    let js_code = tokio::fs::read_to_string(&built_path)
        .await
        .map_err(|e| format!("Failed to read built bundle: {}", e))?;

    // Read package.json for framework detection and import map generation
    let pkg = read_package_json(project_dir).await?;
    let entry_rel = resolve_tugboats_entry(project_dir)?;
    let framework = detect_framework(&pkg, &entry_rel);
    let importmap = generate_importmap(&pkg, &framework);
    let mount_utils = generate_mount_utils(&pkg, &framework);

    // Save to bundles directory
    let home = dirs::home_dir().ok_or("No home directory found")?;
    let bundles_dir = home.join(".tugboats").join("bundles");
    std::fs::create_dir_all(&bundles_dir)
        .map_err(|e| format!("Failed to create bundles dir: {}", e))?;

    let bundle_path = bundles_dir.join(bundle_file);
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
        "framework": framework,
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

// Helpers copied/adapted from bundler.rs
#[derive(Debug, Deserialize, Clone, Default)]
struct TugboatConfig {
    framework: Option<String>,
}

#[derive(Debug, Deserialize, Clone, Default)]
struct PackageJson {
    #[serde(default)]
    dependencies: std::collections::HashMap<String, String>,
    #[serde(default)]
    dev_dependencies: std::collections::HashMap<String, String>,
    #[serde(default)]
    tugboat: Option<TugboatConfig>,
}


async fn read_package_json(project_dir: &Path) -> Result<PackageJson, String> {
    let pkg_path = project_dir.join("package.json");
    let contents = tokio::fs::read_to_string(&pkg_path)
        .await
        .map_err(|e| format!("Failed to read package.json: {}", e))?;
    serde_json::from_str::<PackageJson>(&contents)
        .map_err(|e| format!("Failed to parse package.json: {}", e))
}

fn detect_framework(pkg: &PackageJson, entry_file: &str) -> String {
    // 1. Explicit config takes priority
    if let Some(config) = &pkg.tugboat {
        if let Some(framework) = &config.framework {
            return framework.clone();
        }
    }
    
    // 2. Filename convention (100% certain for Svelte)
    if entry_file.ends_with(".svelte") {
        return "svelte".to_string();
    }
    
    // 3. Dependency inspection (priority order)
    let has = |name: &str| -> bool {
        pkg.dependencies.contains_key(name) || pkg.dev_dependencies.contains_key(name)
    };
    
    let framework_deps = [
        ("svelte", "svelte"),
        ("react", "react"),
        ("preact", "preact"),
        ("solid-js", "solidjs"),
        ("vue", "vue"),
    ];
    
    for (dep_name, framework_name) in &framework_deps {
        if has(dep_name) {
            return framework_name.to_string();
        }
    }
    
    // 4. Default to React
    "react".to_string()
}

fn resolve_tugboats_entry(repo_dir: &Path) -> Result<String, String> {
    // Only support new simplified patterns
    let candidates = vec![
        // React & other frameworks
        "app.tsx", "app.jsx", "app.ts", "app.js",
        "src/app.tsx", "src/app.jsx", "src/app.ts", "src/app.js",
        // Svelte
        "App.svelte", "app.svelte",
        "src/App.svelte", "src/app.svelte",
    ];
    
    for candidate in candidates {
        if repo_dir.join(candidate).exists() {
            return Ok(candidate.to_string());
        }
    }
    
    // If nothing found, provide clear error
    Err(
        "❌ No entry point found. Expected one of:\n  \
         - app.tsx, app.jsx, app.ts, app.js (React or other frameworks)\n  \
         - App.svelte, app.svelte (Svelte)\n\n  \
         Place your app file at the root or in src/ directory.".to_string()
    )
}

fn generate_mount_wrapper(entry_rel: &str, framework: &str) -> String {
    // Generate a wrapper that imports the app component and exports a mount function
    match framework {
        "react" => format!(r#"
import {{ createRoot }} from 'react-dom/client';
import {{ createElement }} from 'react';
import App from './{}';

export function mountComponent(slot) {{
  const root = createRoot(slot);
  root.render(createElement(App));
  return () => root.unmount();
}}

// Also export default for new pattern
export default App;
"#, entry_rel),
        "preact" => format!(r#"
import {{ render }} from 'preact';
import {{ createElement }} from 'preact';
import App from './{}';

export function mountComponent(slot) {{
  render(createElement(App), slot);
  return () => render(null, slot);
}}

// Also export default for new pattern
export default App;
"#, entry_rel),
        "svelte" => format!(r#"
import {{ mount, unmount }} from 'svelte';
import App from './{}';

export function mountComponent(slot) {{
  const instance = mount(App, {{ target: slot }});
  return () => unmount(instance);
}}

// Also export default for new pattern
export default App;
"#, entry_rel),
        "solidjs" => format!(r#"
import {{ render }} from 'solid-js/web';
import App from './{}';

export function mountComponent(slot) {{
  const dispose = render(() => App({{}}), slot);
  return () => dispose();
}}

// Also export default for new pattern
export default App;
"#, entry_rel),
        "vue" => format!(r#"
import {{ createApp }} from 'vue';
import App from './{}';

export function mountComponent(slot) {{
  const app = createApp(App);
  app.mount(slot);
  return () => app.unmount();
}}

// Also export default for new pattern
export default App;
"#, entry_rel),
        _ => format!(r#"
import App from './{}';

export function mountComponent(slot) {{
  console.warn('Unknown framework, attempting basic mount');
  if (typeof App === 'function') {{
    const el = App();
    if (el && typeof el === 'object' && 'render' in el) {{
      slot.appendChild(el.render());
    }}
  }}
  return () => {{ slot.innerHTML = ''; }};
}}

// Also export default for new pattern
export default App;
"#, entry_rel),
    }
}

fn get_package_version(pkg: &PackageJson, package_name: &str) -> Option<String> {
    pkg.dependencies.get(package_name)
        .or_else(|| pkg.dev_dependencies.get(package_name))
        .map(|v| v.clone())
}

fn generate_importmap(pkg: &PackageJson, framework: &str) -> serde_json::Value {
    let mut imports = serde_json::Map::new();
    
    // Map framework to its ESM import paths using actual versions from package.json
    match framework {
        "react" => {
            if let Some(react_version) = get_package_version(pkg, "react") {
                imports.insert("react".to_string(), 
                    serde_json::json!(format!("https://esm.sh/react@{}", react_version)));
            }
            if let Some(react_dom_version) = get_package_version(pkg, "react-dom") {
                imports.insert("react-dom".to_string(), 
                    serde_json::json!(format!("https://esm.sh/react-dom@{}", react_dom_version)));
                imports.insert("react-dom/client".to_string(), 
                    serde_json::json!(format!("https://esm.sh/react-dom@{}/client", react_dom_version)));
            }
        },
        "svelte" => {
            if let Some(svelte_version) = get_package_version(pkg, "svelte") {
                imports.insert("svelte".to_string(), 
                    serde_json::json!(format!("https://esm.sh/svelte@{}", svelte_version)));
            }
        },
        "preact" => {
            if let Some(preact_version) = get_package_version(pkg, "preact") {
                imports.insert("preact".to_string(), 
                    serde_json::json!(format!("https://esm.sh/preact@{}", preact_version)));
                imports.insert("preact/compat".to_string(), 
                    serde_json::json!(format!("https://esm.sh/preact@{}/compat", preact_version)));
            }
        },
        "solidjs" => {
            if let Some(solid_version) = get_package_version(pkg, "solid-js") {
                imports.insert("solid-js".to_string(), 
                    serde_json::json!(format!("https://esm.sh/solid-js@{}", solid_version)));
                imports.insert("solid-js/web".to_string(), 
                    serde_json::json!(format!("https://esm.sh/solid-js@{}/web", solid_version)));
            }
        },
        "vue" => {
            if let Some(vue_version) = get_package_version(pkg, "vue") {
                imports.insert("vue".to_string(), 
                    serde_json::json!(format!("https://esm.sh/vue@{}", vue_version)));
            }
        },
        _ => {}
    }
    
    // Always map @tugboats/core
    imports.insert("@tugboats/core".to_string(), 
        serde_json::json!("/assets/core/mod.js"));
    
    serde_json::json!({ "imports": imports })
}

fn generate_mount_utils(pkg: &PackageJson, framework: &str) -> String {
    // Generate framework-specific mount utilities with full CDN URLs
    match framework {
        "react" => {
            let react_version = get_package_version(pkg, "react").unwrap_or("19".to_string());
            let react_dom_version = get_package_version(pkg, "react-dom").unwrap_or(react_version.clone());
            format!(r#"
import {{ createRoot }} from 'https://esm.sh/react-dom@{}/client';
import {{ createElement }} from 'https://esm.sh/react@{}';

export function mountComponent(Component, slot) {{
  const root = createRoot(slot);
  root.render(createElement(Component));
  return () => root.unmount();
}}
"#, react_dom_version, react_version)
        },
        "preact" => {
            let preact_version = get_package_version(pkg, "preact").unwrap_or("10.19.0".to_string());
            format!(r#"
import {{ render }} from 'https://esm.sh/preact@{}';
import {{ createElement }} from 'https://esm.sh/preact@{}';

export function mountComponent(Component, slot) {{
  render(createElement(Component), slot);
  return () => render(null, slot);
}}
"#, preact_version, preact_version)
        },
        "svelte" => {
            let svelte_version = get_package_version(pkg, "svelte").unwrap_or("5.0.0".to_string());
            format!(r#"
import {{ mount, unmount }} from 'https://esm.sh/svelte@{}';

export function mountComponent(Component, slot) {{
  const instance = mount(Component, {{ target: slot }});
  return () => unmount(instance);
}}
"#, svelte_version)
        },
        "solidjs" => {
            let solid_version = get_package_version(pkg, "solid-js").unwrap_or("1.9.0".to_string());
            format!(r#"
import {{ render }} from 'https://esm.sh/solid-js@{}/web';

export function mountComponent(Component, slot) {{
  const dispose = render(() => Component({{}}, slot));
  return () => dispose();
}}
"#, solid_version)
        },
        "vue" => {
            let vue_version = get_package_version(pkg, "vue").unwrap_or("3.4.0".to_string());
            format!(r#"
import {{ createApp }} from 'https://esm.sh/vue@{}';

export function mountComponent(Component, slot) {{
  const app = createApp(Component);
  app.mount(slot);
  return () => app.unmount();
}}
"#, vue_version)
        },
        _ => {
            // Fallback for unknown frameworks
            r#"
export function mountComponent(Component, slot) {
  console.warn('Unknown framework, attempting basic mount');
  if (typeof Component === 'function') {
    const el = Component();
    if (el && typeof el === 'object' && 'render' in el) {
      slot.appendChild(el.render());
    }
  }
  return () => { slot.innerHTML = ''; };
}
"#.to_string()
        }
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

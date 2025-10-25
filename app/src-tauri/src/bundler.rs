use crate::git_url_parser::GitUrl;
use crate::jsrun::detect_runtime;
use serde::Deserialize;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tauri::Emitter;
use tokio::io::AsyncReadExt;

#[derive(Debug, Deserialize, Clone, Default)]
pub struct TugboatConfig {
    pub framework: Option<String>,
}

#[derive(Debug, Deserialize, Clone, Default)]
pub struct PackageJson {
    #[serde(default)]
    pub dependencies: HashMap<String, String>,
    #[serde(default)]
    pub dev_dependencies: HashMap<String, String>,
    #[serde(default)]
    pub tugboat: Option<TugboatConfig>,
}

#[tauri::command]
pub async fn bundle_app(
    app_dir: String,
    alias: String,
    github_url: Option<String>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let app_dir = resolve_tilde(&app_dir)?;

    emit(
        &app,
        format!(
            "🚧 Preparing to bundle app '{}' in {}",
            alias,
            app_dir.display()
        ),
    );

    // Determine project directory (where package.json lives)
    // Prefer a subdirectory derived from github_url if provided
    let hinted_dir: PathBuf = if let Some(url) = github_url.clone() {
        match GitUrl::parse_https(&url) {
            Ok(parsed) => {
                if let Some(sub) = parsed.subpath() {
                    app_dir.join(sub)
                } else {
                    app_dir.clone()
                }
            }
            Err(_) => app_dir.clone(),
        }
    } else {
        app_dir.clone()
    };

    let project_dir = if hinted_dir.join("package.json").exists() {
        hinted_dir
    } else {
        // Fallback to legacy discovery (root or one-level nested)
        find_package_json_dir(&app_dir)?
    };

    emit(
        &app,
        format!("📦 package.json found at {}", project_dir.display()),
    );

    // Detect runtime and ensure it's available
    let runtime = detect_runtime(&project_dir);
    runtime.ensure_tools_available().await?;

    // Install deps (first build only). If node_modules exists, skip install to avoid
    // unnecessary churn that would retrigger the file watcher.
    let node_modules = project_dir.join("node_modules");
    if !node_modules.exists() {
        runtime.install(&project_dir).await?;
    } else {
        emit(
            &app,
            format!("⏭️  Skipping install (node_modules present)"),
        );
    }

    // Load package.json
    let pkg = read_package_json(&project_dir).await?;
    
    // Resolve entry first (needed for framework detection)
    let entry_rel = resolve_entry(&project_dir)?;
    emit(&app, format!("🧭 Using entry: {}", &entry_rel));
    
    // Detect framework using entry file and package.json
    let framework = detect_framework(&pkg, &entry_rel);
    emit(
        &app,
        format!("🔎 Detected framework: {}", framework.as_str()),
    );

    // Generate mount wrapper that imports the app and provides mount function
    let mount_wrapper = generate_mount_wrapper(&entry_rel, &framework);
    let mount_wrapper_path = project_dir.join(".tugboats-mount-wrapper.js");
    tokio::fs::write(&mount_wrapper_path, mount_wrapper)
        .await
        .map_err(|e| format!("Failed to write mount wrapper: {}", e))?;
    emit(&app, "🔧 Generated mount wrapper".to_string());

    // Ensure vite and plugin dev deps
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

    // Possibly ensure a minimal svelte.config.mjs
    let mut created_svelte_config = false;
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
            created_svelte_config = true;
            emit(&app, "🧩 Wrote minimal svelte.config.mjs".to_string());
        }
    }

    // Compute timestamped bundle filename using the provided alias
    let timestamp = match std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH) {
        Ok(dur) => dur.as_secs(),
        Err(_) => 0,
    };
    let bundle_file = format!("{}-{}.js", alias, timestamp);

    // Write temporary vite.config.mjs - use mount wrapper as entry
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
        other => return Err(format!("Unsupported framework for bundling: {}", other)),
    };

    let temp_config_path = project_dir.join("vite.config.mjs");
    tokio::fs::write(&temp_config_path, vite_config)
        .await
        .map_err(|e| format!("Failed to write vite.config.mjs: {}", e))?;
    emit(&app, "⚙️ Wrote temporary vite.config.mjs".to_string());

    // Run vite build
    runtime
        .build(&["vite", "build", "--config", "vite.config.mjs"], &project_dir)
        .await?;

    // Clean up vite config, mount wrapper, and optional svelte config
    let _ = tokio::fs::remove_file(&temp_config_path).await;
    let _ = tokio::fs::remove_file(&mount_wrapper_path).await;
    if created_svelte_config {
        let _ = tokio::fs::remove_file(project_dir.join("svelte.config.mjs")).await;
    }

    // Read built bundle
    let built = project_dir.join(".tugboats-dist").join(&bundle_file);
    let mut f = tokio::fs::File::open(&built)
        .await
        .map_err(|e| format!("Failed to read built bundle: {}", e))?;
    let mut js_code = String::new();
    f.read_to_string(&mut js_code)
        .await
        .map_err(|e| format!("Failed to read bundle content: {}", e))?;

    // Generate import map and mount utils for this app
    let importmap = generate_importmap(&pkg, &framework);
    let mount_utils = generate_mount_utils(&pkg, &framework);
    
    // Save artifacts under ~/.tugboats/bundles
    let bundle_path = save_bundle_artifacts(&alias, timestamp, &framework, &bundle_file, &js_code, &importmap, &mount_utils)?;

    emit(&app, format!("🎉 Bundle saved: {}", bundle_path.display()));

    Ok(bundle_path.to_string_lossy().to_string())
}

fn emit(app: &tauri::AppHandle, msg: String) {
    let _ = app.emit("tugboats://clone-progress", &msg);
}

fn resolve_tilde(p: &str) -> Result<PathBuf, String> {
    if p == "~" {
        return dirs::home_dir().ok_or("No home directory found".to_string());
    }
    if let Some(stripped) = p.strip_prefix("~/") {
        let home = dirs::home_dir().ok_or("No home directory found".to_string())?;
        return Ok(home.join(stripped));
    }
    Ok(PathBuf::from(p))
}


fn find_package_json_dir(project_dir: &Path) -> Result<PathBuf, String> {
    let root_pkg = project_dir.join("package.json");
    if root_pkg.exists() {
        return Ok(project_dir.to_path_buf());
    }

    // search one level down
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

async fn read_package_json(project_dir: &Path) -> Result<PackageJson, String> {
    let pkg_path = project_dir.join("package.json");
    let contents = tokio::fs::read_to_string(&pkg_path)
        .await
        .map_err(|e| format!("Failed to read package.json: {}", e))?;
    let pkg: PackageJson = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse package.json: {}", e))?;
    Ok(pkg)
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

fn resolve_entry(repo_dir: &Path) -> Result<String, String> {
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

fn generate_mount_utils(pkg: &PackageJson, framework: &str) -> String {
    // Generate framework-specific mount utilities with full CDN URLs
    match framework {
        "react" => {
            let react_version = get_package_version(pkg, "react").unwrap_or(
"19".to_string());
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

#[tauri::command]
pub async fn latest_bundle_for_alias(alias: String) -> Result<String, String> {
    let home = dirs::home_dir().ok_or("No home directory found")?;
    let bundles_dir = home.join(".tugboats").join("bundles");
    if !bundles_dir.exists() {
        return Err("Bundles directory does not exist".to_string());
    }

    let mut best_path: Option<PathBuf> = None;
    let mut best_ts: u64 = 0;

    let read_dir = std::fs::read_dir(&bundles_dir)
        .map_err(|e| format!("Failed to read bundles dir: {}", e))?;
    for entry in read_dir {
        if let Ok(e) = entry {
            let p = e.path();
            if let Some(name) = p.file_name().and_then(|s| s.to_str()) {
                // Match format: <alias>-<timestamp>.js
                if name.starts_with(&format!("{}-", alias)) && name.ends_with(".js") {
                    let ts_part = name
                        .trim_start_matches(&format!("{}-", alias))
                        .trim_end_matches(".js");
                    if let Ok(ts) = ts_part.parse::<u64>() {
                        if ts > best_ts {
                            best_ts = ts;
                            best_path = Some(p.clone());
                        }
                    }
                }
            }
        }
    }

    match best_path {
        Some(p) => Ok(p.to_string_lossy().to_string()),
        None => Err("No bundle found for alias".to_string()),
    }
}

#[tauri::command]
pub async fn read_text_file(path: String) -> Result<String, String> {
    let content = tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;
    Ok(content)
}

#[tauri::command]
pub async fn read_bundle_metadata(alias: String) -> Result<serde_json::Value, String> {
    let home = dirs::home_dir().ok_or("No home directory found")?;
    let bundles_dir = home.join(".tugboats").join("bundles");
    
    if !bundles_dir.exists() {
        return Err("Bundles directory does not exist".to_string());
    }
    
    // Find latest metadata file for alias
    let mut best_path: Option<PathBuf> = None;
    let mut best_ts: u64 = 0;
    
    let read_dir = std::fs::read_dir(&bundles_dir)
        .map_err(|e| format!("Failed to read bundles dir: {}", e))?;
    for entry in read_dir {
        if let Ok(e) = entry {
            let p = e.path();
            if let Some(name) = p.file_name().and_then(|s| s.to_str()) {
                // Match format: <alias>-<timestamp>.meta.json
                if name.starts_with(&format!("{}-", alias)) && name.ends_with(".meta.json") {
                    let ts_part = name
                        .trim_start_matches(&format!("{}-", alias))
                        .trim_end_matches(".meta.json");
                    if let Ok(ts) = ts_part.parse::<u64>() {
                        if ts > best_ts {
                            best_ts = ts;
                            best_path = Some(p.clone());
                        }
                    }
                }
            }
        }
    }
    
    match best_path {
        Some(p) => {
            let content = tokio::fs::read_to_string(&p)
                .await
                .map_err(|e| format!("Failed to read metadata file: {}", e))?;
            let metadata: serde_json::Value = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse metadata: {}", e))?;
            Ok(metadata)
        }
        None => Err("No metadata found for alias".to_string()),
    }
}

fn save_bundle_artifacts(
    alias: &str,
    timestamp: u64,
    framework: &str,
    file_name: &str,
    js_code: &str,
    importmap: &serde_json::Value,
    mount_utils: &str,
) -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("No home directory found")?;
    let bundles_dir = home.join(".tugboats").join("bundles");
    std::fs::create_dir_all(&bundles_dir)
        .map_err(|e| format!("Failed to create bundles dir: {}", e))?;

    let bundle_path = bundles_dir.join(file_name);
    std::fs::write(&bundle_path, js_code).map_err(|e| format!("Failed to write bundle: {}", e))?;

    // Save mount utils (framework-specific mounting code)
    let mount_utils_file = format!("{}-{}.mount-utils.js", alias, timestamp);
    let mount_utils_path = bundles_dir.join(&mount_utils_file);
    std::fs::write(&mount_utils_path, mount_utils)
        .map_err(|e| format!("Failed to write mount utils: {}", e))?;

    // Save metadata with import map and mount utils path
    let meta_file = format!("{}-{}.meta.json", alias, timestamp);
    let meta_path = bundles_dir.join(&meta_file);
    
    let metadata = serde_json::json!({
        "framework": framework,
        "alias": alias,
        "timestamp": timestamp,
        "importmap": importmap,
        "mount_utils_path": mount_utils_path.to_string_lossy().to_string()
    });
    
    std::fs::write(&meta_path, serde_json::to_string_pretty(&metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?)
        .map_err(|e| format!("Failed to write metadata: {}", e))?;

    Ok(bundle_path)
}

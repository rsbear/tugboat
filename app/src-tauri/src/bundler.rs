use crate::git_url_parser::GitUrl;
use crate::jsrun::detect_runtime;
use serde::Deserialize;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tauri::Emitter;
use tokio::io::AsyncReadExt;

#[derive(Debug, Deserialize, Clone, Default)]
pub struct PackageJson {
    #[serde(default)]
    pub dependencies: HashMap<String, String>,
    #[serde(default)]
    pub dev_dependencies: HashMap<String, String>,
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

    // Load package.json for framework detection
    let pkg = read_package_json(&project_dir).await?;
    let framework = detect_framework(&pkg)?;
    emit(
        &app,
        format!("🔎 Detected framework: {}", framework.as_str()),
    );

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

    // Resolve entry
    let entry_rel = resolve_entry(&project_dir).ok_or_else(|| {
        "No tugboats.ts or tugboats.tsx entrypoint found (tried root and src/)".to_string()
    })?;
    emit(&app, format!("🧭 Using entry: {}", &entry_rel));

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

    // Write temporary vite.config.mjs
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

    // Clean up vite config and optional svelte config
    let _ = tokio::fs::remove_file(&temp_config_path).await;
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

    // Save artifacts under ~/.tugboats/bundles
    let bundle_path = save_bundle_artifacts(&bundle_file, &js_code)?;

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

fn resolve_entry(repo_dir: &Path) -> Option<String> {
    // Support Harbor-style and Tugboats-style entrypoints at root or in src/
    let candidates = [
        "harbor.ts",
        "harbor.tsx",
        "src/harbor.ts",
        "src/harbor.tsx",
        "tugboats.ts",
        "tugboats.tsx",
        "src/tugboats.ts",
        "src/tugboats.tsx",
    ];
    for c in candidates.iter() {
        if repo_dir.join(c).exists() {
            return Some(c.to_string());
        }
    }
    None
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

fn save_bundle_artifacts(file_name: &str, js_code: &str) -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("No home directory found")?;
    let bundles_dir = home.join(".tugboats").join("bundles");
    std::fs::create_dir_all(&bundles_dir)
        .map_err(|e| format!("Failed to create bundles dir: {}", e))?;

    let bundle_path = bundles_dir.join(file_name);
    std::fs::write(&bundle_path, js_code).map_err(|e| format!("Failed to write bundle: {}", e))?;

    // Minimal importmap (externalize only @tugboats/core mapping left to host import maps);
    // write an empty map for now.
    let importmap_stem = if let Some(stripped) = file_name.strip_suffix(".js") {
        stripped.to_string()
    } else {
        file_name.to_string()
    };
    let importmap_path = bundles_dir.join(format!("{}.importmap.json", importmap_stem));
    let empty_map = "{\n  \"imports\": {}\n}";
    std::fs::write(&importmap_path, empty_map)
        .map_err(|e| format!("Failed to write import map: {}", e))?;

    Ok(bundle_path)
}

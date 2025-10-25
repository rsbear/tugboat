use crate::git_url_parser::GitUrl;
use crate::js_app_bases::{detect_app_base, utils::resolve_tilde};
use std::path::{Path, PathBuf};
use tauri::Emitter;
use tokio::io::AsyncReadExt;

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

    // Determine project directory (with subpath hint from github_url if provided)
    let project_dir = resolve_project_dir(&app_dir, github_url)?;

    emit(
        &app,
        format!("📦 Project directory: {}", project_dir.display()),
    );

    // Detect which app base can handle this project
    let app_base = detect_app_base(&project_dir)?;
    emit(&app, "🔍 Detected app type".to_string());

    // Validate tools are available
    app_base.validate().await?;
    emit(&app, "✅ Tools validated".to_string());

    // Prepare build context
    let ctx = app_base.prepare_build(&alias, false).await?;
    emit(
        &app,
        format!("🧭 Entry: {}, Framework: {}", ctx.entry_rel, ctx.framework),
    );

    // Run build
    emit(&app, "🔨 Building...".to_string());
    app_base.build(&ctx).await?;

    // Read built bundle
    let built = ctx.project_dir.join(".tugboats-dist").join(&ctx.bundle_file);
    let mut f = tokio::fs::File::open(&built)
        .await
        .map_err(|e| format!("Failed to read built bundle: {}", e))?;
    let mut js_code = String::new();
    f.read_to_string(&mut js_code)
        .await
        .map_err(|e| format!("Failed to read bundle content: {}", e))?;

    // Generate import map and mount utils
    let importmap = app_base.generate_importmap();
    let mount_utils = app_base.generate_mount_utils();

    // Extract timestamp from bundle filename (format: alias-timestamp.js)
    let timestamp = ctx
        .bundle_file
        .trim_start_matches(&format!("{}-", alias))
        .trim_end_matches(".js")
        .parse::<u64>()
        .unwrap_or(0);

    // Save artifacts under ~/.tugboats/bundles
    let bundle_path = save_bundle_artifacts(
        &alias,
        timestamp,
        &ctx.framework,
        &ctx.bundle_file,
        &js_code,
        &importmap,
        &mount_utils,
    )?;

    // Cleanup temporary files
    app_base.cleanup(&ctx).await?;

    emit(&app, format!("🎉 Bundle saved: {}", bundle_path.display()));

    Ok(bundle_path.to_string_lossy().to_string())
}

fn emit(app: &tauri::AppHandle, msg: String) {
    let _ = app.emit("tugboats://clone-progress", &msg);
}

/// Resolve project directory with optional subpath hint from github_url
fn resolve_project_dir(app_dir: &Path, github_url: Option<String>) -> Result<PathBuf, String> {
    use crate::js_app_bases::utils::find_config_file;

    // Prefer subdirectory derived from github_url if provided
    let hinted_dir: PathBuf = if let Some(url) = github_url {
        match GitUrl::parse_https(&url) {
            Ok(parsed) => {
                if let Some(sub) = parsed.subpath() {
                    app_dir.join(sub)
                } else {
                    app_dir.to_path_buf()
                }
            }
            Err(_) => app_dir.to_path_buf(),
        }
    } else {
        app_dir.to_path_buf()
    };

    // Check if this is the project directory (has package.json or other config)
    if find_config_file(&hinted_dir, &["package.json", "deno.json", "deno.jsonc"]).is_some() {
        return Ok(hinted_dir);
    }

    // Otherwise use the original app_dir
    Ok(app_dir.to_path_buf())
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

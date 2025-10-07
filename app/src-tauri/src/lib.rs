use tauri::Emitter;
use tauri_plugin_fs::FsExt;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

pub mod kv;
pub mod bundler;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn clone_repo(
    github_url: String,
    dir_path: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    // Resolve ~ to home directory
    let resolved_path = if dir_path.starts_with("~/") {
        let home = dirs::home_dir().ok_or("Could not find home directory")?;
        home.join(&dir_path[2..])
    } else if dir_path == "~" {
        dirs::home_dir().ok_or("Could not find home directory")?
    } else {
        std::path::PathBuf::from(&dir_path)
    };

    // Extract repository name from GitHub URL for directory naming
    let repo_name = extract_repo_name(&github_url)?;

    // Determine final target directory
    let target_dir = if resolved_path.ends_with("tugboat_apps") {
        resolved_path.join(&repo_name)
    } else {
        resolved_path
    };

    // Check if repository already exists (look for .git directory)
    if target_dir.join(".git").exists() {
        let message = format!("✅ Repository already exists at: {}", target_dir.display());
        let _ = app.emit("tugboats://clone-progress", &message);
        return Ok(());
    }

    // Create parent directory if it doesn't exist
    if let Some(parent) = target_dir.parent() {
        let _ = app.emit(
            "tugboats://clone-progress",
            &format!("📁 Creating directory: {}", parent.display()),
        );
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("❌ Failed to create directory {}: {}", parent.display(), e))?;
    }

    // Run git clone
    run_git_clone(github_url, target_dir.to_string_lossy().to_string(), app).await
}

fn extract_repo_name(github_url: &str) -> Result<String, String> {
    // Handle various GitHub URL formats:
    // https://github.com/user/repo
    // https://github.com/user/repo.git
    // https://github.com/user/repo/tree/branch/path
    // git@github.com:user/repo.git

    let url = github_url.trim_end_matches('/');

    if url.starts_with("git@github.com:") {
        // SSH format: git@github.com:user/repo.git
        let path_part = url.strip_prefix("git@github.com:").unwrap();
        let repo_part = path_part.split('/').nth(1).unwrap_or("");
        let repo_name = repo_part.strip_suffix(".git").unwrap_or(repo_part);
        if repo_name.is_empty() {
            return Err("Could not extract repository name from SSH URL".to_string());
        }
        return Ok(repo_name.to_string());
    }

    if url.starts_with("https://github.com/") {
        // HTTPS format: https://github.com/user/repo or https://github.com/user/repo/tree/branch/path
        let path_part = url.strip_prefix("https://github.com/").unwrap();
        let parts: Vec<&str> = path_part.split('/').collect();
        if parts.len() >= 2 {
            let repo_part = parts[1];
            let repo_name = repo_part.strip_suffix(".git").unwrap_or(repo_part);
            return Ok(repo_name.to_string());
        }
    }

    Err("Unsupported GitHub URL format".to_string())
}

async fn run_git_clone(
    github_url: String,
    target_dir: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let message = format!("🔄 Starting clone of {} to {}", github_url, target_dir);
    let _ = app.emit("tugboats://clone-progress", &message);

    // Check if git is available
    if let Err(_) = Command::new("git").arg("--version").output().await {
        let error_msg = "❌ Git is not installed or not available in PATH".to_string();
        let _ = app.emit("tugboats://clone-progress", &error_msg);
        return Err(error_msg);
    }

    let mut cmd = Command::new("git")
        .arg("clone")
        .arg(&github_url)
        .arg(&target_dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| {
            let error_msg = format!("❌ Failed to start git clone: {}", e);
            let _ = app.emit("tugboats://clone-progress", &error_msg);
            error_msg
        })?;

    // Handle stdout
    if let Some(stdout) = cmd.stdout.take() {
        let mut reader = BufReader::new(stdout).lines();
        let app_clone = app.clone();
        tokio::spawn(async move {
            while let Ok(Some(line)) = reader.next_line().await {
                if !line.trim().is_empty() {
                    let _ = app_clone.emit("tugboats://clone-progress", &format!("📥 {}", line));
                }
            }
        });
    }

    // Handle stderr
    if let Some(stderr) = cmd.stderr.take() {
        let mut reader = BufReader::new(stderr).lines();
        let app_clone = app.clone();
        tokio::spawn(async move {
            while let Ok(Some(line)) = reader.next_line().await {
                if !line.trim().is_empty() {
                    let _ = app_clone.emit("tugboats://clone-progress", &format!("⚠️ {}", line));
                }
            }
        });
    }

    let status = cmd
        .wait()
        .await
        .map_err(|e| format!("Git clone process failed: {}", e))?;

    if status.success() {
        let message = format!("✅ Successfully cloned {} to {}", github_url, target_dir);
        let _ = app.emit("tugboats://clone-progress", &message);
        Ok(())
    } else {
        let error_msg = format!(
            "❌ Git clone failed with exit code: {:?} for repository: {}",
            status.code(),
            github_url
        );
        let _ = app.emit("tugboats://clone-progress", &error_msg);
        Err(error_msg)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            clone_repo,
            bundler::bundle_app,
            bundler::latest_bundle_for_alias,
            bundler::read_text_file,
            // --- KV Commands ---
            kv::kv_factory_reset,
            kv::kv_get,
            kv::kv_set,
            kv::kv_list,
            kv::kv_delete,
            kv::kv_search,
            kv::kv_tables,
        ])
        .setup(move |app| {
            // Initialize KV database in background
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = kv::initialize_kv_db(&app_handle).await {
                    eprintln!("Failed to initialize KV database: {}", e);
                }
            });

            // Use ~/.tugboats as the custom data directory
            let home = dirs::home_dir().expect("No home directory found");
            let tugboats_dir = home.join(".tugboats");
            std::fs::create_dir_all(&tugboats_dir).expect("Failed to create ~/.tugboats directory");

            // Allow Tauri FS scope to serve files from ~/.tugboats
            app.fs_scope().allow_directory(&tugboats_dir, true)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

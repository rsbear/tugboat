use crate::git_url_parser::GitUrl;
use tauri::{Emitter, Manager};
use tauri_nspanel::ManagerExt;
use tauri_plugin_fs::FsExt;
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use window::WebviewWindowExt;

pub mod bundler;
pub mod commands;
pub mod devserver;
pub mod git_url_parser;
pub mod js_app_bases;
pub mod jsrun;
pub mod kv;
pub mod encryptions;
pub mod window;

pub const SPOTLIGHT_LABEL: &str = "main";

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn parse_github_url(github_url: String) -> Result<serde_json::Value, String> {
    let parsed = GitUrl::parse_https(&github_url)?;
    let obj = serde_json::json!({
        "owner": parsed.owner(),
        "repo": parsed.repo(),
        "branch": parsed.branch(),
        "subpath": parsed.subpath(),
        "https_base_url": parsed.https_base_url(),
        "ssh_url": parsed.ssh_url(),
    });
    Ok(obj)
}

#[tauri::command]
async fn clone_repo(
    github_url: String,
    dir_path: String,
    #[allow(non_snake_case)] gitProtocol: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    // Parse the GitHub URL (HTTPS forms)
    let parsed = GitUrl::parse_https(&github_url)?;

    // Choose clone URL based on explicit protocol argument
    let proto = gitProtocol.to_lowercase();
    let clone_url = if proto == "ssh" {
        parsed.ssh_url()
    } else {
        parsed.https_base_url()
    };

    // Resolve ~ to home directory
    let resolved_path = if dir_path.starts_with("~/") {
        let home = dirs::home_dir().ok_or("Could not find home directory")?;
        home.join(&dir_path[2..])
    } else if dir_path == "~" {
        dirs::home_dir().ok_or("Could not find home directory")?
    } else {
        std::path::PathBuf::from(&dir_path)
    };

    // If the path is a tugboat_apps directory, put the clone in a subdir named after the repo
    let target_dir = if resolved_path.file_name().and_then(|n| n.to_str()) == Some("tugboat_apps") {
        resolved_path.join(parsed.repo())
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

    // Run git clone using the computed clone URL
    run_git_clone(clone_url, target_dir.to_string_lossy().to_string(), app).await
}

#[tauri::command]
async fn clone_app(
    github_url: String,
    git_protocol: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    // Parse the GitHub URL (HTTPS forms)
    let parsed = GitUrl::parse_https(&github_url)?;

    // Choose clone URL based on explicit protocol argument
    let proto = git_protocol.to_lowercase();
    let clone_url = if proto == "ssh" {
        parsed.ssh_url()
    } else {
        parsed.https_base_url()
    };

    // Always clone into ~/.tugboats/tmp/<repo>
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let base_tmp = home.join(".tugboats").join("tmp");
    std::fs::create_dir_all(&base_tmp).map_err(|e| {
        format!(
            "❌ Failed to create temp directory {}: {}",
            base_tmp.display(),
            e
        )
    })?;
    let target_dir = base_tmp.join(parsed.repo());

    // If repository already exists, treat as success
    if target_dir.join(".git").exists() {
        let message = format!("✅ Repository already exists at: {}", target_dir.display());
        let _ = app.emit("tugboats://clone-progress", &message);
        return Ok(());
    }

    // Run git clone
    run_git_clone(clone_url, target_dir.to_string_lossy().to_string(), app).await
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
        // NOTE: nspanel plugin causes panic during init - needs investigation
        .plugin(tauri_nspanel::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::show,
            commands::hide,
            parse_github_url,
            clone_repo,
            clone_app,
            bundler::bundle_app,
            bundler::latest_bundle_for_alias,
            bundler::read_text_file,
            bundler::read_bundle_metadata,
            // --- Dev Server Commands ---
            devserver::start_dev,
            devserver::stop_dev,
            devserver::dev_status,
            devserver::get_home_dir,
            // --- KV Commands ---
            kv::kv_factory_reset,
            kv::kv_get,
            kv::kv_set,
            kv::kv_list,
            kv::kv_delete,
            // --- Encryption Commands ---
            encryptions::encrypt,
            encryptions::decrypt
        ])
        .setup(move |app| {
            // Initialize KV database in background
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = kv::initialize_kv_db(&app_handle).await {
                    eprintln!("Failed to initialize KV database: {}", e);
                }
            });

            // Initialize dev server manager
            let dev_manager = devserver::DevServerManager::new(app.handle().clone());
            app.manage(dev_manager);

            // Use ~/.tugboats as the custom data directory
            let home = dirs::home_dir().ok_or("No home directory found")?;
            let tugboats_dir = home.join(".tugboats");
            std::fs::create_dir_all(&tugboats_dir)
                .map_err(|e| format!("Failed to create ~/.tugboats directory: {}", e))?;

            // Allow Tauri FS scope to serve files from ~/.tugboats
            app.fs_scope().allow_directory(&tugboats_dir, true)?;

            // Set activation policy to Prohibited to prevent
            // app icon in dock and focus stealing on first launch
            //
            // Alternative: use Accessory to allow app activation
            // but hide from dock, it will steal focus on first launch
            app.set_activation_policy(tauri::ActivationPolicy::Prohibited);

            Ok(())
        })
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcut(Shortcut::new(Some(Modifiers::SUPER), Code::KeyK))
                .unwrap()
                .with_handler(|app, shortcut, event| {
                    if event.state == ShortcutState::Pressed
                        && shortcut.matches(Modifiers::SUPER, Code::KeyK)
                    {
                        let window = app.get_webview_window(SPOTLIGHT_LABEL).unwrap();

                        match app
                            .get_webview_panel(SPOTLIGHT_LABEL)
                            .or_else(|_| window.to_spotlight_panel())
                        {
                            Ok(panel) => {
                                if panel.is_visible() {
                                    panel.hide();
                                } else {
                                    window.center_at_cursor_monitor().unwrap();
                                    panel.show_and_make_key();
                                }
                            }
                            Err(e) => eprintln!("{:?}", e),
                        }
                    }
                })
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

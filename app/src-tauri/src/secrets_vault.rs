use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_stronghold::Builder as StrongholdBuilder;

/// Configuration state to track the single vault instance
pub struct VaultConfig {
    snapshot_path: Option<PathBuf>,
    client_name: Option<String>,
}

impl Default for VaultConfig {
    fn default() -> Self {
        Self {
            snapshot_path: None,
            client_name: None,
        }
    }
}

#[tauri::command]
pub async fn vault_initialize(
    app: AppHandle,
    config: State<'_, Mutex<VaultConfig>>,
    _vault_password: String,
    client_name: String,
) -> Result<(), String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("could not resolve app data dir: {}", e))?;
    let snapshot_path = app_dir.join("vault.hold");

    // Initialize the stronghold at this path
    // Frontend will need to call plugin:stronghold|initialize directly
    // We just store the config here
    let mut guard = config.lock().unwrap();
    guard.snapshot_path = Some(snapshot_path.clone());
    guard.client_name = Some(client_name);
    
    Ok(())
}

#[tauri::command]
pub async fn vault_get_config(
    config: State<'_, Mutex<VaultConfig>>,
) -> Result<serde_json::Value, String> {
    let guard = config.lock().unwrap();
    Ok(serde_json::json!({
        "snapshotPath": guard.snapshot_path,
        "clientName": guard.client_name,
    }))
}

#[tauri::command]
pub async fn secret_get(
    config: State<'_, Mutex<VaultConfig>>,
    _key: String,
) -> Result<Vec<u8>, String> {
    let guard = config.lock().unwrap();
    guard
        .snapshot_path
        .as_ref()
        .ok_or_else(|| "vault not initialized".to_string())?;
    guard
        .client_name
        .as_ref()
        .ok_or_else(|| "vault not initialized".to_string())?;

    // Return placeholder - frontend should use plugin:stronghold|get_store_record
    Ok(vec![])
}

#[tauri::command]
pub async fn secret_set(
    config: State<'_, Mutex<VaultConfig>>,
    _key: String,
    _value: Vec<u8>,
) -> Result<(), String> {
    let guard = config.lock().unwrap();
    guard
        .snapshot_path
        .as_ref()
        .ok_or_else(|| "vault not initialized".to_string())?;
    guard
        .client_name
        .as_ref()
        .ok_or_else(|| "vault not initialized".to_string())?;

    // Return success - frontend should use plugin:stronghold|save_store_record
    Ok(())
}

#[tauri::command]
pub async fn secret_remove(
    config: State<'_, Mutex<VaultConfig>>,
    _key: String,
) -> Result<(), String> {
    let guard = config.lock().unwrap();
    guard
        .snapshot_path
        .as_ref()
        .ok_or_else(|| "vault not initialized".to_string())?;
    guard
        .client_name
        .as_ref()
        .ok_or_else(|| "vault not initialized".to_string())?;

    // Return success - frontend should use plugin:stronghold|remove_store_record
    Ok(())
}

#[tauri::command]
pub async fn vault_save(config: State<'_, Mutex<VaultConfig>>) -> Result<(), String> {
    let guard = config.lock().unwrap();
    guard
        .snapshot_path
        .as_ref()
        .ok_or_else(|| "vault not initialized".to_string())?;

    // Return success - frontend should use plugin:stronghold|save
    Ok(())
}

#[tauri::command]
pub async fn vault_destroy(config: State<'_, Mutex<VaultConfig>>) -> Result<(), String> {
    let mut guard = config.lock().unwrap();
    guard.snapshot_path = None;
    guard.client_name = None;
    Ok(())
}

pub fn init_vault_plugin(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let salt_path = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("could not resolve app local data path: {}", e))?
        .join("salt.txt");
    app.plugin(StrongholdBuilder::with_argon2(&salt_path).build())?;
    app.manage(Mutex::new(VaultConfig::default()));
    Ok(())
}

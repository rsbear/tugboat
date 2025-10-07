use sqlx::sqlite::SqlitePool;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

static DB_POOL: Mutex<Option<SqlitePool>> = Mutex::new(None);

pub async fn initialize_kv_db(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&app_data_dir)?;

    let db_path = app_data_dir.join("tugboats.db");
    let pool = try_connect_database(&db_path).await?;

    // Registry of tables
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS kv_registry (
            table_name TEXT PRIMARY KEY,
            created_at INTEGER DEFAULT (strftime('%s','now'))
        )
        "#,
    )
    .execute(&pool)
    .await?;

    // Global FTS5 search
    sqlx::query(
        r#"
        CREATE VIRTUAL TABLE IF NOT EXISTS kv_search USING fts5(
            table_name UNINDEXED,
            key UNINDEXED,
            value,
            content=''
        )
        "#,
    )
    .execute(&pool)
    .await?;

    let mut db_pool = DB_POOL.lock().unwrap();
    *db_pool = Some(pool);

    Ok(())
}

pub fn get_db() -> Result<SqlitePool, String> {
    let db_guard = DB_POOL
        .lock()
        .map_err(|e| format!("Failed to lock database: {}", e))?;

    db_guard
        .clone()
        .ok_or_else(|| "Database not initialized".to_string())
}

pub fn sanitize_table_name(name: &str) -> String {
    name.chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect()
}

pub fn key_to_string(key: &[String]) -> String {
    key.join("/")
}

async fn try_connect_database(db_path: &std::path::Path) -> Result<SqlitePool, sqlx::Error> {
    let database_url = format!("sqlite://{}?mode=rwc", db_path.display());
    SqlitePool::connect(&database_url).await
}

pub async fn ensure_table(table_name: &str) -> Result<(), Box<dyn std::error::Error>> {
    let pool = get_db()?;
    let safe_table_name = sanitize_table_name(table_name);

    let create_table_sql = format!(
        r#"
        CREATE TABLE IF NOT EXISTS {} (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s','now')),
            updated_at INTEGER DEFAULT (strftime('%s','now'))
        )
        "#,
        safe_table_name
    );

    sqlx::query(&create_table_sql).execute(&pool).await?;

    sqlx::query("INSERT OR IGNORE INTO kv_registry (table_name) VALUES (?)")
        .bind(&safe_table_name)
        .execute(&pool)
        .await?;

    // FTS5 triggers
    let insert_trigger = format!(
        r#"
        CREATE TRIGGER IF NOT EXISTS {}_fts_insert
        AFTER INSERT ON {} BEGIN
            INSERT INTO kv_search(table_name, key, value)
            VALUES ('{}', new.key, new.value);
        END
        "#,
        safe_table_name, safe_table_name, safe_table_name
    );

    let update_trigger = format!(
        r#"
        CREATE TRIGGER IF NOT EXISTS {}_fts_update
        AFTER UPDATE ON {} BEGIN
            UPDATE kv_search SET value = new.value
            WHERE table_name = '{}' AND key = new.key;
        END
        "#,
        safe_table_name, safe_table_name, safe_table_name
    );

    let delete_trigger = format!(
        r#"
        CREATE TRIGGER IF NOT EXISTS {}_fts_delete
        AFTER DELETE ON {} BEGIN
            DELETE FROM kv_search
            WHERE table_name = '{}' AND key = old.key;
        END
        "#,
        safe_table_name, safe_table_name, safe_table_name
    );

    sqlx::query(&insert_trigger).execute(&pool).await?;
    sqlx::query(&update_trigger).execute(&pool).await?;
    sqlx::query(&delete_trigger).execute(&pool).await?;

    Ok(())
}

pub async fn reset_kv_db(app: &AppHandle) -> Result<(), String> {
    // Take and close the existing pool if present
    let maybe_pool = {
        let mut guard = DB_POOL
            .lock()
            .map_err(|e| format!("Failed to lock database: {}", e))?;
        guard.take()
    };

    if let Some(pool) = maybe_pool {
        // Close all connections cleanly before deleting the file
        pool.close().await;
    }

    // Delete the SQLite file
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {}", e))?;
    let db_path = app_data_dir.join("tugboats.db");

    if db_path.exists() {
        if let Err(e) = std::fs::remove_file(&db_path) {
            return Err(format!(
                "Failed to remove database file {}: {}",
                db_path.display(),
                e
            ));
        }
    }

    // Clean up potential SQLite WAL/SHM sidecar files
    let wal_path = app_data_dir.join("tugboats.db-wal");
    if wal_path.exists() {
        let _ = std::fs::remove_file(&wal_path);
    }
    let shm_path = app_data_dir.join("tugboats.db-shm");
    if shm_path.exists() {
        let _ = std::fs::remove_file(&shm_path);
    }

    // Re-initialize the database schema and pool
    initialize_kv_db(app)
        .await
        .map_err(|e| format!("Failed to re-initialize KV DB: {}", e))
}

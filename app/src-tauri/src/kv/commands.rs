use serde_json::Value;
use sqlx::Row;
use tauri::command;

use super::client::{ensure_table, get_db, key_to_string, reset_kv_db, sanitize_table_name};
use super::types::{KvItem, KvKey, Metadata, SearchResult};

#[command]
pub async fn kv_factory_reset(app: tauri::AppHandle) -> Result<(), String> {
    reset_kv_db(&app).await
}

#[command]
pub async fn kv_get(key: KvKey) -> Result<Option<KvItem<Value>>, String> {
    if key.is_empty() {
        return Err("Key cannot be empty".to_string());
    }

    let table_name = &key[0];
    let rest_key = &key[1..];
    let safe_table_name = sanitize_table_name(table_name);
    let key_str = key_to_string(rest_key);

    ensure_table(&safe_table_name)
        .await
        .map_err(|e| e.to_string())?;

    let pool = get_db()?;
    let query = format!(
        "SELECT value, created_at, updated_at FROM {} WHERE key = ?",
        safe_table_name
    );

    let row = sqlx::query(&query)
        .bind(&key_str)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(row) = row {
        let value_str: String = row.try_get("value").map_err(|e| e.to_string())?;
        let created_at: i64 = row.try_get("created_at").map_err(|e| e.to_string())?;
        let updated_at: i64 = row.try_get("updated_at").map_err(|e| e.to_string())?;

        let value: Value =
            serde_json::from_str(&value_str).map_err(|e| format!("Failed to parse JSON: {}", e))?;

        Ok(Some(KvItem {
            value,
            metadata: Metadata {
                key: key.clone(),
                created_at,
                updated_at,
            },
        }))
    } else {
        Ok(None)
    }
}

#[command]
pub async fn kv_set(key: KvKey, value: Value) -> Result<(), String> {
    if key.is_empty() {
        return Err("Key cannot be empty".to_string());
    }

    let table_name = &key[0];
    let rest_key = &key[1..];
    let safe_table_name = sanitize_table_name(table_name);
    let key_str = key_to_string(rest_key);

    let pool = get_db()?;
    ensure_table(&safe_table_name)
        .await
        .map_err(|e| e.to_string())?;

    let value_str =
        serde_json::to_string(&value).map_err(|e| format!("Failed to serialize value: {}", e))?;

    let query = format!(
        r#"
        INSERT INTO {table} (key, value, created_at, updated_at)
        VALUES (?, ?, strftime('%s','now'), strftime('%s','now'))
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = strftime('%s','now')
        "#,
        table = safe_table_name
    );

    sqlx::query(&query)
        .bind(&key_str)
        .bind(&value_str)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn kv_list(prefix: KvKey) -> Result<Vec<KvItem<Value>>, String> {
    if prefix.is_empty() {
        return Err("Prefix cannot be empty".to_string());
    }

    let table_name = &prefix[0];
    let rest_prefix = &prefix[1..];
    let safe_table_name = sanitize_table_name(table_name);

    ensure_table(&safe_table_name)
        .await
        .map_err(|e| e.to_string())?;

    let pool = get_db()?;
    let mut query = format!(
        "SELECT key, value, created_at, updated_at FROM {} ",
        safe_table_name
    );

    let rows = if rest_prefix.is_empty() {
        query.push_str("ORDER BY key");
        sqlx::query(&query)
            .fetch_all(&pool)
            .await
            .map_err(|e| e.to_string())?
    } else {
        let prefix_str = format!("{}/%", key_to_string(rest_prefix));
        query.push_str("WHERE key LIKE ? ORDER BY key");
        sqlx::query(&query)
            .bind(&prefix_str)
            .fetch_all(&pool)
            .await
            .map_err(|e| e.to_string())?
    };

    let mut items = Vec::new();
    for row in rows {
        let key_str: String = row.try_get("key").map_err(|e| e.to_string())?;
        let value_str: String = row.try_get("value").map_err(|e| e.to_string())?;
        let created_at: i64 = row.try_get("created_at").map_err(|e| e.to_string())?;
        let updated_at: i64 = row.try_get("updated_at").map_err(|e| e.to_string())?;

        let value: Value =
            serde_json::from_str(&value_str).map_err(|e| format!("Failed to parse JSON: {}", e))?;

        let mut full_key = vec![table_name.clone()];
        full_key.extend(key_str.split('/').map(|s| s.to_string()));

        items.push(KvItem {
            value,
            metadata: Metadata {
                key: full_key,
                created_at,
                updated_at,
            },
        });
    }

    Ok(items)
}

#[command]
pub async fn kv_delete(key: KvKey) -> Result<(), String> {
    if key.is_empty() {
        return Err("Key cannot be empty".to_string());
    }

    let table_name = &key[0];
    let rest_key = &key[1..];
    let safe_table_name = sanitize_table_name(table_name);
    let key_str = key_to_string(rest_key);

    let pool = get_db()?;
    let query = format!("DELETE FROM {} WHERE key = ?", safe_table_name);

    sqlx::query(&query)
        .bind(&key_str)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn kv_search(
    query: String,
    table_filter: Option<String>,
) -> Result<Vec<SearchResult<Value>>, String> {
    let pool = get_db()?;
    let mut sql = r#"
        SELECT table_name, key, snippet(kv_search, 2, '<mark>', '</mark>', '...', 10) as snippet
        FROM kv_search
        WHERE value MATCH ?
    "#
    .to_string();

    let rows = if let Some(filter) = table_filter {
        sql.push_str(" AND table_name = ? ORDER BY rank");
        sqlx::query(&sql)
            .bind(&query)
            .bind(&sanitize_table_name(&filter))
            .fetch_all(&pool)
            .await
            .map_err(|e| e.to_string())?
    } else {
        sql.push_str(" ORDER BY rank");
        sqlx::query(&sql)
            .bind(&query)
            .fetch_all(&pool)
            .await
            .map_err(|e| e.to_string())?
    };

    let mut results = Vec::new();
    for row in rows {
        let table_name: String = row.try_get("table_name").map_err(|e| e.to_string())?;
        let key_str: String = row.try_get("key").map_err(|e| e.to_string())?;
        let snippet: String = row.try_get("snippet").map_err(|e| e.to_string())?;

        let mut full_key = vec![table_name];
        full_key.extend(key_str.split('/').map(|s| s.to_string()));

        if let Some(item) = kv_get(full_key.clone()).await? {
            results.push(SearchResult { item, snippet });
        }
    }

    Ok(results)
}

#[command]
pub async fn kv_tables() -> Result<Vec<String>, String> {
    let pool = get_db()?;
    let rows = sqlx::query("SELECT table_name FROM kv_registry ORDER BY table_name")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(rows
        .into_iter()
        .filter_map(|row| row.try_get::<String, _>("table_name").ok())
        .collect())
}

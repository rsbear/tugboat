//! Shared utilities for app base implementations

use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// Resolve tilde in paths (~/ or ~ to home directory)
pub fn resolve_tilde(p: &str) -> Result<PathBuf, String> {
    if p == "~" {
        return dirs::home_dir().ok_or("No home directory found".to_string());
    }
    if let Some(stripped) = p.strip_prefix("~/") {
        let home = dirs::home_dir().ok_or("No home directory found".to_string())?;
        return Ok(home.join(stripped));
    }
    Ok(PathBuf::from(p))
}

/// Find a config file in project directory
///
/// Searches for any of the provided patterns and returns the first match
pub fn find_config_file(project_dir: &Path, patterns: &[&str]) -> Option<PathBuf> {
    for pattern in patterns {
        let path = project_dir.join(pattern);
        if path.exists() {
            return Some(path);
        }
    }
    None
}

/// Extract package version from dependencies map
pub fn extract_package_version(deps: &HashMap<String, String>, name: &str) -> Option<String> {
    deps.get(name).map(|v| v.clone())
}

/// Detect framework from dependencies
///
/// Returns framework name if a known framework dependency is found
pub fn detect_framework_from_deps(
    dependencies: &HashMap<String, String>,
    dev_dependencies: &HashMap<String, String>,
) -> Option<String> {
    let has = |name: &str| -> bool {
        dependencies.contains_key(name) || dev_dependencies.contains_key(name)
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
            return Some(framework_name.to_string());
        }
    }

    None
}

/// Detect framework from entry file extension
pub fn detect_framework_from_entry(entry_file: &str) -> Option<String> {
    if entry_file.ends_with(".svelte") {
        return Some("svelte".to_string());
    }
    // Could add more extension-based detection here
    None
}

/// Generate ESM.sh import URL
pub fn generate_esm_sh_import(package: &str, version: &str) -> String {
    format!("https://esm.sh/{}@{}", package, version)
}

/// Find package.json directory (current or one level nested)
pub fn find_package_json_dir(project_dir: &Path) -> Result<PathBuf, String> {
    let root_pkg = project_dir.join("package.json");
    if root_pkg.exists() {
        return Ok(project_dir.to_path_buf());
    }

    // Search one level down
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_framework_from_entry() {
        assert_eq!(
            detect_framework_from_entry("App.svelte"),
            Some("svelte".to_string())
        );
        assert_eq!(detect_framework_from_entry("app.tsx"), None);
    }

    #[test]
    fn test_generate_esm_sh_import() {
        assert_eq!(
            generate_esm_sh_import("react", "18.2.0"),
            "https://esm.sh/react@18.2.0"
        );
    }

    #[test]
    fn test_extract_package_version() {
        let mut deps = HashMap::new();
        deps.insert("react".to_string(), "^18.2.0".to_string());
        
        assert_eq!(
            extract_package_version(&deps, "react"),
            Some("^18.2.0".to_string())
        );
        assert_eq!(extract_package_version(&deps, "vue"), None);
    }
}

# Installing tugboat apps after cloning an apps repo

**THIS TASK FOCUSES SPECIFICALLY ON TUGBOAT APPS**

On save of preferences:
- [x] Clone a repo to ~/.tugboats/temp
- [ ] Using preferences.apps.github_url, find the tugboat app dir in ~/.tugboats/temp
- [ ] Create a vite.config.mjs in the app dir
- [ ] Install vite in the app dir
- [ ] Bundle the app for the user
- [ ] Move the bundle to ~/.tugboats/bundles/


### builder code ripped from prototype of project. please use it for reference and context only
```rust
use std::path::{Path, PathBuf};
use std::process::Command;

use super::lib::{self, generate_react_importmap, save_artifacts, PackageJson};

pub async fn install_shipment(github_url: &str, alias: &str) -> Result<PathBuf, String> {
    // Fetch repo
    let repo_root = lib::fetch_and_write_repo_dir(github_url).await?;

    // Resolve project dir that contains package.json (supports one-level nested)
    let project_dir = lib::find_package_json_dir(&repo_root)?;

    // Install deps in the project dir
    lib::run_npm_install(&project_dir)?;

    // Parse package.json from the project dir
    let pkg = lib::parse_package_json(&project_dir).await?;

    // Detect framework
    let framework = lib::detect_framework(&pkg)?;

    match framework.as_str() {
        "svelte" => bundle_svelte(&project_dir, alias, &pkg).await,
        "react" => bundle_react(&project_dir, alias, &pkg).await,
        other => Err(format!("Unsupported framework: {}", other)),
    }
}

fn resolve_entry(repo_dir: &Path) -> Option<String> {
    let candidates = [
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

pub async fn bundle_svelte(
    repo_dir: &Path,
    alias: &str,
    pkg: &PackageJson,
) -> Result<PathBuf, String> {
    // Verify entry exists
    let entry_rel = resolve_entry(repo_dir).ok_or_else(|| {
        "No tugboats.ts or tugboats.tsx entrypoint found in repository".to_string()
    })?;

    // Ensure required dev dependencies are present (plugin + vite)
    let _ = lib::ensure_dev_dependency(repo_dir, pkg, "@sveltejs/vite-plugin-svelte");
    let _ = lib::ensure_dev_dependency(repo_dir, pkg, "vite");

    // Ensure a basic svelte.config.mjs with vitePreprocess exists
    let svelte_config_path = repo_dir.join("svelte.config.mjs");
    let created_svelte_config = if !svelte_config_path.exists() {
        let svelte_cfg = r#"import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('svelte').Config} */
const config = {
  preprocess: vitePreprocess(),
};

export default config;
"#;
        if let Err(e) = tokio::fs::write(&svelte_config_path, svelte_cfg).await {
            return Err(format!("Failed to write svelte.config.mjs: {}", e));
        }
        true
    } else {
        false
    };

    // Create a temporary Vite config for library-style build
    let vite_config = format!(
        r#"import {{ svelte }} from '@sveltejs/vite-plugin-svelte';

export default {{
define: {{ 'process.env.NODE_ENV': 'production', 'process.env': '{{}}', process: '{{}}', global: 'globalThis' }},
  plugins: [svelte()],
  build: {{
    outDir: '.tugboats-dist',
    sourcemap: false,
    manifest: true,
    lib: {{
      entry: './{entry}',
      formats: ['es'],
      fileName: () => 'bundle-{alias}.js'
    }},
    rollupOptions: {{
      // Intentionally do NOT externalize 'svelte' to avoid runtime version conflicts
      // external: ['@tugboats/core'],
      output: {{
        format: 'es',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }}
    }}
  }}
}};
"#,
        entry = entry_rel,
        alias = alias
    );

    let temp_config_path = repo_dir.join("vite.config.mjs");
    tokio::fs::write(&temp_config_path, vite_config)
        .await
        .map_err(|e| format!("Failed to write temporary vite.config.mjs: {}", e))?;

    // Run vite build using npx (ensure local project context)
    let status = Command::new("npx")
        .args(["--yes", "vite", "build", "--config", "vite.config.mjs"])
        .current_dir(repo_dir)
        .status()
        .map_err(|e| format!("Failed to spawn vite build: {}", e))?;

    // Clean up the temporary config (best-effort)
    let _ = tokio::fs::remove_file(&temp_config_path).await;
    if created_svelte_config {
        let _ = tokio::fs::remove_file(&svelte_config_path).await;
    }

    if !status.success() {
        return Err(format!(
            "Vite build failed with status: {:?}",
            status.code()
        ));
    }

    // Read built bundle
    let out_file = repo_dir
        .join(".tugboats-dist")
        .join(format!("bundle-{}.js", alias));
    let js_code = tokio::fs::read_to_string(&out_file)
        .await
        .map_err(|e| format!("Failed to read built bundle: {}", e))?;

    // We now bundle Svelte into the output, so an import map is not required.
    // Write an empty import map to keep the host loader happy without external resolution.
    let importmap = "{\n  \"imports\": {}\n}".to_string();

    // Save artifacts to ~/.tugboats/bundles
    let bundle_path = save_artifacts(alias, &js_code, &importmap)?;

    Ok(bundle_path)
}

pub async fn bundle_react(
    repo_dir: &Path,
    alias: &str,
    pkg: &PackageJson,
) -> Result<PathBuf, String> {
    // Verify entry exists
    let entry_rel = resolve_entry(repo_dir).ok_or_else(|| {
        "No tugboats.ts or tugboats.tsx entrypoint found in repository".to_string()
    })?;

    // Always use the official React plugin (never use the SWC variant)
    let plugin_import = "@vitejs/plugin-react";

    // Ensure dev deps
    let _ = lib::ensure_dev_dependency(repo_dir, pkg, plugin_import);
    let _ = lib::ensure_dev_dependency(repo_dir, pkg, "vite");

    // Create temporary Vite config for React with top-level define
    let vite_config = format!(
        r#"import react from '{plugin_import}';

export default {{
  define: {{ 'process.env.node_env': '\"production\"', 'process.env': '{{}}', process: '{{}}', global: 'globalthis' }},
  plugins: [react()],
  build: {{
    outdir: '.tugboats-dist',
    sourcemap: false,
    manifest: true,
    lib: {{
      entry: './{entry}',
      formats: ['es'],
      filename: () => 'bundle-{alias}.js'
    }},
    rollupoptions: {{
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {{
        format: 'es',
        chunkfilenames: 'chunks/[name]-[hash].js',
        assetfilenames: 'assets/[name]-[hash][extname]'
      }}
    }}
  }}
}};
"#,
        plugin_import = plugin_import,
        entry = entry_rel,
        alias = alias
    );

    let temp_config_path = repo_dir.join("vite.config.mjs");
    tokio::fs::write(&temp_config_path, vite_config)
        .await
        .map_err(|e| format!("Failed to write temporary vite.config.mjs: {}", e))?;

    // Run vite build
    let status = Command::new("npx")
        .args(["--yes", "vite", "build", "--config", "vite.config.mjs"])
        .current_dir(repo_dir)
        .status()
        .map_err(|e| format!("Failed to spawn vite build: {}", e))?;

    // Clean config
    let _ = tokio::fs::remove_file(&temp_config_path).await;

    if !status.success() {
        return Err(format!(
            "Vite build failed with status: {:?}",
            status.code()
        ));
    }

    // Read built bundle
    let out_file = repo_dir
        .join(".tugboats-dist")
        .join(format!("bundle-{}.js", alias));
    let js_code = tokio::fs::read_to_string(&out_file)
        .await
        .map_err(|e| format!("Failed to read built bundle: {}", e))?;

    // Import map
    let react_ver = pkg
        .dependencies
        .get("react")
        .or_else(|| pkg.devDependencies.get("react"))
        .cloned()
        .unwrap_or_else(|| "latest".to_string());
    let react_dom_ver = pkg
        .dependencies
        .get("react-dom")
        .or_else(|| pkg.devDependencies.get("react-dom"))
        .map(|s| s.as_str());

    let importmap = generate_react_importmap(&react_ver, react_dom_ver);

    // Save
    let bundle_path = save_artifacts(alias, &js_code, &importmap)?;
    Ok(bundle_path)
}
```

//! NPM + Vite App Base
//!
//! Handles tugboat apps built with package.json, npm/bun/deno runtimes, and Vite bundler.
//! Supports React, Svelte, Preact, Vue, Solid.js and other Vite-compatible frameworks.

use super::utils::{
    detect_framework_from_deps, detect_framework_from_entry, extract_package_version,
    find_package_json_dir, generate_esm_sh_import,
};
use super::{AppBase, BuildContext};
use crate::jsrun::{detect_runtime, JSRuntime};
use serde::Deserialize;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

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

/// NPM/Vite-based app handler
pub struct NpmViteAppBase {
    project_dir: PathBuf,
    package_json: PackageJson,
    runtime: JSRuntime,
}

impl NpmViteAppBase {
    /// Async helper for prepare_build
    async fn prepare_build_async(&self, alias: &str, is_dev: bool) -> Result<BuildContext, String> {
        // Install dependencies if needed
        let node_modules = self.project_dir.join("node_modules");
        if !node_modules.exists() {
            self.runtime.install(&self.project_dir).await?;
        }

        // Resolve entry
        let entry_rel = self.resolve_entry()?;

        // Detect framework
        let framework = self.detect_framework(&entry_rel);

        // Bundle filename
        let bundle_file = if is_dev {
            format!("{}-dev.js", alias)
        } else {
            let timestamp = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0);
            format!("{}-{}.js", alias, timestamp)
        };

        // Generate mount wrapper
        let mount_wrapper = Self::generate_mount_wrapper(&entry_rel, &framework);
        let mount_wrapper_path = self.project_dir.join(".tugboats-mount-wrapper.js");
        tokio::fs::write(&mount_wrapper_path, mount_wrapper)
            .await
            .map_err(|e| format!("Failed to write mount wrapper: {}", e))?;

        let mut temp_files = vec![mount_wrapper_path.clone()];

        // Install vite and framework plugin
        self.runtime
            .install_dev(&["vite"], &self.project_dir)
            .await?;

        match framework.as_str() {
            "svelte" => {
                self.runtime
                    .install_dev(&["@sveltejs/vite-plugin-svelte"], &self.project_dir)
                    .await?;

                // Create minimal svelte.config.mjs if needed
                let svelte_cfg = self.project_dir.join("svelte.config.mjs");
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
                    temp_files.push(svelte_cfg);
                }
            }
            "react" => {
                self.runtime
                    .install_dev(&["@vitejs/plugin-react"], &self.project_dir)
                    .await?;
            }
            _ => {}
        }

        // Write vite config
        let vite_config_content = Self::generate_vite_config(&framework, &bundle_file)?;
        let vite_config_path = self.project_dir.join("vite.config.mjs");
        tokio::fs::write(&vite_config_path, vite_config_content)
            .await
            .map_err(|e| format!("Failed to write vite.config.mjs: {}", e))?;
        temp_files.push(vite_config_path);

        Ok(BuildContext {
            project_dir: self.project_dir.clone(),
            alias: alias.to_string(),
            entry_rel,
            framework,
            bundle_file,
            temp_files,
            is_dev,
        })
    }


    /// Detect framework from package.json and entry file
    fn detect_framework(&self, entry_file: &str) -> String {
        // 1. Explicit config takes priority
        if let Some(config) = &self.package_json.tugboat {
            if let Some(framework) = &config.framework {
                return framework.clone();
            }
        }

        // 2. Filename convention (100% certain for Svelte)
        if let Some(framework) = detect_framework_from_entry(entry_file) {
            return framework;
        }

        // 3. Dependency inspection
        if let Some(framework) = detect_framework_from_deps(
            &self.package_json.dependencies,
            &self.package_json.dev_dependencies,
        ) {
            return framework;
        }

        // 4. Default to React
        "react".to_string()
    }

    /// Resolve entry point file
    fn resolve_entry_file(&self) -> Result<String, String> {
        let candidates = vec![
            // React & other frameworks
            "app.tsx",
            "app.jsx",
            "app.ts",
            "app.js",
            "src/app.tsx",
            "src/app.jsx",
            "src/app.ts",
            "src/app.js",
            // Svelte
            "App.svelte",
            "app.svelte",
            "src/App.svelte",
            "src/app.svelte",
        ];

        for candidate in candidates {
            if self.project_dir.join(candidate).exists() {
                return Ok(candidate.to_string());
            }
        }

        Err(
            "❌ No entry point found. Expected one of:\n  \
             - app.tsx, app.jsx, app.ts, app.js (React or other frameworks)\n  \
             - App.svelte, app.svelte (Svelte)\n\n  \
             Place your app file at the root or in src/ directory."
                .to_string(),
        )
    }

    /// Generate mount wrapper for framework
    fn generate_mount_wrapper(entry_rel: &str, framework: &str) -> String {
        match framework {
            "react" => format!(
                r#"
import {{ createRoot }} from 'react-dom/client';
import {{ createElement }} from 'react';
import App from './{}';

export function mountComponent(slot) {{
  const root = createRoot(slot);
  root.render(createElement(App));
  return () => root.unmount();
}}

export default App;
"#,
                entry_rel
            ),
            "preact" => format!(
                r#"
import {{ render }} from 'preact';
import {{ createElement }} from 'preact';
import App from './{}';

export function mountComponent(slot) {{
  render(createElement(App), slot);
  return () => render(null, slot);
}}

export default App;
"#,
                entry_rel
            ),
            "svelte" => format!(
                r#"
import {{ mount, unmount }} from 'svelte';
import App from './{}';

export function mountComponent(slot) {{
  const instance = mount(App, {{ target: slot }});
  return () => unmount(instance);
}}

export default App;
"#,
                entry_rel
            ),
            "solidjs" => format!(
                r#"
import {{ render }} from 'solid-js/web';
import App from './{}';

export function mountComponent(slot) {{
  const dispose = render(() => App({{}}), slot);
  return () => dispose();
}}

export default App;
"#,
                entry_rel
            ),
            "vue" => format!(
                r#"
import {{ createApp }} from 'vue';
import App from './{}';

export function mountComponent(slot) {{
  const app = createApp(App);
  app.mount(slot);
  return () => app.unmount();
}}

export default App;
"#,
                entry_rel
            ),
            _ => format!(
                r#"
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

export default App;
"#,
                entry_rel
            ),
        }
    }

    /// Generate Vite config for framework
    fn generate_vite_config(framework: &str, bundle_file: &str) -> Result<String, String> {
        match framework {
            "svelte" => Ok(format!(
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
      fileName: () => '{}'
    }},
    rollupOptions: {{
      external: ['@tugboats/core']
    }}
  }}
}};
"#,
                bundle_file
            )),
            "react" => Ok(format!(
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
      fileName: () => '{}'
    }},
    rollupOptions: {{
      external: ['@tugboats/core']
    }}
  }}
}};
"#,
                bundle_file
            )),
            other => Err(format!("Unsupported framework for Vite bundling: {}", other)),
        }
    }

    /// Get package version from dependencies
    fn get_version(&self, package_name: &str) -> Option<String> {
        extract_package_version(&self.package_json.dependencies, package_name)
            .or_else(|| extract_package_version(&self.package_json.dev_dependencies, package_name))
    }
}

impl AppBase for NpmViteAppBase {
    fn detect(project_dir: &Path) -> Option<Box<dyn AppBase>> {
        // Must have package.json
        let pkg_path = project_dir.join("package.json");
        if !pkg_path.exists() {
            return None;
        }

        // Try to find actual project dir (might be nested)
        let actual_project_dir = match find_package_json_dir(project_dir) {
            Ok(dir) => dir,
            Err(_) => return None,
        };

        // Read package.json synchronously (detection should be fast)
        let contents = std::fs::read_to_string(actual_project_dir.join("package.json")).ok()?;
        let package_json: PackageJson = serde_json::from_str(&contents).ok()?;

        // Detect runtime
        let runtime = detect_runtime(&actual_project_dir);

        Some(Box::new(NpmViteAppBase {
            project_dir: actual_project_dir,
            package_json,
            runtime,
        }))
    }

    fn validate(&self) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + Send + '_>> {
        Box::pin(async move {
            // Ensure runtime tools available
            self.runtime.ensure_tools_available().await?;
            Ok(())
        })
    }

    fn resolve_entry(&self) -> Result<String, String> {
        self.resolve_entry_file()
    }

    fn get_framework(&self) -> String {
        // Need entry to detect framework properly
        match self.resolve_entry() {
            Ok(entry) => self.detect_framework(&entry),
            Err(_) => "react".to_string(), // Fallback
        }
    }

    fn prepare_build(&self, alias: &str, is_dev: bool) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<BuildContext, String>> + Send + '_>> {
        let alias_owned = alias.to_string();
        Box::pin(async move {
            self.prepare_build_async(&alias_owned, is_dev).await
        })
    }

    fn build(&self, ctx: &BuildContext) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + Send + '_>> {
        let project_dir = ctx.project_dir.clone();
        Box::pin(async move {
            self.runtime
                .build(&["vite", "build", "--config", "vite.config.mjs"], &project_dir)
                .await
        })
    }

    fn generate_importmap(&self) -> serde_json::Value {
        let mut imports = serde_json::Map::new();

        let framework = self.get_framework();

        // Map framework dependencies to ESM.sh
        match framework.as_str() {
            "react" => {
                if let Some(react_version) = self.get_version("react") {
                    imports.insert(
                        "react".to_string(),
                        serde_json::json!(generate_esm_sh_import("react", &react_version)),
                    );
                }
                if let Some(react_dom_version) = self.get_version("react-dom") {
                    imports.insert(
                        "react-dom".to_string(),
                        serde_json::json!(generate_esm_sh_import("react-dom", &react_dom_version)),
                    );
                    imports.insert(
                        "react-dom/client".to_string(),
                        serde_json::json!(format!(
                            "{}/client",
                            generate_esm_sh_import("react-dom", &react_dom_version)
                        )),
                    );
                }
            }
            "svelte" => {
                if let Some(svelte_version) = self.get_version("svelte") {
                    imports.insert(
                        "svelte".to_string(),
                        serde_json::json!(generate_esm_sh_import("svelte", &svelte_version)),
                    );
                }
            }
            "preact" => {
                if let Some(preact_version) = self.get_version("preact") {
                    imports.insert(
                        "preact".to_string(),
                        serde_json::json!(generate_esm_sh_import("preact", &preact_version)),
                    );
                    imports.insert(
                        "preact/compat".to_string(),
                        serde_json::json!(format!(
                            "{}/compat",
                            generate_esm_sh_import("preact", &preact_version)
                        )),
                    );
                }
            }
            "solidjs" => {
                if let Some(solid_version) = self.get_version("solid-js") {
                    imports.insert(
                        "solid-js".to_string(),
                        serde_json::json!(generate_esm_sh_import("solid-js", &solid_version)),
                    );
                    imports.insert(
                        "solid-js/web".to_string(),
                        serde_json::json!(format!(
                            "{}/web",
                            generate_esm_sh_import("solid-js", &solid_version)
                        )),
                    );
                }
            }
            "vue" => {
                if let Some(vue_version) = self.get_version("vue") {
                    imports.insert(
                        "vue".to_string(),
                        serde_json::json!(generate_esm_sh_import("vue", &vue_version)),
                    );
                }
            }
            _ => {}
        }

        // Always map @tugboats/core
        imports.insert(
            "@tugboats/core".to_string(),
            serde_json::json!("/assets/core/mod.js"),
        );

        serde_json::json!({ "imports": imports })
    }

    fn generate_mount_utils(&self) -> String {
        let framework = self.get_framework();

        match framework.as_str() {
            "react" => {
                let react_version = self.get_version("react").unwrap_or("19".to_string());
                let react_dom_version = self
                    .get_version("react-dom")
                    .unwrap_or(react_version.clone());
                format!(
                    r#"
import {{ createRoot }} from '{}';
import {{ createElement }} from '{}';

export function mountComponent(Component, slot) {{
  const root = createRoot(slot);
  root.render(createElement(Component));
  return () => root.unmount();
}}
"#,
                    format!("{}/client", generate_esm_sh_import("react-dom", &react_dom_version)),
                    generate_esm_sh_import("react", &react_version)
                )
            }
            "preact" => {
                let preact_version = self.get_version("preact").unwrap_or("10.19.0".to_string());
                format!(
                    r#"
import {{ render }} from '{}';
import {{ createElement }} from '{}';

export function mountComponent(Component, slot) {{
  render(createElement(Component), slot);
  return () => render(null, slot);
}}
"#,
                    generate_esm_sh_import("preact", &preact_version),
                    generate_esm_sh_import("preact", &preact_version)
                )
            }
            "svelte" => {
                let svelte_version = self.get_version("svelte").unwrap_or("5.0.0".to_string());
                format!(
                    r#"
import {{ mount, unmount }} from '{}';

export function mountComponent(Component, slot) {{
  const instance = mount(Component, {{ target: slot }});
  return () => unmount(instance);
}}
"#,
                    generate_esm_sh_import("svelte", &svelte_version)
                )
            }
            "solidjs" => {
                let solid_version = self.get_version("solid-js").unwrap_or("1.9.0".to_string());
                format!(
                    r#"
import {{ render }} from '{}';

export function mountComponent(Component, slot) {{
  const dispose = render(() => Component({{}}), slot);
  return () => dispose();
}}
"#,
                    format!(
                        "{}/web",
                        generate_esm_sh_import("solid-js", &solid_version)
                    )
                )
            }
            "vue" => {
                let vue_version = self.get_version("vue").unwrap_or("3.4.0".to_string());
                format!(
                    r#"
import {{ createApp }} from '{}';

export function mountComponent(Component, slot) {{
  const app = createApp(Component);
  app.mount(slot);
  return () => app.unmount();
}}
"#,
                    generate_esm_sh_import("vue", &vue_version)
                )
            }
            _ => {
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
"#
                .to_string()
            }
        }
    }

    fn cleanup(&self, ctx: &BuildContext) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + Send + '_>> {
        let temp_files = ctx.temp_files.clone();
        Box::pin(async move {
            for temp_file in &temp_files {
                let _ = tokio::fs::remove_file(temp_file).await;
            }
            Ok(())
        })
    }
}

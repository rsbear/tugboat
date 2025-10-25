//! NPM + Vite App Base
//!
//! Handles tugboat apps built with package.json OR deno.json, various runtimes, and Vite bundler.
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

#[derive(Debug, Clone, PartialEq)]
pub enum ProjectType {
    Npm,  // Uses package.json
    Deno, // Uses deno.json or deno.jsonc
}

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

#[derive(Debug, Deserialize, Clone, Default)]
pub struct DenoConfig {
    #[serde(default)]
    pub imports: Option<HashMap<String, String>>,
    #[serde(default)]
    pub tugboat: Option<TugboatConfig>,
}

/// NPM/Vite-based app handler (also supports Deno + Vite)
pub struct NpmViteAppBase {
    project_dir: PathBuf,
    project_type: ProjectType,
    package_json: Option<PackageJson>,
    deno_config: Option<DenoConfig>,
    runtime: JSRuntime,
}

impl NpmViteAppBase {
    /// Async helper for prepare_build
    async fn prepare_build_async(&self, alias: &str, is_dev: bool) -> Result<BuildContext, String> {
        // Install dependencies if needed
        let node_modules = self.project_dir.join("node_modules");
        if !node_modules.exists() {
            match self.project_type {
                ProjectType::Npm => {
                    self.runtime.install(&self.project_dir).await?;
                }
                ProjectType::Deno => {
                    // Run deno install to create node_modules
                    let status = tokio::process::Command::new("deno")
                        .arg("install")
                        .current_dir(&self.project_dir)
                        .status()
                        .await
                        .map_err(|e| format!("Failed to run deno install: {}", e))?;

                    if !status.success() {
                        return Err("deno install failed".to_string());
                    }
                }
            }
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
        match self.project_type {
            ProjectType::Npm => {
                self.runtime
                    .install_dev(&["vite"], &self.project_dir)
                    .await?;
            }
            ProjectType::Deno => {
                // Add vite to deno.json if not present
                self.deno_add_package("npm:vite@latest").await?;
                // Add @deno/vite-plugin
                self.deno_add_package("npm:@deno/vite-plugin@latest").await?;
            }
        }

        match framework.as_str() {
            "svelte" => {
                match self.project_type {
                    ProjectType::Npm => {
                        self.runtime
                            .install_dev(&["@sveltejs/vite-plugin-svelte"], &self.project_dir)
                            .await?;
                    }
                    ProjectType::Deno => {
                        self.deno_add_package("npm:svelte@latest").await?;
                        self.deno_add_package("npm:@sveltejs/vite-plugin-svelte@latest")
                            .await?;
                    }
                }

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
                match self.project_type {
                    ProjectType::Npm => {
                        self.runtime
                            .install_dev(&["@vitejs/plugin-react"], &self.project_dir)
                            .await?;
                    }
                    ProjectType::Deno => {
                        // Add React framework dependencies
                        self.deno_add_package("npm:react@latest").await?;
                        self.deno_add_package("npm:react-dom@latest").await?;
                        self.deno_add_package("npm:react/jsx-runtime").await?;
                        self.deno_add_package("npm:react/jsx-dev-runtime").await?;
                        // Add Vite plugin
                        self.deno_add_package("npm:@vitejs/plugin-react@latest").await?;
                    }
                }
            }
            _ => {}
        }

        // Write vite config
        let vite_config_content =
            self.generate_vite_config_for_project(&framework, &bundle_file)?;
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

    /// Detect framework from package.json/deno.json and entry file
    fn detect_framework(&self, entry_file: &str) -> String {
        match self.project_type {
            ProjectType::Npm => {
                if let Some(pkg) = &self.package_json {
                    // 1. Explicit config takes priority
                    if let Some(config) = &pkg.tugboat {
                        if let Some(framework) = &config.framework {
                            return framework.clone();
                        }
                    }

                    // 2. Filename convention (100% certain for Svelte)
                    if let Some(framework) = detect_framework_from_entry(entry_file) {
                        return framework;
                    }

                    // 3. Dependency inspection
                    if let Some(framework) =
                        detect_framework_from_deps(&pkg.dependencies, &pkg.dev_dependencies)
                    {
                        return framework;
                    }
                }

                // 4. Default to React
                "react".to_string()
            }
            ProjectType::Deno => {
                // 1. Filename convention
                if let Some(framework) = detect_framework_from_entry(entry_file) {
                    return framework;
                }

                // 2. Check deno.json imports
                if let Some(deno_config) = &self.deno_config {
                    if let Some(framework) = Self::detect_framework_from_deno_json(deno_config) {
                        return framework;
                    }
                }

                // 3. Default to React
                "react".to_string()
            }
        }
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

        Err("❌ No entry point found. Expected one of:\n  \
             - app.tsx, app.jsx, app.ts, app.js (React or other frameworks)\n  \
             - App.svelte, app.svelte (Svelte)\n\n  \
             Place your app file at the root or in src/ directory."
            .to_string())
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

    /// Generate Vite config for current project (with Deno support)
    fn generate_vite_config_for_project(
        &self,
        framework: &str,
        bundle_file: &str,
    ) -> Result<String, String> {
        match self.project_type {
            ProjectType::Npm => Self::generate_vite_config(framework, bundle_file, false),
            ProjectType::Deno => Self::generate_vite_config(framework, bundle_file, true),
        }
    }

    /// Generate Vite config for framework
    fn generate_vite_config(
        framework: &str,
        bundle_file: &str,
        include_deno_plugin: bool,
    ) -> Result<String, String> {
        let deno_import = if include_deno_plugin {
            "import deno from '@deno/vite-plugin';\n"
        } else {
            ""
        };

        let deno_plugin = if include_deno_plugin { "deno(), " } else { "" };

        match framework {
            "svelte" => Ok(format!(
                r#"{}import {{ svelte }} from '@sveltejs/vite-plugin-svelte';

export default {{
  define: {{ 'process.env.NODE_ENV': '"production"', 'process.env': {{}}, process: {{}}, global: 'globalThis' }},
  plugins: [{}svelte()],
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
                deno_import, deno_plugin, bundle_file
            )),
            "react" => Ok(format!(
                r#"{}import react from '@vitejs/plugin-react';

export default {{
  define: {{ 'process.env.NODE_ENV': '"production"', 'process.env': {{}}, process: {{}}, global: 'globalThis' }},
  plugins: [{}react()],
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
                deno_import, deno_plugin, bundle_file
            )),
            other => Err(format!(
                "Unsupported framework for Vite bundling: {}",
                other
            )),
        }
    }

    /// Get package version from dependencies
    fn get_version(&self, package_name: &str) -> Option<String> {
        match self.project_type {
            ProjectType::Npm => {
                if let Some(pkg) = &self.package_json {
                    extract_package_version(&pkg.dependencies, package_name)
                        .or_else(|| extract_package_version(&pkg.dev_dependencies, package_name))
                } else {
                    None
                }
            }
            ProjectType::Deno => self.get_deno_version(package_name),
        }
    }

    /// Extract version from Deno npm: specifier (e.g., "npm:react@19" -> "19")
    fn get_deno_version(&self, package_name: &str) -> Option<String> {
        let deno_config = self.deno_config.as_ref()?;
        let imports = deno_config.imports.as_ref()?;

        // Check for exact match first (e.g., "react")
        if let Some(specifier) = imports.get(package_name) {
            return Self::extract_npm_specifier_version(specifier);
        }

        // Check for subpath imports (e.g., "react-dom/client")
        for (key, specifier) in imports {
            if key.starts_with(package_name) {
                return Self::extract_npm_specifier_version(specifier);
            }
        }

        None
    }

    /// Extract version from npm: specifier
    /// Examples:
    /// - "npm:react@19" -> Some("19")
    /// - "npm:react@^19.0.0" -> Some("19.0.0")
    /// - "https://esm.sh/react@19" -> Some("19")
    fn extract_npm_specifier_version(specifier: &str) -> Option<String> {
        if let Some(after_at) = specifier.split('@').nth_back(0) {
            // Remove leading ^ or ~ from versions
            let clean_version = after_at.trim_start_matches('^').trim_start_matches('~');
            if !clean_version.is_empty() && clean_version != specifier {
                return Some(clean_version.to_string());
            }
        }
        None
    }

    /// Load deno.json or deno.jsonc from project directory
    fn load_deno_config(&self) -> Option<DenoConfig> {
        self.deno_config.clone()
    }

    /// Add a package to deno.json using `deno add`
    async fn deno_add_package(&self, package_spec: &str) -> Result<(), String> {
        let status = tokio::process::Command::new("deno")
            .arg("add")
            .arg(package_spec)
            .current_dir(&self.project_dir)
            .status()
            .await
            .map_err(|e| format!("Failed to run deno add: {}", e))?;

        if !status.success() {
            return Err(format!("deno add {} failed", package_spec));
        }

        Ok(())
    }

    /// Detect framework from deno.json imports
    fn detect_framework_from_deno_json(deno_config: &DenoConfig) -> Option<String> {
        // 1. Check explicit tugboat.framework override
        if let Some(tugboat) = &deno_config.tugboat {
            if let Some(framework) = &tugboat.framework {
                return Some(framework.clone());
            }
        }

        // 2. Infer from imports
        if let Some(imports) = &deno_config.imports {
            for (key, value) in imports {
                // Check for React
                if key == "react" || key.starts_with("react/") {
                    if value.starts_with("npm:react") || value.contains("esm.sh/react") {
                        return Some("react".to_string());
                    }
                }
                // Check for Preact
                if key == "preact" || key.starts_with("preact/") {
                    if value.starts_with("npm:preact") || value.contains("esm.sh/preact") {
                        return Some("preact".to_string());
                    }
                }
                // Check for Svelte
                if key == "svelte" || key.starts_with("svelte/") {
                    if value.starts_with("npm:svelte") || value.contains("esm.sh/svelte") {
                        return Some("svelte".to_string());
                    }
                }
            }
        }

        None
    }
}

impl AppBase for NpmViteAppBase {
    fn detect(project_dir: &Path) -> Option<Box<dyn AppBase>> {
        // Check for package.json (npm) or deno.json/deno.jsonc (Deno)
        let has_package_json = project_dir.join("package.json").exists();
        let has_deno_json = project_dir.join("deno.json").exists();
        let has_deno_jsonc = project_dir.join("deno.jsonc").exists();

        if !has_package_json && !has_deno_json && !has_deno_jsonc {
            return None;
        }

        // Determine project type
        let (project_type, actual_project_dir) = if has_package_json {
            // Try to find actual project dir (might be nested)
            let actual_dir = match find_package_json_dir(project_dir) {
                Ok(dir) => dir,
                Err(_) => return None,
            };
            (ProjectType::Npm, actual_dir)
        } else {
            // Deno projects are assumed to be at the specified directory
            (ProjectType::Deno, project_dir.to_path_buf())
        };

        // Load config based on project type
        let (package_json, deno_config) = match project_type {
            ProjectType::Npm => {
                let contents =
                    std::fs::read_to_string(actual_project_dir.join("package.json")).ok()?;
                let pkg: PackageJson = serde_json::from_str(&contents).ok()?;
                (Some(pkg), None)
            }
            ProjectType::Deno => {
                // Try deno.json first, then deno.jsonc
                let config_path = if has_deno_json {
                    actual_project_dir.join("deno.json")
                } else {
                    actual_project_dir.join("deno.jsonc")
                };

                let contents = std::fs::read_to_string(&config_path).ok()?;
                let deno: DenoConfig = serde_json::from_str(&contents).ok()?;

                // Verify it has a framework we support
                if Self::detect_framework_from_deno_json(&deno).is_none() {
                    return None;
                }

                (None, Some(deno))
            }
        };

        // Detect runtime
        let runtime = detect_runtime(&actual_project_dir);

        Some(Box::new(NpmViteAppBase {
            project_dir: actual_project_dir,
            project_type,
            package_json,
            deno_config,
            runtime,
        }))
    }

    fn validate(
        &self,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + Send + '_>> {
        Box::pin(async move {
            match self.project_type {
                ProjectType::Npm => {
                    // Ensure runtime tools available (npm/bun/pnpm)
                    self.runtime.ensure_tools_available().await?;
                }
                ProjectType::Deno => {
                    // Check if deno is installed
                    let output = tokio::process::Command::new("deno")
                        .arg("--version")
                        .output()
                        .await
                        .map_err(|_| {
                            "Deno not found. Install from https://deno.land/".to_string()
                        })?;

                    if !output.status.success() {
                        return Err("Deno command failed".to_string());
                    }
                }
            }
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

    fn prepare_build(
        &self,
        alias: &str,
        is_dev: bool,
    ) -> std::pin::Pin<
        Box<dyn std::future::Future<Output = Result<BuildContext, String>> + Send + '_>,
    > {
        let alias_owned = alias.to_string();
        Box::pin(async move { self.prepare_build_async(&alias_owned, is_dev).await })
    }

    fn build(
        &self,
        ctx: &BuildContext,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + Send + '_>> {
        let project_dir = ctx.project_dir.clone();
        Box::pin(async move {
            self.runtime
                .build(
                    &["vite", "build", "--config", "vite.config.mjs"],
                    &project_dir,
                )
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
                    format!(
                        "{}/client",
                        generate_esm_sh_import("react-dom", &react_dom_version)
                    ),
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
                    format!("{}/web", generate_esm_sh_import("solid-js", &solid_version))
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
            _ => r#"
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
            .to_string(),
        }
    }

    fn cleanup(
        &self,
        ctx: &BuildContext,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + Send + '_>> {
        let temp_files = ctx.temp_files.clone();
        Box::pin(async move {
            for temp_file in &temp_files {
                let _ = tokio::fs::remove_file(temp_file).await;
            }
            Ok(())
        })
    }
}

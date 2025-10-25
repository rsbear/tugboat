# Deno Bundle Support Implementation Plan

This document outlines the plan to support Deno-based tugboat apps that use `deno.json` instead of `package.json` and leverage `deno bundle --platform=browser` for bundling.

## Overview

Add support for tugboat apps built with:
- **Configuration**: `deno.json` or `deno.jsonc` (instead of `package.json`)
- **Runtime**: Deno (instead of npm/node/bun)
- **Framework**: React, Preact (imported via npm: or esm.sh specifiers)
- **Bundler**: `deno bundle --platform=browser` (instead of Vite)

## Architecture

### Key Differences from npm+Vite Apps

| Aspect | npm+Vite | Deno+Bundle |
|--------|----------|-------------|
| Config file | `package.json` | `deno.json` / `deno.jsonc` |
| Dependencies | `node_modules/` | Import maps in config |
| Build tool | Vite | `deno bundle` |
| JSX/TSX | Vite plugins | Native Deno support |
| Runtime | npm/node/bun | Deno CLI |
| Temp files | Vite config, mount wrapper | Mount wrapper only |

### Module Structure

New file: `app/src-tauri/src/js_app_bases/deno_bundle.rs`

```rust
pub struct DenoBundleAppBase {
    project_dir: PathBuf,
    deno_config: DenoConfig,
}

impl AppBase for DenoBundleAppBase {
    // Implementation following NpmViteAppBase pattern
}
```

## Implementation Tasks

### 1. Create `deno_bundle.rs` Implementation
**File**: `app/src-tauri/src/js_app_bases/deno_bundle.rs`

Create new AppBase implementation with:
- Detection logic for `deno.json`/`deno.jsonc`
- Framework detection from import maps
- Build using `deno bundle --platform=browser`
- No node_modules, no Vite config needed

### 2. Update `mod.rs` Registration
**File**: `app/src-tauri/src/js_app_bases/mod.rs`

Add module and register in detection priority:
```rust
pub mod deno_bundle;

pub fn detect_app_base(project_dir: &Path) -> Result<Box<dyn AppBase>, String> {
    // 1. Try npm/Vite (most common)
    if let Some(base) = npm_vite::NpmViteAppBase::detect(project_dir) {
        return Ok(base);
    }
    
    // 2. Try Deno bundle
    if let Some(base) = deno_bundle::DenoBundleAppBase::detect(project_dir) {
        return Ok(base);
    }
    
    // Future: Other app bases...
}
```

### 3. Implement Detection Logic

Detect projects with `deno.json` or `deno.jsonc` that have React/Preact in imports:

```rust
fn detect(project_dir: &Path) -> Option<Box<dyn AppBase>> {
    // Check for deno.json or deno.jsonc
    let config_path = ["deno.json", "deno.jsonc"]
        .iter()
        .find_map(|name| {
            let path = project_dir.join(name);
            path.exists().then_some(path)
        })?;
    
    // Parse config
    let contents = std::fs::read_to_string(&config_path).ok()?;
    let deno_config: DenoConfig = serde_json::from_str(&contents).ok()?;
    
    // Verify it has framework imports (react, preact, etc.)
    // ...
    
    Some(Box::new(DenoBundleAppBase {
        project_dir: project_dir.to_path_buf(),
        deno_config,
    }))
}
```

### 4. Framework Detection from Import Maps

Parse `deno.json` imports to detect framework:

```json
{
  "imports": {
    "react": "npm:react@^19",
    "react-dom": "npm:react-dom@^19",
    "react-dom/client": "npm:react-dom@^19/client"
  }
}
```

Detection logic:
- Check for `npm:react@*` → react
- Check for `npm:preact@*` → preact
- Check for `https://esm.sh/react` → react
- Support explicit `tugboat.framework` override in deno.json

### 5. Entry Point Resolution

Search for entry files:
```rust
fn resolve_entry_file(&self) -> Result<String, String> {
    let candidates = vec![
        "app.tsx", "app.jsx",
        "src/app.tsx", "src/app.jsx",
        "App.tsx", "App.jsx",
        "src/App.tsx", "src/App.jsx",
    ];
    // Find first existing file
}
```

### 6. Prepare Build Phase

Generate mount wrapper at `.tugboats-mount-wrapper.tsx` or `.jsx`:

```typescript
// Example for React
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import App from './app.tsx';

export function mountComponent(slot) {
  const root = createRoot(slot);
  root.render(createElement(App));
  return () => root.unmount();
}

export default App;
```

**Key difference**: No Vite config, no node_modules install needed!

### 7. Build Command

Execute Deno bundle:
```rust
async fn build(&self, ctx: &BuildContext) -> Result<(), String> {
    let output_path = ctx.project_dir
        .join(".tugboats-dist")
        .join(&ctx.bundle_file);
    
    std::fs::create_dir_all(output_path.parent().unwrap())?;
    
    let status = tokio::process::Command::new("deno")
        .arg("bundle")
        .arg("--platform=browser")
        .arg("--output")
        .arg(&output_path)
        .arg(".tugboats-mount-wrapper.tsx")
        .current_dir(&ctx.project_dir)
        .status()
        .await?;
    
    if !status.success() {
        return Err("Deno bundle failed".to_string());
    }
    
    Ok(())
}
```

### 8. **CRITICAL**: Handle `@tugboats/core` Externalization

**Problem**: Deno bundle doesn't support `rollupOptions.external` like Vite. We need `@tugboats/core` to be external (loaded from host at runtime).

**Solution Options**:

#### Option A: Temporary Import Map (Recommended)
Create temporary `deno.json` during build with `@tugboats/core` pointing to stub:
```json
{
  "imports": {
    "@tugboats/core": "./tugboats-core-stub.ts",
    // ... user's imports
  }
}
```

Stub file exports matching interface, real import map replaces at runtime.

#### Option B: Post-Process Bundle
After bundling, regex replace or AST transform to stub `@tugboats/core` imports:
```javascript
// Replace this:
import { input } from '@tugboats/core';
// With this:
const { input } = window.__tugboats_core__;
```

#### Option C: Wrapper Script
Don't bundle mount wrapper directly. Create intermediate loader:
```javascript
// Bundles user code only
// Wrapper imports bundle + @tugboats/core at runtime
```

**Recommendation**: Start with Option A (temporary import map), fall back to Option B if needed.

### 9. Generate Import Map

Extract framework versions from `deno.json` imports:

```rust
fn generate_importmap(&self) -> serde_json::Value {
    let mut imports = serde_json::Map::new();
    
    // Parse user's deno.json imports
    if let Some(user_imports) = &self.deno_config.imports {
        for (key, value) in user_imports {
            if key.starts_with("react") || key.starts_with("preact") {
                // Extract version from npm:react@19 or esm.sh URL
                let version = extract_version_from_specifier(value);
                imports.insert(
                    key.clone(),
                    serde_json::json!(generate_esm_sh_import(key, &version))
                );
            }
        }
    }
    
    // Always map @tugboats/core
    imports.insert(
        "@tugboats/core".to_string(),
        serde_json::json!("/assets/core/mod.js"),
    );
    
    serde_json::json!({ "imports": imports })
}
```

### 10. Generate Mount Utils

Same pattern as npm+Vite but extract versions from deno.json:

```rust
fn generate_mount_utils(&self) -> String {
    let framework = self.get_framework();
    let version = self.get_framework_version();
    
    match framework.as_str() {
        "react" => format!(/* React mount utils with ESM.sh imports */),
        "preact" => format!(/* Preact mount utils with ESM.sh imports */),
        _ => /* Fallback */
    }
}
```

### 11. Verify `bundler.rs` Detection

**File**: `app/src-tauri/src/bundler.rs` (line 118)

Already handles `deno.json`/`deno.jsonc`:
```rust
if find_config_file(&hinted_dir, &["package.json", "deno.json", "deno.jsonc"]).is_some() {
    return Ok(hinted_dir);
}
```

✅ No changes needed here.

### 12. Runtime Validation

Check if `deno` command is available:

```rust
async fn validate(&self) -> Result<(), String> {
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
    
    Ok(())
}
```

### 13. End-to-End Testing

Create test app structure:
```
test-deno-app/
├── deno.json          # React imports
├── app.tsx            # Simple React component
└── README.md
```

**Test Cases**:
1. Detection: Verify `DenoBundleAppBase` claims project
2. Build: Verify bundle is created in `.tugboats-dist/`
3. Externals: Verify `@tugboats/core` is NOT bundled inline
4. Dev mode: Verify file watcher triggers rebuilds
5. Runtime: Load in host, verify mounting works

## Data Structures

### DenoConfig
```rust
#[derive(Debug, Deserialize, Clone, Default)]
pub struct DenoConfig {
    #[serde(default)]
    pub imports: Option<HashMap<String, String>>,
    #[serde(default)]
    pub tugboat: Option<TugboatConfig>,
}

#[derive(Debug, Deserialize, Clone, Default)]
pub struct TugboatConfig {
    pub framework: Option<String>,
}
```

## File Watching (Dev Mode)

**File**: `app/src-tauri/src/devserver.rs`

No changes needed! Watcher already handles:
- `.tsx`, `.ts`, `.jsx`, `.js` files (line 169)
- Ignores build artifacts in `.tugboats-dist/` (line 149)
- Ignores temp files like `.tugboats-mount-wrapper.js` (line 157)

Just ensure we track `.tugboats-mount-wrapper.tsx` (not `.js`) in temp_files.

## Migration Path

### For Users
Existing npm+Vite apps continue working. New Deno apps are automatically detected.

### For Development
1. Implement `deno_bundle.rs` (tasks 1-10)
2. Register in `mod.rs` (task 2)
3. Test with sample app (task 13)
4. Document in main WARP.md

## Success Criteria

- ✅ Deno projects with `deno.json` + React are detected
- ✅ `deno bundle --platform=browser` produces working bundles
- ✅ `@tugboats/core` is external (not bundled inline)
- ✅ Import maps correctly resolve framework at runtime
- ✅ Dev mode file watching triggers rebuilds
- ✅ No Vite, no node_modules required
- ✅ Works alongside existing npm+Vite apps

## Future Enhancements

After initial implementation:
- Support more frameworks (Vue, Solid, Svelte via Deno)
- Support Deno's native JSR imports (`jsr:@std/...`)
- Optimize bundle size with tree-shaking flags
- Support Deno workspace configurations

## References

- Existing architecture: `app/src-tauri/src/js_app_bases/npm_vite.rs`
- Deno bundle docs: https://docs.deno.com/runtime/reference/cli/bundle/
- AppBase trait: `app/src-tauri/src/js_app_bases/mod.rs`

# Gleam/Lustre Tugboat Apps Implementation Plan

## Overview

This document outlines the implementation plan for adding Gleam/Lustre support to tugboats, allowing users to build and run tugboat apps written in Gleam with the Lustre framework.

## Architecture Analysis

### Current System

The tugboats architecture uses a trait-based abstraction (`AppBase`) to support different app types:
- **NpmViteAppBase**: Handles npm/bun/pnpm + Vite (React, Svelte, etc.)
- **Future**: Deno+Vite, Gleam/Lustre, Elm, etc.

### Build Command Reference

Gleam/Lustre apps can be built using:
```bash
gleam run -m lustre/dev build app --minify
```

This produces a minified JavaScript bundle that can be loaded in the browser.

## Implementation Plan

### Phase 1: Create GleamLustreAppBase

**File**: `app/src-tauri/src/js_app_bases/gleam_lustre.rs`

#### Detection (`detect` method)
- Check for `gleam.toml` in project directory
- Verify `lustre` or `lustre_dev_tools` dependency in `gleam.toml`
- Return `Some(Box::new(GleamLustreAppBase))` if valid

#### Validation (`validate` method)
- Check if `gleam` CLI is available: `gleam --version`
- Verify lustre/dev is available: `gleam run -m lustre/dev --help`
- Return helpful error messages with installation links if missing

#### Entry Resolution (`resolve_entry` method)
- Gleam apps typically export from `src/{app_name}.gleam`
- Look for convention: `src/app.gleam` or derive from `gleam.toml` name
- Return relative path (e.g., `"src/app.gleam"`)

#### Framework Detection (`get_framework` method)
- Always return `"lustre"` for Gleam projects with Lustre

#### Build Preparation (`prepare_build` method)
1. Parse `gleam.toml` to get package name
2. Check if `lustre/dev` is in dependencies; if not, add it
3. Create bundle filename:
   - Dev mode: `{alias}-dev.js`
   - Production: `{alias}-{timestamp}.js`
4. Create minimal mount wrapper (see below)
5. Return `BuildContext` with:
   - `project_dir`: Project root
   - `alias`: App alias
   - `entry_rel`: Entry file path
   - `framework`: `"lustre"`
   - `bundle_file`: Output filename
   - `temp_files`: Mount wrapper path
   - `is_dev`: Build mode flag

#### Build Execution (`build` method)
1. Run: `gleam run -m lustre/dev build {entry_name} --minify --outdir .tugboats-dist`
2. The output will be in `.tugboats-dist/app.mjs` (or similar)
3. Rename to expected `bundle_file` name
4. Verify bundle was created successfully

#### Import Map Generation (`generate_importmap` method)
Lustre apps compile to standalone JavaScript, so minimal imports needed:
```json
{
  "imports": {
    "@tugboats/core": "/assets/core/mod.js"
  }
}
```

#### Mount Utils Generation (`generate_mount_utils` method)
Lustre uses a different mounting pattern. Generate:
```javascript
export function mountComponent(Component, slot) {
  // Lustre apps export an `app` function that returns a Lustre application
  // The application has a `start` method that mounts to a DOM element
  if (typeof Component === 'object' && Component.start) {
    const app = Component.start(slot);
    return () => {
      // Lustre cleanup (if available)
      if (app && app.stop) app.stop();
      slot.innerHTML = '';
    };
  }
  console.error('Invalid Lustre component:', Component);
  return () => { slot.innerHTML = ''; };
}
```

#### Cleanup (`cleanup` method)
- Remove temporary mount wrapper file
- Remove `.tugboats-dist` directory (optional, or keep for caching)

### Phase 2: Register GleamLustreAppBase

**File**: `app/src-tauri/src/js_app_bases/mod.rs`

1. Add module declaration:
   ```rust
   pub mod gleam_lustre;
   ```

2. Update `detect_app_base` function to try Gleam detection:
   ```rust
   pub fn detect_app_base(project_dir: &Path) -> Result<Box<dyn AppBase>, String> {
       // Try npm/Vite first (most common case)
       if let Some(base) = npm_vite::NpmViteAppBase::detect(project_dir) {
           return Ok(base);
       }

       // Try Gleam/Lustre
       if let Some(base) = gleam_lustre::GleamLustreAppBase::detect(project_dir) {
           return Ok(base);
       }

       Err(format!(
           "No compatible app base found for project at {}. \
            Expected package.json, deno.json, or gleam.toml with supported framework.",
           project_dir.display()
       ))
   }
   ```

### Phase 3: Integration Updates

#### bundler.rs
- No changes needed; it already calls `detect_app_base` which will handle Gleam apps

#### devserver.rs
- No changes needed; file watching will work for `.gleam` files
- Update file extension filter in watcher (line 169) to include `"gleam"`:
  ```rust
  matches!(ext, "js" | "ts" | "jsx" | "tsx" | "svelte" | "css" | "gleam")
  ```

### Phase 4: Testing & Validation

1. **Create test Gleam/Lustre app**:
   ```bash
   gleam new test-gleam-lustre
   cd test-gleam-lustre
   gleam add lustre lustre_dev_tools
   ```

2. **Create minimal app** (`src/app.gleam`):
   ```gleam
   import lustre
   import lustre/element/html
   import lustre/element.{text}
   import lustre/attribute.{style}
   
   pub fn app() {
     lustre.element(
       html.div([style([#("padding", "20px")])], [
         html.h1([], [text("Hello from Gleam!")]),
         html.p([], [text("This is a Lustre tugboat app")])
       ])
     )
   }
   ```

3. **Test build command**:
   ```bash
   gleam run -m lustre/dev build app --minify
   ```

4. **Test with tugboats**:
   - Add to preferences with clone URL
   - Run `bundle_app` command
   - Verify bundle is created in `~/.tugboats/bundles/`
   - Test dev mode with `start_dev`

## Technical Considerations

### Lustre Build Output

Lustre's `dev build` command:
- Produces ESM JavaScript with `.mjs` extension
- Bundles all Gleam code + Lustre runtime
- No external framework dependencies needed (self-contained)
- Output location: configurable via `--outdir` flag

### Mount Wrapper Strategy

Unlike React/Svelte, Lustre apps:
- Export the application directly, not a component
- Use Lustre's runtime for mounting/unmounting
- Don't need framework imports in mount utils (already bundled)

### Version Pinning

Gleam projects use `manifest.toml` for lockfile:
- Parse `gleam.toml` for dependency versions
- Use locked versions in import map (if needed for CDN)
- For now, Lustre bundles everything so no runtime imports needed

### File Watching

Gleam source files use `.gleam` extension:
- Update devserver.rs to watch `*.gleam` files
- Rebuild on save (same flow as other frameworks)

### Error Handling

Common errors to handle:
- Gleam not installed
- `lustre/dev` module not available
- Build failures (type errors, missing modules)
- Invalid bundle output

## Implementation Checklist

- [ ] Create `app/src-tauri/src/js_app_bases/gleam_lustre.rs`
- [ ] Implement `GleamLustreAppBase` struct and `AppBase` trait
- [ ] Add Gleam detection to `mod.rs`
- [ ] Update devserver.rs file watcher to include `.gleam` extension
- [ ] Add Cargo dependencies if needed (TOML parsing: `toml = "0.8"`)
- [ ] Write tests for Gleam detection and building
- [ ] Create example Gleam/Lustre tugboat app
- [ ] Update WARP.md with Gleam/Lustre support documentation
- [ ] Test end-to-end: clone → bundle → dev mode → production bundle

## Future Enhancements

1. **Hot Module Replacement**: Integrate with Lustre's HMR capabilities
2. **TypeScript Definitions**: Generate types for Gleam → TS interop
3. **Multiple Entry Points**: Support multi-app Gleam projects
4. **Custom Build Flags**: Allow users to pass additional `gleam build` options
5. **Dependency Analysis**: Parse `manifest.toml` for version pinning

## References

- [Gleam Language](https://gleam.run/)
- [Lustre Framework](https://hexdocs.pm/lustre/)
- [Lustre Dev Tools](https://hexdocs.pm/lustre_dev_tools/)
- Tugboats Architecture: `app/src-tauri/src/js_app_bases/mod.rs`
- NPM/Vite Implementation: `app/src-tauri/src/js_app_bases/npm_vite.rs`

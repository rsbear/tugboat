# Tugboat App Pattern Migration Assessment & Plan

## Executive Summary

**Goal:** Simplify tugboat app development by having the host manage mount/unmount lifecycles, requiring only `export default App` from developers.

**Current State:** Apps export framework-specific mount functions (`tugboatReact`, `tugboatSvelte`)  
**Desired State:** Apps export default component; host handles all mounting logic

---

## Current Architecture Analysis

**Decision:** Drop legacy pattern support completely. This is a breaking change but enables much cleaner architecture.

### 1. New Entry Point Requirements

**Simplified Patterns:**
- `app.tsx/jsx/ts/js` (React & others)
- `App.svelte` (Svelte)

**Locations Checked:**
- Root directory
- `src/` subdirectory

**New Export Signature (All Frameworks):**
```typescript
// React
export default function App() {
  return <div>Hello World</div>;
}

// Svelte
export default function App() {
  // ...
}

// Preact, SolidJS, Vue - same pattern, framework-agnostic
```

### 2. Mount Logic (New)

**Production Mount (`MountProdApp.tsx`)**
- Always uses `default` export from module
- Framework determined from metadata
- Host manages all lifecycle (React root creation, Svelte mount, etc.)
- Uses blob URLs for ESM import

**Dev Mount (`MountDevApp.tsx`)**
- Same logic as production
- Hot reloading via file watcher
- Framework-agnostic cleanup

### 3. Build Pipeline (Current)

**Bundler (`bundler.rs`):**
- Entry resolution: `resolve_entry()` looks for `tugboats.*`, `harbor.*` files
- Vite config generation with framework plugins
- Externalizes `@tugboats/core`
- Outputs timestamped ESM bundles to `~/.tugboats/bundles/`

**Dev Server (`devserver.rs`):**
- Entry resolution: `resolve_tugboats_entry()` - same pattern
- JIT builds with file watching
- Saves dev bundles as `{alias}-dev.js`

---

## Desired Architecture Analysis

### 1. Simplified Entry Point (Desired)

**File Names:**
- `app.tsx/jsx` (React)
- `app.ts/js` (React without JSX)
- `App.svelte` (Svelte)

**Export Pattern:**
```typescript
// React
export default function App() {
  return <div>Hello World</div>
}

// Svelte (App.svelte)
<script>
  // component logic
</script>
<div>Hello World</div>
```

**Host Responsibilities:**
- Detect framework automatically
- Import and mount component
- Manage React root creation
- Manage Svelte mount/unmount
- Handle all lifecycle cleanup

---

## Gap Analysis

### Files Requiring Changes

| File | Current Role | Changes Needed |
|------|-------------|----------------|
| `bundler.rs` | Entry resolution | Update `resolve_entry()` to find `app.*` / `App.svelte` |
| `devserver.rs` | Dev entry resolution | Update `resolve_tugboats_entry()` similarly |
| `MountProdApp.tsx` | Production mounting | Add framework detection + React/Svelte mounting logic |
| `MountDevApp.tsx` | Dev mounting | Same as production mounting |
| `lib.rs` | No changes needed | Exports commands only |
| `jsrun.rs` | No changes needed | Runtime abstraction only |

### Key Challenges

#### 1. **Framework Detection at Build Time**
**Problem:** Framework detection enables future support for Preact, SolidJS, etc. Runtime detection is unreliable and inflexible.

**Solutions:**
- **Option A:** Filename convention (`.svelte` extension is clear indicator)
- **Option B:** Detect from `package.json` dependencies (look for framework packages)
- **Option C:** Explicit config field in `package.json` or `deno.json` (e.g., `"tugboat": { "framework": "react" }`)
- **Option D:** Hybrid approach with fallback chain

**Recommended:** Multi-tier detection strategy (in order):
1. **Explicit config:** `package.json."tugboat"."framework"` or `deno.json."tugboat"."framework"`
   - Clearest intent, zero ambiguity
   - Example: `{ "tugboat": { "framework": "react" } }`
2. **Filename convention:** `.svelte` file = Svelte (100% certain)
   - Auto-detected from entry point
3. **Dependency inspection:** Scan `dependencies` and `devDependencies`
   - Heuristic order: Svelte > React > Preact > SolidJS > Vue > Vanilla
   - Pick first framework found
4. **Default fallback:** Assume React (most common)

**Implementation:**
```rust
fn detect_framework(pkg: &PackageJson, entry_file: &str) -> Result<String, String> {
    // 1. Check explicit config
    if let Some(config) = &pkg.tugboat {
        if let Some(framework) = &config.framework {
            return Ok(framework.clone());
        }
    }
    
    // 2. Check filename convention
    if entry_file.ends_with(".svelte") {
        return Ok("svelte".to_string());
    }
    
    // 3. Inspect dependencies (priority order)
    let frameworks = [("svelte", "svelte"), ("react", "react"), 
                      ("preact", "preact"), ("solid-js", "solidjs"), 
                      ("vue", "vue")];
    
    for (dep_name, framework_name) in &frameworks {
        if pkg.dependencies.contains_key(*dep_name) || 
           pkg.dev_dependencies.contains_key(*dep_name) {
            return Ok(framework_name.to_string());
        }
    }
    
    // 4. Default to React
    Ok("react".to_string())
}
```

**Benefits:**
- Supports unlimited future frameworks without code changes
- Developer control when needed (explicit config)
- Auto-detection for convenience (dependency inspection)
- Deterministic and testable
- Extensible: just add to framework priority list

#### 2. **ESM Import Map Generation & Injection**
**Problem:** Different tugboat apps have different dependency trees. Host needs framework packages (React, Svelte, Preact, SolidJS, etc.), but we can't bundle all of them. Solution: generate per-app import maps.

**Recommended Approach: Build-Time Import Map Generation**

**When:** During `bundle_app` (production) or `start_dev` (development)

**How:**
1. Read tugboat app's `package.json` dependencies
2. Filter to known framework packages and their peers
3. Generate import map JSON
4. Store with bundle metadata
5. Inject into host at mount time via `<script type="importmap">`

**Implementation Strategy:**
```rust
// In bundler.rs or devserver.rs
fn generate_importmap(pkg: &PackageJson, framework: &str) -> serde_json::Value {
    let mut imports = serde_json::Map::new();
    
    // Map framework to its ESM import paths
    match framework {
        "react" => {
            if pkg.dependencies.contains_key("react") {
                imports.insert("react".to_string(), 
                    json!("https://esm.sh/react@18.3.0"));
            }
            if pkg.dependencies.contains_key("react-dom") {
                imports.insert("react-dom".to_string(), 
                    json!("https://esm.sh/react-dom@18.3.0"));
                imports.insert("react-dom/client".to_string(), 
                    json!("https://esm.sh/react-dom@18.3.0/client"));
            }
        },
        "svelte" => {
            if pkg.dependencies.contains_key("svelte") {
                imports.insert("svelte".to_string(), 
                    json!("https://esm.sh/svelte@5.0.0"));
            }
        },
        "preact" => {
            if pkg.dependencies.contains_key("preact") {
                imports.insert("preact".to_string(), 
                    json!("https://esm.sh/preact@10.19.0"));
            }
        },
        "solidjs" => {
            if pkg.dependencies.contains_key("solid-js") {
                imports.insert("solid-js".to_string(), 
                    json!("https://esm.sh/solid-js@1.9.0"));
            }
        },
        _ => {}
    }
    
    // Always map @tugboats/core
    imports.insert("@tugboats/core".to_string(), 
        json!("/assets/core/mod.js"));
    
    json!({ "imports": imports })
}
```

**Store with bundle:**
```rust
// Save alongside bundle as {alias}-{timestamp}.importmap.json
let importmap_path = bundles_dir.join(format!("{}-{}.importmap.json", alias, timestamp));
std::fs::write(&importmap_path, serde_json::to_string_pretty(&importmap)?)
    .map_err(|e| format!("Failed to write import map: {}", e))?;
```

**Alternative: CDN vs Local Strategy**

For import URLs, choose based on your needs:
- **CDN (esm.sh, skypack):** No server setup, automatic version resolution
  - Pro: Zero maintenance, global CDN
  - Con: External dependency, version conflicts possible
- **Vendored ESM:** Download and serve from `~/.tugboats/vendor/`
  - Pro: Offline-capable, reproducible builds, version control
  - Con: Requires setup, storage overhead
- **Hybrid:** CDN for dev, vendored for production
  - Pro: Fast iteration + reproducible deployments
  - Con: Most complex

**Recommendation:** Start with **CDN (esm.sh)** for MVP, migrate to vendored if needed.

#### 3. **Dynamic Import Map Injection at Mount Time**
**Problem:** Static import maps conflict when different apps use different versions.

**Solution: Runtime Injection**
```typescript
// In MountProdApp.tsx before module import
const mountBundle = async () => {
  const path = await invoke("latest_bundle_for_alias", { alias });
  const metaJson = await invoke("read_bundle_metadata", { alias });
  const importmapJson = metaJson.importmap; // Stored in metadata
  
  // Inject import map if not already present
  if (!document.querySelector(`script[data-alias="${alias}"]`)) {
    const scriptEl = document.createElement('script');
    scriptEl.type = 'importmap';
    scriptEl.setAttribute('data-alias', alias);
    scriptEl.textContent = JSON.stringify(importmapJson);
    document.head.appendChild(scriptEl);
  }
  
  // Now import bundle
  const code = await invoke("read_text_file", { path });
  const blob = new Blob([code], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const mod = await import(url);
  
  // Mount with available framework
  const framework = metaJson.framework;
  const Component = mod.default;
  // ... mounting logic
};
```

**Caveat:** Multiple `<script type="importmap">` elements can coexist, but later ones override earlier ones. Test for version conflicts.

#### 4. **Optional: Generate Import Maps at Preference Save Time**
**When:** User updates preferences (adds/updates clone configs)

**Use Case:** Pre-generate import maps for all configured apps to optimize mount time

**Implementation:**
```rust
// New Tauri command
#[tauri::command]
pub async fn pregenerate_importmaps(aliases: Vec<String>) -> Result<(), String> {
    for alias in aliases {
        // Read app's package.json from clone directory
        // Generate import map
        // Store in ~/.tugboats/bundles/{alias}.importmap.json
    }
    Ok(())
}
```

**When to use:** Optional optimization, not required for MVP. Useful for:
- Faster mount times on slow networks
- Offline capability planning
- Dependency conflict analysis

**Recommendation:** Defer to Phase 2 after MVP is stable.

#### 4. **Entry Resolution During Build**
**Problem:** Vite needs to know the exact entry file path.

**Current Logic:**
```rust
// bundler.rs:298-316
fn resolve_entry(repo_dir: &Path) -> Option<String> {
    let candidates = [
        "harbor.ts", "harbor.tsx",
        "tugboats.ts", "tugboats.tsx",
        "src/harbor.ts", "src/harbor.tsx",
        "src/tugboats.ts", "src/tugboats.tsx",
    ];
    // ...
}
```

**New Logic:**
```rust
fn resolve_entry(repo_dir: &Path, framework: &str) -> Option<(String, bool)> {
    let candidates = match framework {
        "react" => vec![
            "app.tsx", "app.jsx", "app.ts", "app.js",
            "src/app.tsx", "src/app.jsx", "src/app.ts", "src/app.js"
        ],
        "svelte" => vec!["App.svelte", "app.svelte", "src/App.svelte", "src/app.svelte"],
        _ => vec![]
    };
    // Return (path, is_svelte) tuple
}
```

#### 5. **Breaking Change: Legacy Support Removed**
**Decision:** Drop legacy `tugboats.ts`, `tugboat.ts`, and `harbor.ts` patterns entirely.

**Benefits:**
- ✅ Significantly simpler code (no fallback paths)
- ✅ Clearer error messages when wrong pattern detected
- ✅ Faster entry resolution (no extra filesystem checks)
- ✅ Easier to test and maintain
- ✅ Encourages modern best practices

**Migration Path:**
- All existing tugboat apps must migrate to new pattern
- Error message provides clear guidance
- Migration is simple: rename file + export default component
- Can be automated with a script if needed

---

## Migration Plan

### Phase 1: Backend Changes (Rust)

#### 1.1 Detect Framework at Build Time

**Add to `PackageJson` struct:**
```rust
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
pub struct TugboatConfig {
    pub framework: Option<String>,
}
```

**New `detect_framework()` with dependency inspection:**
```rust
fn detect_framework(pkg: &PackageJson, entry_file: &str) -> String {
    // 1. Explicit config takes priority
    if let Some(config) = &pkg.tugboat {
        if let Some(framework) = &config.framework {
            return framework.clone();
        }
    }
    
    // 2. Filename convention (100% certain for Svelte)
    if entry_file.ends_with(".svelte") {
        return "svelte".to_string();
    }
    
    // 3. Dependency inspection (priority order)
    let framework_deps = [
        ("svelte", "svelte"),
        ("react", "react"),
        ("preact", "preact"),
        ("solid-js", "solidjs"),
        ("vue", "vue"),
    ];
    
    for (dep_name, framework_name) in &framework_deps {
        if pkg.dependencies.contains_key(*dep_name) || 
           pkg.dev_dependencies.contains_key(*dep_name) {
            return framework_name.to_string();
        }
    }
    
    // 4. Default to React
    "react".to_string()
}
```

#### 1.2 Update Entry Resolution (`bundler.rs`)

**Simplified `resolve_entry()`:**
```rust
fn resolve_entry(repo_dir: &Path) -> Result<String, String> {
    // Only support new simplified patterns
    let candidates = vec![
        // React & other frameworks
        "app.tsx", "app.jsx", "app.ts", "app.js",
        "src/app.tsx", "src/app.jsx", "src/app.ts", "src/app.js",
        // Svelte
        "App.svelte", "app.svelte",
        "src/App.svelte", "src/app.svelte",
    ];
    
    for candidate in candidates {
        if repo_dir.join(candidate).exists() {
            return Ok(candidate.to_string());
        }
    }
    
    // If nothing found, provide clear error
    Err(
        "❌ No entry point found. Expected one of:\n  \
         - app.tsx, app.jsx, app.ts, app.js (React or other frameworks)\n  \
         - App.svelte, app.svelte (Svelte)\n\n  \
         Place your app file at the root or in src/ directory.".to_string()
    )
}
```

**Call Site Update (`bundle_app` function):**
```rust
let entry_rel = resolve_entry(&project_dir)?;  // Error if not found

// Framework detection uses dependency inspection
let framework = detect_framework(&pkg, &entry_rel);

// Store metadata including import map
let importmap = generate_importmap(&pkg, &framework);
let metadata = serde_json::json!({
    "framework": framework,
    "alias": alias,
    "timestamp": timestamp,
    "importmap": importmap
});
```

#### 1.3 Generate Bundle Metadata with Import Map

**New function in `bundler.rs`:**
```rust
fn save_bundle_metadata(
    alias: &str, 
    timestamp: u64, 
    framework: &str,
    entry_type: &str,
    importmap: &serde_json::Value
) -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("No home directory found")?;
    let bundles_dir = home.join(".tugboats").join("bundles");
    
    let meta_file = format!("{}-{}.meta.json", alias, timestamp);
    let meta_path = bundles_dir.join(&meta_file);
    
    let metadata = serde_json::json!({
        "framework": framework,
        "entry_type": entry_type,
        "alias": alias,
        "timestamp": timestamp,
        "importmap": importmap
    });
    
    std::fs::write(&meta_path, serde_json::to_string_pretty(&metadata)?)
        .map_err(|e| format!("Failed to write metadata: {}", e))?;
    
    Ok(meta_path)
}
```

**Integrate into `bundle_app`:**
```rust
// After detecting framework and generating import map
save_bundle_metadata(&alias, timestamp, &framework, &entry_type, &importmap)?;
```

#### 1.4 Update Dev Server Entry Resolution (`devserver.rs`)

**Use shared `resolve_entry()` from bundler:**
```rust
// Import from shared module or duplicate the same logic
use crate::app_resolver::resolve_entry;
```

**Update `start_dev` call site:**
```rust
let entry_rel = resolve_entry(&project_dir)?;  // Error if not found

let framework = detect_framework(&pkg, &entry_rel);
let importmap = generate_importmap(&pkg, &framework);
```

#### 1.4 Add Metadata Read Command (`bundler.rs`)

**New Tauri command:**
```rust
#[tauri::command]
pub async fn read_bundle_metadata(alias: String) -> Result<serde_json::Value, String> {
    let home = dirs::home_dir().ok_or("No home directory found")?;
    let bundles_dir = home.join(".tugboats").join("bundles");
    
    // Find latest metadata file for alias
    let pattern = format!("{}-*.meta.json", alias);
    // Scan and find highest timestamp
    // Read and return JSON
}
```

**Register in `lib.rs`:**
```rust
invoke_handler![
    // ... existing handlers
    bundler::read_bundle_metadata,
]
```

### Phase 2: Frontend Changes (TypeScript/TSX)

#### 2.1 Update Production Mount (`MountProdApp.tsx`)

**Add metadata fetch and dynamic import map injection:**
```typescript
const mountBundle = async () => {
  try {
    // 1. Get bundle path and metadata
    const path = await invoke("latest_bundle_for_alias", { alias });
    const metaJson = await invoke("read_bundle_metadata", { alias });
    const { framework, entry_type: entryType, importmap } = metaJson;
    
    // 2. Inject import map dynamically (before module import)
    if (importmap) {
      injectImportMap(alias, importmap);
    }
    
    // 3. Load bundle
    const code = await invoke("read_text_file", { path });
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const mod = await import(url);
    URL.revokeObjectURL(url);
    
    // 4. Mount using framework-agnostic logic
    const cleanup = await mountNewPattern(mod, framework, slotRef.current);
    cleanupRef.current = cleanup;
    
    console.log("🚢 DEBUG: Successfully mounted", alias, "with framework:", framework);
  } catch (err) {
    console.error("Failed to mount tugboat app for alias", alias, err);
  }
};

// Helper to inject import map
function injectImportMap(alias: string, importmap: Record<string, any>) {
  // Check if import map for this alias already exists
  if (!document.querySelector(`script[data-tugboat-alias="${alias}"]`)) {
    const scriptEl = document.createElement('script');
    scriptEl.type = 'importmap';
    scriptEl.setAttribute('data-tugboat-alias', alias);
    scriptEl.textContent = JSON.stringify({ imports: importmap.imports || importmap });
    document.head.appendChild(scriptEl);
    console.log("🚢 DEBUG: Injected import map for", alias);
  }
}

// Framework-agnostic mount function
async function mountNewPattern(
  mod: any, 
  framework: string, 
  slot: HTMLElement
): Promise<() => void> {
  const Component = mod.default;
  
  if (!Component) {
    throw new Error(`No default export in bundle for framework: ${framework}`);
  }
  
  switch (framework) {
    case 'react':
    case 'preact': {
      // Both use similar APIs
      const moduleName = framework === 'preact' ? 'preact/compat' : 'react-dom/client';
      const { createRoot } = await import(moduleName);
      const root = createRoot(slot);
      root.render(/* @jsx */ Component({}));
      return () => root.unmount();
    }
    
    case 'svelte': {
      const { mount, unmount } = await import('svelte');
      const instance = mount(Component, { target: slot });
      return () => unmount(instance);
    }
    
    case 'solidjs': {
      const { render } = await import('solid-js/web');
      const dispose = render(() => Component(), slot);
      return () => dispose();
    }
    
    case 'vue': {
      const { createApp } = await import('vue');
      const app = createApp(Component);
      app.mount(slot);
      return () => app.unmount();
    }
    
    default:
      throw new Error(`Unsupported framework: ${framework}`);
  }
}

```

#### 2.2 Update Dev Mount (`MountDevApp.tsx`)

**Mirror changes to `loadDevBundle`:**
```typescript
const loadDevBundle = async (alias: string) => {
  await unmountModule();
  
  if (!slotRef.current) return;
  
  try {
    // Fetch metadata including import map
    const metaJson = await invoke("read_bundle_metadata", { alias });
    const { framework, entry_type: entryType, importmap } = metaJson;
    
    // Inject import map before loading bundle
    if (importmap) {
      injectImportMap(alias, importmap);
    }
    
    // Load bundle from dev bundle path
    const home = await invoke("get_home_dir");
    const bundlePath = `${home}/.tugboats/bundles/${alias}-dev.js`;
    const bundleContent = await invoke("read_text_file", { path: bundlePath });
    
    const blob = new Blob([bundleContent], { type: "application/javascript" });
    const bundleUrl = URL.createObjectURL(blob);
    
    const mod = await import(/* @vite-ignore */ bundleUrl);
    URL.revokeObjectURL(bundleUrl);
    
    if (!mod) return;
    
    moduleRef.current = mod;
    
    // Mount using framework-agnostic logic
    const dispose = await mountNewPattern(mod, framework, slotRef.current);
    
    if (dispose) cleanupRef.current = dispose;
    setStatus("active");
  } catch (e) {
    console.error("Failed to load dev bundle:", e);
    addLog("error", `Failed to load bundle: ${e}`);
    setStatus("error");
  }
};

// Share import map injection with production mount
function injectImportMap(alias: string, importmap: Record<string, any>) {
  if (!document.querySelector(`script[data-tugboat-alias="${alias}"]`)) {
    const scriptEl = document.createElement('script');
    scriptEl.type = 'importmap';
    scriptEl.setAttribute('data-tugboat-alias', alias);
    scriptEl.textContent = JSON.stringify({ imports: importmap.imports || importmap });
    document.head.appendChild(scriptEl);
  }
}

// Share mountNewPattern and other mount logic with production mount
// (Extract to shared module or duplicate for now)
```

#### 2.3 Framework Dependencies & Import Maps

**Strategy: Dynamic Generation + CDN-backed ESM Imports**

**Why Dynamic?** Each tugboat app has different framework needs (React vs Svelte vs SolidJS). Static host import maps would need to bundle everything.

**Solution Architecture:**
1. **Build time (bundler/devserver):** Generate import maps based on app's `package.json`
2. **Runtime:** Inject app-specific import map before module import
3. **Backend:** CDN URLs (esm.sh) for framework packages

**No changes needed to host HTML!** Import maps are injected dynamically.

**Generated Import Map Example (for React app):**
```json
{
  "imports": {
    "react": "https://esm.sh/react@18.3.0",
    "react-dom/client": "https://esm.sh/react-dom@18.3.0/client",
    "@tugboats/core": "/assets/core/mod.js"
  }
}
```

**Generated Import Map Example (for Svelte app):**
```json
{
  "imports": {
    "svelte": "https://esm.sh/svelte@5.0.0",
    "@tugboats/core": "/assets/core/mod.js"
  }
}
```

**Benefits:**
- ✅ No host bundle bloat (frameworks loaded on-demand via CDN)
- ✅ Framework-agnostic (same system works for React, Svelte, Preact, SolidJS, Vue)
- ✅ App-specific versions supported (React 17 vs 18, different Svelte versions)
- ✅ Future extensible (add new framework just needs dependency inspection)

**CDN Choice: esm.sh**
- Fast, reliable global CDN
- Auto-resolves dependencies
- Version pinning supported
- No API key needed
- Fallback to skypack.dev if needed

**Future Optimization:** Vendored ESM
If CDN dependency is problematic, add phase 2 feature:
- Download framework ESM builds during preference save
- Store in `~/.tugboats/vendor/`
- Switch import map URLs to local paths
- Enable offline mode

### Phase 3: Testing & Validation

#### 3.1 Create Test Apps

**New Pattern React App:**
```bash
test-bun-react/
├── package.json
└── app.tsx  # export default function App() { ... }
```

**New Pattern Svelte App:**
```bash
test-bun-svelte/
├── package.json
└── App.svelte
```

**Additional Test Apps:**
- Preact example (`test-bun-preact`)
- SolidJS example (`test-bun-solidjs`)

#### 3.2 Test Cases

1. **New Pattern - React:**
   - Bundle builds successfully
   - Metadata generated correctly
   - Production mount works
   - Dev mount + hot reload works
   - Cleanup properly unmounts

2. **New Pattern - Svelte:**
   - Bundle builds successfully
   - Metadata generated correctly
   - Production mount works
   - Dev mount + hot reload works
   - Cleanup properly unmounts

3. **Migration Validation:**
   - Verify old app files produce helpful error messages
   - Test error message clarity and guidance

4. **Edge Cases:**
   - Missing default export (clear error)
   - Both old and new files present (new takes priority)
   - Framework detection failures (fallback to React)

### Phase 4: Migration Guide & Documentation

#### 4.1 Create Migration Guide

**File:** `MIGRATION_GUIDE.md`

**Contents:**
- Comparison of old vs new patterns
- Step-by-step migration instructions
- Code examples for both frameworks
- Common pitfalls and solutions
- Timeline for legacy deprecation

#### 4.2 Update WARP.md

Add section on new simplified pattern:
```markdown
## Tugboat App Development (Simplified Pattern)

### React Apps
Create `app.tsx`:
```tsx
export default function App() {
  return <div>Hello World</div>;
}
```

### Svelte Apps
Create `App.svelte`:
```svelte
<div>Hello World</div>
```

**No mount functions needed!** The host handles all lifecycle management.
```

### Phase 5: Rollout Strategy

#### Timeline

**Week 1: Backend Implementation**
- Day 1-2: Update entry resolution in `bundler.rs` and `devserver.rs`
- Day 3: Implement metadata generation and storage
- Day 4: Add metadata read command
- Day 5: Testing and bug fixes

**Week 2: Frontend Implementation**
- Day 1-2: Update `MountProdApp.tsx` with new mount logic
- Day 3-4: Update `MountDevApp.tsx` with new mount logic
- Day 5: Set up import maps for React/Svelte

**Week 3: Testing & Validation**
- Day 1-2: Create new pattern test apps
- Day 3-4: Run comprehensive test suite
- Day 5: Fix issues and edge cases

**Week 4: Documentation & Migration**
- Day 1-2: Write migration guide
- Day 3: Update WARP.md and other docs
- Day 4-5: Migrate existing test apps to new pattern

#### Success Criteria

✅ All new pattern apps build without errors (React, Svelte, Preact, SolidJS)  
✅ Production mount works correctly for all frameworks  
✅ Dev mode hot reload works with new pattern  
✅ Old pattern files produce clear, helpful error messages  
✅ Import maps generated correctly for each app  
✅ Framework detection works via all methods (config, filename, deps)  
✅ Documentation complete and clear  
✅ All test apps migrated to new pattern

---

## Risk Mitigation

### Risk 1: Breaking Change - Existing Apps Need Migration
**Impact:** All existing tugboat apps must be updated  
**Mitigation:** 
- Provide clear error message with migration instructions
- Create migration script to automate renaming
- Migration is straightforward: file rename + export default
- Update all documentation and examples upfront

### Risk 2: Framework Detection Edge Cases
**Impact:** App with conflicting framework dependencies  
**Mitigation:**
- Prioritize explicit config (`package.json.tugboat.framework`)
- Clear detection order: config → filename → deps
- Log framework detection decision for debugging

### Risk 3: Import Map CDN Dependency
**Impact:** Network issues prevent app mounting  
**Mitigation:**
- esm.sh is reliable and widely used
- Fallback to skypack.dev if needed
- Phase 2: Add vendored ESM option for offline capability

### Risk 4: Dev/Prod Parity
**Mitigation:** Share mount logic between `MountProdApp` and `MountDevApp` via extracted utilities

---

## Open Questions

1. **Should we support props passing to mounted components?**
   - Current legacy pattern allows this for Svelte
   - New pattern would need standardized API
   - Recommendation: Start without, add if needed
Answer: No, not for now. This will be handled in the future.

2. **How to handle TypeScript types for new pattern?**
   - Create `@tugboats/types` package with component interfaces?
   - Document expected signature in WARP.md?
   - Recommendation: Minimal types, rely on framework defaults

3. **Should we support multiple entry files in one repo?**
   - Current: Single `tugboats.ts` per app
   - Future: Multi-app repos with `apps/app1/app.tsx`, `apps/app2/app.tsx`?
   - Recommendation: Defer to future work
Answer: We already support multi app repos, but we want 1 app per package.json

4. **Timeline for deprecating legacy pattern?**
   - Keep indefinitely?
   - Remove in 6 months?
   - Recommendation: Keep for 1 year with warnings, then remove
Answer: Deprecate now and completely remove

---

## Conclusion

The migration to simplified tugboat app patterns is **feasible and recommended**. The architecture already has partial support for default exports, making this a natural evolution rather than a complete rewrite.

**Key Benefits:**
- Dramatically simpler developer experience
- Matches conventions from create-react-app, Vite, SvelteKit
- Clearer separation of concerns (host handles mounting)
- Easier onboarding for new developers

**Implementation Complexity:** Medium (simpler than if supporting legacy patterns)
- Backend changes: ~250 lines of Rust (no fallback paths)
  - Framework detection with dependency inspection
  - Import map generation for all frameworks
  - Simplified entry resolution
- Frontend changes: ~200 lines of TypeScript (framework-agnostic mounting)
  - Dynamic import map injection
  - Multi-framework mount logic
- Shared utilities: ~150 lines (extract to `app_resolver` module)
- Testing overhead: ~2-3 days
- Documentation: ~1 day
- Existing app migration: Depends on app count, but simple (rename + export)

**Key Implementation Notes:**

1. **Shared Utility Functions**
   - Extract `resolve_entry()`, `detect_framework()`, and `generate_importmap()` to shared modules
   - Use in both `bundler.rs` and `devserver.rs` to avoid duplication
   - Recommendation: Create `crate::app_resolver` module

2. **Framework Support Matrix**
   - **MVP:** React, Svelte (existing support)
   - **Phase 1b:** Preact, SolidJS, Vue (dependency inspection ready)
   - **Future:** Custom frameworks via explicit config

3. **ESM Import Map Lifecycle**
   - **Generated:** During `bundle_app()` or `start_dev()`
   - **Stored:** In metadata JSON alongside bundle
   - **Injected:** Dynamically at mount time (dev & prod)
   - **Cleanup:** Old scripts removed when app unmounts (optional, not critical)

4. **Clean Breaking Change**
   - No fallback paths or legacy logic
   - Simpler code, easier to maintain
   - Clear error messages guide developers to new pattern
   - All entry point resolution and mount logic simplified

5. **Testing Considerations**
   - Test with frameworks beyond React/Svelte early
   - Validate import map generation for all supported frameworks
   - Check for version conflicts between apps
   - Verify CDN fallback behavior

**Recommended Next Steps:**
1. Review this plan with team
2. Discuss framework priority order and supported frameworks
3. Create feature branch
4. Implement Phase 1 (backend) first with shared modules
5. Validate import map generation before frontend work
6. Proceed to frontend implementation
7. Create test apps for each framework
8. Test version conflict scenarios

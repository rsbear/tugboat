# Dev Mode Alternative: Vite Dev Server Approach

## Why the Current Approach is Failing

The current dev mode implementation is overengineered and fragile:

1. **Complex Bundle Chain**: Clone → Watch → Build → Save bundle → Import → Mount
2. **Module Caching Issues**: Browser caches modules despite blob URLs and cache-busting
3. **State Management Complexity**: Managing watchers, sessions, and rebuild triggers
4. **Bundle Management**: Timestamp-based bundles accumulate and create confusion
5. **Hot Reload Problems**: Custom remount logic is error-prone

**Root Problem**: We're reimplementing what Vite already does perfectly.

## New Approach: Native Vite Dev Servers

Instead of building bundles, start actual Vite dev servers for clones and render their output.

### Core Concept

```
User types: myapp dev
→ Start Vite dev server on port 5173+ for clone directory  
→ Dev server runs at http://localhost:5173

User types: myapp  
→ Render dev server output in tugboat slot (iframe or fetch)
→ Vite handles HMR automatically via WebSocket
```

### Benefits

1. **Standard Dev Experience**: Uses Vite's built-in dev server and HMR
2. **Zero Custom Bundling**: No file watchers, rebuild logic, or bundle management  
3. **Automatic Hot Reload**: Vite's HMR "just works" - no custom remount logic
4. **Familiar Workflow**: Developers get the exact same experience as `npm run dev`
5. **Simplified Architecture**: Backend manages processes, frontend renders output

## Implementation Plan

### Backend Changes (Rust)

#### 1. Vite Process Management
```rust
// New module: vite_server.rs
struct ViteServer {
    alias: String,
    port: u16,
    process: Child,
    clone_path: PathBuf,
}

struct ViteServerManager {
    servers: HashMap<String, ViteServer>,
    port_allocator: PortAllocator, // Start from 5173, increment
}

impl ViteServerManager {
    async fn start_server(&mut self, alias: String) -> Result<u16, String> {
        // 1. Find clone directory for alias
        // 2. Allocate available port (5173, 5174, 5175, ...)
        // 3. Run: cd clone_path && npx vite dev --port {port} --host 0.0.0.0
        // 4. Wait for "Local: http://localhost:{port}" in stdout
        // 5. Store process and return port
    }
    
    async fn stop_server(&mut self, alias: String) -> Result<(), String> {
        // Kill process, free port, remove from hashmap
    }
    
    fn get_server_url(&self, alias: &str) -> Option<String> {
        // Return http://localhost:{port} if server is running
    }
}
```

#### 2. New Tauri Commands
```rust
#[tauri::command]
async fn start_vite_dev_server(alias: String) -> Result<String, String> {
    // Returns: "http://localhost:5173" or error
}

#[tauri::command]  
async fn stop_vite_dev_server(alias: String) -> Result<(), String> {
    // Stops the server process
}

#[tauri::command]
async fn get_vite_server_url(alias: String) -> Result<Option<String>, String> {
    // Returns current server URL or None if not running
}

#[tauri::command]
async fn list_running_vite_servers() -> Result<Vec<String>, String> {
    // Returns list of aliases with running servers
}
```

#### 3. Process Lifecycle
- **Auto-cleanup**: Stop all servers when Tugboats app closes
- **Port management**: Allocate ports 5173-5199, handle conflicts gracefully
- **Error handling**: Detect if `vite` command not found, port already in use, etc.

### Frontend Changes (JavaScript)

#### 1. Updated Dev Control UI
```javascript
// When user types: myapp dev
async function showViteDevControlUI(alias) {
  const serverUrl = await invoke("get_vite_server_url", { alias });
  const isRunning = !!serverUrl;
  
  tugboatsSlot.innerHTML = `
    <div class="vite-dev-controls">
      <h3>🚀 Vite Dev Server: ${alias}</h3>
      ${isRunning ? 
        `<p>✅ Running at: <a href="${serverUrl}" target="_blank">${serverUrl}</a></p>
         <button onclick="stopViteServer('${alias}')">🛑 Stop Server</button>` :
        `<p>⭕ Server stopped</p>
         <button onclick="startViteServer('${alias}')">🚀 Start Server</button>`
      }
    </div>
  `;
}
```

#### 2. Server Control Functions
```javascript
async function startViteServer(alias) {
  try {
    const serverUrl = await invoke("start_vite_dev_server", { alias });
    console.log(`Vite server started: ${serverUrl}`);
    await showViteDevControlUI(alias); // Refresh UI
  } catch (err) {
    console.error("Failed to start Vite server:", err);
  }
}

async function stopViteServer(alias) {
  try {
    await invoke("stop_vite_dev_server", { alias });
    console.log(`Vite server stopped: ${alias}`);
    await showViteDevControlUI(alias); // Refresh UI  
  } catch (err) {
    console.error("Failed to stop Vite server:", err);
  }
}
```

#### 3. Rendering Dev Server Output

**Approach: Fetch and Execute in Host Context**
```javascript
async function mountViteDevServer(alias) {
  const serverUrl = await invoke("get_vite_server_url", { alias });
  if (!serverUrl) {
    showViteDevRequired(alias);
    return;
  }
  
  try {
    // Fetch the tugboat entry module directly from Vite dev server
    // Vite serves at: http://localhost:5173/src/tugboats.tsx
    const moduleUrl = `${serverUrl}/src/tugboats.tsx`;
    
    // Dynamic import with cache busting for HMR
    const timestamp = Date.now();
    const module = await import(`${moduleUrl}?t=${timestamp}`);
    
    // Mount using standard tugboat exports (same as bundle approach)
    const slot = tugboatsSlot;
    let cleanup = null;
    
    if (module && typeof module.tugboatReact === "function") {
      const res = module.tugboatReact(slot);
      if (typeof res === "function") cleanup = res;
    } else if (module && typeof module.tugboatSvelte === "function") {
      const res = module.tugboatSvelte(slot);
      if (typeof res === "function") cleanup = res;
    } else if (module && typeof module.default === "function") {
      const res = module.default(slot);
      if (typeof res === "function") cleanup = res;
    }
    
    currentMounted = { alias, cleanup };
    
  } catch (err) {
    console.error("Failed to load from Vite dev server:", err);
    tugboatsSlot.innerHTML = `
      <div class="vite-dev-error">
        <h3>🔥 Vite Dev Server Error</h3>
        <p>Failed to load module: ${err.message}</p>
        <p>Check that dev server is running and module exports tugboat functions.</p>
      </div>
    `;
  }
}
```

#### 4. Updated Input Logic
```javascript
input.subscribe(async (s) => {
  const devCommand = parseDevCommand(s.raw);
  if (devCommand) {
    await showViteDevControlUI(devCommand.alias);
    return;
  }
  
  const alias = parseAlias(s.raw);
  if (alias && aliasMap.has(alias)) {
    // Check if it's a clone with running dev server
    const stored = await prefsKV.get(["user"]);
    const isClone = /* check if alias is in clones[] */;
    
    if (isClone) {
      await mountViteDevServer(alias);
    } else {
      await mountTugboatForAlias(alias); // Regular app bundle
    }
  }
});
```

## Technical Considerations

### Port Management
- **Range**: Use ports 5173-5199 (27 concurrent dev servers)
- **Detection**: Check if port is available before allocation
- **Conflicts**: If Vite can't start on assigned port, try next available
- **Cleanup**: Free ports when servers stop

### ESM Module Sharing Problem
- **Iframe Isolation**: Iframes can't access host's ESM modules (`@tugboats/core`)
- **Context Requirement**: Clone apps need to run in same JS context as host
- **Solution**: Fetch dev server content and inject into same context

### Process Management
- **Process Cleanup**: Ensure child processes die with parent
- **Error Detection**: Parse Vite stdout/stderr for startup success/failure
- **Resource Usage**: Monitor memory/CPU of dev server processes

### Vite Configuration
Dev servers need tugboat-specific config:
```javascript
// Auto-generated vite.config.mjs for dev mode
export default {
  server: {
    port: 5173, // Assigned port
    host: '0.0.0.0',
    cors: true,
    headers: {
      // Allow ES modules to be imported from different origins
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },
  build: {
    // Not used in dev mode  
  },
  // Ensure Vite serves modules correctly for cross-origin imports
  optimizeDeps: {
    exclude: ['@tugboats/core'] // Don't pre-bundle host modules
  }
}
```

## User Experience

### Workflow
1. **Start Dev**: Type `myapp dev` → see start/stop controls
2. **Launch Server**: Click "🚀 Start Server" → Vite starts on localhost:5173
3. **View App**: Type `myapp` → imports module directly from dev server
4. **Make Changes**: Edit files → Vite recompiles → next import gets updated module
5. **Stop Dev**: Click "🛑 Stop Server" → clean shutdown

### Error States
- **No Vite**: "Vite not found. Run `npm install vite` in clone directory."
- **Port Busy**: "Port 5173 busy, trying 5174..."  
- **Build Error**: Show Vite's error output directly
- **Server Down**: "Dev server stopped. Click start to restart."

## Implementation Phases

### Phase 1: Basic Vite Server Management
1. Create `vite_server.rs` with process management
2. Add Tauri commands for start/stop/status
3. Create simple dev control UI

### Phase 2: Direct Module Import Rendering  
1. Implement direct module imports from Vite dev server
2. Add CORS configuration and module serving
3. Test hot reloading with cache-busting imports

### Phase 3: Error Handling & Polish
1. Robust port management and error states
2. Process cleanup and resource management
3. Better UI feedback and status indicators

### Phase 4: Advanced Features (Optional)
1. WebSocket integration for automatic remount on file changes
2. Multiple server management UI
3. Custom Vite plugin for tugboat-specific optimizations

## Advantages Over Current Approach

1. **Simplicity**: Uses standard Vite dev server instead of custom bundling
2. **Module Sharing**: Direct imports maintain access to host ESM modules
3. **Performance**: No bundle generation, direct module imports from dev server
4. **Developer Experience**: Live recompilation on file changes via Vite
5. **Debugging**: Source maps and dev tools work with original TypeScript files
6. **Hot Reloading**: Import fresh modules on each mount for instant updates

## Migration Strategy

1. **Keep current system running** for regular app bundles
2. **Add Vite server management** alongside existing dev mode
3. **Switch clone dev mode** to use Vite servers instead of bundling
4. **Gradually deprecate** old dev mode bundling system
5. **Clean up** unused dev mode code once Vite approach is stable

This approach is simpler, more reliable, and provides a better developer experience by leveraging existing tools instead of reinventing them.
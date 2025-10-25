// Shared utilities for mounting tugboat apps across different frameworks
// NOTE: Framework mounting functions are injected at runtime via generated mount utils

/**
 * Injects an import map dynamically for a tugboat app
 */
export function injectImportMap(alias: string, importmap: Record<string, any>) {
  // Check if import map for this alias already exists
  if (!document.querySelector(`script[data-tugboat-alias="${alias}"]`)) {
    const scriptEl = document.createElement('script');
    scriptEl.type = 'importmap';
    scriptEl.setAttribute('data-tugboat-alias', alias);
    scriptEl.textContent = JSON.stringify({ imports: importmap.imports || importmap });
    document.head.appendChild(scriptEl);
    console.log('🚢 DEBUG: Injected import map for', alias);
  }
}

/**
 * Loads the mount utilities script for a specific framework
 * This is generated server-side and includes the proper framework imports
 */
export async function loadMountUtils(mountUtilsPath: string): Promise<any> {
  const { invoke } = (window as any).__TAURI__.core;
  
  try {
    const utilsContent = await invoke("read_text_file", { path: mountUtilsPath });
    
    const blob = new Blob([utilsContent], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const mountUtils = await import(/* @vite-ignore */ url);
    URL.revokeObjectURL(url);
    
    return mountUtils;
  } catch (e) {
    console.error('Failed to load mount utils from', mountUtilsPath, e);
    throw e;
  }
}

/**
 * Mounts using the new pattern with server-generated mount utils
 */
export async function mountNewPattern(
  mod: any,
  framework: string,
  slot: HTMLElement,
  mountUtilsPath: string
): Promise<() => void> {
  const Component = mod.default;

  if (!Component) {
    throw new Error(`No default export in bundle for framework: ${framework}`);
  }

  // Load framework-specific mount utilities
  const mountUtils = await loadMountUtils(mountUtilsPath);
  
  if (!mountUtils || typeof mountUtils.mountComponent !== 'function') {
    throw new Error(`Mount utils not available for ${framework}`);
  }
  
  return mountUtils.mountComponent(Component, slot);
}

/**
 * Attempts to mount using legacy patterns for backwards compatibility
 * Returns cleanup function if successful, null otherwise
 */
export async function tryLegacyMount(
  mod: any,
  slot: HTMLElement
): Promise<(() => void) | null> {
  // Try legacy harbor mount
  if (mod && typeof mod.harborMount === 'function') {
    console.log('🚢 DEBUG: Using legacy harborMount');
    mod.harborMount(slot);
    if (typeof mod.unmount === 'function') {
      return () => {
        try {
          mod.unmount();
        } catch {}
      };
    }
    return null;
  }

  // Try legacy tugboat React
  if (mod && typeof mod.tugboatReact === 'function') {
    console.log('🚢 DEBUG: Using legacy tugboatReact');
    const res = mod.tugboatReact(slot);
    if (typeof res === 'function') return res;
    return null;
  }

  // Try legacy tugboat Svelte
  if (mod && typeof mod.tugboatSvelte === 'function') {
    console.log('🚢 DEBUG: Using legacy tugboatSvelte');
    const res = mod.tugboatSvelte(slot);
    if (typeof res === 'function') return res;
    return null;
  }

  return null;
}

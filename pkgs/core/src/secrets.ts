// pkgs/core/secrets.ts
type TauriInvoke = (
  cmd: string,
  args?: Record<string, unknown>,
) => Promise<any>;

function getInvoker(): TauriInvoke {
  const w = globalThis as any;
  const invoke = w.__TAURI__?.invoke;
  if (!invoke) {
    throw new Error("Tauri invoke not available on window.__TAURI__");
  }
  return invoke;
}

function decode(bytes: number[]): string {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * Read-only secret access for tugboat apps.
 * Host controls secret creation and lifecycle.
 */
export async function get(key: string): Promise<string> {
  const invoke = getInvoker();
  
  // Get vault config
  const config = await invoke("vault_get_config");
  const { snapshotPath, clientName } = config;
  
  // Get secret from stronghold
  const res: number[] | null = await invoke("plugin:stronghold|get_store_record", {
    snapshotPath,
    client: clientName,
    key,
  });
  
  if (!res) {
    throw new Error(`Secret "${key}" not found`);
  }
  
  return decode(res);
}

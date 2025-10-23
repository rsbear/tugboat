// app/src/common/secrets_internal.ts
type TauriInvoke = (
  cmd: string,
  args?: Record<string, unknown>,
) => Promise<any>;

function getInvoker(): TauriInvoke {
  const { invoke } = (window as any).__TAURI__.core;
  if (!invoke) {
    throw new Error("Tauri invoke not available on window.__TAURI__");
  }
  return invoke;
}

function encode(input: string | Uint8Array): number[] {
  if (input instanceof Uint8Array) return Array.from(input);
  return Array.from(new TextEncoder().encode(input));
}

export async function initVault(
  passphrase: string,
  clientName = "tugboat-core",
): Promise<void> {
  const invoke = getInvoker();

  // First, store the config in our Rust state
  await invoke("vault_initialize", { vaultPassword: passphrase, clientName });

  // Get the config (snapshot path and client name)
  const config = await invoke("vault_get_config");
  const { snapshotPath, clientName: storedClientName } = config;

  // Initialize the stronghold plugin
  await invoke("plugin:stronghold|initialize", {
    snapshotPath,
    password: passphrase,
  });

  // Try to load the client, if it doesn't exist, create it
  try {
    await invoke("plugin:stronghold|load_client", {
      snapshotPath,
      client: storedClientName,
    });
  } catch (e) {
    // Client doesn't exist, create it
    await invoke("plugin:stronghold|create_client", {
      snapshotPath,
      client: storedClientName,
    });
  }
}

export async function saveVault(): Promise<void> {
  const invoke = getInvoker();
  const config = await invoke("vault_get_config");
  const { snapshotPath } = config;

  await invoke("plugin:stronghold|save", { snapshotPath });
}

export async function set(
  key: string,
  value: string | Uint8Array,
): Promise<void> {
  const invoke = getInvoker();
  const config = await invoke("vault_get_config");
  const { snapshotPath, clientName } = config;

  await invoke("plugin:stronghold|save_store_record", {
    snapshotPath,
    client: clientName,
    key,
    value: encode(value),
    lifetime: null,
  });
}

export async function remove(key: string): Promise<void> {
  const invoke = getInvoker();
  const config = await invoke("vault_get_config");
  const { snapshotPath, clientName } = config;

  await invoke("plugin:stronghold|remove_store_record", {
    snapshotPath,
    client: clientName,
    key,
  });
}

export async function destroyVaultSession(): Promise<void> {
  const invoke = getInvoker();
  await invoke("vault_destroy");
}

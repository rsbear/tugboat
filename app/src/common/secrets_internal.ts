// app/src/common/secrets_internal.ts
import { kv } from "npm:@tugboats/core@0.0.15";

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

function decode(bytes: number[]): string {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// KV namespace for encrypted secrets
const secretsKV = kv("secrets");

// Master passphrase cached in memory for the session
let cachedMasterPhrase: string | null = null;

/**
 * Initialize vault by verifying the master passphrase.
 * Tests decryption of a canary value if it exists.
 */
export async function initVault(passphrase: string): Promise<void> {
  const invoke = getInvoker();

  // Check if we have any existing secrets by trying to load the canary
  const canaryResult = await secretsKV.get(["__canary__"]);

  if (canaryResult.isOk() && canaryResult.value() !== null) {
    // Vault exists, verify passphrase with canary
    const encryptedCanary = canaryResult.value() as number[];
    try {
      await invoke("decrypt", {
        encryptedValue: encryptedCanary,
        masterPhrase: passphrase,
      });
      // Decryption succeeded, passphrase is correct
    } catch (e) {
      throw new Error("Incorrect master passphrase");
    }
  } else {
    // No vault exists yet, create canary
    const canaryValue = encode("tugboats-vault-canary");
    const encryptedCanary: number[] = await invoke("encrypt", {
      value: canaryValue,
      masterPhrase: passphrase,
    });
    await secretsKV.set(["__canary__"], encryptedCanary);
  }

  // Cache the passphrase for this session
  cachedMasterPhrase = passphrase;
}

/**
 * Check if vault file/canary exists
 */
export async function vaultExists(): Promise<boolean> {
  const canaryResult = await secretsKV.get(["__canary__"]);
  return canaryResult.isOk() && canaryResult.value() !== null;
}

/**
 * Set an encrypted secret in KV storage
 */
export async function set(
  key: string,
  value: string | Uint8Array,
): Promise<void> {
  if (!cachedMasterPhrase) {
    throw new Error("Vault not initialized. Call initVault first.");
  }

  const invoke = getInvoker();
  const plaintext = encode(value);

  // Encrypt the value
  const encrypted: number[] = await invoke("encrypt", {
    value: plaintext,
    masterPhrase: cachedMasterPhrase,
  });

  // Store in KV
  await secretsKV.set([key], encrypted);
}

/**
 * Get and decrypt a secret from KV storage
 */
export async function get(key: string): Promise<string | null> {
  if (!cachedMasterPhrase) {
    throw new Error("Vault not initialized. Call initVault first.");
  }

  const invoke = getInvoker();

  // Load from KV
  const result = await secretsKV.get([key]);
  if (!result.isOk() || result.value() === null) {
    return null;
  }

  const encrypted = result.value() as number[];

  // Decrypt the value
  const decrypted: number[] = await invoke("decrypt", {
    encryptedValue: encrypted,
    masterPhrase: cachedMasterPhrase,
  });

  return decode(decrypted);
}

/**
 * Remove a secret from KV storage
 */
export async function remove(key: string): Promise<void> {
  await secretsKV.delete([key]);
}

/**
 * Clear the cached master passphrase (lock the vault)
 */
export async function lockVault(): Promise<void> {
  cachedMasterPhrase = null;
}

/**
 * Check if vault is currently unlocked
 */
export function isUnlocked(): boolean {
  return cachedMasterPhrase !== null;
}

/**
 * List all secret keys stored in the vault
 */
export async function listAllSecrets(): Promise<string[]> {
  const result = await secretsKV.list([]);
  
  if (!result.isOk()) {
    return [];
  }
  
  const items = result.values();
  return items
    .map(item => item.metadata.key[1]) // Skip "secrets" namespace prefix
    .filter(key => key !== "__canary__"); // Filter out canary
}

// pkgs/core/src/secrets.ts

/**
 * Get a secret from the tugboats vault.
 * The host manages secret storage and encryption.
 * This function provides read-only, synchronous access for tugboat apps.
 * 
 * All secrets are decrypted and cached in memory when the vault is unlocked.
 * This function reads from that cache, making it fast and synchronous.
 * 
 * @param secretKey - The key of the secret to retrieve
 * @returns The decrypted secret value, or null if not found
 * @throws If the vault is locked or secrets API is not available
 */
export function getSecret(secretKey: string): string | null {
  const w = globalThis as any;
  const getSecretFn = w.__TUGBOAT__?.secrets?.getSecret;
  
  if (!getSecretFn) {
    throw new Error(
      "Secrets API not available. Ensure the tugboat host has initialized the secrets module."
    );
  }
  
  return getSecretFn(secretKey);
}

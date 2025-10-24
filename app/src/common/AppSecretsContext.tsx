import { createContext } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import * as secretsInternal from "./secrets_internal.ts";

interface SecretsContextValue {
  isUnlocked: boolean;
  initVault: (passphrase: string) => Promise<void>;
  lockVault: () => Promise<void>;
  vaultExists: () => Promise<boolean>;
  // Internal methods for AppSecrets UI (decrypt on demand)
  getSecretInternal: (key: string) => Promise<string | null>;
  setSecret: (key: string, value: string) => Promise<void>;
  removeSecret: (key: string) => Promise<void>;
}

const SecretsContext = createContext<SecretsContextValue | null>(null);

// Cache for decrypted secrets (in memory, session-only)
const secretsCache = new Map<string, string>();

export function AppSecretsCtxProvider(props: { children: ComponentChildren }) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Initialize vault and decrypt all secrets into cache
  const initVault = async (passphrase: string) => {
    await secretsInternal.initVault(passphrase);
    setIsUnlocked(true);
    
    // Decrypt and cache all secrets
    await refreshSecretsCache();
  };

  // Refresh the secrets cache by decrypting all secrets
  const refreshSecretsCache = async () => {
    // Get all secret keys from secrets KV namespace
    const secretsList = await secretsInternal.listAllSecrets();
    
    // Clear existing cache
    secretsCache.clear();
    
    // Decrypt and cache each secret
    for (const key of secretsList) {
      try {
        const value = await secretsInternal.get(key);
        if (value !== null) {
          secretsCache.set(key, value);
        }
      } catch (error) {
        console.error(`Failed to decrypt secret "${key}":`, error);
      }
    }
  };

  const lockVault = async () => {
    await secretsInternal.lockVault();
    setIsUnlocked(false);
    // Clear the cache
    secretsCache.clear();
  };

  const vaultExists = async () => {
    return await secretsInternal.vaultExists();
  };

  // Internal method for UI to decrypt secrets on demand (view button)
  const getSecretInternal = async (key: string) => {
    return await secretsInternal.get(key);
  };

  const setSecret = async (key: string, value: string) => {
    await secretsInternal.set(key, value);
    // Update cache
    if (isUnlocked) {
      secretsCache.set(key, value);
    }
  };

  const removeSecret = async (key: string) => {
    await secretsInternal.remove(key);
    // Remove from cache
    secretsCache.delete(key);
  };

  // Synchronous getSecret function for tugboat apps (reads from cache)
  const getSecret = (key: string): string | null => {
    if (!isUnlocked) {
      throw new Error("Vault is locked. Cannot access secrets.");
    }
    return secretsCache.get(key) ?? null;
  };

  // Expose getSecret on window.__TUGBOAT__
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__TUGBOAT__ = (window as any).__TUGBOAT__ || {};
      (window as any).__TUGBOAT__.secrets = {
        getSecret,
      };
    }
  }, [isUnlocked]); // Re-expose when unlock state changes

  const contextValue: SecretsContextValue = {
    isUnlocked,
    initVault,
    lockVault,
    vaultExists,
    getSecretInternal,
    setSecret,
    removeSecret,
  };

  return (
    <SecretsContext.Provider value={contextValue}>
      {props.children}
    </SecretsContext.Provider>
  );
}

export function useSecretsCtx(): SecretsContextValue {
  const ctx = useContext(SecretsContext);
  if (!ctx) {
    throw new Error("useSecretsCtx must be used within AppSecretsCtxProvider");
  }
  return ctx;
}

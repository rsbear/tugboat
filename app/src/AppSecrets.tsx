import { signal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { useSecretsCtx } from "./common/AppSecretsContext.tsx";
import { kv } from "npm:@tugboats/core@0.0.15";

interface SecretEntry {
  id: string;
  key: string;
  value: string;
  isSaved?: boolean; // Track if this secret has been saved to the vault
}

const status = signal("");
const isInitialized = signal(false);

// KV table for storing secret keys (not values)
const secretsKV = kv("secrets-metadata");

type VaultState = "setup" | "locked" | "unlocked";

// PassphraseSetup Component
function PassphraseSetup({ onSetupComplete }: { onSetupComplete: () => void }) {
  const secretsCtx = useSecretsCtx();
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = async (e: Event) => {
    e.preventDefault();
    setError("");

    if (passphrase.length < 3) {
      setError("Passphrase must be at least 3 characters");
      return;
    }

    if (passphrase !== confirmPassphrase) {
      setError("Passphrases do not match");
      return;
    }

    try {
      setIsLoading(true);
      status.value = "Setting up vault...";

      // Initialize the vault with the user's passphrase
      await secretsCtx.initVault(passphrase);

      isInitialized.value = true;
      status.value = "✅ Vault setup complete";
      onSetupComplete();
    } catch (err) {
      setError(`Failed to setup vault: ${err}`);
      status.value = `❌ Setup failed: ${err}`;
      console.error("Vault setup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 class="text-2xl font-bold mb-2">Setup Vault</h2>
      <p class="text-sm text-gray-600 mb-4">
        Create a master passphrase to secure your secrets
      </p>

      <form onSubmit={handleSetup} class="space-y-4">
        <div>
          <label class="block text-sm font-semibold mb-1" for="passphrase">
            Master Passphrase
          </label>
          <input
            id="passphrase"
            type="password"
            value={passphrase}
            onInput={(e) => setPassphrase((e.target as HTMLInputElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="At least 3 characters"
            disabled={isLoading}
            autoFocus
          />
        </div>

        <div>
          <label
            class="block text-sm font-semibold mb-1"
            for="confirmPassphrase"
          >
            Confirm Passphrase
          </label>
          <input
            id="confirmPassphrase"
            type="password"
            value={confirmPassphrase}
            onInput={(e) =>
              setConfirmPassphrase((e.target as HTMLInputElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Re-enter passphrase"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div class="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !passphrase || !confirmPassphrase}
          class={`w-full px-4 py-2 rounded font-semibold ${
            isLoading || !passphrase || !confirmPassphrase
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isLoading ? "Setting up..." : "Create Vault"}
        </button>
      </form>
    </div>
  );
}

// UnlockVault Component
function UnlockVault({ onUnlockSuccess }: { onUnlockSuccess: () => void }) {
  const secretsCtx = useSecretsCtx();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async (e: Event) => {
    e.preventDefault();
    setError("");

    if (!passphrase) {
      setError("Please enter your passphrase");
      return;
    }

    try {
      setIsLoading(true);
      status.value = "Unlocking vault...";

      // Try to initialize/unlock the vault with the passphrase
      await secretsCtx.initVault(passphrase);

      isInitialized.value = true;
      status.value = "✅ Vault unlocked";
      onUnlockSuccess();
    } catch (err) {
      setError("Incorrect passphrase or vault corrupted");
      status.value = `❌ Failed to unlock: ${err}`;
      console.error("Vault unlock error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 class="text-2xl font-bold mb-2">Unlock Vault</h2>
      <p class="text-sm text-gray-600 mb-4">
        Enter your master passphrase to access secrets
      </p>

      <form onSubmit={handleUnlock} class="space-y-4">
        <div>
          <label
            class="block text-sm font-semibold mb-1"
            for="unlock-passphrase"
          >
            Master Passphrase
          </label>
          <input
            id="unlock-passphrase"
            type="password"
            value={passphrase}
            onInput={(e) => setPassphrase((e.target as HTMLInputElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your passphrase"
            disabled={isLoading}
            autoFocus
          />
        </div>

        {error && (
          <div class="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !passphrase}
          class={`w-full px-4 py-2 rounded font-semibold ${
            isLoading || !passphrase
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {isLoading ? "Unlocking..." : "Unlock Vault"}
        </button>
      </form>
    </div>
  );
}

export function AppSecrets() {
  const secretsCtx = useSecretsCtx();
  const [vaultState, setVaultState] = useState<VaultState>("setup");

  // Check vault setup state on mount by checking if canary exists in KV
  useEffect(() => {
    const checkVaultState = async () => {
      try {
        const exists = await secretsCtx.vaultExists();
        if (exists) {
          setVaultState("locked");
        }
      } catch (err) {
        console.error("Failed to check vault state:", err);
      }
    };
    checkVaultState();
  }, []);

  const handleSetupComplete = () => {
    setVaultState("unlocked");
  };

  const handleUnlockSuccess = () => {
    setVaultState("unlocked");
  };

  const handleLockVault = async () => {
    await secretsCtx.lockVault();
    isInitialized.value = false;
    setVaultState("locked");
    status.value = "🔒 Vault locked";
  };

  // Show setup screen if vault not configured
  if (vaultState === "setup") {
    return <PassphraseSetup onSetupComplete={handleSetupComplete} />;
  }

  // Show unlock screen if vault is locked
  if (vaultState === "locked") {
    return <UnlockVault onUnlockSuccess={handleUnlockSuccess} />;
  }

  // Vault is unlocked, show secrets manager
  const [secrets, setSecrets] = useState<SecretEntry[]>([]);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load existing secret keys from KV on mount
  useEffect(() => {
    const loadSecretKeys = async () => {
      try {
        const keys = await secretsKV.get(["keys"]);
        console.log("keys.value", keys.value());
        if (keys.isOk() && Array.isArray(keys.value())) {
          setSecrets(
            keys.value().map((key: string) => ({
              id: crypto.randomUUID(),
              key,
              value: "",
              isSaved: true, // Existing secrets are already saved
            })),
          );
        } else {
          // No existing secrets, start with one empty row
          setSecrets([{ id: crypto.randomUUID(), key: "", value: "" }]);
        }
      } catch (error) {
        console.error("Failed to load secret keys:", error);
        setSecrets([{ id: crypto.randomUUID(), key: "", value: "" }]);
      } finally {
        setIsLoading(false);
      }
    };
    loadSecretKeys();
  }, []);

  const addSecret = () => {
    setSecrets([...secrets, { id: crypto.randomUUID(), key: "", value: "", isSaved: false }]);
  };

  const removeSecret = (id: string) => {
    setSecrets(secrets.filter((s) => s.id !== id));
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateSecret = (
    id: string,
    field: "key" | "value",
    newValue: string,
  ) => {
    setSecrets(
      secrets.map((s) => (s.id === id ? { ...s, [field]: newValue } : s)),
    );
  };

  const retrieveSecret = async (id: string) => {
    const secret = secrets.find((s) => s.id === id);
    if (!secret || !secret.key) {
      status.value = "⚠️ Secret key is empty";
      return;
    }

    try {
      status.value = `Retrieving ${secret.key}...`;
      const value = await secretsCtx.getSecretInternal(secret.key);

      if (!value) {
        status.value = `⚠️ Secret "${secret.key}" not found`;
        return;
      }

      // Update the secret value in state
      setSecrets(secrets.map((s) => s.id === id ? { ...s, value } : s));

      setRevealedSecrets((prev) => new Set(prev).add(id));
      status.value = `✅ Retrieved ${secret.key}`;
    } catch (error) {
      status.value = `❌ Failed to retrieve ${secret.key}: ${error}`;
      console.error("Retrieve secret error:", error);
    }
  };

  const hideSecret = (id: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSaveSecret = async (id: string) => {
    if (!secretsCtx.isUnlocked) {
      status.value = "⚠️ Please unlock vault first";
      return;
    }

    const secret = secrets.find((s) => s.id === id);
    if (!secret || !secret.key || !secret.value) {
      status.value = "⚠️ Both key and value are required";
      return;
    }

    try {
      status.value = `Saving ${secret.key}...`;

      // Save the secret (encrypted) to KV storage
      await secretsCtx.setSecret(secret.key, secret.value);

      // Update the list of secret keys in metadata KV
      const existingKeys = await secretsKV.get(["keys"]);
      const secretKeys = existingKeys.isOk() && Array.isArray(existingKeys.value())
        ? existingKeys.value()
        : [];
      
      if (!secretKeys.includes(secret.key)) {
        secretKeys.push(secret.key);
        await secretsKV.set(["keys"], secretKeys);
      }

      // Mark the secret as saved
      setSecrets(secrets.map((s) => s.id === id ? { ...s, isSaved: true } : s));

      status.value = `✅ Successfully saved ${secret.key}`;
    } catch (error) {
      status.value = `❌ Failed to save ${secret.key}: ${error}`;
      console.error("Save secret error:", error);
    }
  };

  return (
    <div class="p-4 bg-white rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Secrets Manager</h2>
        <div class="flex gap-2">
          <button
            onClick={addSecret}
            class="px-3 py-1 text-sm rounded font-semibold bg-blue-500 text-white hover:bg-blue-600"
          >
            + Add Secret
          </button>
          <button
            onClick={handleLockVault}
            class="px-3 py-1 text-sm rounded font-semibold bg-gray-500 text-white hover:bg-gray-600"
          >
            🔒 Lock Vault
          </button>
        </div>
      </div>

      {isLoading
        ? <div class="text-center py-8 text-gray-500">Loading secrets...</div>
        : (
          <div class="space-y-3 mb-4">
            {secrets.map((secret) => {
              const isRevealed = revealedSecrets.has(secret.id);

              return (
                <div
                  key={secret.id}
                  class="flex gap-3 items-start p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div class="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Key (e.g., API_KEY, GITHUB_TOKEN)"
                      value={secret.key}
                      onInput={(e) =>
                        updateSecret(
                          secret.id,
                          "key",
                          (e.target as HTMLInputElement).value,
                        )}
                      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type={isRevealed ? "text" : "password"}
                      placeholder="Value"
                      value={secret.value}
                      onInput={(e) =>
                        updateSecret(
                          secret.id,
                          "value",
                          (e.target as HTMLInputElement).value,
                        )}
                      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div class="flex flex-col gap-2">
                    <div class="flex gap-2">
                      <button
                        onClick={() =>
                          isRevealed
                            ? hideSecret(secret.id)
                            : retrieveSecret(secret.id)}
                        class="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 whitespace-nowrap"
                        title={isRevealed ? "Hide secret" : "Reveal secret"}
                      >
                        {isRevealed ? "👁️‍🗨️ Hide" : "👁️ View"}
                      </button>

                      <button
                        onClick={() => removeSecret(secret.id)}
                        class="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        title="Remove secret"
                      >
                        ✕
                      </button>
                    </div>
                    {!secret.isSaved && (
                      <button
                        onClick={() => handleSaveSecret(secret.id)}
                        disabled={!secret.key || !secret.value}
                        class={`px-3 py-2 text-sm rounded whitespace-nowrap ${
                          !secret.key || !secret.value
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                        title="Save secret"
                      >
                        💾 Save
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {!isLoading && secrets.length === 0 && (
        <div class="text-center py-8 text-gray-500">
          No secrets configured. Click "Add Secret" to get started.
        </div>
      )}

      {status.value && (
        <div class="p-3 bg-gray-100 rounded border border-gray-300">
          <p class="text-sm font-mono">{status.value}</p>
        </div>
      )}
    </div>
  );
}

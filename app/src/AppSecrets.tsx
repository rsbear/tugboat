import { signal } from "@preact/signals";
import { initVault, set, saveVault } from "./common/secrets_internal.ts";

// Test secrets
const testSecrets = [
  { key: "github_token", value: "ghp_test_token_123456789" },
  { key: "api_key", value: "sk_test_api_key_abcdefg" },
];

const status = signal("");
const isInitialized = signal(false);
const isSaving = signal(false);

export function AppSecrets() {
  const handleInitializeVault = async () => {
    try {
      status.value = "Initializing vault...";
      // For testing, use a simple passphrase
      // In production, this should be user-provided
      await initVault("test-passphrase-123", "tugboat-core");
      isInitialized.value = true;
      status.value = "✅ Vault initialized successfully";
    } catch (error) {
      status.value = `❌ Failed to initialize vault: ${error}`;
      console.error("Vault initialization error:", error);
    }
  };

  const handleSaveSecrets = async () => {
    if (!isInitialized.value) {
      status.value = "⚠️ Please initialize vault first";
      return;
    }

    try {
      isSaving.value = true;
      status.value = "Saving secrets...";

      // Loop over test secrets and save them
      for (const secret of testSecrets) {
        status.value = `Saving ${secret.key}...`;
        await set(secret.key, secret.value);
      }

      // Save the vault to disk
      await saveVault();
      status.value = `✅ Successfully saved ${testSecrets.length} secrets`;
    } catch (error) {
      status.value = `❌ Failed to save secrets: ${error}`;
      console.error("Save secrets error:", error);
    } finally {
      isSaving.value = false;
    }
  };

  return (
    <div class="p-4 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-4">Secrets Manager</h2>

      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Test Secrets:</h3>
        <ul class="list-disc list-inside space-y-1 mb-4">
          {testSecrets.map((secret) => (
            <li key={secret.key} class="font-mono text-sm">
              <span class="font-semibold">{secret.key}</span>: {secret.value}
            </li>
          ))}
        </ul>
      </div>

      <div class="flex gap-2 mb-4">
        <button
          onClick={handleInitializeVault}
          disabled={isInitialized.value}
          class={`px-4 py-2 rounded font-semibold ${
            isInitialized.value
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isInitialized.value ? "✓ Vault Initialized" : "Initialize Vault"}
        </button>

        <button
          onClick={handleSaveSecrets}
          disabled={!isInitialized.value || isSaving.value}
          class={`px-4 py-2 rounded font-semibold ${
            !isInitialized.value || isSaving.value
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {isSaving.value ? "Saving..." : "Save All Secrets"}
        </button>
      </div>

      {status.value && (
        <div class="p-3 bg-gray-100 rounded border border-gray-300">
          <p class="text-sm font-mono">{status.value}</p>
        </div>
      )}
    </div>
  );
}

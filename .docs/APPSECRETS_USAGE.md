# AppSecrets Component Usage

## Overview

The `AppSecrets` component provides a UI for testing the secrets vault functionality. It's accessible by typing `secrets` in the app's input field.

## Features

### Test Secrets
Two hardcoded test secrets are provided:
- `github_token`: "ghp_test_token_123456789"
- `api_key`: "sk_test_api_key_abcdefg"

### User Actions

1. **Initialize Vault** (blue button)
   - Initializes the stronghold vault with test passphrase
   - Creates or loads the "tugboat-core" client
   - Only needs to be done once per session

2. **Save All Secrets** (green button)
   - Loops through all test secrets
   - Saves each one to the vault
   - Persists vault to disk
   - Only enabled after vault is initialized

### Status Display
- Real-time status messages show what's happening
- Success (✅), warning (⚠️), and error (❌) indicators

## How to Use

1. Start the app with `just dev`
2. Type `secrets` in the input field
3. Click "Initialize Vault" button
4. Once initialized, click "Save All Secrets" button
5. Check the status messages to confirm success

## Technical Details

### Integration Points

- **Component**: `app/src/AppSecrets.tsx`
- **App Integration**: `app/src/App.tsx` (renders when `aliasTag === "secrets"`)
- **Secrets API**: `app/src/common/secrets_internal.ts`

### API Flow

```typescript
// Initialize vault
initVault(passphrase, clientName) →
  vault_initialize → vault_get_config → 
  plugin:stronghold|initialize → 
  plugin:stronghold|create_client or load_client

// Save secret
set(key, value) →
  vault_get_config →
  plugin:stronghold|save_store_record

// Persist vault
saveVault() →
  vault_get_config →
  plugin:stronghold|save
```

### State Management

Uses Preact signals for reactive state:
- `status`: Current operation status message
- `isInitialized`: Whether vault is ready
- `isSaving`: Whether save operation is in progress

## Next Steps

To make this production-ready:

1. **User-provided passphrase**: Replace hardcoded "test-passphrase-123" with user input
2. **Secret management UI**: Add ability to create, edit, delete individual secrets
3. **Secret listing**: Display existing secrets from vault
4. **Import/Export**: Allow importing secrets from file or exporting (encrypted)
5. **Validation**: Add input validation for secret keys and values

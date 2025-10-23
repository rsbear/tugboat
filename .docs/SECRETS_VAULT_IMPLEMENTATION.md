# Secrets Vault Implementation

## Overview

The secrets vault has been successfully implemented using the `tauri-plugin-stronghold` library. The implementation follows a hybrid approach where:

1. **Rust backend** (`app/src-tauri/src/secrets_vault.rs`) - Manages vault configuration state and provides command wrappers
2. **TypeScript frontend layers**:
   - `app/src/common/secrets_internal.ts` - Internal API for write operations (set, remove, initialize)
   - `pkgs/core/src/secrets.ts` - Public read-only API for tugboat apps

## Architecture

### Rust Backend (`secrets_vault.rs`)

The Rust implementation provides:

- **VaultConfig state**: Tracks the snapshot path and client name for the single vault instance
- **Commands**:
  - `vault_initialize`: Sets up vault configuration (snapshot path and client name)
  - `vault_get_config`: Returns current vault configuration
  - `secret_get`: Validates vault initialization (actual read via stronghold plugin)
  - `secret_set`: Validates vault initialization (actual write via stronghold plugin)
  - `secret_remove`: Validates vault initialization (actual removal via stronghold plugin)
  - `vault_save`: Validates vault initialization (actual save via stronghold plugin)
  - `vault_destroy`: Clears vault configuration from memory

### Integration

The vault is initialized in `app/src-tauri/src/lib.rs`:

```rust
// In setup()
if let Err(e) = secrets_vault::init_vault_plugin(&app.handle()) {
    eprintln!("Failed to initialize secrets vault: {}", e);
}

// In invoke_handler
secrets_vault::vault_initialize,
secrets_vault::vault_get_config,
secrets_vault::secret_set,
secrets_vault::secret_get,
secrets_vault::secret_remove,
secrets_vault::vault_save,
secrets_vault::vault_destroy
```

### Frontend Integration

The frontend TypeScript layers need to:

1. **Initialize the vault** by calling:
   - `vault_initialize` (our wrapper) to store config
   - `plugin:stronghold|initialize` (stronghold plugin) with password
   - `plugin:stronghold|create_client` or `load_client` (stronghold plugin) to set up client

2. **Read secrets** by calling:
   - `vault_get_config` to get snapshot path and client name
   - `plugin:stronghold|get_store_record` with those parameters

3. **Write secrets** by calling:
   - `vault_get_config` to get snapshot path and client name
   - `plugin:stronghold|save_store_record` with those parameters
   - `plugin:stronghold|save` to persist changes

4. **Remove secrets** by calling:
   - `vault_get_config` to get snapshot path and client name
   - `plugin:stronghold|remove_store_record` with those parameters
   - `plugin:stronghold|save` to persist changes

## Security Features

- **Stronghold encryption**: Uses IOTA Stronghold for military-grade encryption
- **Argon2 KDF**: Password hashing with salt stored in `~/.tugboats/salt.txt`
- **Secure storage**: Vault file stored in `~/.tugboats/vault.hold`
- **Memory protection**: Secrets are zeroized after use by Stronghold
- **Read-only public API**: Tugboat apps can only read secrets via `pkgs/core/src/secrets.ts`

## Next Steps for Frontend Implementation

The TypeScript files (`secrets_internal.ts` and `secrets.ts`) need to be updated to:

1. Call `vault_get_config` to retrieve snapshot path and client name
2. Use these values when calling the stronghold plugin commands directly
3. Handle the initialization flow properly (initialize stronghold → create/load client → store config)

## File Locations

- **Rust**: `app/src-tauri/src/secrets_vault.rs`
- **Integration**: `app/src-tauri/src/lib.rs` (module declaration and command registration)
- **Dependencies**: `app/src-tauri/Cargo.toml` (tauri-plugin-stronghold already added)
- **Frontend (write)**: `app/src/common/secrets_internal.ts`
- **Frontend (read)**: `pkgs/core/src/secrets.ts`

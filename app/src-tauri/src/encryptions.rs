use argon2::{Argon2, Params, Version};
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    XChaCha20Poly1305, XNonce,
};
use tauri::AppHandle;
use zeroize::Zeroize;

// Version byte for the encryption format
const VERSION: u8 = 1;
const NONCE_SIZE: usize = 24; // XChaCha20 uses 24-byte nonces
const SALT_SIZE: usize = 16;

/// Error type for encryption operations
#[derive(Debug, thiserror::Error)]
pub enum EncryptionError {
    #[error("Failed to derive key: {0}")]
    KeyDerivation(String),
    #[error("Encryption failed: {0}")]
    Encryption(String),
    #[error("Decryption failed: {0}")]
    Decryption(String),
    #[error("Invalid encrypted blob format")]
    InvalidFormat,
    #[error("Unsupported encryption version: {0}")]
    UnsupportedVersion(u8),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

/// Get or create the salt file
fn get_or_create_salt(_app: &AppHandle) -> Result<[u8; SALT_SIZE], EncryptionError> {
    // Use ~/.tugboats directory to match where KV data is stored
    let home = dirs::home_dir().ok_or_else(|| {
        EncryptionError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "Could not find home directory",
        ))
    })?;
    let app_dir = home.join(".tugboats");
    
    std::fs::create_dir_all(&app_dir)?;
    let salt_path = app_dir.join("vault_kdf_salt.bin");

    if salt_path.exists() {
        // Load existing salt
        let salt_bytes = std::fs::read(&salt_path)?;
        if salt_bytes.len() != SALT_SIZE {
            return Err(EncryptionError::Io(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                format!("Salt file has invalid size: {} bytes", salt_bytes.len()),
            )));
        }
        let mut salt = [0u8; SALT_SIZE];
        salt.copy_from_slice(&salt_bytes);
        Ok(salt)
    } else {
        // Generate new random salt
        let mut salt = [0u8; SALT_SIZE];
        getrandom::getrandom(&mut salt).map_err(|e| {
            EncryptionError::Io(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("Failed to generate random salt: {}", e),
            ))
        })?;
        std::fs::write(&salt_path, &salt)?;
        Ok(salt)
    }
}

/// Derive a 32-byte encryption key from master phrase using Argon2id
fn derive_key(master_phrase: &str, salt: &[u8; SALT_SIZE]) -> Result<[u8; 32], EncryptionError> {
    // Use moderate Argon2id parameters for balance between security and performance
    let params = Params::new(
        65536,  // 64 MB memory cost
        3,      // 3 iterations
        4,      // 4 parallelism
        Some(32), // 32-byte output
    )
    .map_err(|e| EncryptionError::KeyDerivation(format!("Invalid Argon2 params: {}", e)))?;

    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, Version::V0x13, params);

    let mut key = [0u8; 32];
    argon2
        .hash_password_into(master_phrase.as_bytes(), salt, &mut key)
        .map_err(|e| EncryptionError::KeyDerivation(format!("Key derivation failed: {}", e)))?;

    Ok(key)
}

/// Encrypt plaintext bytes with master phrase
/// Returns: [version | nonce | ciphertext]
#[tauri::command]
pub async fn encrypt(
    value: Vec<u8>,
    master_phrase: String,
    app: AppHandle,
) -> Result<Vec<u8>, String> {
    encrypt_impl(value, master_phrase, app)
        .map_err(|e| e.to_string())
}

fn encrypt_impl(
    value: Vec<u8>,
    mut master_phrase: String,
    app: AppHandle,
) -> Result<Vec<u8>, EncryptionError> {
    // Get or create salt
    let salt = get_or_create_salt(&app)?;

    // Derive encryption key
    let mut key = derive_key(&master_phrase, &salt)?;
    
    // Zeroize master phrase immediately after use
    master_phrase.zeroize();

    // Create cipher
    let cipher = XChaCha20Poly1305::new((&key).into());
    
    // Generate random nonce
    let mut nonce_bytes = [0u8; NONCE_SIZE];
    getrandom::getrandom(&mut nonce_bytes).map_err(|e| {
        EncryptionError::Encryption(format!("Failed to generate nonce: {}", e))
    })?;
    let nonce = XNonce::from_slice(&nonce_bytes);

    // Encrypt
    let ciphertext = cipher
        .encrypt(nonce, value.as_ref())
        .map_err(|e| EncryptionError::Encryption(format!("AEAD encryption failed: {}", e)))?;

    // Zeroize key material
    key.zeroize();

    // Build output: [version | nonce | ciphertext]
    let mut output = Vec::with_capacity(1 + NONCE_SIZE + ciphertext.len());
    output.push(VERSION);
    output.extend_from_slice(&nonce_bytes);
    output.extend_from_slice(&ciphertext);

    Ok(output)
}

/// Decrypt encrypted blob with master phrase
/// Input: [version | nonce | ciphertext]
/// Returns: plaintext bytes
#[tauri::command]
pub async fn decrypt(
    encrypted_value: Vec<u8>,
    master_phrase: String,
    app: AppHandle,
) -> Result<Vec<u8>, String> {
    decrypt_impl(encrypted_value, master_phrase, app)
        .map_err(|e| e.to_string())
}

fn decrypt_impl(
    encrypted_value: Vec<u8>,
    mut master_phrase: String,
    app: AppHandle,
) -> Result<Vec<u8>, EncryptionError> {
    // Parse blob format: [version | nonce | ciphertext]
    if encrypted_value.len() < 1 + NONCE_SIZE {
        return Err(EncryptionError::InvalidFormat);
    }

    let version = encrypted_value[0];
    if version != VERSION {
        return Err(EncryptionError::UnsupportedVersion(version));
    }

    let nonce_bytes = &encrypted_value[1..1 + NONCE_SIZE];
    let ciphertext = &encrypted_value[1 + NONCE_SIZE..];

    // Get salt
    let salt = get_or_create_salt(&app)?;

    // Derive decryption key
    let mut key = derive_key(&master_phrase, &salt)?;
    
    // Zeroize master phrase immediately after use
    master_phrase.zeroize();

    // Create cipher
    let cipher = XChaCha20Poly1305::new((&key).into());
    let nonce = XNonce::from_slice(nonce_bytes);

    // Decrypt
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| EncryptionError::Decryption(format!("AEAD decryption failed (wrong passphrase or tampered data): {}", e)))?;

    // Zeroize key material
    key.zeroize();

    Ok(plaintext)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_key_derivation_deterministic() {
        let salt = [42u8; SALT_SIZE];
        let phrase = "test-passphrase";
        
        let key1 = derive_key(phrase, &salt).unwrap();
        let key2 = derive_key(phrase, &salt).unwrap();
        
        assert_eq!(key1, key2, "Key derivation should be deterministic");
    }

    #[test]
    fn test_key_derivation_different_phrases() {
        let salt = [42u8; SALT_SIZE];
        
        let key1 = derive_key("phrase1", &salt).unwrap();
        let key2 = derive_key("phrase2", &salt).unwrap();
        
        assert_ne!(key1, key2, "Different phrases should produce different keys");
    }

    #[test]
    fn test_key_derivation_different_salts() {
        let salt1 = [42u8; SALT_SIZE];
        let salt2 = [43u8; SALT_SIZE];
        let phrase = "test-passphrase";
        
        let key1 = derive_key(phrase, &salt1).unwrap();
        let key2 = derive_key(phrase, &salt2).unwrap();
        
        assert_ne!(key1, key2, "Different salts should produce different keys");
    }
}

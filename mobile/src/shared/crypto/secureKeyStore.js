/**
 * Secure Key Store — wraps expo-secure-store for vault private keys.
 *
 * FR-122: Keys never leave client in plaintext
 *
 * Storage layout:
 *   vault_priv_{userId}   — RSA private key JWK (hardware-backed, biometric-gated)
 *   vault_salt_{userId}   — PBKDF2 salt for passphrase backup (not secret, no auth)
 *   vault_backup_{userId} — backup mode: 'passphrase' | 'none'
 *
 * Note on biometric gating:
 *   requireAuthentication: true routes through the OS hardware keychain
 *   (Secure Enclave on iOS, TEE/StrongBox on Android). The biometric prompt
 *   is not a JavaScript-level UI gate — it is a native OS-level hardware
 *   authentication requirement before the key material is released.
 *
 * Note on salt storage:
 *   The PBKDF2 salt is not secret by design. Knowing the salt does not
 *   help an attacker without also knowing the passphrase. It is stored
 *   without requireAuthentication to allow salt retrieval during the
 *   recovery flow before biometric context is established.
 */

import * as SecureStore from 'expo-secure-store';

const PRIVATE_KEY_PREFIX = 'vault_priv_';
const SALT_PREFIX = 'vault_salt_';
const BACKUP_MODE_PREFIX = 'vault_backup_';

// ─── Private Key ─────────────────────────────────────────────────────────────

/**
 * Store the user's RSA private key JWK in the hardware-backed keychain.
 * Requires device biometric or passcode authentication on retrieval.
 */
export async function storePrivateKey(userId, privateKeyJwk) {
  await SecureStore.setItemAsync(
    `${PRIVATE_KEY_PREFIX}${userId}`,
    JSON.stringify(privateKeyJwk),
    {
      requireAuthentication: true,
      authenticationPrompt: 'Authenticate to access your encrypted vault',
    }
  );
}

/**
 * Retrieve the user's RSA private key JWK from the hardware keychain.
 * Triggers biometric/PIN authentication prompt. Returns null only when no
 * key is stored on this device at all — auth failure/cancellation throws
 * instead, so callers can tell "not set up here" apart from "you failed to
 * authenticate" and never accidentally treat the latter as the former.
 */
export async function getPrivateKey(userId) {
  const raw = await SecureStore.getItemAsync(
    `${PRIVATE_KEY_PREFIX}${userId}`,
    {
      requireAuthentication: true,
      authenticationPrompt: 'Authenticate to access your encrypted vault',
    }
  );
  if (!raw) return null;
  return JSON.parse(raw);
}

/**
 * Delete the private key from the keychain (used during key rotation or device wipe).
 */
export async function deletePrivateKey(userId) {
  await SecureStore.deleteItemAsync(`${PRIVATE_KEY_PREFIX}${userId}`);
}

// ─── PBKDF2 Salt ─────────────────────────────────────────────────────────────

/**
 * Store the PBKDF2 salt for passphrase-based recovery.
 * Not secret — stored without authentication requirement.
 */
export async function storeVaultSalt(userId, saltB64) {
  await SecureStore.setItemAsync(`${SALT_PREFIX}${userId}`, saltB64);
}

/**
 * Retrieve the PBKDF2 salt for passphrase-based recovery.
 */
export async function getVaultSalt(userId) {
  return SecureStore.getItemAsync(`${SALT_PREFIX}${userId}`);
}

// ─── Backup Mode ─────────────────────────────────────────────────────────────

/**
 * Persist the user's chosen backup mode.
 * 'passphrase': private key is encrypted with passphrase and backed up to server.
 * 'none': no server backup. Device loss = permanent vault loss. Zero-knowledge.
 */
export async function storeBackupMode(userId, mode) {
  await SecureStore.setItemAsync(`${BACKUP_MODE_PREFIX}${userId}`, mode);
}

/**
 * Retrieve the user's backup mode, or null if not yet chosen.
 */
export async function getBackupMode(userId) {
  const mode = await SecureStore.getItemAsync(`${BACKUP_MODE_PREFIX}${userId}`);
  if (mode === 'passphrase' || mode === 'none') return mode;
  return null;
}

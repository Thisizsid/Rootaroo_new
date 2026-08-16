/**
 * Shared vault key setup — used by VaultSetupScreen (first-time flow) and
 * VaultUploadScreen (lazy setup on first upload).
 *
 * Creates an RSA key pair, stores the private key in the hardware keychain
 * (biometric-gated via requireAuthentication), pins the public key (TOFU),
 * and optionally uploads an encrypted private-key backup for recovery on a
 * new device.
 */
import { vaultApi } from '../api/vault';
import {
  generateVaultKeyPair,
  exportPublicKeySpki,
  encryptPrivateKeyForBackup,
} from './vaultCrypto';
import {
  storePrivateKey,
  storeVaultSalt,
  storeBackupMode,
} from './secureKeyStore';
import { verifyPublicKey } from './keyPinStore';

/**
 * Generate + persist a vault key pair.
 *
 * @param userId          current user id
 * @param backupChoice    'passphrase' → upload an AES-GCM encrypted backup;
 *                        'none'       → zero-knowledge, no recovery path
 * @param passphrase      required when backupChoice === 'passphrase'
 * @returns the SPKI base64 public key
 */
export async function setupVaultKeys(userId, backupChoice, passphrase) {
  const pair = await generateVaultKeyPair();
  const publicKeySpki = await exportPublicKeySpki(pair.publicKey);
  const privateKeyJwk = await globalThis.crypto.subtle.exportKey('jwk', pair.privateKey);

  // Store private key in the hardware keychain (biometric-gated). This is what
  // makes "Unlock vault" trigger the Face ID / fingerprint prompt later.
  await storePrivateKey(userId, privateKeyJwk);
  await storeBackupMode(userId, backupChoice === 'passphrase' ? 'passphrase' : 'none');

  let encryptedBackup = null;
  if (backupChoice === 'passphrase') {
    if (!passphrase) throw new Error('Passphrase is required for backup mode');
    const { encryptedBlob, saltB64 } = await encryptPrivateKeyForBackup(privateKeyJwk, passphrase);
    encryptedBackup = encryptedBlob;
    await storeVaultSalt(userId, saltB64);
  }

  // Server receives: SPKI public key (not secret) + AES-GCM ciphertext (server cannot decrypt).
  // If no backup, privateKeyEncrypted is a sentinel — server stores 'none'.
  await vaultApi.storeKey(publicKeySpki, encryptedBackup ?? 'none');

  // TOFU: pin own public key locally for future verification
  const pinResult = await verifyPublicKey(userId, publicKeySpki);
  if (pinResult === 'changed') {
    // Own key just generated — a 'changed' result would mean a bug in our code
    throw new Error('Unexpected key pin state during key setup');
  }

  return publicKeySpki;
}

/**
 * Vault Crypto — Client-side E2EE for document vault.
 *
 * Threat model: the server is not trusted. It may read all stored data,
 * substitute public keys during key exchange, or be actively malicious.
 * All plaintext and all key material must be cryptographically inaccessible
 * to the server at all times — not just absent from its codebase.
 *
 * Primitives:
 *   - AES-256-GCM  : document / file encryption
 *   - RSA-OAEP-4096: per-user document key wrapping (hybrid encryption)
 *   - PBKDF2-SHA256 : passphrase → AES-GCM key for private key backup
 *     - 800,000 iterations (raised from 600K; within tolerance on modern devices)
 *     - 32-byte random salt per user (not secret; stored alongside ciphertext)
 *   - All IVs/salts: crypto.getRandomValues — never counters, never timestamps
 *
 * FR-121: Client-side AES-256-GCM encryption
 * FR-122: Keys never leave client in plaintext
 * FR-123: RSA-4096 key wrapping per member
 */

const subtle = globalThis.crypto?.subtle;

// ─── Constants ───────────────────────────────────────────────────────────────

/** PBKDF2 iteration count. Keep ≥ 600,000; 800K is the floor here. */
export const PBKDF2_ITERATIONS = 800_000;

/** AES-GCM IV length in bytes. 96-bit (12 bytes) is the standard for GCM. */
export const AES_GCM_IV_BYTES = 12;

/** PBKDF2 salt length in bytes. 256-bit salt, not secret. */
export const PBKDF2_SALT_BYTES = 32;

// ─── RSA Key Pair ────────────────────────────────────────────────────────────

/**
 * Generate an RSA-OAEP-4096 key pair for vault key wrapping.
 * The private key is non-extractable by default in WebCrypto; we override
 * this (extractable: true) only so it can be serialised to JWK for
 * hardware-keychain storage via SecureStore.
 */
export async function generateVaultKeyPair() {
  if (!subtle) {
    throw new Error(
      'WebCrypto is unavailable on this device. The vault uses native crypto ' +
      '(react-native-quick-crypto), which Expo Go does not include. ' +
      'Run a development build: `npx expo run:android` (or `npx expo run:ios`), ' +
      'then retry vault setup.'
    );
  }
  return subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['wrapKey', 'unwrapKey']
  );
}

/**
 * Export an RSA public key as base64-encoded SPKI.
 */
export async function exportPublicKeySpki(key) {
  const spki = await subtle.exportKey('spki', key);
  return arrayBufferToBase64(spki);
}

/**
 * Import an RSA public key from base64 SPKI.
 * Usage: key-wrapping only (not verify — RSA-OAEP is not a signing scheme).
 */
export async function importPublicKey(spkiB64) {
  const spki = base64ToArrayBuffer(spkiB64);
  return subtle.importKey(
    'spki',
    spki,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['wrapKey']
  );
}

/**
 * Import an RSA-OAEP private key from JWK.
 * Called after loading the private key from the hardware keychain (SecureStore).
 * The key is imported as non-extractable — once imported it cannot leave
 * the JavaScript engine in raw form.
 */
export async function importPrivateKey(jwk) {
  return subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false, // non-extractable after import
    ['unwrapKey']
  );
}

// ─── Key Fingerprint ─────────────────────────────────────────────────────────

/**
 * Compute a human-readable fingerprint of an RSA public key.
 *
 * Algorithm: SHA-256(raw SPKI bytes) → first 12 bytes → base64url → 4-char groups.
 * Example output: "aB3x F9kL mN2p"
 *
 * This fingerprint is displayed in the UI for out-of-band verification and is
 * the foundation for the future fingerprint-verification fast-follow.
 *
 * @param spkiB64 - base64-encoded SPKI public key
 * @returns human-readable fingerprint string
 */
export async function computePublicKeyFingerprint(spkiB64) {
  const raw = base64ToArrayBuffer(spkiB64);
  const hashBuffer = await subtle.digest('SHA-256', raw);
  // Take first 12 bytes (96 bits) → 16 base64url chars → 4 groups of 4
  const first12 = new Uint8Array(hashBuffer).slice(0, 12);
  const b64url = arrayBufferToBase64url(first12.buffer);
  // Format as groups of 4 separated by spaces for readability
  return b64url.match(/.{1,4}/g).join(' ');
}

// ─── AES-GCM Key ─────────────────────────────────────────────────────────────

/**
 * Generate an AES-256-GCM symmetric key for file encryption.
 * The key is extractable so it can be wrapped for storage in VaultDocumentKey.
 */
export async function generateAesKey() {
  return subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// ─── File Encryption / Decryption ────────────────────────────────────────────

/**
 * Encrypt a file Blob with AES-256-GCM.
 * IV is generated fresh for every call via crypto.getRandomValues — never reused.
 */
export async function encryptFile(aesKey, fileBlob) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));
  const plaintext = await blobToArrayBuffer(fileBlob);

  const encrypted = await subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    aesKey,
    plaintext
  );

  const encryptedArray = new Uint8Array(encrypted);
  const authTag = encryptedArray.slice(encryptedArray.length - 16);
  const ciphertext = encryptedArray.slice(0, encryptedArray.length - 16);

  return {
    ciphertext: arrayBufferToBase64(ciphertext.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    authTag: arrayBufferToBase64(authTag.buffer),
  };
}

/**
 * Encrypt an ArrayBuffer with AES-256-GCM.
 * Returns the EncryptResult plus the combined raw encrypted bytes for upload.
 * IV is generated fresh for every call via crypto.getRandomValues.
 */
export async function encryptBuffer(aesKey, plaintext) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));

  const encrypted = await subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    aesKey,
    plaintext
  );

  const encryptedArray = new Uint8Array(encrypted);
  const authTag = encryptedArray.slice(encryptedArray.length - 16);
  const ciphertext = encryptedArray.slice(0, encryptedArray.length - 16);

  return {
    ciphertext: arrayBufferToBase64(ciphertext.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    authTag: arrayBufferToBase64(authTag.buffer),
    encryptedBytes: encrypted,
  };
}

/**
 * Decrypt a file with AES-256-GCM.
 * Returns the plaintext ArrayBuffer held in-memory only — NEVER written to
 * disk (FR-128). Deliberately not wrapped in a Blob: React Native's built-in
 * Blob implementation doesn't support constructing from an ArrayBuffer/
 * ArrayBufferView ("Creating blobs from 'ArrayBuffer' and 'ArrayBufferView'
 * are not supported"), and every caller immediately needed the raw bytes
 * back anyway.
 * Throws a DOMException if the auth tag is invalid (tampered ciphertext or wrong key).
 */
export async function decryptFile(aesKey, ciphertextB64, ivB64, authTagB64) {
  const ciphertext = base64ToArrayBuffer(ciphertextB64);
  const iv = base64ToArrayBuffer(ivB64);
  const authTag = base64ToArrayBuffer(authTagB64);

  // AES-GCM expects ciphertext || authTag concatenated
  const combined = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
  combined.set(new Uint8Array(ciphertext), 0);
  combined.set(new Uint8Array(authTag), ciphertext.byteLength);

  return subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    aesKey,
    combined
  );
}

// ─── Key Wrapping / Unwrapping ───────────────────────────────────────────────

/**
 * Wrap an AES-256-GCM key with an RSA-OAEP-4096 public key.
 * The public key MUST be TOFU-verified by the caller before this is invoked —
 * do not pass server-fetched keys without checking the pin store first.
 *
 * @param aesKey - the symmetric key to protect
 * @param recipientPublicKey - the recipient's pinned RSA public key CryptoKey
 * @returns base64-encoded RSA-OAEP ciphertext
 */
export async function wrapKey(aesKey, recipientPublicKey) {
  const wrapped = await subtle.wrapKey('raw', aesKey, recipientPublicKey, {
    name: 'RSA-OAEP',
  });
  return arrayBufferToBase64(wrapped);
}

/**
 * Unwrap an RSA-OAEP-wrapped AES-256-GCM key using the caller's private key.
 * The returned CryptoKey is non-extractable — it exists only in-memory for
 * the duration of the decryption session.
 *
 * Throws if the wrapped key ciphertext is malformed or the wrong private key is used.
 */
export async function unwrapKey(wrappedKeyB64, privateKey) {
  const wrappedKey = base64ToArrayBuffer(wrappedKeyB64);
  return subtle.unwrapKey(
    'raw',
    wrappedKey,
    privateKey,
    { name: 'RSA-OAEP' },
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable after unwrap
    ['encrypt', 'decrypt']
  );
}

// ─── PBKDF2 — Passphrase-Based Key Derivation ────────────────────────────────

/**
 * Derive an AES-256-GCM key from a user passphrase and salt.
 *
 * Parameters:
 *   - 800,000 PBKDF2-SHA256 iterations
 *   - 32-byte random salt (unique per user; not secret; stored alongside ciphertext)
 *
 * This is used ONLY for encrypting the RSA private key before server backup.
 * If the user chose the zero-knowledge (no-backup) mode, this function is
 * never called and the passphrase is never set.
 */
export async function deriveKeyFromPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // derived key is non-extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt the RSA private key JWK with a user passphrase for server backup.
 *
 * Security tradeoff (displayed to user before calling this):
 *   - The encrypted backup is stored on the server.
 *   - If the passphrase is weak, offline brute-force against the backup is possible.
 *   - If the user chooses zero-knowledge mode (no backup), this function is never called
 *     and device loss = permanent vault loss.
 *
 * Returns:
 *   - encryptedBlob: JSON string containing { ciphertext, iv, authTag, salt } (all base64).
 *     The salt is embedded in the blob so recovery is fully server-self-contained — no local
 *     SecureStore state is required. The salt is not secret; storing it alongside the
 *     ciphertext is standard cryptographic practice.
 *   - saltB64: same salt, also returned for local SecureStore caching (optional; speeds up
 *     subsequent local reads but is NOT required for server-backed recovery).
 */
export async function encryptPrivateKeyForBackup(jwk, password) {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const derivedAesKey = await deriveKeyFromPassword(password, salt);

  const enc = new TextEncoder();
  const { ciphertext, iv, authTag } = await encryptBuffer(
    derivedAesKey,
    enc.encode(JSON.stringify(jwk)).buffer
  );

  const saltB64 = arrayBufferToBase64(salt.buffer);

  return {
    // Salt is part of the blob — the server copy is now fully self-contained for recovery.
    encryptedBlob: JSON.stringify({ ciphertext, iv, authTag, salt: saltB64 }),
    saltB64,
  };
}

/**
 * Decrypt a server-backed private key JWK using the vault passphrase.
 *
 * The PBKDF2 salt is extracted from the blob itself — no separate saltB64 argument
 * is required. This means recovery works even on a fresh reinstall where SecureStore
 * has been wiped, as long as the server-stored blob is available.
 *
 * Throws if:
 *   - The passphrase is wrong (AES-GCM auth tag verification fails with DOMException)
 *   - The blob is malformed or tampered
 *   - The blob is in the legacy format (pre-salt-in-blob) — detected by missing 'salt' field
 *
 * There is no silent fallback — a wrong passphrase is a hard error.
 */
export async function decryptPrivateKeyFromBackup(encryptedBlobStr, password) {
  const payload = JSON.parse(encryptedBlobStr);
  const { ciphertext, iv, authTag, salt: saltB64 } = payload;

  if (!saltB64) {
    throw new Error(
      'Backup blob is missing salt field — this backup was created before the reinstall-recovery fix ' +
      'and cannot be recovered on a new device. The key must be re-backed up on the original device.'
    );
  }

  const salt = new Uint8Array(base64ToArrayBuffer(saltB64));
  const derivedAesKey = await deriveKeyFromPassword(password, salt);

  // decryptFile throws DOMException on wrong passphrase — intentional, no catch here
  const plaintext = await decryptFile(derivedAesKey, ciphertext, iv, authTag);
  const dec = new TextDecoder();
  const jsonText = dec.decode(plaintext);

  return JSON.parse(jsonText);
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** base64url encoding (no padding, URL-safe chars) — used for fingerprints. */
function arrayBufferToBase64url(buffer) {
  return arrayBufferToBase64(buffer)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function blobToArrayBuffer(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

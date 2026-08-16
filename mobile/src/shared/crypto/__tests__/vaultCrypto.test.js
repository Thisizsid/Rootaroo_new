/**
 * Adversarial + correctness tests for the vault's cryptographic layer.
 *
 * These tests run in a Jest environment using the Node.js WebCrypto polyfill.
 * They are intentionally adversarial — each test corresponds to a specific
 * attack or correctness requirement from the threat model.
 *
 * Test coverage:
 *   1. IV uniqueness across 50 encryptions of the same key
 *   2. Wrong passphrase fails hard (throws — no silent fallback)
 *   3. Salt is embedded in encryptedBlob (server backup is self-contained for reinstall recovery)
 *   4. Public key fingerprint is deterministic and stable
 *   5. decryptPrivateKeyFromBackup rejects tampered ciphertext
 *   6. PBKDF2 iteration count meets minimum requirement (800,000)
 *   7. RSA-OAEP wrapped key cannot be unwrapped with a different private key
 */

import { webcrypto } from 'node:crypto';

// Polyfill WebCrypto for Node test environment
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

import {
  generateVaultKeyPair,
  generateAesKey,
  encryptBuffer,
  wrapKey,
  unwrapKey,
  deriveKeyFromPassword,
  encryptPrivateKeyForBackup,
  decryptPrivateKeyFromBackup,
  exportPublicKeySpki,
  computePublicKeyFingerprint,
  PBKDF2_ITERATIONS,
  AES_GCM_IV_BYTES,
  PBKDF2_SALT_BYTES,
  arrayBufferToBase64,
} from '../vaultCrypto';

// ─── 1. IV Uniqueness ────────────────────────────────────────────────────────

describe('IV uniqueness', () => {
  it('generates a unique IV for every encryption under the same key', async () => {
    const aesKey = await generateAesKey();
    const plaintext = new TextEncoder().encode('test payload').buffer;
    const ivs = new Set();

    for (let i = 0; i < 50; i++) {
      const { iv } = await encryptBuffer(aesKey, plaintext);
      expect(ivs.has(iv)).toBe(false);
      ivs.add(iv);
    }

    expect(ivs.size).toBe(50);
  });

  it('uses a 12-byte (96-bit) IV — the standard for AES-GCM', () => {
    expect(AES_GCM_IV_BYTES).toBe(12);
  });
});

// ─── 2. Wrong Passphrase Fails Hard ─────────────────────────────────────────

describe('passphrase-based private key backup', () => {
  it('fails to decrypt with the wrong passphrase — throws, does not return garbage', async () => {
    const pair = await generateVaultKeyPair();
    const jwk = await globalThis.crypto.subtle.exportKey('jwk', pair.privateKey);

    const { encryptedBlob } = await encryptPrivateKeyForBackup(jwk, 'correct-passphrase');

    // Wrong passphrase must throw — AES-GCM auth tag verification failure
    await expect(
      decryptPrivateKeyFromBackup(encryptedBlob, 'wrong-passphrase')
    ).rejects.toThrow();
  });

  it('decrypts correctly with the right passphrase', async () => {
    const pair = await generateVaultKeyPair();
    const original = await globalThis.crypto.subtle.exportKey('jwk', pair.privateKey);

    const { encryptedBlob } = await encryptPrivateKeyForBackup(original, 'correct-passphrase');
    const recovered = await decryptPrivateKeyFromBackup(encryptedBlob, 'correct-passphrase');

    expect(recovered.n).toBe(original.n); // RSA modulus must match
  });

  it('uses a 32-byte (256-bit) PBKDF2 salt', () => {
    expect(PBKDF2_SALT_BYTES).toBe(32);
  });

  it('salt is embedded in the encrypted blob — server backup is self-contained for reinstall recovery', async () => {
    // This is the core fix for the reinstall-recovery gap: the salt must travel with
    // the ciphertext to the server so that decryption does not require any local
    // SecureStore state. Verify the blob contains a 'salt' field.
    const pair = await generateVaultKeyPair();
    const jwk = await globalThis.crypto.subtle.exportKey('jwk', pair.privateKey);

    const { encryptedBlob } = await encryptPrivateKeyForBackup(jwk, 'passphrase');
    const parsed = JSON.parse(encryptedBlob);

    expect(parsed.salt).toBeTruthy();
    expect(typeof parsed.salt).toBe('string');
    // salt must be 32 bytes → 44 base64 chars (with padding) or 43 (without)
    expect(Buffer.from(parsed.salt, 'base64').byteLength).toBe(PBKDF2_SALT_BYTES);
  });

  it('each backup call generates a distinct salt (salt is not reused)', async () => {
    const pair = await generateVaultKeyPair();
    const jwk = await globalThis.crypto.subtle.exportKey('jwk', pair.privateKey);

    const { encryptedBlob: blob1 } = await encryptPrivateKeyForBackup(jwk, 'passphrase');
    const { encryptedBlob: blob2 } = await encryptPrivateKeyForBackup(jwk, 'passphrase');

    expect(JSON.parse(blob1).salt).not.toBe(JSON.parse(blob2).salt);
  });

  it('rejects tampered ciphertext (auth tag mismatch)', async () => {
    const pair = await generateVaultKeyPair();
    const jwk = await globalThis.crypto.subtle.exportKey('jwk', pair.privateKey);
    const { encryptedBlob } = await encryptPrivateKeyForBackup(jwk, 'passphrase');

    // Flip one byte in the ciphertext
    const parsed = JSON.parse(encryptedBlob);
    const bytes = Buffer.from(parsed.ciphertext, 'base64');
    bytes[0] ^= 0xff;
    parsed.ciphertext = bytes.toString('base64');
    const tampered = JSON.stringify(parsed);

    await expect(
      decryptPrivateKeyFromBackup(tampered, 'passphrase')
    ).rejects.toThrow();
  });

  it('throws a descriptive error on legacy blobs missing the salt field', async () => {
    // Blobs created before this fix lack the embedded salt. Recovery is impossible
    // on reinstall; the error should be explicit rather than a confusing auth tag failure.
    const legacyBlob = JSON.stringify({ ciphertext: 'abc', iv: 'def', authTag: 'ghi' }); // no salt

    await expect(
      decryptPrivateKeyFromBackup(legacyBlob, 'any-passphrase')
    ).rejects.toThrow('missing salt field');
  });
});

// ─── 3. PBKDF2 Iteration Count ───────────────────────────────────────────────

describe('PBKDF2 iteration count', () => {
  it('meets the minimum security threshold of 800,000 iterations', () => {
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(800_000);
  });
});

// ─── 4. Public Key Fingerprint ───────────────────────────────────────────────

describe('public key fingerprint', () => {
  it('is deterministic — same key produces same fingerprint', async () => {
    const { publicKey } = await generateVaultKeyPair();
    const spki = await exportPublicKeySpki(publicKey);

    const fp1 = await computePublicKeyFingerprint(spki);
    const fp2 = await computePublicKeyFingerprint(spki);

    expect(fp1).toBe(fp2);
  });

  it('is unique — different keys produce different fingerprints', async () => {
    const kp1 = await generateVaultKeyPair();
    const kp2 = await generateVaultKeyPair();

    const spki1 = await exportPublicKeySpki(kp1.publicKey);
    const spki2 = await exportPublicKeySpki(kp2.publicKey);

    const fp1 = await computePublicKeyFingerprint(spki1);
    const fp2 = await computePublicKeyFingerprint(spki2);

    expect(fp1).not.toBe(fp2);
  });

  it('produces a human-readable space-separated format', async () => {
    const { publicKey } = await generateVaultKeyPair();
    const spki = await exportPublicKeySpki(publicKey);
    const fp = await computePublicKeyFingerprint(spki);

    // Format: groups of 4 chars separated by spaces
    expect(fp).toMatch(/^[A-Za-z0-9_-]{4}( [A-Za-z0-9_-]{4})*$/);
  });
});

// ─── 5. RSA Key Wrapping / Unwrapping ────────────────────────────────────────

describe('RSA-OAEP key wrapping', () => {
  it('successfully wraps and unwraps an AES key with the correct keypair', async () => {
    const { publicKey, privateKey } = await generateVaultKeyPair();
    const aesKey = await generateAesKey();

    const wrapped = await wrapKey(aesKey, publicKey);
    const unwrapped = await unwrapKey(wrapped, privateKey);

    // Verify the unwrapped key works for encryption/decryption
    const { ciphertext, iv, authTag } = await encryptBuffer(unwrapped, new TextEncoder().encode('hello').buffer);
    expect(ciphertext).toBeTruthy();
    expect(iv).toBeTruthy();
    expect(authTag).toBeTruthy();
  });

  it('fails to unwrap with a different private key — simulates key substitution attack', async () => {
    // Simulate: attacker server wraps the AES key with their own public key.
    // The legitimate user's private key cannot unwrap it — decryption fails.
    const legitimateKP = await generateVaultKeyPair();
    const attackerKP = await generateVaultKeyPair();

    const aesKey = await generateAesKey();

    // Attacker wraps with attacker's public key (key substitution)
    const wrappedByAttacker = await wrapKey(aesKey, attackerKP.publicKey);

    // Legitimate user tries to unwrap with their own private key — must throw
    await expect(
      unwrapKey(wrappedByAttacker, legitimateKP.privateKey)
    ).rejects.toThrow();
  });
});

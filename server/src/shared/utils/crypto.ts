import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { env } from '../../config/env';

const ALGORITHM = 'aes-256-gcm';

// Derive a 32-byte key from the configured secret (of any length) rather
// than requiring the env var itself be exactly 32 bytes.
function getKey(): Buffer {
  return createHash('sha256').update(env.calendarTokenKek).digest();
}

/** Encrypts a plaintext string for storage. Format: iv:authTag:ciphertext (all base64). */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':');
}

/**
 * Decrypts a value produced by encrypt(). Falls back to returning the raw
 * input unchanged if it isn't in that format (or fails to decrypt) — this
 * lets existing plaintext rows (written before encryption was added) keep
 * working until they're next rewritten, instead of hard-failing on them.
 */
export function decrypt(value: string): string {
  const parts = value.split(':');
  if (parts.length !== 3) return value;

  try {
    const [ivB64, authTagB64, ciphertextB64] = parts;
    const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  } catch {
    return value;
  }
}

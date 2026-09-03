import { encrypt, decrypt } from '../crypto';

describe('crypto (calendar token encryption at rest)', () => {
  it('should decrypt back to the original plaintext', () => {
    const plaintext = 'ya29.a0AfH6SMB_example_google_access_token';

    const ciphertext = encrypt(plaintext);

    expect(ciphertext).not.toBe(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it('should produce a different ciphertext each time (random IV)', () => {
    const plaintext = 'same-input-token';

    const a = encrypt(plaintext);
    const b = encrypt(plaintext);

    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe(plaintext);
    expect(decrypt(b)).toBe(plaintext);
  });

  it('should pass through a value that is not in encrypted format (legacy plaintext row)', () => {
    const legacyPlaintextToken = '1//09legacyRefreshTokenNeverEncrypted';

    expect(decrypt(legacyPlaintextToken)).toBe(legacyPlaintextToken);
  });

  it('should pass through a corrupted/undecryptable ciphertext instead of throwing', () => {
    const corrupted = 'aWF2:dGFn:Y29ycnVwdGVk'; // well-formed shape, wrong key material

    expect(() => decrypt(corrupted)).not.toThrow();
  });
});

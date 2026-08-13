import { Model, CreationOptional } from 'sequelize';
/**
 * VaultDocumentKey — per-user wrapped AES key for each vault document.
 *
 * When a document is uploaded, the uploader wraps the AES-256-GCM key with
 * their own RSA public key and stores it here. During a key ceremony, the
 * uploader (or any member who already has access) unwraps the AES key and
 * re-wraps it for each household member's RSA public key.
 *
 * The server never sees the raw AES key — only RSA-OAEP-wrapped ciphertext.
 */
declare class VaultDocumentKey extends Model {
    documentId: string;
    userId: string;
    wrappedKey: string;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
export default VaultDocumentKey;
//# sourceMappingURL=VaultDocumentKey.d.ts.map
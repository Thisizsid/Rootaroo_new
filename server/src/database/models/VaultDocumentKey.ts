import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

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
class VaultDocumentKey extends Model {
  declare documentId: string;
  declare userId: string;
  declare wrappedKey: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

VaultDocumentKey.init(
  {
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'document_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'user_id',
    },
    wrappedKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'wrapped_key',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'vault_document_keys',
    timestamps: true,
    paranoid: false,
  }
);

export default VaultDocumentKey;

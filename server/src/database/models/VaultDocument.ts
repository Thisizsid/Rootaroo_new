import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class VaultDocument extends Model {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare uploadedBy: string;
  declare name: string;
  declare mimeType: string;
  declare sizeBytes: number;
  declare encryptedKey: string;
  declare iv: string;
  declare cloudinaryPublicId: string;
  declare cloudinarySecureUrl: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

VaultDocument.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    householdId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'household_id',
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'uploaded_by',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'mime_type',
    },
    sizeBytes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'size_bytes',
    },
    encryptedKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'encrypted_key',
    },
    iv: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    cloudinaryPublicId: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'cloudinary_public_id',
    },
    cloudinarySecureUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'cloudinary_secure_url',
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
    tableName: 'vault_documents',
    timestamps: true,
    paranoid: false, // Hard delete per FR-130
  }
);

export default VaultDocument;
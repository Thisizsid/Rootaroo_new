import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class Household extends Model {
  declare id: CreationOptional<string>;
  declare name: string;
  declare inviteCode: string;
  declare storageUsedBytes: number;
  declare storageLimitBytes: number;
  declare coverPhotoUrl: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: Date | null;
  declare scheduledDeletionAt: Date | null;
}

Household.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    inviteCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'invite_code',
    },
    storageUsedBytes: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      field: 'storage_used_bytes',
    },
    storageLimitBytes: {
      type: DataTypes.BIGINT,
      defaultValue: 2147483648,
      field: 'storage_limit_bytes',
    },
    coverPhotoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'cover_photo_url',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
    scheduledDeletionAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_deletion_at',
    },
  },
  {
    sequelize,
    tableName: 'households',
    paranoid: true,
  }
);

export default Household;

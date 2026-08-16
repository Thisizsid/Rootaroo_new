import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class VaultKey extends Model {
  declare userId: string;
  declare householdId: string;
  declare publicKey: string;
  declare privateKeyEncrypted: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

VaultKey.init(
  {
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'user_id',
    },
    householdId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'household_id',
    },
    publicKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'public_key',
    },
    privateKeyEncrypted: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'private_key_encrypted',
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
    tableName: 'vault_keys',
    timestamps: true,
    paranoid: false,
  }
);

export default VaultKey;
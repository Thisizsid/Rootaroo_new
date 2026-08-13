import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class PasswordReset extends Model {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare token: string;
  declare expiresAt: Date;
  declare usedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
}

PasswordReset.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'used_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'password_resets',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['token'] },
      { name: 'idx_password_reset_user_created', fields: ['user_id', 'created_at'] },
    ],
  }
);

export default PasswordReset;

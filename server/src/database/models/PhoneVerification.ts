import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class PhoneVerification extends Model {
  declare id: CreationOptional<string>;
  declare phone: string;
  declare userId: string | null;
  declare token: string;
  declare expiresAt: Date;
  declare verifiedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
}

PhoneVerification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
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
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'phone_verifications',
    timestamps: true,
    updatedAt: false,
    paranoid: false,
    indexes: [
      { name: 'idx_phone_verification_phone_token', fields: ['phone', 'token'] },
    ],
  }
);

export default PhoneVerification;

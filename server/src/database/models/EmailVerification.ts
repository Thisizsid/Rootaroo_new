import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class EmailVerification extends Model {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare token: string;
  declare expiresAt: Date;
  declare verifiedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
}

EmailVerification.init(
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
      unique: true,
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
    tableName: 'email_verifications',
    timestamps: true,
    paranoid: false,
    indexes: [
      { name: 'idx_email_verification_user_token', fields: ['user_id', 'token'] },
    ],
  }
);

export default EmailVerification;

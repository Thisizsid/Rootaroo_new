import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class User extends Model {
  declare id: CreationOptional<string>;
  declare email: string;
  declare passwordHash: string;
  declare displayName: string;
  declare avatarUrl: string | null;
  declare avatarEmoji: string | null;
  declare avatarPresetId: string | null;
  declare dateOfBirth: string | null;
  declare homeAddress: string | null;
  declare phone: string | null;
  declare isPhoneVerified: boolean;
  declare addToCalendar: boolean;
  declare notifyHousehold: boolean;
  declare role: 'admin' | 'member' | 'child';
  declare isVerified: boolean;
  declare googleId: string | null;
  declare appleId: string | null;
  declare lastLoginAt: Date | null;
  declare scheduledDeletionAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: Date | null;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'display_name',
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'avatar_url',
    },
    avatarEmoji: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'avatar_emoji',
    },
    avatarPresetId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'avatar_preset_id',
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth',
    },
    homeAddress: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'home_address',
    },
    phone: {
      type: DataTypes.STRING(32),
      allowNull: true,
      unique: true,
    },
    isPhoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_phone_verified',
    },
    addToCalendar: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'add_to_calendar',
    },
    notifyHousehold: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'notify_household',
    },
    role: {
      type: DataTypes.ENUM('admin', 'member', 'child'),
      defaultValue: 'member',
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified',
    },
    googleId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'google_id',
    },
    appleId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'apple_id',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
    },
    scheduledDeletionAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_deletion_at',
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
  },
  {
    sequelize,
    tableName: 'users',
    paranoid: true,
    indexes: [{ fields: ['email'] }, { fields: ['phone'] }],
  }
);

export default User;

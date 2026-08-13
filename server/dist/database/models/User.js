"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class User extends sequelize_1.Model {
}
User.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    passwordHash: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash',
    },
    displayName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        field: 'display_name',
    },
    avatarUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        field: 'avatar_url',
    },
    avatarEmoji: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: true,
        field: 'avatar_emoji',
    },
    avatarPresetId: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
        field: 'avatar_preset_id',
    },
    dateOfBirth: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
        field: 'date_of_birth',
    },
    homeAddress: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        field: 'home_address',
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(32),
        allowNull: true,
        unique: true,
    },
    isPhoneVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_phone_verified',
    },
    addToCalendar: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'add_to_calendar',
    },
    notifyHousehold: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'notify_household',
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('admin', 'member', 'child'),
        defaultValue: 'member',
    },
    isVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified',
    },
    googleId: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        field: 'google_id',
    },
    lastLoginAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'last_login_at',
    },
    scheduledDeletionAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'scheduled_deletion_at',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'created_at',
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'updated_at',
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
    },
}, {
    sequelize: database_1.default,
    tableName: 'users',
    paranoid: true,
    indexes: [{ fields: ['email'] }, { fields: ['phone'] }],
});
exports.default = User;
//# sourceMappingURL=User.js.map
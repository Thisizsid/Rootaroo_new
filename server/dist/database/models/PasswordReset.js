"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class PasswordReset extends sequelize_1.Model {
}
PasswordReset.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
    },
    token: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    expiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'expires_at',
    },
    usedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'used_at',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'created_at',
    },
}, {
    sequelize: database_1.default,
    tableName: 'password_resets',
    timestamps: true,
    paranoid: false,
    indexes: [
        { fields: ['token'] },
        { name: 'idx_password_reset_user_created', fields: ['user_id', 'created_at'] },
    ],
});
exports.default = PasswordReset;
//# sourceMappingURL=PasswordReset.js.map
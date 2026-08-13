"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class DeviceToken extends sequelize_1.Model {
}
DeviceToken.init({
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
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    platform: {
        type: sequelize_1.DataTypes.ENUM('ios', 'android', 'web'),
        allowNull: false,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'created_at',
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'updated_at',
    },
}, {
    sequelize: database_1.default,
    tableName: 'device_tokens',
    indexes: [
        { name: 'idx_device_tokens_user_id', fields: ['user_id'] },
        { name: 'idx_device_tokens_token', fields: ['token'], unique: true },
    ],
});
exports.default = DeviceToken;
//# sourceMappingURL=DeviceToken.js.map
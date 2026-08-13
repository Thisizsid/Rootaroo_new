"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class Household extends sequelize_1.Model {
}
Household.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    inviteCode: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'invite_code',
    },
    storageUsedBytes: {
        type: sequelize_1.DataTypes.BIGINT,
        defaultValue: 0,
        field: 'storage_used_bytes',
    },
    storageLimitBytes: {
        type: sequelize_1.DataTypes.BIGINT,
        defaultValue: 2147483648,
        field: 'storage_limit_bytes',
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
    tableName: 'households',
    paranoid: true,
});
exports.default = Household;
//# sourceMappingURL=Household.js.map
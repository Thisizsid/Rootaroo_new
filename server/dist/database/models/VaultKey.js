"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class VaultKey extends sequelize_1.Model {
}
VaultKey.init({
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: 'user_id',
    },
    householdId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'household_id',
    },
    publicKey: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        field: 'public_key',
    },
    privateKeyEncrypted: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        field: 'private_key_encrypted',
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
    tableName: 'vault_keys',
    timestamps: true,
    paranoid: false,
});
exports.default = VaultKey;
//# sourceMappingURL=VaultKey.js.map
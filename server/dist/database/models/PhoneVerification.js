"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class PhoneVerification extends sequelize_1.Model {
}
PhoneVerification.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(32),
        allowNull: false,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
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
    verifiedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'verified_at',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'created_at',
    },
}, {
    sequelize: database_1.default,
    tableName: 'phone_verifications',
    timestamps: true,
    updatedAt: false,
    paranoid: false,
    indexes: [
        { name: 'idx_phone_verification_phone_token', fields: ['phone', 'token'] },
    ],
});
exports.default = PhoneVerification;
//# sourceMappingURL=PhoneVerification.js.map
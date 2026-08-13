"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class VaultDocument extends sequelize_1.Model {
}
VaultDocument.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    householdId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'household_id',
    },
    uploadedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'uploaded_by',
    },
    name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    mimeType: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        field: 'mime_type',
    },
    sizeBytes: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        field: 'size_bytes',
    },
    encryptedKey: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        field: 'encrypted_key',
    },
    iv: {
        type: sequelize_1.DataTypes.STRING(64),
        allowNull: false,
    },
    cloudinaryPublicId: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
        field: 'cloudinary_public_id',
    },
    cloudinarySecureUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
        field: 'cloudinary_secure_url',
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
    tableName: 'vault_documents',
    timestamps: true,
    paranoid: false, // Hard delete per FR-130
});
exports.default = VaultDocument;
//# sourceMappingURL=VaultDocument.js.map
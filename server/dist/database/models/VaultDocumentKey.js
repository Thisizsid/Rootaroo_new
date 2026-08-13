"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
/**
 * VaultDocumentKey — per-user wrapped AES key for each vault document.
 *
 * When a document is uploaded, the uploader wraps the AES-256-GCM key with
 * their own RSA public key and stores it here. During a key ceremony, the
 * uploader (or any member who already has access) unwraps the AES key and
 * re-wraps it for each household member's RSA public key.
 *
 * The server never sees the raw AES key — only RSA-OAEP-wrapped ciphertext.
 */
class VaultDocumentKey extends sequelize_1.Model {
}
VaultDocumentKey.init({
    documentId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: 'document_id',
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: 'user_id',
    },
    wrappedKey: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        field: 'wrapped_key',
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
    tableName: 'vault_document_keys',
    timestamps: true,
    paranoid: false,
});
exports.default = VaultDocumentKey;
//# sourceMappingURL=VaultDocumentKey.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class ChatMessage extends sequelize_1.Model {
}
ChatMessage.init({
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
    conversationId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'conversation_id',
    },
    senderId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'sender_id',
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    mediaUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        field: 'media_url',
    },
    replyToId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'reply_to_id',
    },
    editedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'edited_at',
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
    tableName: 'chat_messages',
    paranoid: true,
    indexes: [
        { name: 'idx_chat_messages_household_created', fields: ['household_id', 'created_at'] },
    ],
});
exports.default = ChatMessage;
//# sourceMappingURL=ChatMessage.js.map
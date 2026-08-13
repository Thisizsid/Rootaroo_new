"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class ConversationParticipant extends sequelize_1.Model {
}
ConversationParticipant.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    conversationId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'conversation_id',
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
    },
    joinedAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'joined_at',
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.default,
    tableName: 'conversation_participants',
    timestamps: false,
    indexes: [
        { fields: ['conversation_id'] },
        { fields: ['user_id'] },
        { unique: true, fields: ['conversation_id', 'user_id'] },
    ],
});
exports.default = ConversationParticipant;
//# sourceMappingURL=ConversationParticipant.js.map
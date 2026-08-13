"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class ChatReaction extends sequelize_1.Model {
}
ChatReaction.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    messageId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'message_id',
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
    },
    reaction: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'created_at',
    },
}, {
    sequelize: database_1.default,
    tableName: 'chat_reactions',
    timestamps: true,
    paranoid: false,
    indexes: [
        { unique: true, fields: ['message_id', 'user_id', 'reaction'] },
    ],
});
exports.default = ChatReaction;
//# sourceMappingURL=ChatReaction.js.map
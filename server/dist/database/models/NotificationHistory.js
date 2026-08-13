"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class NotificationHistory extends sequelize_1.Model {
}
NotificationHistory.init({
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
    type: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    body: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    data: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    isRead: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_read',
    },
    readAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'read_at',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'created_at',
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
    },
}, {
    sequelize: database_1.default,
    tableName: 'notification_history',
    paranoid: true,
    indexes: [
        { name: 'idx_notifications_user_read', fields: ['user_id', 'is_read', 'created_at'] },
    ],
});
exports.default = NotificationHistory;
//# sourceMappingURL=NotificationHistory.js.map
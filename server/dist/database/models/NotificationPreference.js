"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class NotificationPreference extends sequelize_1.Model {
}
NotificationPreference.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: 'user_id',
    },
    newPost: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'new_post',
    },
    taskAssigned: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'task_assigned',
    },
    taskCompleted: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'task_completed',
    },
    checkIn: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'check_in',
    },
    newExpense: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'new_expense',
    },
    chatMessage: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'chat_message',
    },
    calendarEvent: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'calendar_event',
    },
    memberJoined: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'member_joined',
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
    tableName: 'notification_preferences',
    timestamps: true,
    paranoid: false,
});
exports.default = NotificationPreference;
//# sourceMappingURL=NotificationPreference.js.map
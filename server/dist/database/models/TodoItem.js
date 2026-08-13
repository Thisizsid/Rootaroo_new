"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class TodoItem extends sequelize_1.Model {
}
TodoItem.init({
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
    title: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    dueDate: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
        field: 'due_date',
    },
    assignedTo: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'assigned_to',
    },
    isCompleted: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_completed',
    },
    completedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'completed_at',
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
    tableName: 'todo_items',
    paranoid: true,
});
exports.default = TodoItem;
//# sourceMappingURL=TodoItem.js.map
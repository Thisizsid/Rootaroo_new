"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class Task extends sequelize_1.Model {
}
Task.init({
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
    createdBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'created_by',
    },
    title: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    dueDate: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
        field: 'due_date',
    },
    recurrence: {
        type: sequelize_1.DataTypes.ENUM('none', 'daily', 'weekly', 'monthly'),
        defaultValue: 'none',
    },
    recurrenceEndDate: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
        field: 'recurrence_end_date',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'completed', 'reopened'),
        defaultValue: 'pending',
    },
    completedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'completed_at',
    },
    completedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'completed_by',
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
    tableName: 'tasks',
    paranoid: true,
    indexes: [
        { name: 'idx_tasks_household_status', fields: ['household_id', 'status'] },
    ],
});
exports.default = Task;
//# sourceMappingURL=Task.js.map
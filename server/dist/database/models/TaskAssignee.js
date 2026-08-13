"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class TaskAssignee extends sequelize_1.Model {
}
TaskAssignee.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    taskId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'task_id',
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'created_at',
    },
}, {
    sequelize: database_1.default,
    tableName: 'task_assignees',
    timestamps: true,
    paranoid: false,
});
exports.default = TaskAssignee;
//# sourceMappingURL=TaskAssignee.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class ExpenseParticipant extends sequelize_1.Model {
}
ExpenseParticipant.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    expenseId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'expense_id',
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
    },
    shareAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'share_amount',
    },
    isSettled: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_settled',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'created_at',
    },
}, {
    sequelize: database_1.default,
    tableName: 'expense_participants',
    timestamps: true,
    paranoid: false,
});
exports.default = ExpenseParticipant;
//# sourceMappingURL=ExpenseParticipant.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class Settlement extends sequelize_1.Model {
}
Settlement.init({
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
    fromUserId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'from_user_id',
    },
    toUserId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'to_user_id',
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    settledAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
        field: 'settled_at',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'created_at',
    },
}, {
    sequelize: database_1.default,
    tableName: 'settlements',
    timestamps: true,
    paranoid: false,
});
exports.default = Settlement;
//# sourceMappingURL=Settlement.js.map
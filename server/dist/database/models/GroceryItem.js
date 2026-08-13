"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class GroceryItem extends sequelize_1.Model {
}
GroceryItem.init({
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
    name: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    quantity: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    note: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    assignedTo: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'assigned_to',
    },
    isBought: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_bought',
    },
    boughtBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'bought_by',
    },
    boughtAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'bought_at',
    },
    archivedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'archived_at',
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
    tableName: 'grocery_items',
    paranoid: true,
    indexes: [
        { name: 'idx_grocery_household_bought', fields: ['household_id', 'is_bought'] },
    ],
});
exports.default = GroceryItem;
//# sourceMappingURL=GroceryItem.js.map
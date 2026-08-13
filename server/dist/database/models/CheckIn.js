"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class CheckIn extends sequelize_1.Model {
}
CheckIn.init({
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
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
    },
    latitude: {
        type: sequelize_1.DataTypes.DECIMAL(10, 7),
        allowNull: true,
    },
    longitude: {
        type: sequelize_1.DataTypes.DECIMAL(10, 7),
        allowNull: true,
    },
    address: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    note: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    checkedInAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: 'checked_in_at',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'created_at',
    },
}, {
    sequelize: database_1.default,
    tableName: 'check_ins',
    timestamps: true,
    paranoid: false,
});
exports.default = CheckIn;
//# sourceMappingURL=CheckIn.js.map
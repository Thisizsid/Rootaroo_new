"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class CalendarSyncState extends sequelize_1.Model {
}
CalendarSyncState.init({
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
    googleCalendarId: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        field: 'google_calendar_id',
    },
    syncToken: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        field: 'sync_token',
    },
    lastSyncedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'last_synced_at',
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
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
    tableName: 'calendar_sync_states',
    timestamps: true,
    paranoid: false,
});
exports.default = CalendarSyncState;
//# sourceMappingURL=CalendarSyncState.js.map
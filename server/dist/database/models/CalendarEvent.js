"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class CalendarEvent extends sequelize_1.Model {
}
CalendarEvent.init({
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
    eventDate: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
        field: 'event_date',
    },
    startTime: {
        type: sequelize_1.DataTypes.TIME,
        allowNull: true,
        field: 'start_time',
    },
    endTime: {
        type: sequelize_1.DataTypes.TIME,
        allowNull: true,
        field: 'end_time',
    },
    isRecurring: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_recurring',
    },
    recurrenceRule: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        field: 'recurrence_rule',
    },
    googleEventId: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        field: 'google_event_id',
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
    tableName: 'calendar_events',
    paranoid: true,
    indexes: [
        { name: 'idx_calendar_household_date', fields: ['household_id', 'event_date'] },
    ],
});
exports.default = CalendarEvent;
//# sourceMappingURL=CalendarEvent.js.map
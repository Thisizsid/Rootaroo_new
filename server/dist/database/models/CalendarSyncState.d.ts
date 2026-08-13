import { Model, CreationOptional } from 'sequelize';
declare class CalendarSyncState extends Model {
    id: CreationOptional<string>;
    userId: string;
    googleCalendarId: string;
    syncToken: string | null;
    lastSyncedAt: Date | null;
    isActive: boolean;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
export default CalendarSyncState;
//# sourceMappingURL=CalendarSyncState.d.ts.map
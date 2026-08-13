import { Model, CreationOptional } from 'sequelize';
declare class CalendarEvent extends Model {
    id: CreationOptional<string>;
    householdId: string;
    createdBy: string;
    title: string;
    description: string | null;
    eventDate: Date;
    startTime: string | null;
    endTime: string | null;
    isRecurring: boolean;
    recurrenceRule: string | null;
    googleEventId: string | null;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
    deletedAt: Date | null;
}
export default CalendarEvent;
//# sourceMappingURL=CalendarEvent.d.ts.map
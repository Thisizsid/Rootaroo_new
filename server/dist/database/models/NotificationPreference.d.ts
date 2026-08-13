import { Model, CreationOptional } from 'sequelize';
declare class NotificationPreference extends Model {
    id: CreationOptional<string>;
    userId: string;
    newPost: boolean;
    taskAssigned: boolean;
    taskCompleted: boolean;
    checkIn: boolean;
    newExpense: boolean;
    chatMessage: boolean;
    calendarEvent: boolean;
    memberJoined: boolean;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
export default NotificationPreference;
//# sourceMappingURL=NotificationPreference.d.ts.map
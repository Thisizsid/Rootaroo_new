import { Model, CreationOptional } from 'sequelize';
declare class NotificationHistory extends Model {
    id: CreationOptional<string>;
    userId: string;
    type: string;
    title: string;
    body: string | null;
    data: object | null;
    isRead: boolean;
    readAt: Date | null;
    createdAt: CreationOptional<Date>;
    deletedAt: Date | null;
}
export default NotificationHistory;
//# sourceMappingURL=NotificationHistory.d.ts.map
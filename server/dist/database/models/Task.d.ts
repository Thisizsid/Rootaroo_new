import { Model, CreationOptional } from 'sequelize';
declare class Task extends Model {
    id: CreationOptional<string>;
    householdId: string;
    createdBy: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
    recurrenceEndDate: string | null;
    status: 'pending' | 'completed' | 'reopened';
    completedAt: Date | null;
    completedBy: string | null;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
    deletedAt: Date | null;
}
export default Task;
//# sourceMappingURL=Task.d.ts.map
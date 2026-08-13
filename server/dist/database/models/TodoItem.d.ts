import { Model, CreationOptional } from 'sequelize';
declare class TodoItem extends Model {
    id: CreationOptional<string>;
    householdId: string;
    title: string;
    dueDate: Date | null;
    assignedTo: string | null;
    isCompleted: boolean;
    completedAt: Date | null;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
    deletedAt: Date | null;
}
export default TodoItem;
//# sourceMappingURL=TodoItem.d.ts.map
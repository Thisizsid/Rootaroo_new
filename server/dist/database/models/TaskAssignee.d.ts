import { Model, CreationOptional } from 'sequelize';
declare class TaskAssignee extends Model {
    id: CreationOptional<string>;
    taskId: string;
    userId: string;
    createdAt: CreationOptional<Date>;
}
export default TaskAssignee;
//# sourceMappingURL=TaskAssignee.d.ts.map
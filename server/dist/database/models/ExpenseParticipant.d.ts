import { Model, CreationOptional } from 'sequelize';
declare class ExpenseParticipant extends Model {
    id: CreationOptional<string>;
    expenseId: string;
    userId: string;
    shareAmount: number;
    isSettled: boolean;
    createdAt: CreationOptional<Date>;
}
export default ExpenseParticipant;
//# sourceMappingURL=ExpenseParticipant.d.ts.map
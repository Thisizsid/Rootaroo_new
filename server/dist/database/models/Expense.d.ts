import { Model, CreationOptional } from 'sequelize';
declare class Expense extends Model {
    id: CreationOptional<string>;
    householdId: string;
    paidBy: string;
    title: string;
    amount: number;
    splitType: 'equal' | 'custom';
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
    deletedAt: Date | null;
}
export default Expense;
//# sourceMappingURL=Expense.d.ts.map
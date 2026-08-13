import { Model, CreationOptional } from 'sequelize';
declare class Settlement extends Model {
    id: CreationOptional<string>;
    householdId: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    settledAt: Date;
    createdAt: CreationOptional<Date>;
}
export default Settlement;
//# sourceMappingURL=Settlement.d.ts.map
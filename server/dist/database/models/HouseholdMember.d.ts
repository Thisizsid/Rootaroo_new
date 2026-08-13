import { Model, CreationOptional } from 'sequelize';
import type Household from './Household';
import type User from './User';
declare class HouseholdMember extends Model {
    id: CreationOptional<string>;
    householdId: string;
    userId: string;
    role: 'admin' | 'member' | 'child';
    joinedAt: Date;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
    deletedAt: Date | null;
    household?: Household;
    user?: User;
}
export default HouseholdMember;
//# sourceMappingURL=HouseholdMember.d.ts.map
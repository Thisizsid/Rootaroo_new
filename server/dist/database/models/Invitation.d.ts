import { Model, CreationOptional } from 'sequelize';
import type Household from './Household';
import type User from './User';
declare class Invitation extends Model {
    id: CreationOptional<string>;
    householdId: string;
    invitedBy: string;
    code: string;
    email: string | null;
    expiresAt: Date;
    acceptedAt: Date | null;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
    inviter?: User;
    household?: Household;
}
export default Invitation;
//# sourceMappingURL=Invitation.d.ts.map
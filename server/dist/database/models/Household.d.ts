import { Model, CreationOptional } from 'sequelize';
declare class Household extends Model {
    id: CreationOptional<string>;
    name: string;
    inviteCode: string;
    storageUsedBytes: number;
    storageLimitBytes: number;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
    deletedAt: Date | null;
}
export default Household;
//# sourceMappingURL=Household.d.ts.map
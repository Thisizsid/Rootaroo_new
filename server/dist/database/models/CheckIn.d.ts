import { Model, CreationOptional } from 'sequelize';
declare class CheckIn extends Model {
    id: CreationOptional<string>;
    householdId: string;
    userId: string;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    note: string | null;
    checkedInAt: Date;
    createdAt: CreationOptional<Date>;
}
export default CheckIn;
//# sourceMappingURL=CheckIn.d.ts.map
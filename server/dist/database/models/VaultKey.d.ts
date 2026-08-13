import { Model, CreationOptional } from 'sequelize';
declare class VaultKey extends Model {
    userId: string;
    householdId: string;
    publicKey: string;
    privateKeyEncrypted: string;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
export default VaultKey;
//# sourceMappingURL=VaultKey.d.ts.map
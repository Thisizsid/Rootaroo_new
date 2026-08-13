import { Model, CreationOptional } from 'sequelize';
declare class PasswordReset extends Model {
    id: CreationOptional<string>;
    userId: string;
    token: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: CreationOptional<Date>;
}
export default PasswordReset;
//# sourceMappingURL=PasswordReset.d.ts.map
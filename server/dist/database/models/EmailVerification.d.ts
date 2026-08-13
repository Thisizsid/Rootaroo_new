import { Model, CreationOptional } from 'sequelize';
declare class EmailVerification extends Model {
    id: CreationOptional<string>;
    userId: string;
    token: string;
    expiresAt: Date;
    verifiedAt: Date | null;
    createdAt: CreationOptional<Date>;
}
export default EmailVerification;
//# sourceMappingURL=EmailVerification.d.ts.map
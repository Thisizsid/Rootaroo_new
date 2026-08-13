import { Model, CreationOptional } from 'sequelize';
declare class PhoneVerification extends Model {
    id: CreationOptional<string>;
    phone: string;
    userId: string | null;
    token: string;
    expiresAt: Date;
    verifiedAt: Date | null;
    createdAt: CreationOptional<Date>;
}
export default PhoneVerification;
//# sourceMappingURL=PhoneVerification.d.ts.map
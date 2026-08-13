import { Model, CreationOptional } from 'sequelize';
import type User from './User';
declare class RefreshToken extends Model {
    id: CreationOptional<string>;
    userId: string;
    token: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: CreationOptional<Date>;
    user?: User;
}
export default RefreshToken;
//# sourceMappingURL=RefreshToken.d.ts.map
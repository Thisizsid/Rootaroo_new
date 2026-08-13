import { Model, CreationOptional } from 'sequelize';
declare class DeviceToken extends Model {
    id: CreationOptional<string>;
    userId: string;
    token: string;
    platform: 'ios' | 'android' | 'web';
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
export default DeviceToken;
//# sourceMappingURL=DeviceToken.d.ts.map
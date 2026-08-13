import { Model, CreationOptional } from 'sequelize';
declare class User extends Model {
    id: CreationOptional<string>;
    email: string;
    passwordHash: string;
    displayName: string;
    avatarUrl: string | null;
    avatarEmoji: string | null;
    avatarPresetId: string | null;
    dateOfBirth: string | null;
    homeAddress: string | null;
    phone: string | null;
    isPhoneVerified: boolean;
    addToCalendar: boolean;
    notifyHousehold: boolean;
    role: 'admin' | 'member' | 'child';
    isVerified: boolean;
    googleId: string | null;
    lastLoginAt: Date | null;
    scheduledDeletionAt: Date | null;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
    deletedAt: Date | null;
}
export default User;
//# sourceMappingURL=User.d.ts.map
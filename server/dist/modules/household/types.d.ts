export interface CreateHouseholdBody {
    name: string;
}
export interface HouseholdResponse {
    id: string;
    name: string;
    inviteCode: string;
    memberCount: number;
    role: string;
    createdAt: string;
}
export interface InvitationResponse {
    id: string;
    code: string;
    expiresAt: string;
    shareLink: string;
}
export interface JoinHouseholdBody {
    code: string;
}
export interface MemberResponse {
    userId: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    avatarEmoji: string | null;
    role: string;
    joinedAt: string;
}
export interface TransferAdminBody {
    newAdminId: string;
}
export interface ChangeRoleBody {
    role: 'admin' | 'member' | 'child';
}
//# sourceMappingURL=types.d.ts.map
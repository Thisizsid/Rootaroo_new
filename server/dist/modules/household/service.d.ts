import type { CreateHouseholdBody, HouseholdResponse, InvitationResponse, JoinHouseholdBody, MemberResponse, ChangeRoleBody } from './types';
export declare function createHousehold(userId: string, body: CreateHouseholdBody): Promise<HouseholdResponse>;
export declare function getHousehold(householdId: string, userId: string): Promise<HouseholdResponse>;
export declare function listUserHouseholds(userId: string): Promise<HouseholdResponse[]>;
export declare function generateInvitation(userId: string, householdId: string): Promise<InvitationResponse>;
export declare function joinViaCode(userId: string, body: JoinHouseholdBody): Promise<HouseholdResponse>;
export declare function removeMember(adminUserId: string, householdId: string, targetUserId: string): Promise<void>;
export declare function leaveHousehold(userId: string, householdId: string): Promise<void>;
export declare function transferAdmin(userId: string, householdId: string, newAdminId: string): Promise<HouseholdResponse>;
export declare function changeMemberRole(adminUserId: string, householdId: string, targetUserId: string, body: ChangeRoleBody): Promise<MemberResponse>;
export declare function listMembers(householdId: string, userId: string): Promise<MemberResponse[]>;
//# sourceMappingURL=service.d.ts.map
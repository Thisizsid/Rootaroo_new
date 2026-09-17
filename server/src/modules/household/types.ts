export interface CreateHouseholdBody {
  name: string;
}

export interface HouseholdResponse {
  id: string;
  name: string;
  inviteCode: string | null;
  memberCount: number;
  role: string;
  coverPhotoUrl: string | null;
  createdAt: string;
  scheduledDeletionAt: string | null;
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
  dateOfBirth: string | null;
  role: string;
  joinedAt: string;
}

export interface TransferAdminBody {
  newAdminId: string;
}

export interface ChangeRoleBody {
  role: 'admin' | 'member' | 'child';
}

export type HouseholdActionRequestType = 'leave' | 'delete';
export type HouseholdActionRequestStatus = 'pending' | 'approved' | 'rejected';

export interface HouseholdActionRequestResponse {
  id: string;
  householdId: string;
  requestedBy: string;
  type: HouseholdActionRequestType;
  status: HouseholdActionRequestStatus;
  reviewerNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

/** The admin-facing view of a pending leave request — adds the requester's
 * display name so the settings screen can show "X wants to leave." */
export interface PendingLeaveRequestResponse extends HouseholdActionRequestResponse {
  requestedByName: string | null;
}

export interface CreatePingRequestBody {
  targetUserId: string;
  note?: string | null;
}

export type PingRespondAction = 'accept' | 'decline';

export interface RespondPingRequestBody {
  action: PingRespondAction;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  durationMinutes?: number;
}

export interface UpdateShareLocationBody {
  latitude: number;
  longitude: number;
}

interface PingUserSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface PingRequestResponse {
  id: string;
  householdId: string;
  requester: PingUserSummary | null;
  target: PingUserSummary | null;
  status: 'pending' | 'fulfilled' | 'declined' | 'expired';
  note: string | null;
  checkInId: string | null;
  respondedAt: string | null;
  shareDurationMinutes: number | null;
  shareExpiresAt: string | null;
  liveLatitude: number | null;
  liveLongitude: number | null;
  liveUpdatedAt: string | null;
  createdAt: string;
}

export interface PaginatedPingRequestsResponse {
  items: PingRequestResponse[];
  nextCursor: string | null;
}

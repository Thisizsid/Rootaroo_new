export interface CreateCheckInBody {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  note?: string | null;
}

export interface CheckInResponse {
  id: string;
  householdId: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  note: string | null;
  checkedInAt: string;
  createdAt: string;
}

export interface PaginatedCheckInsResponse {
  items: CheckInResponse[];
  nextCursor: string | null;
}

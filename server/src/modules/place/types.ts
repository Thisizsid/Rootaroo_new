export type SavedPlaceIcon = 'home' | 'office' | 'school' | 'custom';

export interface CreateSavedPlaceBody {
  name: string;
  icon: SavedPlaceIcon;
  latitude: number;
  longitude: number;
  address?: string | null;
}

export interface UpdateSavedPlaceBody {
  name?: string;
  icon?: SavedPlaceIcon;
  latitude?: number;
  longitude?: number;
  address?: string | null;
}

export interface SavedPlaceResponse {
  id: string;
  householdId: string;
  userId: string;
  name: string;
  icon: SavedPlaceIcon;
  latitude: number;
  longitude: number;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

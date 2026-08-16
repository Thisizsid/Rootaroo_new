export interface CreateGroceryBody {
  name: string;
  quantity?: string;
  note?: string;
  assignedTo?: string;
}

export interface UpdateGroceryBody {
  name?: string;
  quantity?: string | null;
  note?: string | null;
  assignedTo?: string | null;
}

export interface GroceryResponse {
  id: string;
  name: string;
  quantity: string | null;
  note: string | null;
  assignedTo: GroceryAssignee | null;
  isBought: boolean;
  boughtBy: GroceryAssignee | null;
  boughtAt: string | null;
  createdAt: string;
}

export interface GroceryAssignee {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  avatarEmoji: string | null;
}

export interface GroupedGroceriesResponse {
  pending: GroceryResponse[];
  bought: GroceryResponse[];
  archived: GroceryResponse[];
}

export interface GrocerySummaryResponse {
  pending: number;
  boughtToday: number;
}

export interface CreateExpenseBody {
  title: string;
  amount: number;
  paidBy: string;
  date?: string;
  splitType: 'equal' | 'custom';
  participants: {
    userId: string;
    shareAmount?: number;
  }[];
}

export interface UpdateExpenseBody {
  title?: string;
  amount?: number;
  paidBy?: string;
  date?: string;
  splitType?: 'equal' | 'custom';
  participants?: {
    userId: string;
    shareAmount?: number;
  }[];
}

export interface ExpenseQuery {
  cursor?: string;
  limit?: number;
}

export interface SettlementBody {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface ExpenseParticipantResponse {
  id: string;
  expenseId: string;
  userId: string;
  shareAmount: number;
  isSettled: boolean;
  createdAt: string;
  user?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarEmoji: string | null;
  } | null;
}

export interface ExpenseResponse {
  id: string;
  householdId: string;
  title: string;
  amount: number;
  paidBy: string;
  splitType: 'equal' | 'custom';
  date: string;
  createdAt: string;
  updatedAt: string;
  participants: ExpenseParticipantResponse[];
  payer?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarEmoji: string | null;
  };
}

export interface PaginatedExpenses {
  expenses: ExpenseResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface NetBalanceResponse {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  avatarEmoji: string | null;
  paidTotal: number;
  shareTotal: number;
  netBalance: number;
}

export interface LedgerEntryResponse {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export interface ExpenseSummaryResponse {
  netBalances: NetBalanceResponse[];
  totalExpenses: number;
  totalAmount: number;
  ledger: LedgerEntryResponse[];
}

export interface SettlementResponse {
  id: string;
  householdId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  settledAt: string;
  fromUser?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarEmoji: string | null;
  };
  toUser?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarEmoji: string | null;
  };
}

export interface PaginatedSettlements {
  settlements: SettlementResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}
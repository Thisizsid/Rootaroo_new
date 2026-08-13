import type { ExpenseResponse, ExpenseSummaryResponse, LedgerEntryResponse, SettlementResponse, PaginatedSettlements, PaginatedExpenses } from './types';
/** FR-100: Create expense with equal or custom split */
export declare function createExpense(_userId: string, householdId: string, body: {
    title: string;
    amount: number;
    paidBy: string;
    date?: string;
    splitType: 'equal' | 'custom';
    participants: {
        userId: string;
        shareAmount?: number;
    }[];
}): Promise<ExpenseResponse>;
/** FR-106: List expenses with cursor pagination */
export declare function listExpenses(householdId: string, _userId: string, options: {
    cursor?: string;
    limit?: number;
}): Promise<PaginatedExpenses>;
export declare function getExpenseById(expenseId: string, userId: string): Promise<ExpenseResponse>;
/** FR-107, FR-108: Update expense (creator or admin only) */
export declare function updateExpense(expenseId: string, userId: string, userRole: string, body: {
    title?: string;
    amount?: number;
    paidBy?: string;
    splitType?: 'equal' | 'custom';
    participants?: {
        userId: string;
        shareAmount?: number;
    }[];
}): Promise<ExpenseResponse>;
/** FR-107, FR-108: Delete expense (creator or admin only) */
export declare function deleteExpense(expenseId: string, userId: string, userRole: string): Promise<void>;
/** FR-103, FR-104, FR-109: Get expense summary with net balances and ledger */
export declare function getExpenseSummary(userId: string): Promise<ExpenseSummaryResponse>;
/** FR-104: Get simplified ledger (standalone endpoint, unwraps from summary) */
export declare function getLedger(userId: string): Promise<LedgerEntryResponse[]>;
/** FR-105: Record a settlement between two users */
export declare function recordSettlement(userId: string, body: {
    fromUserId: string;
    toUserId: string;
    amount: number;
}): Promise<SettlementResponse>;
/** FR-106: Get settlement history */
export declare function getSettlements(userId: string, options: {
    cursor?: string;
    limit?: number;
}): Promise<PaginatedSettlements>;
//# sourceMappingURL=service.d.ts.map
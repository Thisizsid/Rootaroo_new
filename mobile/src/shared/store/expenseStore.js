import { create } from 'zustand';
import { expenseApi } from '../api/expense';

export const useExpenseStore = create((set, get) => ({
  expenses: [],
  cursor: null,
  hasMore: true,
  loading: false,
  refreshing: false,
  error: null,

  summary: null,
  summaryLoading: false,

  ledger: [],
  ledgerLoading: false,

  settlements: [],
  settlementsCursor: null,
  settlementsHasMore: true,
  settlementsLoading: false,

  fetchExpenses: async (since) => {
    const isRefresh = !!since;
    set({ [isRefresh ? 'refreshing' : 'loading']: true, error: null });

    try {
      const data = await expenseApi.list({ cursor: since, limit: 20 });

      set({
        expenses: data.expenses,
        cursor: data.nextCursor,
        hasMore: data.hasMore,
        loading: false,
        refreshing: false,
      });
    } catch (e) {
      set({
        loading: false,
        refreshing: false,
        error: e?.response?.data?.message || 'Failed to load expenses',
      });
    }
  },

  fetchMoreExpenses: async () => {
    const { cursor, hasMore, loading, expenses } = get();
    if (!hasMore || loading) return;

    set({ loading: true });

    try {
      const data = await expenseApi.list({ cursor: cursor || undefined, limit: 20 });

      set({
        expenses: [...expenses, ...data.expenses],
        cursor: data.nextCursor,
        hasMore: data.hasMore,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  prependExpense: (expense) => {
    set((state) => ({
      expenses: [expense, ...state.expenses],
    }));
  },

  removeExpense: (expenseId) => {
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== expenseId),
    }));
  },

  updateExpense: (expense) => {
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === expense.id ? expense : e)),
    }));
  },

  refreshExpenses: async () => {
    await get().fetchExpenses();
  },

  fetchSummary: async () => {
    set({ summaryLoading: true });
    try {
      const summary = await expenseApi.getSummary();
      set({ summary, summaryLoading: false });
    } catch {
      set({ summaryLoading: false });
    }
  },

  fetchLedger: async () => {
    set({ ledgerLoading: true });
    try {
      const ledger = await expenseApi.getLedger();
      set({ ledger, ledgerLoading: false });
    } catch {
      set({ ledgerLoading: false });
    }
  },

  fetchSettlements: async (cursor) => {
    const isRefresh = !!cursor;
    set({ [isRefresh ? 'settlementsLoading' : 'settlementsLoading']: true });

    try {
      const data = await expenseApi.listSettlements({ cursor, limit: 20 });

      set({
        settlements: isRefresh ? data.settlements : [...get().settlements, ...data.settlements],
        settlementsCursor: data.nextCursor,
        settlementsHasMore: data.hasMore,
        settlementsLoading: false,
      });
    } catch {
      set({ settlementsLoading: false });
    }
  },

  fetchMoreSettlements: async () => {
    const { settlementsCursor, settlementsHasMore, settlementsLoading } = get();
    if (!settlementsHasMore || settlementsLoading) return;

    set({ settlementsLoading: true });

    try {
      const data = await expenseApi.listSettlements({ cursor: settlementsCursor || undefined, limit: 20 });

      set((state) => ({
        settlements: [...state.settlements, ...data.settlements],
        settlementsCursor: data.nextCursor,
        settlementsHasMore: data.hasMore,
        settlementsLoading: false,
      }));
    } catch {
      set({ settlementsLoading: false });
    }
  },

  addSettlement: (settlement) => {
    set((state) => ({
      settlements: [settlement, ...state.settlements],
    }));
  },
}));

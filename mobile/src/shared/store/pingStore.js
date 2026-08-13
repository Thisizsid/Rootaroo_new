import { create } from 'zustand';

export const usePingStore = create((set) => ({
  incoming: [],
  outgoing: [],

  setIncoming: (list) => set({ incoming: list }),

  addIncoming: (request) => {
    set((state) => {
      if (state.incoming.some((r) => r.id === request.id)) return state;
      return { incoming: [request, ...state.incoming] };
    });
  },

  removeIncoming: (id) => {
    set((state) => ({ incoming: state.incoming.filter((r) => r.id !== id) }));
  },

  upsertOutgoing: (request) => {
    set((state) => {
      const exists = state.outgoing.some((r) => r.id === request.id);
      const outgoing = exists
        ? state.outgoing.map((r) => (r.id === request.id ? request : r))
        : [request, ...state.outgoing];
      return { outgoing };
    });
  },
}));

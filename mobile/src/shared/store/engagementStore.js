import { create } from 'zustand';

/**
 * Bumped whenever a socket event arrives that could move the household's
 * streak/activity/leaderboard — a task/todo/grocery completion, a check-in,
 * a new calendar event, a feed post, or a ping — so any screen showing that
 * data (currently just the Dashboard) can refetch instead of waiting for
 * the next focus or manual pull-to-refresh.
 */
export const useEngagementStore = create((set) => ({
  lastEventAt: 0,
  bump: () => set({ lastEventAt: Date.now() }),
}));

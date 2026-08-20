export interface DashboardActivity {
  date: string; // YYYY-MM-DD
  tasksCompleted: number;
  todosCompleted: number;
  groceriesBought: number;
  // True if the day counts toward the streak — a chore OR a chat message,
  // ping/check-in, feed post, or calendar event. Same truth computeStreak
  // uses, so the UI's day pills never contradict the streak number.
  engaged: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  avatarEmoji: string | null;
  points: number;
}

export interface StreakInfo {
  current: number;
  best: number;
}

export type RecentActivityKind = 'task' | 'todo' | 'grocery';

export interface RecentActivityItem {
  date: string; // YYYY-MM-DD
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  avatarEmoji: string | null;
  points: number;
  kind: RecentActivityKind;
}

export interface DashboardResponse {
  tasks: {
    pending: number;
    overdue: number;
    completedToday: number;
  };
  groceries: {
    pending: number;
  };
  todos: {
    pending: number;
    completedToday: number;
  };
  expenses: {
    totalExpenses: number;
    totalAmount: number;
    myBalance: number;
  };
  notifications: {
    unreadCount: number;
  };
  activity: DashboardActivity[];
  streak: StreakInfo;
  leaderboard: LeaderboardEntry[];
  recentActivity: RecentActivityItem[];
}

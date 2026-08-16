import { Op } from 'sequelize';
import {
  HouseholdMember,
  User,
  Task,
  TodoItem,
  GroceryItem,
} from '../../database/models';
import { ForbiddenError } from '../../shared/utils/errors';
import * as taskService from '../task/service';
import * as groceryService from '../grocery/service';
import * as todoService from '../todo/service';
import * as expenseService from '../expense/service';
import * as notificationService from '../notification/service';
import logger from '../../shared/utils/logger';
import type {
  DashboardResponse,
  DashboardActivity,
  LeaderboardEntry,
  RecentActivityItem,
  RecentActivityKind,
  StreakInfo,
} from './types';

const ACTIVITY_DAYS = 7;
const STREAK_WINDOW_DAYS = 60;
const RECENT_ACTIVITY_LIMIT = 8;

interface ActivityTotals {
  tasksCompleted: number;
  todosCompleted: number;
  groceriesBought: number;
}

interface RecentRaw {
  when: Date;
  userId: string;
  points: number;
  kind: RecentActivityKind;
}

interface EngagementData {
  daily: Record<string, ActivityTotals>;
  weekByUser: Record<string, number>;
  recent: RecentRaw[];
}

async function getUserHousehold(userId: string): Promise<string> {
  const membership = await HouseholdMember.findOne({ where: { userId } });
  if (!membership) throw new ForbiddenError('You must belong to a household');
  return membership.householdId;
}

export async function getDashboard(userId: string): Promise<DashboardResponse> {
  const householdId = await getUserHousehold(userId);

  const [taskSummary, grocerySummary, todoSummary, expenseSummary, unreadCount, members] =
    await Promise.all([
      taskService.getTaskSummary(userId),
      groceryService.getSummary(userId),
      todoService.getSummary(userId),
      expenseService.getExpenseSummary(userId).catch(() => null),
      notificationService.getUnreadCount(userId),
      HouseholdMember.findAll({
        where: { householdId },
        include: [{ model: User, as: 'user' }],
      }),
    ]);

  const myBalance = expenseSummary
    ? expenseSummary.netBalances.find((nb) => nb.userId === userId)?.netBalance || 0
    : 0;

  const { activity, streak, leaderboard, recentActivity } = await computeEngagement(householdId, members);

  return {
    tasks: {
      pending: taskSummary.pending,
      overdue: taskSummary.overdue,
      completedToday: taskSummary.completedToday,
    },
    groceries: {
      pending: grocerySummary.pending,
    },
    todos: {
      pending: todoSummary.pending,
      completedToday: todoSummary.completedToday,
    },
    expenses: {
      totalExpenses: expenseSummary?.totalExpenses || 0,
      totalAmount: expenseSummary?.totalAmount || 0,
      myBalance,
    },
    notifications: {
      unreadCount,
    },
    activity,
    streak,
    leaderboard,
    recentActivity,
  };
}

// ── Engagement: real activity, streak & leaderboard ──

/** Local-time "YYYY-MM-DD" key for a Date. */
function dateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Start of the day `n` days before today (local time). */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Load completed tasks/todos/bought groceries over the streak window. */
async function loadCompletions(householdId: string): Promise<EngagementData> {
  const windowStart = daysAgo(STREAK_WINDOW_DAYS - 1);
  const weekStart = daysAgo(ACTIVITY_DAYS - 1);

  const [tasks, todos, groceries] = await Promise.all([
    Task.findAll({
      where: { householdId, status: 'completed', completedAt: { [Op.gte]: windowStart } },
      attributes: ['completedAt', 'completedBy', 'points'],
    }),
    TodoItem.findAll({
      where: { householdId, isCompleted: true, completedAt: { [Op.gte]: windowStart } },
      attributes: ['completedAt', 'assignedTo'],
    }),
    GroceryItem.findAll({
      where: { householdId, isBought: true, boughtAt: { [Op.gte]: windowStart } },
      attributes: ['boughtAt', 'boughtBy'],
    }),
  ]);

  const daily: Record<string, ActivityTotals> = {};
  const weekByUser: Record<string, number> = {};
  const recent: RecentRaw[] = [];

  const bump = (
    when: Date | null,
    byUser: string | null,
    points: number,
    key: keyof ActivityTotals,
    kind: RecentActivityKind,
  ) => {
    if (!when) return;
    const t = new Date(when);
    const k = dateKey(t);
    const d = daily[k] || (daily[k] = { tasksCompleted: 0, todosCompleted: 0, groceriesBought: 0 });
    d[key]++;
    if (!byUser) return;
    // Leaderboard + recent activity are scoped to the current week.
    if (t >= weekStart) {
      weekByUser[byUser] = (weekByUser[byUser] || 0) + points;
      recent.push({ when: t, userId: byUser, points, kind });
    }
  };

  for (const t of tasks) bump(t.completedAt, t.completedBy, t.points || 1, 'tasksCompleted', 'task');
  for (const t of todos) bump(t.completedAt, t.assignedTo, 1, 'todosCompleted', 'todo');
  for (const g of groceries) bump(g.boughtAt, g.boughtBy, 1, 'groceriesBought', 'grocery');

  return { daily, weekByUser, recent };
}

/** Last 7 days of household-wide completion totals (oldest → newest). */
function buildActivity(daily: Record<string, ActivityTotals>): DashboardActivity[] {
  const out: DashboardActivity[] = [];
  const today = new Date();
  const empty = { tasksCompleted: 0, todosCompleted: 0, groceriesBought: 0 };

  for (let i = ACTIVITY_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = dateKey(d);
    const v = daily[k] || empty;
    out.push({ date: k, ...v });
  }
  return out;
}

function totalFor(v: ActivityTotals | undefined): number {
  return v ? v.tasksCompleted + v.todosCompleted + v.groceriesBought : 0;
}

/** Consecutive-day completion streak over the window (current + all-time best). */
function computeStreak(daily: Record<string, ActivityTotals>): StreakInfo {
  const today = new Date();
  let best = 0;
  let run = 0;

  // Oldest → newest: longest run of days with any completion.
  for (let i = STREAK_WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = dateKey(d);
    if (totalFor(daily[k]) > 0) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }

  // Today → backwards: current streak.
  let current = 0;
  for (let i = 0; i < STREAK_WINDOW_DAYS; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = dateKey(d);
    if (totalFor(daily[k]) > 0) current += 1;
    else break;
  }

  return { current, best };
}

/** Per-member weekly points, sorted desc (used for the leaderboard card). */
function buildLeaderboard(
  members: HouseholdMember[],
  weekByUser: Record<string, number>,
): LeaderboardEntry[] {
  return members
    .map((m) => {
      const u = (m as unknown as { user?: User }).user;
      return {
        userId: m.userId,
        displayName: u?.displayName || 'Member',
        avatarUrl: u?.avatarUrl || null,
        avatarEmoji: u?.avatarEmoji || null,
        points: weekByUser[m.userId] || 0,
      };
    })
    .sort((a, b) => b.points - a.points);
}

async function computeEngagement(
  householdId: string,
  members: HouseholdMember[],
): Promise<{
  activity: DashboardActivity[];
  streak: StreakInfo;
  leaderboard: LeaderboardEntry[];
  recentActivity: RecentActivityItem[];
}> {
  const { daily, weekByUser, recent } = await loadCompletions(householdId);

  const byId = new Map(members.map((m) => [m.userId, (m as unknown as { user?: User }).user]));
  const recentActivity: RecentActivityItem[] = recent
    .slice()
    .sort((a, b) => b.when.getTime() - a.when.getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT)
    .map((r) => {
      const u = byId.get(r.userId);
      return {
        date: dateKey(r.when),
        userId: r.userId,
        displayName: u?.displayName || 'Someone',
        avatarUrl: u?.avatarUrl || null,
        avatarEmoji: u?.avatarEmoji || null,
        points: r.points,
        kind: r.kind,
      };
    });

  return {
    activity: buildActivity(daily),
    streak: computeStreak(daily),
    leaderboard: buildLeaderboard(members, weekByUser),
    recentActivity,
  };
}

/**
 * Quick-notify selected household members with a status action and optional
 * custom message (used as the notification body when provided).
 */
export async function quickNotify(
  userId: string,
  action: string,
  memberIds: string[],
  message?: string,
): Promise<void> {
  const householdId = await getUserHousehold(userId);

  // Verify all target members belong to the same household
  const valid = await HouseholdMember.count({
    where: { householdId, userId: { [Op.in]: memberIds } },
  });
  if (valid !== memberIds.length) {
    throw new ForbiddenError('Invalid member selection');
  }

  // Look up sender's name
  const sender = await User.findByPk(userId);
  const senderName = sender?.displayName || 'Someone';

  const body = message?.trim() || `Quick update from ${senderName}`;

  // Send notification to each selected member
  const notify = memberIds.map((id) =>
    notificationService.sendToUser(
      id,
      'check_in',
      `${senderName} ${action.toLowerCase()}`,
      body,
      { type: 'check_in' },
    ).catch((e: Error) => logger.warn('[QuickNotify] Push failed:', e.message)),
  );

  await Promise.all(notify);
}

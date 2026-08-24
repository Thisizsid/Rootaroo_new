import { Op } from 'sequelize';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import {
  Household,
  HouseholdMember,
  User,
  Task,
  TodoItem,
  GroceryItem,
  ChatMessage,
  PingRequest,
  CheckIn,
  FeedPost,
  CalendarEvent,
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

/** Guards against a bogus/malicious `X-Timezone` header reaching Intl/date-fns-tz. */
function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function getDashboard(
  userId: string,
  clientTimeZone?: string,
): Promise<DashboardResponse> {
  const householdId = await getUserHousehold(userId);

  const [taskSummary, grocerySummary, todoSummary, expenseSummary, unreadCount, members, household] =
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
      Household.findByPk(householdId, { attributes: ['id', 'timezone'] }),
    ]);

  // The household's timezone drives every "today"/day-boundary calculation
  // below. Self-heal it from whichever member's phone last loaded the
  // dashboard — cheap, and means existing households never need a settings
  // screen just to get this right. A bad/spoofed header is simply ignored.
  let timeZone = household?.timezone || 'UTC';
  if (clientTimeZone && clientTimeZone !== timeZone && isValidTimeZone(clientTimeZone)) {
    timeZone = clientTimeZone;
    Household.update({ timezone: clientTimeZone }, { where: { id: householdId } }).catch(
      (e: Error) => logger.warn('[Dashboard] Timezone self-heal failed:', e.message),
    );
  }

  const myBalance = expenseSummary
    ? expenseSummary.netBalances.find((nb) => nb.userId === userId)?.netBalance || 0
    : 0;

  const { activity, streak, leaderboard, recentActivity } = await computeEngagement(
    householdId,
    members,
    timeZone,
  );

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

/** "YYYY-MM-DD" key for a Date, as seen in the household's own timezone —
 *  not the server's, so "today" means the household's today. */
function dateKey(d: Date, timeZone: string): string {
  return formatInTimeZone(d, timeZone, 'yyyy-MM-dd');
}

/** The `yyyy-MM-dd` key `n` days before `key` (plain calendar-day math). */
function keyMinusDays(key: string, n: number): string {
  const [y, m, day] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, day));
  d.setUTCDate(d.getUTCDate() - n);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * The actual UTC instant of local midnight, `n` days before today, in the
 * household's timezone (`n = 0` → today at 00:00 local). Used as the DB
 * query lower-bound so a late-night completion isn't miscounted into the
 * wrong calendar day just because the server's clock is in UTC.
 */
function daysAgo(n: number, timeZone: string): Date {
  const today = dateKey(new Date(), timeZone);
  const targetKey = keyMinusDays(today, n);
  return fromZonedTime(`${targetKey} 00:00:00`, timeZone);
}

/** Load completed tasks/todos/bought groceries over the streak window. */
async function loadCompletions(householdId: string, timeZone: string): Promise<EngagementData> {
  const windowStart = daysAgo(STREAK_WINDOW_DAYS - 1, timeZone);
  const weekStart = daysAgo(ACTIVITY_DAYS - 1, timeZone);

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
    const k = dateKey(t, timeZone);
    const d = daily[k] || (daily[k] = { tasksCompleted: 0, todosCompleted: 0, groceriesBought: 0 });
    d[key]++;
    if (!byUser) return;
    // Leaderboard + recent activity are scoped to the current week.
    if (t >= weekStart) {
      weekByUser[byUser] = (weekByUser[byUser] || 0) + points;
      recent.push({ when: t, userId: byUser, points, kind });
    }
  };

  for (const t of tasks) bump(t.completedAt, t.completedBy, t.points || 5, 'tasksCompleted', 'task');
  for (const t of todos) bump(t.completedAt, t.assignedTo, 5, 'todosCompleted', 'todo');
  for (const g of groceries) bump(g.boughtAt, g.boughtBy, 5, 'groceriesBought', 'grocery');

  return { daily, weekByUser, recent };
}

/**
 * Days the household stayed *connected* even without finishing a chore —
 * a chat message, a location ping/check-in, a feed post, or a new calendar
 * event. These don't feed the chores chart or the leaderboard (that stays
 * completion-only), but they're enough to keep the streak alive: the streak
 * is meant to reward the family staying in touch, not just doing housework.
 */
async function loadEngagementDays(householdId: string, timeZone: string): Promise<Set<string>> {
  const windowStart = daysAgo(STREAK_WINDOW_DAYS - 1, timeZone);
  const where = { householdId, createdAt: { [Op.gte]: windowStart } };

  const [messages, pings, checkIns, posts, events] = await Promise.all([
    ChatMessage.findAll({ where, attributes: ['createdAt'] }),
    PingRequest.findAll({ where, attributes: ['createdAt', 'respondedAt'] }),
    CheckIn.findAll({ where, attributes: ['checkedInAt'] }),
    FeedPost.findAll({ where, attributes: ['createdAt'] }),
    CalendarEvent.findAll({ where, attributes: ['createdAt'] }),
  ]);

  const days = new Set<string>();
  for (const m of messages) days.add(dateKey(m.createdAt, timeZone));
  for (const p of pings) {
    days.add(dateKey(p.createdAt, timeZone));
    if (p.respondedAt) days.add(dateKey(p.respondedAt, timeZone));
  }
  for (const c of checkIns) days.add(dateKey(c.checkedInAt, timeZone));
  for (const f of posts) days.add(dateKey(f.createdAt, timeZone));
  for (const e of events) days.add(dateKey(e.createdAt, timeZone));

  return days;
}

/** Last 7 days of household-wide completion totals (oldest → newest). */
function buildActivity(
  daily: Record<string, ActivityTotals>,
  engagedDays: Set<string>,
  timeZone: string,
): DashboardActivity[] {
  const out: DashboardActivity[] = [];
  const todayKey = dateKey(new Date(), timeZone);
  const empty = { tasksCompleted: 0, todosCompleted: 0, groceriesBought: 0 };

  for (let i = ACTIVITY_DAYS - 1; i >= 0; i--) {
    const k = keyMinusDays(todayKey, i);
    const v = daily[k] || empty;
    out.push({ date: k, ...v, engaged: totalFor(daily[k]) > 0 || engagedDays.has(k) });
  }
  return out;
}

function totalFor(v: ActivityTotals | undefined): number {
  return v ? v.tasksCompleted + v.todosCompleted + v.groceriesBought : 0;
}

/**
 * Consecutive-day streak over the window (current + all-time best). A day
 * counts if the household got a chore done *or* stayed connected —
 * messaged, pinged/checked in, posted, or scheduled something together.
 */
function computeStreak(
  daily: Record<string, ActivityTotals>,
  engagedDays: Set<string>,
  timeZone: string,
): StreakInfo {
  const todayKey = dateKey(new Date(), timeZone);
  const dayCounts = (k: string) => totalFor(daily[k]) > 0 || engagedDays.has(k);
  let best = 0;
  let run = 0;

  // Oldest → newest: longest run of days with any completion or engagement.
  for (let i = STREAK_WINDOW_DAYS - 1; i >= 0; i--) {
    const k = keyMinusDays(todayKey, i);
    if (dayCounts(k)) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }

  // Today → backwards: current streak.
  let current = 0;
  for (let i = 0; i < STREAK_WINDOW_DAYS; i++) {
    const k = keyMinusDays(todayKey, i);
    if (dayCounts(k)) current += 1;
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
  timeZone: string,
): Promise<{
  activity: DashboardActivity[];
  streak: StreakInfo;
  leaderboard: LeaderboardEntry[];
  recentActivity: RecentActivityItem[];
}> {
  const [{ daily, weekByUser, recent }, engagedDays] = await Promise.all([
    loadCompletions(householdId, timeZone),
    loadEngagementDays(householdId, timeZone),
  ]);

  const byId = new Map(members.map((m) => [m.userId, (m as unknown as { user?: User }).user]));
  const recentActivity: RecentActivityItem[] = recent
    .slice()
    .sort((a, b) => b.when.getTime() - a.when.getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT)
    .map((r) => {
      const u = byId.get(r.userId);
      return {
        date: dateKey(r.when, timeZone),
        userId: r.userId,
        displayName: u?.displayName || 'Someone',
        avatarUrl: u?.avatarUrl || null,
        avatarEmoji: u?.avatarEmoji || null,
        points: r.points,
        kind: r.kind,
      };
    });

  return {
    activity: buildActivity(daily, engagedDays, timeZone),
    streak: computeStreak(daily, engagedDays, timeZone),
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

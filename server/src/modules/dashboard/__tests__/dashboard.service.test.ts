import { getDashboard, quickNotify } from '../service';
import * as models from '../../../database/models';
import * as taskService from '../../task/service';
import * as groceryService from '../../grocery/service';
import * as todoService from '../../todo/service';
import * as notificationService from '../../notification/service';
import { ForbiddenError } from '../../../shared/utils/errors';
import { Op } from 'sequelize';

const userId = '550e8400-e29b-41d4-a716-446655440001';
const householdId = '770e8400-e29b-41d4-a716-446655440003';
const otherUserId = '660e8400-e29b-41d4-a716-446655440002';

jest.mock('../../../database/models', () => ({
  HouseholdMember: {
    findOne: jest.fn(),
    count: jest.fn(),
    findAll: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  Task: { findAll: jest.fn() },
  TodoItem: { findAll: jest.fn() },
  GroceryItem: { findAll: jest.fn() },
}));

jest.mock('../../task/service', () => ({
  getTaskSummary: jest.fn(),
}));

jest.mock('../../grocery/service', () => ({
  getSummary: jest.fn(),
}));

jest.mock('../../todo/service', () => ({
  getSummary: jest.fn(),
}));

jest.mock('../../notification/service', () => ({
  getUnreadCount: jest.fn(),
  sendToUser: jest.fn(),
}));

jest.mock('../../../shared/utils/logger');

const modelsMock = models as any;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Dashboard Service', () => {
  describe('getDashboard', () => {
    it('returns aggregated dashboard data with real activity/leaderboard/streak', async () => {
      (modelsMock.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ householdId });
      (modelsMock.HouseholdMember.findAll as jest.Mock).mockResolvedValue([
        { userId, user: { displayName: 'Alice', avatarUrl: null, avatarEmoji: null } },
        { userId: otherUserId, user: { displayName: 'Bob', avatarUrl: null, avatarEmoji: null } },
      ]);
      (taskService.getTaskSummary as jest.Mock).mockResolvedValue({ pending: 3, overdue: 1, completedToday: 2 });
      (groceryService.getSummary as jest.Mock).mockResolvedValue({ pending: 5, boughtToday: 0 });
      (todoService.getSummary as jest.Mock).mockResolvedValue({ pending: 2, completedToday: 1 });
      (notificationService.getUnreadCount as jest.Mock).mockResolvedValue(4);

      const now = new Date();
      (modelsMock.Task.findAll as jest.Mock).mockResolvedValue([
        { completedAt: now, completedBy: userId, points: 2 },
      ]);
      (modelsMock.TodoItem.findAll as jest.Mock).mockResolvedValue([
        { completedAt: now, assignedTo: otherUserId },
      ]);
      (modelsMock.GroceryItem.findAll as jest.Mock).mockResolvedValue([
        { boughtAt: now, boughtBy: userId },
      ]);

      const result = await getDashboard(userId);

      expect(result.tasks).toEqual({ pending: 3, overdue: 1, completedToday: 2 });
      expect(result.groceries).toEqual({ pending: 5 });
      expect(result.todos).toEqual({ pending: 2, completedToday: 1 });
      expect(result.notifications).toEqual({ unreadCount: 4 });
      expect(result.activity).toHaveLength(7);
      // Today is the last activity entry.
      expect(result.activity[6]).toMatchObject({
        tasksCompleted: 1,
        todosCompleted: 1,
        groceriesBought: 1,
      });
      // One completion day → streak >= 1.
      expect(result.streak.current).toBeGreaterThanOrEqual(1);
      expect(result.streak.best).toBeGreaterThanOrEqual(1);
      // Alice: 2 (task points) + 1 (grocery) = 3; Bob: 1 (todo).
      expect(result.leaderboard[0]).toMatchObject({ userId, points: 3 });
      expect(result.leaderboard[1]).toMatchObject({ userId: otherUserId, points: 1 });

      // Recent activity is real per-member events with names.
      expect(result.recentActivity).toHaveLength(3);
      expect(result.recentActivity.map((r) => r.kind).sort()).toEqual(['grocery', 'task', 'todo']);
      expect(result.recentActivity.map((r) => r.displayName).sort()).toEqual(['Alice', 'Alice', 'Bob']);
    });

    it('computes a streak across consecutive completion days', async () => {
      (modelsMock.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ householdId });
      (modelsMock.HouseholdMember.findAll as jest.Mock).mockResolvedValue([
        { userId, user: { displayName: 'Alice', avatarUrl: null, avatarEmoji: null } },
      ]);
      (taskService.getTaskSummary as jest.Mock).mockResolvedValue({ pending: 0, overdue: 0, completedToday: 2 });
      (groceryService.getSummary as jest.Mock).mockResolvedValue({ pending: 0, boughtToday: 0 });
      (todoService.getSummary as jest.Mock).mockResolvedValue({ pending: 0, completedToday: 0 });
      (notificationService.getUnreadCount as jest.Mock).mockResolvedValue(0);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      (modelsMock.Task.findAll as jest.Mock).mockResolvedValue([
        { completedAt: today, completedBy: userId, points: 1 },
        { completedAt: yesterday, completedBy: userId, points: 1 },
        { completedAt: threeDaysAgo, completedBy: userId, points: 1 },
      ]);
      (modelsMock.TodoItem.findAll as jest.Mock).mockResolvedValue([]);
      (modelsMock.GroceryItem.findAll as jest.Mock).mockResolvedValue([]);

      const result = await getDashboard(userId);

      // Gap 2 days ago breaks today+yesterday into a run of 2.
      expect(result.streak.current).toBe(2);
      expect(result.streak.best).toBe(2);
    });

    it('throws ForbiddenError when user has no household', async () => {
      (modelsMock.HouseholdMember.findOne as jest.Mock).mockResolvedValue(null);

      await expect(getDashboard(userId)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('quickNotify', () => {
    it('sends notification to selected members', async () => {
      (modelsMock.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ householdId });
      (modelsMock.HouseholdMember.count as jest.Mock).mockResolvedValue(1);
      (modelsMock.User.findByPk as jest.Mock).mockResolvedValue({ displayName: 'Sender' });
      (notificationService.sendToUser as jest.Mock).mockResolvedValue(undefined);

      await quickNotify(userId, 'checked in', [otherUserId]);

      expect(modelsMock.HouseholdMember.count).toHaveBeenCalledWith({
        where: { householdId, userId: { [Op.in]: [otherUserId] } },
      });
      expect(notificationService.sendToUser).toHaveBeenCalledWith(
        otherUserId,
        'check_in',
        'Sender checked in',
        'Quick update from Sender',
        { type: 'check_in' },
      );
    });

    it('throws ForbiddenError for invalid member', async () => {
      (modelsMock.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ householdId });
      (modelsMock.HouseholdMember.count as jest.Mock).mockResolvedValue(0);

      await expect(quickNotify(userId, 'checked in', [otherUserId])).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('uses a custom message as the notification body', async () => {
      (modelsMock.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ householdId });
      (modelsMock.HouseholdMember.count as jest.Mock).mockResolvedValue(1);
      (modelsMock.User.findByPk as jest.Mock).mockResolvedValue({ displayName: 'Sender' });
      (notificationService.sendToUser as jest.Mock).mockResolvedValue(undefined);

      await quickNotify(userId, 'safe', [otherUserId], 'Picked up the kids!');

      expect(notificationService.sendToUser).toHaveBeenCalledWith(
        otherUserId,
        'check_in',
        'Sender safe',
        'Picked up the kids!',
        { type: 'check_in' },
      );
    });
  });
});
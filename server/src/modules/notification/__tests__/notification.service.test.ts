import {
  registerToken,
  unregisterToken,
  getHistory,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
  sendToUser,
  getUnreadCount,
} from '../service';
import * as models from '../../../database/models';

const userId = '550e8400-e29b-41d4-a716-446655440001';

jest.mock('../../../database/models', () => ({
  NotificationHistory: {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  NotificationPreference: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  DeviceToken: {
    upsert: jest.fn(),
    destroy: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock('../../../config/env', () => ({
  env: { fcm: { enabled: false, serverKey: '', projectId: '' } },
}));

const modelsMock = models as jest.Mocked<typeof models>;
beforeEach(() => { jest.clearAllMocks(); });

describe('Notification Service', () => {
  describe('registerToken / unregisterToken', () => {
    it('registers a device token', async () => {
      await expect(
        registerToken(userId, { token: 'abc123', platform: 'android' }),
      ).resolves.toBeUndefined();
    });

    it('unregisters a device token', async () => {
      await registerToken(userId, { token: 'abc123', platform: 'android' });
      await expect(unregisterToken(userId, 'abc123')).resolves.toBeUndefined();
    });
  });

  describe('getHistory', () => {
    it('returns paginated history', async () => {
      (modelsMock.NotificationHistory.findAll as jest.Mock).mockResolvedValue([
        { id: '1', userId, type: 'test', title: 'Hello', body: null, data: null, isRead: false, readAt: null, createdAt: new Date() },
      ]);

      const result = await getHistory(userId, {});
      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].title).toBe('Hello');
    });
  });

  describe('markAsRead / markAllAsRead', () => {
    it('marks a notification as read', async () => {
      const notif = {
        id: '1', userId, type: 'test', title: 'Test', body: null, data: null,
        isRead: false, readAt: null, createdAt: new Date(), save: jest.fn(),
      };
      (modelsMock.NotificationHistory.findOne as jest.Mock).mockResolvedValue(notif);

      await markAsRead('1', userId);
      expect(notif.isRead).toBe(true);
      expect(notif.save).toHaveBeenCalled();
    });

    it('marks all as read', async () => {
      (modelsMock.NotificationHistory.update as jest.Mock).mockResolvedValue([1]);

      await markAllAsRead(userId);
      expect(modelsMock.NotificationHistory.update).toHaveBeenCalledWith(
        { isRead: true, readAt: expect.any(Date) },
        { where: { userId, isRead: false } },
      );
    });
  });

  describe('getPreferences / updatePreferences', () => {
    it('creates default preferences if missing', async () => {
      (modelsMock.NotificationPreference.findOne as jest.Mock).mockResolvedValue(null);
      (modelsMock.NotificationPreference.create as jest.Mock).mockResolvedValue({
        newPost: true, taskAssigned: true, taskCompleted: true, checkIn: true,
        newExpense: true, chatMessage: true, calendarEvent: true, memberJoined: true,
      });

      const result = await getPreferences(userId);

      expect(result.newPost).toBe(true);
      expect(modelsMock.NotificationPreference.create).toHaveBeenCalled();
    });

    it('updates preferences', async () => {
      const prefs = {
        newPost: true, taskAssigned: true, taskCompleted: true, checkIn: true,
        newExpense: true, chatMessage: true, calendarEvent: true, memberJoined: true,
        save: jest.fn(),
      };
      (modelsMock.NotificationPreference.findOne as jest.Mock).mockResolvedValue(prefs);

      const result = await updatePreferences(userId, { newPost: false });
      expect(result.newPost).toBe(false);
      expect(prefs.save).toHaveBeenCalled();
    });
  });

  describe('sendToUser / getUnreadCount', () => {
    it('creates a history record when sending', async () => {
      (modelsMock.NotificationHistory.create as jest.Mock).mockResolvedValue({ id: '1' });

      await sendToUser(userId, 'task_assigned', 'New Task', 'You got a task');

      expect(modelsMock.NotificationHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId, type: 'task_assigned', title: 'New Task' }),
      );
    });

    it('returns unread count', async () => {
      (modelsMock.NotificationHistory.count as jest.Mock).mockResolvedValue(3);

      const count = await getUnreadCount(userId);
      expect(count).toBe(3);
    });
  });
});

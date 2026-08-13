"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = require("../service");
const models = __importStar(require("../../../database/models"));
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
const modelsMock = models;
beforeEach(() => { jest.clearAllMocks(); });
describe('Notification Service', () => {
    describe('registerToken / unregisterToken', () => {
        it('registers a device token', async () => {
            await expect((0, service_1.registerToken)(userId, { token: 'abc123', platform: 'android' })).resolves.toBeUndefined();
        });
        it('unregisters a device token', async () => {
            await (0, service_1.registerToken)(userId, { token: 'abc123', platform: 'android' });
            await expect((0, service_1.unregisterToken)(userId, 'abc123')).resolves.toBeUndefined();
        });
    });
    describe('getHistory', () => {
        it('returns paginated history', async () => {
            modelsMock.NotificationHistory.findAll.mockResolvedValue([
                { id: '1', userId, type: 'test', title: 'Hello', body: null, data: null, isRead: false, readAt: null, createdAt: new Date() },
            ]);
            const result = await (0, service_1.getHistory)(userId, {});
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
            modelsMock.NotificationHistory.findOne.mockResolvedValue(notif);
            await (0, service_1.markAsRead)('1', userId);
            expect(notif.isRead).toBe(true);
            expect(notif.save).toHaveBeenCalled();
        });
        it('marks all as read', async () => {
            modelsMock.NotificationHistory.update.mockResolvedValue([1]);
            await (0, service_1.markAllAsRead)(userId);
            expect(modelsMock.NotificationHistory.update).toHaveBeenCalledWith({ isRead: true, readAt: expect.any(Date) }, { where: { userId, isRead: false } });
        });
    });
    describe('getPreferences / updatePreferences', () => {
        it('creates default preferences if missing', async () => {
            modelsMock.NotificationPreference.findOne.mockResolvedValue(null);
            modelsMock.NotificationPreference.create.mockResolvedValue({
                newPost: true, taskAssigned: true, taskCompleted: true, checkIn: true,
                newExpense: true, chatMessage: true, calendarEvent: true, memberJoined: true,
            });
            const result = await (0, service_1.getPreferences)(userId);
            expect(result.newPost).toBe(true);
            expect(modelsMock.NotificationPreference.create).toHaveBeenCalled();
        });
        it('updates preferences', async () => {
            const prefs = {
                newPost: true, taskAssigned: true, taskCompleted: true, checkIn: true,
                newExpense: true, chatMessage: true, calendarEvent: true, memberJoined: true,
                save: jest.fn(),
            };
            modelsMock.NotificationPreference.findOne.mockResolvedValue(prefs);
            const result = await (0, service_1.updatePreferences)(userId, { newPost: false });
            expect(result.newPost).toBe(false);
            expect(prefs.save).toHaveBeenCalled();
        });
    });
    describe('sendToUser / getUnreadCount', () => {
        it('creates a history record when sending', async () => {
            modelsMock.NotificationHistory.create.mockResolvedValue({ id: '1' });
            await (0, service_1.sendToUser)(userId, 'task_assigned', 'New Task', 'You got a task');
            expect(modelsMock.NotificationHistory.create).toHaveBeenCalledWith(expect.objectContaining({ userId, type: 'task_assigned', title: 'New Task' }));
        });
        it('returns unread count', async () => {
            modelsMock.NotificationHistory.count.mockResolvedValue(3);
            const count = await (0, service_1.getUnreadCount)(userId);
            expect(count).toBe(3);
        });
    });
});
//# sourceMappingURL=notification.service.test.js.map
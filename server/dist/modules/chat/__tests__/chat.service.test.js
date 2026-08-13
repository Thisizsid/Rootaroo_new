"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = require("../service");
const errors_1 = require("../../../shared/utils/errors");
const userId = '550e8400-e29b-41d4-a716-446655440001';
const otherUserId = '660e8400-e29b-41d4-a716-446655440002';
const adminUserId = '770e8400-e29b-41d4-a716-446655440003';
const householdId = '880e8400-e29b-41d4-a716-446655440004';
const messageId = '990e8400-e29b-41d4-a716-446655440005';
const conversationId = 'aa0e8400-e29b-41d4-a716-446655440006';
// ── Model Mocks ──
jest.mock('../../../database/models', () => {
    const mockModel = (name) => {
        const cls = jest.fn().mockName(name);
        cls.create = jest.fn();
        cls.findAll = jest.fn();
        cls.findOne = jest.fn();
        cls.findByPk = jest.fn();
        cls.destroy = jest.fn();
        cls.upsert = jest.fn();
        cls.sum = jest.fn();
        return cls;
    };
    return {
        sequelize: { transaction: jest.fn((cb) => cb({})) },
        ChatMessage: mockModel('ChatMessage'),
        ChatReaction: mockModel('ChatReaction'),
        Conversation: mockModel('Conversation'),
        ConversationParticipant: mockModel('ConversationParticipant'),
        FeedMedia: mockModel('FeedMedia'),
        HouseholdMember: mockModel('HouseholdMember'),
        User: mockModel('User'),
    };
});
jest.mock('../../../shared/utils/socket', () => ({
    getIO: jest.fn(() => ({
        to: jest.fn(() => ({
            emit: jest.fn(),
        })),
    })),
}));
const models_1 = require("../../../database/models");
// ── Helpers ──
const mockUser = (overrides = {}) => ({
    id: userId,
    displayName: 'Test User',
    avatarUrl: null,
    avatarEmoji: null,
    get: (key) => {
        const data = {
            id: userId,
            displayName: 'Test User',
            avatarUrl: null,
            avatarEmoji: null,
            ...overrides,
        };
        return data[key];
    },
    ...overrides,
});
const now = new Date();
const mockMessage = (overrides = {}) => {
    const m = {
        id: messageId,
        householdId,
        senderId: userId,
        conversationId: 'conv1',
        content: 'Hello world',
        mediaUrl: null,
        replyToId: null,
        editedAt: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        destroy: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        get: (key) => {
            const data = {
                id: messageId,
                householdId,
                senderId: userId,
                conversationId: 'conv1',
                content: 'Hello world',
                mediaUrl: null,
                replyToId: null,
                editedAt: null,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
                sender: mockUser(),
                reactions: [],
                ...overrides,
            };
            return data[key];
        },
        ...overrides,
    };
    return m;
};
const mockReaction = (overrides = {}) => ({
    id: 'react-001',
    messageId,
    userId,
    reaction: '👍',
    createdAt: now,
    ...overrides,
});
describe('Chat Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        models_1.HouseholdMember.findOne.mockResolvedValue({ householdId, userId });
        models_1.User.findByPk.mockResolvedValue(mockUser());
        models_1.ConversationParticipant.findOne.mockResolvedValue({ conversationId, userId });
    });
    // ── sendMessage ──
    describe('sendMessage', () => {
        it('should create a text message', async () => {
            models_1.ChatMessage.create.mockResolvedValue(mockMessage());
            models_1.ChatMessage.findByPk.mockResolvedValue(mockMessage());
            const result = await (0, service_1.sendMessage)(userId, { conversationId, content: 'Hello world' });
            expect(models_1.ChatMessage.create).toHaveBeenCalledWith(expect.objectContaining({ content: 'Hello world', senderId: userId, householdId }));
            expect(result.content).toBe('Hello world');
        });
        it('should reject messages with no content and no media', async () => {
            await expect((0, service_1.sendMessage)(userId, { conversationId })).rejects.toThrow(); // validation catches this
        });
        it('should attach mediaUrl when mediaIds provided', async () => {
            models_1.ChatMessage.create.mockResolvedValue(mockMessage({ mediaUrl: 'https://cloudinary.com/img.jpg' }));
            models_1.ChatMessage.findByPk.mockResolvedValue(mockMessage({ mediaUrl: 'https://cloudinary.com/img.jpg' }));
            models_1.FeedMedia.findAll.mockResolvedValue([{ get: () => 'https://cloudinary.com/img.jpg' }]);
            const result = await (0, service_1.sendMessage)(userId, { conversationId, content: 'Check this', mediaIds: ['media-uuid'] });
            expect(result.mediaUrl).toBe('https://cloudinary.com/img.jpg');
        });
        it('should reject if user is not a household member', async () => {
            models_1.HouseholdMember.findOne.mockResolvedValue(null);
            await expect((0, service_1.sendMessage)(userId, { conversationId, content: 'Hi' })).rejects.toThrow(errors_1.ForbiddenError);
        });
    });
    // ── listMessages ──
    describe('listMessages', () => {
        it('should return paginated messages', async () => {
            models_1.ChatMessage.findAll.mockResolvedValue([mockMessage()]);
            models_1.ChatReaction.findAll.mockResolvedValue([]);
            const result = await (0, service_1.listMessages)(userId, { limit: 20 });
            expect(result.messages).toHaveLength(1);
            expect(result.messages[0].id).toBe(messageId);
            expect(result.hasMore).toBe(false);
        });
        it('should return empty list when no messages', async () => {
            models_1.ChatMessage.findAll.mockResolvedValue([]);
            models_1.ChatReaction.findAll.mockResolvedValue([]);
            const result = await (0, service_1.listMessages)(userId, {});
            expect(result.messages).toHaveLength(0);
            expect(result.hasMore).toBe(false);
        });
    });
    // ── getMessageById ──
    describe('getMessageById', () => {
        it('should return a message by id', async () => {
            models_1.ChatMessage.findOne.mockResolvedValue(mockMessage());
            models_1.ChatReaction.findAll.mockResolvedValue([]);
            const result = await (0, service_1.getMessageById)(messageId, userId);
            expect(result.id).toBe(messageId);
            expect(result.content).toBe('Hello world');
        });
        it('should throw NotFoundError for non-existent message', async () => {
            models_1.ChatMessage.findOne.mockResolvedValue(null);
            await expect((0, service_1.getMessageById)('nonexistent', userId)).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    // ── updateMessage ──
    describe('updateMessage', () => {
        it('should allow sender to edit their message', async () => {
            models_1.ChatMessage.findOne.mockResolvedValue(mockMessage());
            models_1.ChatMessage.findByPk.mockResolvedValue(mockMessage({ content: 'Edited!' }));
            const result = await (0, service_1.updateMessage)(messageId, userId, 'member', { content: 'Edited!' });
            expect(result.content).toBe('Edited!');
        });
        it('should reject non-sender non-admin edit', async () => {
            models_1.ChatMessage.findOne.mockResolvedValue(mockMessage({ senderId: otherUserId }));
            await expect((0, service_1.updateMessage)(messageId, userId, 'member', { content: 'Hacked' })).rejects.toThrow(errors_1.ForbiddenError);
        });
        it('should allow admin to edit any message', async () => {
            models_1.ChatMessage.findOne.mockResolvedValue(mockMessage({ senderId: otherUserId }));
            models_1.ChatMessage.findByPk.mockResolvedValue(mockMessage({ content: 'Admin edited' }));
            const result = await (0, service_1.updateMessage)(messageId, adminUserId, 'admin', { content: 'Admin edited' });
            expect(result.content).toBe('Admin edited');
        });
    });
    // ── deleteMessage (FR-145, FR-146) ──
    describe('deleteMessage', () => {
        const recentCreated = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago — < 1hr
        it('should hard-delete own message under 1 hour (FR-145)', async () => {
            const msg = mockMessage({ senderId: userId, conversationId: 'conv1', createdAt: recentCreated });
            msg.destroy = jest.fn().mockResolvedValue(undefined);
            models_1.ChatMessage.findOne.mockResolvedValue(msg);
            await (0, service_1.deleteMessage)(messageId, userId, 'member');
            expect(models_1.ChatReaction.destroy).toHaveBeenCalledWith({ where: { messageId }, transaction: expect.anything() });
            expect(msg.destroy).toHaveBeenCalled();
        });
        it('should soft-delete own message over 1 hour', async () => {
            const oldCreated = new Date(Date.now() - 2 * 3600 * 1000); // 2 hours ago
            const msg = mockMessage({ senderId: userId, conversationId: 'conv1', createdAt: oldCreated });
            msg.destroy = jest.fn().mockResolvedValue(undefined);
            models_1.ChatMessage.findOne.mockResolvedValue(msg);
            await (0, service_1.deleteMessage)(messageId, userId, 'member');
            expect(msg.destroy).toHaveBeenCalled();
        });
        it('should allow admin to hard-delete any message (FR-146)', async () => {
            const msg = mockMessage({ senderId: otherUserId, conversationId: 'conv1', createdAt: new Date() });
            msg.destroy = jest.fn().mockResolvedValue(undefined);
            models_1.ChatMessage.findOne.mockResolvedValue(msg);
            await (0, service_1.deleteMessage)(messageId, adminUserId, 'admin');
            expect(models_1.ChatReaction.destroy).toHaveBeenCalled();
            expect(msg.destroy).toHaveBeenCalled();
        });
        it('should reject non-owner non-admin deletion', async () => {
            const msg = mockMessage({ senderId: otherUserId, conversationId: 'conv1' });
            models_1.ChatMessage.findOne.mockResolvedValue(msg);
            models_1.ConversationParticipant.findOne.mockResolvedValue(null);
            await expect((0, service_1.deleteMessage)(messageId, userId, 'member')).rejects.toThrow(errors_1.ForbiddenError);
        });
    });
    // ── addReaction (FR-148) ──
    describe('addReaction', () => {
        it('should add a reaction', async () => {
            models_1.ChatMessage.findByPk.mockResolvedValue(mockMessage());
            models_1.ChatReaction.upsert.mockResolvedValue([mockReaction(), true]);
            models_1.ChatReaction.findAll.mockResolvedValue([mockReaction()]);
            const result = await (0, service_1.addReaction)(messageId, userId, '👍');
            expect(models_1.ChatReaction.upsert).toHaveBeenCalledWith({ messageId, userId, reaction: '👍' });
            expect(Array.isArray(result)).toBe(true);
        });
        it('should reject invalid reaction emoji', async () => {
            models_1.ChatMessage.findByPk.mockResolvedValue(mockMessage());
            await expect((0, service_1.addReaction)(messageId, userId, '💩')).rejects.toThrow(errors_1.ValidationError);
        });
    });
    // ── removeReaction ──
    describe('removeReaction', () => {
        it('should remove a reaction', async () => {
            models_1.ChatMessage.findByPk.mockResolvedValue(mockMessage());
            models_1.ChatReaction.findAll.mockResolvedValue([]);
            const result = await (0, service_1.removeReaction)(messageId, userId, '👍');
            expect(models_1.ChatReaction.destroy).toHaveBeenCalledWith({ where: { messageId, userId, reaction: '👍' } });
            expect(Array.isArray(result)).toBe(true);
        });
    });
    // ── typingStart / typingStop (FR-149) ──
    describe('typing indicator', () => {
        it('should broadcast typing start', async () => {
            await expect((0, service_1.typingStart)(userId)).resolves.toBeUndefined();
        });
        it('should broadcast typing stop', async () => {
            await expect((0, service_1.typingStop)(userId)).resolves.toBeUndefined();
        });
        it('should throw if user is not a household member on typingStart', async () => {
            models_1.HouseholdMember.findOne.mockResolvedValue(null);
            await expect((0, service_1.typingStart)(userId)).rejects.toThrow(errors_1.ForbiddenError);
        });
    });
});
//# sourceMappingURL=chat.service.test.js.map
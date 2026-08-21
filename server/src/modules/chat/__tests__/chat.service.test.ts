import {
  sendMessage,
  listMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  typingStart,
  typingStop,
} from '../service';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../shared/utils/errors';

const userId = '550e8400-e29b-41d4-a716-446655440001';
const otherUserId = '660e8400-e29b-41d4-a716-446655440002';
const adminUserId = '770e8400-e29b-41d4-a716-446655440003';
const householdId = '880e8400-e29b-41d4-a716-446655440004';
const messageId = '990e8400-e29b-41d4-a716-446655440005';
const conversationId = 'aa0e8400-e29b-41d4-a716-446655440006';

// ── Model Mocks ──

jest.mock('../../../database/models', () => {
  const mockModel = (name: string) => {
    const cls: any = jest.fn().mockName(name);
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
    sequelize: { transaction: jest.fn((cb: any) => cb({})) },
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

import { ChatMessage, ChatReaction, ConversationParticipant, FeedMedia, HouseholdMember, User } from '../../../database/models';

// ── Helpers ──

const mockUser = (overrides: any = {}) => ({
  id: userId,
  displayName: 'Test User',
  avatarUrl: null,
  avatarEmoji: null,
  get: (key: string) => {
    const data: Record<string, any> = {
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

const mockMessage = (overrides: any = {}) => {
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
    get: (key: string) => {
      const data: Record<string, any> = {
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

const mockReaction = (overrides: any = {}) => ({
  id: 'react-001',
  messageId,
  userId,
  reaction: '👍' as const,
  createdAt: now,
  ...overrides,
});

describe('Chat Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (HouseholdMember.findOne as jest.Mock).mockResolvedValue({ householdId, userId });
    (User.findByPk as jest.Mock).mockResolvedValue(mockUser());
    (ConversationParticipant.findOne as jest.Mock).mockResolvedValue({ conversationId, userId });
  });

  // ── sendMessage ──

  describe('sendMessage', () => {
    it('should create a text message', async () => {
      (ChatMessage.create as jest.Mock).mockResolvedValue(mockMessage());
      (ChatMessage.findByPk as jest.Mock).mockResolvedValue(mockMessage());

      const result = await sendMessage(userId, { conversationId, content: 'Hello world' });

      expect(ChatMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Hello world', senderId: userId, householdId })
      );
      expect(result.content).toBe('Hello world');
    });

    it('should reject messages with no content and no media', async () => {
      await expect(sendMessage(userId, { conversationId })).rejects.toThrow(); // validation catches this
    });

    it('should attach mediaUrl when mediaIds provided', async () => {
      (ChatMessage.create as jest.Mock).mockResolvedValue(mockMessage({ mediaUrl: 'https://cloudinary.com/img.jpg' }));
      (ChatMessage.findByPk as jest.Mock).mockResolvedValue(mockMessage({ mediaUrl: 'https://cloudinary.com/img.jpg' }));
      (FeedMedia.findAll as jest.Mock).mockResolvedValue([{ get: () => 'https://cloudinary.com/img.jpg' }]);

      const result = await sendMessage(userId, { conversationId, content: 'Check this', mediaIds: ['media-uuid'] });

      expect(result.mediaUrl).toBe('https://cloudinary.com/img.jpg');
    });

    it('should reject if user is not a household member', async () => {
      (HouseholdMember.findOne as jest.Mock).mockResolvedValue(null);

      await expect(sendMessage(userId, { conversationId, content: 'Hi' })).rejects.toThrow(ForbiddenError);
    });

    it('should create a voice message from a direct mediaUrl', async () => {
      (ChatMessage.create as jest.Mock).mockResolvedValue(
        mockMessage({ mediaUrl: 'https://cloudinary.com/voice.m4a', type: 'voice', durationSeconds: 8 }),
      );
      (ChatMessage.findByPk as jest.Mock).mockResolvedValue(
        mockMessage({ mediaUrl: 'https://cloudinary.com/voice.m4a', type: 'voice', durationSeconds: 8 }),
      );

      const result = await sendMessage(userId, {
        conversationId,
        mediaUrl: 'https://cloudinary.com/voice.m4a',
        type: 'voice',
        durationSeconds: 8,
      });

      expect(result.mediaUrl).toBe('https://cloudinary.com/voice.m4a');
      expect(result.type).toBe('voice');
      expect(result.durationSeconds).toBe(8);
      expect(ChatMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ mediaUrl: 'https://cloudinary.com/voice.m4a', type: 'voice', durationSeconds: 8 }),
      );
    });
  });

  // ── listMessages ──

  describe('listMessages', () => {
    it('should return paginated messages', async () => {
      (ChatMessage.findAll as jest.Mock).mockResolvedValue([mockMessage()]);
      (ChatReaction.findAll as jest.Mock).mockResolvedValue([]);

      const result = await listMessages(userId, { limit: 20 });

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].id).toBe(messageId);
      expect(result.hasMore).toBe(false);
    });

    it('should return empty list when no messages', async () => {
      (ChatMessage.findAll as jest.Mock).mockResolvedValue([]);
      (ChatReaction.findAll as jest.Mock).mockResolvedValue([]);

      const result = await listMessages(userId, {});

      expect(result.messages).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  // ── getMessageById ──

  describe('getMessageById', () => {
    it('should return a message by id', async () => {
      (ChatMessage.findOne as jest.Mock).mockResolvedValue(mockMessage());
      (ChatReaction.findAll as jest.Mock).mockResolvedValue([]);

      const result = await getMessageById(messageId, userId);

      expect(result.id).toBe(messageId);
      expect(result.content).toBe('Hello world');
    });

    it('should throw NotFoundError for non-existent message', async () => {
      (ChatMessage.findOne as jest.Mock).mockResolvedValue(null);

      await expect(getMessageById('nonexistent', userId)).rejects.toThrow(NotFoundError);
    });
  });

  // ── updateMessage ──

  describe('updateMessage', () => {
    it('should allow sender to edit their message', async () => {
      (ChatMessage.findOne as jest.Mock).mockResolvedValue(mockMessage());
      (ChatMessage.findByPk as jest.Mock).mockResolvedValue(mockMessage({ content: 'Edited!' }));

      const result = await updateMessage(messageId, userId, 'member', { content: 'Edited!' });

      expect(result.content).toBe('Edited!');
    });

    it('should reject non-sender non-admin edit', async () => {
      (ChatMessage.findOne as jest.Mock).mockResolvedValue(mockMessage({ senderId: otherUserId }));

      await expect(
        updateMessage(messageId, userId, 'member', { content: 'Hacked' })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow admin to edit any message', async () => {
      (ChatMessage.findOne as jest.Mock).mockResolvedValue(mockMessage({ senderId: otherUserId }));
      (ChatMessage.findByPk as jest.Mock).mockResolvedValue(mockMessage({ content: 'Admin edited' }));

      const result = await updateMessage(messageId, adminUserId, 'admin', { content: 'Admin edited' });

      expect(result.content).toBe('Admin edited');
    });
  });

  // ── deleteMessage (FR-145, FR-146) ──

  describe('deleteMessage', () => {
    const recentCreated = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago — < 1hr

    it('should hard-delete own message under 1 hour (FR-145)', async () => {
      const msg = mockMessage({ senderId: userId, conversationId: 'conv1', createdAt: recentCreated });
      msg.destroy = jest.fn().mockResolvedValue(undefined);
      (ChatMessage.findOne as jest.Mock).mockResolvedValue(msg);

      await deleteMessage(messageId, userId, 'member');

      expect(ChatReaction.destroy).toHaveBeenCalledWith({ where: { messageId }, transaction: expect.anything() });
      expect(msg.destroy).toHaveBeenCalled();
    });

    it('should soft-delete own message over 1 hour', async () => {
      const oldCreated = new Date(Date.now() - 2 * 3600 * 1000); // 2 hours ago
      const msg = mockMessage({ senderId: userId, conversationId: 'conv1', createdAt: oldCreated });
      msg.destroy = jest.fn().mockResolvedValue(undefined);
      (ChatMessage.findOne as jest.Mock).mockResolvedValue(msg);

      await deleteMessage(messageId, userId, 'member');

      expect(msg.destroy).toHaveBeenCalled();
    });

    it('should allow admin to hard-delete any message (FR-146)', async () => {
      const msg = mockMessage({ senderId: otherUserId, conversationId: 'conv1', createdAt: new Date() });
      msg.destroy = jest.fn().mockResolvedValue(undefined);
      (ChatMessage.findOne as jest.Mock).mockResolvedValue(msg);

      await deleteMessage(messageId, adminUserId, 'admin');

      expect(ChatReaction.destroy).toHaveBeenCalled();
      expect(msg.destroy).toHaveBeenCalled();
    });

    it('should reject non-owner non-admin deletion', async () => {
      const msg = mockMessage({ senderId: otherUserId, conversationId: 'conv1' });
      (ChatMessage.findOne as jest.Mock).mockResolvedValue(msg);
      (ConversationParticipant.findOne as jest.Mock).mockResolvedValue(null);

      await expect(deleteMessage(messageId, userId, 'member')).rejects.toThrow(ForbiddenError);
    });
  });

  // ── addReaction (FR-148) ──

  describe('addReaction', () => {
    it('should add a reaction', async () => {
      (ChatMessage.findByPk as jest.Mock).mockResolvedValue(mockMessage());
      (ChatReaction.upsert as jest.Mock).mockResolvedValue([mockReaction(), true]);
      (ChatReaction.findAll as jest.Mock).mockResolvedValue([mockReaction()]);

      const result = await addReaction(messageId, userId, '👍');

      expect(ChatReaction.upsert).toHaveBeenCalledWith({ messageId, userId, reaction: '👍' });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should reject invalid reaction emoji', async () => {
      (ChatMessage.findByPk as jest.Mock).mockResolvedValue(mockMessage());
      await expect(addReaction(messageId, userId, '💩' as any)).rejects.toThrow(ValidationError);
    });
  });

  // ── removeReaction ──

  describe('removeReaction', () => {
    it('should remove a reaction', async () => {
      (ChatMessage.findByPk as jest.Mock).mockResolvedValue(mockMessage());
      (ChatReaction.findAll as jest.Mock).mockResolvedValue([]);

      const result = await removeReaction(messageId, userId, '👍');

      expect(ChatReaction.destroy).toHaveBeenCalledWith({ where: { messageId, userId, reaction: '👍' } });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ── typingStart / typingStop (FR-149) ──

  describe('typing indicator', () => {
    it('should broadcast typing start', async () => {
      await expect(typingStart(userId)).resolves.toBeUndefined();
    });

    it('should broadcast typing stop', async () => {
      await expect(typingStop(userId)).resolves.toBeUndefined();
    });

    it('should throw if user is not a household member on typingStart', async () => {
      (HouseholdMember.findOne as jest.Mock).mockResolvedValue(null);

      await expect(typingStart(userId)).rejects.toThrow(ForbiddenError);
    });
  });
});

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
// ── Mocks ──
const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    displayName: 'Test User',
    avatarUrl: null,
    avatarEmoji: null,
    email: 'test@example.com',
};
const otherUserId = '660e8400-e29b-41d4-a716-446655440002';
const householdId = '770e8400-e29b-41d4-a716-446655440003';
const postId = '880e8400-e29b-41d4-a716-446655440004';
const commentId = '990e8400-e29b-41d4-a716-446655440005';
jest.mock('../../../database/models', () => {
    const mockSequelize = {
        fn: jest.fn((name) => name),
        col: jest.fn((name) => name),
    };
    return {
        FeedPost: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findByPk: jest.fn(),
        },
        FeedLike: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            sequelize: mockSequelize,
        },
        FeedComment: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findByPk: jest.fn(),
            sequelize: mockSequelize,
        },
        FeedMedia: {
            bulkCreate: jest.fn(),
        },
        User: {
            findByPk: jest.fn(),
        },
        HouseholdMember: {
            findOne: jest.fn(),
            findAll: jest.fn(),
        },
        NotificationHistory: {
            create: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
        },
        NotificationPreference: {
            findOne: jest.fn(),
        },
        Sequelize: mockSequelize,
    };
});
// ── Helpers ──
function fakePost(overrides = {}) {
    return {
        id: postId,
        householdId,
        userId: mockUser.id,
        content: 'Test post content',
        mediaType: 'text',
        createdAt: new Date('2026-07-10T12:00:00Z'),
        updatedAt: new Date('2026-07-10T12:00:00Z'),
        deletedAt: null,
        get: jest.fn((key) => {
            if (key === 'author')
                return mockUser;
            if (key === 'media')
                return [];
            return undefined;
        }),
        destroy: jest.fn(),
        ...overrides,
    };
}
function fakeComment(overrides = {}) {
    return {
        id: commentId,
        postId,
        userId: mockUser.id,
        content: 'Test comment',
        createdAt: new Date('2026-07-10T12:30:00Z'),
        updatedAt: new Date('2026-07-10T12:30:00Z'),
        deletedAt: null,
        get: jest.fn((key) => {
            if (key === 'author')
                return mockUser;
            return undefined;
        }),
        destroy: jest.fn(),
        ...overrides,
    };
}
function fakeLike() {
    return {
        id: 'aa0e8400-e29b-41d4-a716-446655440006',
        postId,
        userId: mockUser.id,
        destroy: jest.fn(),
    };
}
const modelsMock = models;
beforeEach(() => {
    jest.clearAllMocks();
});
// ── Tests ──
describe('Feed Service', () => {
    describe('createPost', () => {
        it('creates a text post and returns it with author info', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({
                householdId,
            });
            modelsMock.HouseholdMember.findAll.mockResolvedValue([
                { userId: 'user2' }, { userId: 'user3' },
            ]);
            modelsMock.FeedPost.create.mockResolvedValue(fakePost());
            modelsMock.FeedPost.findByPk.mockResolvedValue(fakePost());
            modelsMock.FeedLike.findAll.mockResolvedValue([]);
            modelsMock.FeedComment.findAll.mockResolvedValue([]);
            const result = await (0, service_1.createPost)(mockUser.id, {
                content: 'Test post content',
            });
            expect(result.content).toBe('Test post content');
            expect(result.author.displayName).toBe('Test User');
            expect(result.mediaType).toBe('text');
            expect(result.likeCount).toBe(0);
            expect(modelsMock.FeedPost.create).toHaveBeenCalled();
        });
        it('throws ForbiddenError if user has no household', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue(null);
            await expect((0, service_1.createPost)(mockUser.id, { content: 'Test' })).rejects.toThrow('You must belong to a household');
        });
    });
    describe('getFeed', () => {
        it('returns paginated feed posts', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({
                householdId,
            });
            modelsMock.FeedPost.findAll.mockResolvedValue([
                fakePost(),
            ]);
            modelsMock.FeedLike.findAll.mockResolvedValue([]);
            modelsMock.FeedComment.findAll.mockResolvedValue([]);
            const result = await (0, service_1.getFeed)(mockUser.id, { limit: 20 });
            expect(result.posts).toHaveLength(1);
            expect(result.posts[0].content).toBe('Test post content');
            expect(result.hasMore).toBe(false);
            expect(result.nextCursor).toBeNull();
        });
        it('returns hasMore when there are more posts than limit', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({
                householdId,
            });
            const posts = Array(21)
                .fill(null)
                .map((_, i) => fakePost({
                id: `post-${i}`,
                createdAt: new Date(Date.now() - i * 60000),
            }));
            modelsMock.FeedPost.findAll.mockResolvedValue(posts);
            modelsMock.FeedLike.findAll.mockResolvedValue([]);
            modelsMock.FeedComment.findAll.mockResolvedValue([]);
            const result = await (0, service_1.getFeed)(mockUser.id, { limit: 20 });
            expect(result.posts).toHaveLength(20);
            expect(result.hasMore).toBe(true);
            expect(result.nextCursor).toBe('post-19');
        });
    });
    describe('getPostById', () => {
        it('returns a single post by ID', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({
                householdId,
            });
            modelsMock.FeedPost.findOne.mockResolvedValue(fakePost());
            modelsMock.FeedLike.findAll.mockResolvedValue([]);
            modelsMock.FeedComment.findAll.mockResolvedValue([]);
            const result = await (0, service_1.getPostById)(postId, mockUser.id);
            expect(result.id).toBe(postId);
            expect(result.content).toBe('Test post content');
        });
        it('throws NotFoundError for non-existent post', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({
                householdId,
            });
            modelsMock.FeedPost.findOne.mockResolvedValue(null);
            await expect((0, service_1.getPostById)(postId, mockUser.id)).rejects.toThrow('Post not found');
        });
    });
    describe('likePost / unlikePost', () => {
        it('likes a post', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({
                householdId,
            });
            modelsMock.FeedPost.findOne.mockResolvedValue(fakePost());
            modelsMock.FeedLike.findOne.mockResolvedValue(null);
            modelsMock.FeedLike.create.mockResolvedValue(fakeLike());
            const result = await (0, service_1.likePost)(postId, mockUser.id);
            expect(result).toBe(true);
            expect(modelsMock.FeedLike.create).toHaveBeenCalled();
        });
        it('returns false if already liked (no-op)', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({
                householdId,
            });
            modelsMock.FeedPost.findOne.mockResolvedValue(fakePost());
            modelsMock.FeedLike.findOne.mockResolvedValue(fakeLike());
            const result = await (0, service_1.likePost)(postId, mockUser.id);
            expect(result).toBe(false);
            expect(modelsMock.FeedLike.create).not.toHaveBeenCalled();
        });
        it('unlikes a post', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({
                householdId,
            });
            modelsMock.FeedPost.findOne.mockResolvedValue(fakePost());
            const like = fakeLike();
            modelsMock.FeedLike.findOne.mockResolvedValue(like);
            await (0, service_1.unlikePost)(postId, mockUser.id);
            expect(like.destroy).toHaveBeenCalled();
        });
        it('throws NotFoundError when unliking non-existent like', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({
                householdId,
            });
            modelsMock.FeedPost.findOne.mockResolvedValue(fakePost());
            modelsMock.FeedLike.findOne.mockResolvedValue(null);
            await expect((0, service_1.unlikePost)(postId, mockUser.id)).rejects.toThrow('Like not found');
        });
    });
    describe('deletePost', () => {
        it('allows post author to delete their own post', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({
                householdId,
            });
            const post = fakePost();
            modelsMock.FeedPost.findOne.mockResolvedValue(post);
            await (0, service_1.deletePost)(postId, mockUser.id, 'member');
            expect(post.destroy).toHaveBeenCalled();
        });
        it('allows admin to delete any post', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({
                householdId,
            });
            const post = fakePost({ userId: otherUserId }); // someone else's post
            modelsMock.FeedPost.findOne.mockResolvedValue(post);
            await (0, service_1.deletePost)(postId, otherUserId, 'admin');
            expect(post.destroy).toHaveBeenCalled();
        });
        it('prevents non-owner, non-admin from deleting', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({
                householdId,
            });
            const post = fakePost({ userId: otherUserId });
            modelsMock.FeedPost.findOne.mockResolvedValue(post);
            post.destroy = jest.fn();
            await expect((0, service_1.deletePost)(postId, 'some-other-user', 'member')).rejects.toThrow('You can only delete your own posts');
            expect(post.destroy).not.toHaveBeenCalled();
        });
    });
    describe('comments', () => {
        it('adds a comment to a post', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({
                householdId,
            });
            modelsMock.FeedPost.findOne.mockResolvedValue(fakePost());
            modelsMock.FeedComment.create.mockResolvedValue(fakeComment());
            modelsMock.User.findByPk.mockResolvedValue(mockUser);
            const result = await (0, service_1.addComment)(postId, mockUser.id, {
                content: 'Test comment',
            });
            expect(result.content).toBe('Test comment');
            expect(result.author.displayName).toBe('Test User');
        });
        it('allows self-deletion of comment', async () => {
            const comment = fakeComment();
            modelsMock.FeedComment.findByPk.mockResolvedValue(comment);
            await (0, service_1.deleteComment)(commentId, mockUser.id, 'member');
            expect(comment.destroy).toHaveBeenCalled();
        });
        it('allows admin to delete any comment', async () => {
            const comment = fakeComment({ userId: otherUserId });
            modelsMock.FeedComment.findByPk.mockResolvedValue(comment);
            await (0, service_1.deleteComment)(commentId, otherUserId, 'admin');
            expect(comment.destroy).toHaveBeenCalled();
        });
        it('prevents non-owner, non-admin from deleting a comment', async () => {
            const comment = fakeComment({ userId: otherUserId });
            modelsMock.FeedComment.findByPk.mockResolvedValue(comment);
            comment.destroy = jest.fn();
            await expect((0, service_1.deleteComment)(commentId, 'stranger', 'member')).rejects.toThrow('You can only delete your own comments');
            expect(comment.destroy).not.toHaveBeenCalled();
        });
        it('returns paginated comments for a post', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({
                householdId,
            });
            modelsMock.FeedPost.findOne.mockResolvedValue(fakePost());
            modelsMock.FeedComment.findAll.mockResolvedValue([
                fakeComment(),
            ]);
            const result = await (0, service_1.getComments)(postId, mockUser.id, { limit: 20 });
            expect(result.comments).toHaveLength(1);
            expect(result.comments[0].content).toBe('Test comment');
        });
    });
});
//# sourceMappingURL=feed.service.test.js.map
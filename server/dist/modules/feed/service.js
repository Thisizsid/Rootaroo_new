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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPost = createPost;
exports.getFeed = getFeed;
exports.getPostById = getPostById;
exports.deletePost = deletePost;
exports.likePost = likePost;
exports.unlikePost = unlikePost;
exports.addComment = addComment;
exports.deleteComment = deleteComment;
exports.getComments = getComments;
const uuid_1 = require("uuid");
const sequelize_1 = require("sequelize");
const models_1 = require("../../database/models");
const errors_1 = require("../../shared/utils/errors");
const logger_1 = __importDefault(require("../../shared/utils/logger"));
const notificationService = __importStar(require("../notification/service"));
const socket_1 = require("../../shared/utils/socket");
// ── Helpers ──
function toAuthorResponse(user) {
    return {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        avatarEmoji: user.avatarEmoji,
    };
}
function toMediaResponse(items) {
    return items.map((m) => ({
        id: m.id,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        thumbnailUrl: m.thumbnailUrl,
        fileSizeBytes: m.fileSizeBytes,
    }));
}
/**
 * Look up the user's current household membership.
 * Throws 403 if the user does not belong to any household.
 */
async function getUserHousehold(userId) {
    const membership = await models_1.HouseholdMember.findOne({ where: { userId } });
    if (!membership) {
        throw new errors_1.ForbiddenError('You must belong to a household to use the feed');
    }
    return membership.householdId;
}
async function getLikeData(postIds, userId) {
    const [userLikes, counts] = await Promise.all([
        models_1.FeedLike.findAll({ where: { postId: { [sequelize_1.Op.in]: postIds }, userId } }),
        models_1.FeedLike.findAll({
            attributes: [
                'postId',
                [models_1.FeedLike.sequelize.fn('COUNT', models_1.FeedLike.sequelize.col('id')), 'count'],
            ],
            where: { postId: { [sequelize_1.Op.in]: postIds } },
            group: ['post_id'],
            raw: true,
        }),
    ]);
    const userLikeSet = new Set(userLikes.map((l) => l.postId));
    const countMap = new Map(counts.map((r) => [r.postId, r.count]));
    const result = new Map();
    for (const id of postIds) {
        result.set(id, {
            isLikedByMe: userLikeSet.has(id),
            likeCount: countMap.get(id) || 0,
        });
    }
    return result;
}
async function getCommentCounts(postIds) {
    const rows = await models_1.FeedComment.findAll({
        attributes: [
            'postId',
            [models_1.FeedComment.sequelize.fn('COUNT', models_1.FeedComment.sequelize.col('id')), 'count'],
        ],
        where: { postId: { [sequelize_1.Op.in]: postIds }, deletedAt: null },
        group: ['post_id'],
        raw: true,
    });
    const map = new Map();
    for (const row of rows) {
        map.set(row.postId, row.count);
    }
    // Ensure every postId has an entry (0 for posts with no comments)
    for (const id of postIds) {
        if (!map.has(id))
            map.set(id, 0);
    }
    return map;
}
function toPostResponse(post, likeData, commentCount) {
    const postTags = post.get('postTags');
    const taggedUsers = (postTags || [])
        .filter((t) => t.get('taggedUser'))
        .map((t) => {
        const u = t.get('taggedUser');
        return {
            id: u.id,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
        };
    }) || [];
    return {
        id: post.id,
        author: toAuthorResponse(post.get('author')),
        content: post.content,
        mediaType: post.mediaType,
        media: toMediaResponse(post.get('media') || []),
        likeCount: likeData.likeCount,
        commentCount,
        isLikedByMe: likeData.isLikedByMe,
        isPinned: false,
        activity: post.activity || null,
        location: post.location || null,
        taggedUsers,
        privacy: post.privacy || 'household',
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
    };
}
/**
 * FR-040/041/042/043: Create a feed post (text, photo, or video).
 */
async function createPost(userId, body) {
    const householdId = await getUserHousehold(userId);
    const post = await models_1.FeedPost.create({
        id: (0, uuid_1.v4)(),
        householdId,
        userId,
        content: body.content || null,
        mediaType: body.mediaType || 'text',
        activity: body.activity || null,
        location: body.location || null,
        privacy: body.privacy || 'household',
    });
    // Create media records if provided
    if (body.media && body.media.length > 0) {
        await models_1.FeedMedia.bulkCreate(body.media.map((m) => ({
            id: (0, uuid_1.v4)(),
            postId: post.id,
            mediaUrl: m.mediaUrl,
            mediaType: m.mediaType,
            thumbnailUrl: m.thumbnailUrl || null,
            fileSizeBytes: m.fileSizeBytes || null,
        })));
    }
    // Create post tags if provided
    if (body.taggedUserIds && body.taggedUserIds.length > 0) {
        await models_1.PostTag.bulkCreate(body.taggedUserIds.map((taggedUserId) => ({
            id: (0, uuid_1.v4)(),
            postId: post.id,
            userId: taggedUserId,
        })));
    }
    // Reload with associations
    const fullPost = await models_1.FeedPost.findByPk(post.id, {
        include: [
            { model: models_1.User, as: 'author' },
            { model: models_1.FeedMedia, as: 'media' },
            { model: models_1.PostTag, as: 'postTags', include: [{ model: models_1.User, as: 'taggedUser' }] },
        ],
    });
    if (!fullPost)
        throw new Error('Failed to load created post');
    const postId = post.id;
    const likeData = (await getLikeData([postId], userId)).get(postId) || { isLikedByMe: false, likeCount: 0 };
    const commentCounts = await getCommentCounts([postId]);
    const result = toPostResponse(fullPost, likeData, commentCounts.get(postId) || 0);
    // FR-047: Notify household members (async, fire-and-forget)
    const members = await models_1.HouseholdMember.findAll({ where: { householdId } });
    const author = fullPost.get('author');
    const authorName = author?.displayName || 'Someone';
    for (const m of members) {
        if (m.userId !== userId) {
            notificationService.sendToUser(m.userId, 'feed', 'New post', `${authorName} posted in the feed`, { postId: result.id, type: 'feed' }).catch((e) => logger_1.default.warn('[Push] Feed notify failed:', e.message));
        }
    }
    // FR-046: Broadcast new post to household via WebSocket
    try {
        (0, socket_1.getIO)().to(householdId).emit('feed:new-post', result);
    }
    catch (e) {
        logger_1.default.warn('[WS] Feed broadcast failed:', e.message);
    }
    return result;
}
/**
 * FR-040/046/050: List feed posts for the user's household.
 * Supports cursor-based pagination and optional `since` filter for polling.
 */
async function getFeed(userId, options) {
    const householdId = await getUserHousehold(userId);
    const limit = options.limit || 20;
    const where = { householdId };
    // Cursor-based: fetch posts with createdAt < cursor (older)
    if (options.cursor) {
        const cursorPost = await models_1.FeedPost.findByPk(options.cursor, {
            attributes: ['createdAt'],
            paranoid: false,
        });
        if (cursorPost) {
            where.createdAt = { [sequelize_1.Op.lt]: cursorPost.createdAt };
        }
    }
    // Since filter for polling (FR-046)
    if (options.since) {
        where.createdAt = {
            ...(where.createdAt || {}),
            [sequelize_1.Op.gt]: new Date(options.since),
        };
    }
    const posts = await models_1.FeedPost.findAll({
        where,
        include: [
            { model: models_1.User, as: 'author' },
            { model: models_1.FeedMedia, as: 'media' },
            { model: models_1.PostTag, as: 'postTags', include: [{ model: models_1.User, as: 'taggedUser' }] },
        ],
        order: [['createdAt', 'DESC']],
        limit: limit + 1, // Fetch one extra to check for hasMore
        paranoid: true,
    });
    const hasMore = posts.length > limit;
    const pagePosts = posts.slice(0, limit);
    const postIds = pagePosts.map((p) => p.id);
    // Batch-fetch likes and comment counts
    const [likeDataMap, commentCounts] = await Promise.all([
        getLikeData(postIds, userId),
        getCommentCounts(postIds),
    ]);
    const resultPosts = pagePosts.map((post) => {
        const ld = likeDataMap.get(post.id) || { isLikedByMe: false, likeCount: 0 };
        return toPostResponse(post, ld, commentCounts.get(post.id) || 0);
    });
    return {
        posts: resultPosts,
        nextCursor: hasMore && pagePosts.length > 0 ? pagePosts[pagePosts.length - 1].id : null,
        hasMore,
    };
}
/**
 * FR-040: Get a single post by ID (with household scope check).
 */
async function getPostById(postId, userId) {
    const householdId = await getUserHousehold(userId);
    const post = await models_1.FeedPost.findOne({
        where: { id: postId, householdId },
        include: [
            { model: models_1.User, as: 'author' },
            { model: models_1.FeedMedia, as: 'media' },
            { model: models_1.PostTag, as: 'postTags', include: [{ model: models_1.User, as: 'taggedUser' }] },
        ],
    });
    if (!post)
        throw new errors_1.NotFoundError('Post');
    const [likeDataMap, commentCounts] = await Promise.all([
        getLikeData([postId], userId),
        getCommentCounts([postId]),
    ]);
    const ld = likeDataMap.get(postId) || { isLikedByMe: false, likeCount: 0 };
    return toPostResponse(post, ld, commentCounts.get(postId) || 0);
}
/**
 * FR-048/049: Delete a post.
 * - Post author can delete their own post.
 * - Admin users can delete any post in their household.
 */
async function deletePost(postId, userId, userRole) {
    const householdId = await getUserHousehold(userId);
    const post = await models_1.FeedPost.findOne({
        where: { id: postId, householdId },
    });
    if (!post)
        throw new errors_1.NotFoundError('Post');
    const isOwner = post.userId === userId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin) {
        throw new errors_1.ForbiddenError('You can only delete your own posts');
    }
    await post.destroy();
}
/**
 * FR-044: Like a post. Idempotent — returns false if already liked.
 */
async function likePost(postId, userId) {
    const householdId = await getUserHousehold(userId);
    // Verify post exists in user's household
    const post = await models_1.FeedPost.findOne({
        where: { id: postId, householdId },
    });
    if (!post)
        throw new errors_1.NotFoundError('Post');
    // Check if already liked
    const existing = await models_1.FeedLike.findOne({
        where: { postId, userId },
    });
    if (existing)
        return false; // Already liked, no-op
    await models_1.FeedLike.create({
        id: (0, uuid_1.v4)(),
        postId,
        userId,
    });
    return true;
}
/**
 * FR-044: Unlike a post.
 */
async function unlikePost(postId, userId) {
    const householdId = await getUserHousehold(userId);
    // Verify post exists
    const post = await models_1.FeedPost.findOne({
        where: { id: postId, householdId },
    });
    if (!post)
        throw new errors_1.NotFoundError('Post');
    const like = await models_1.FeedLike.findOne({
        where: { postId, userId },
    });
    if (!like)
        throw new errors_1.NotFoundError('Like');
    await like.destroy();
}
// ── Comment Methods ──
/**
 * FR-045: Add a comment to a post.
 */
async function addComment(postId, userId, body) {
    const householdId = await getUserHousehold(userId);
    const post = await models_1.FeedPost.findOne({
        where: { id: postId, householdId },
    });
    if (!post)
        throw new errors_1.NotFoundError('Post');
    const comment = await models_1.FeedComment.create({
        id: (0, uuid_1.v4)(),
        postId,
        userId,
        content: body.content,
    });
    const author = await models_1.User.findByPk(userId);
    if (!author)
        throw new Error('User not found');
    return {
        id: comment.id,
        author: toAuthorResponse(author),
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
    };
}
/**
 * FR-045: Delete a comment (self or admin).
 */
async function deleteComment(commentId, userId, userRole) {
    const comment = await models_1.FeedComment.findByPk(commentId);
    if (!comment)
        throw new errors_1.NotFoundError('Comment');
    const isOwner = comment.userId === userId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin) {
        throw new errors_1.ForbiddenError('You can only delete your own comments');
    }
    await comment.destroy();
}
/**
 * FR-045: Get paginated comments for a post.
 */
async function getComments(postId, userId, options) {
    const householdId = await getUserHousehold(userId);
    const limit = options.limit || 20;
    // Verify post exists
    const post = await models_1.FeedPost.findOne({
        where: { id: postId, householdId },
    });
    if (!post)
        throw new errors_1.NotFoundError('Post');
    const where = { postId };
    // Cursor-based pagination (by createdAt, oldest first for comments)
    if (options.cursor) {
        const cursorComment = await models_1.FeedComment.findByPk(options.cursor, {
            attributes: ['createdAt'],
            paranoid: false,
        });
        if (cursorComment) {
            where.createdAt = { [sequelize_1.Op.gt]: cursorComment.createdAt };
        }
    }
    const comments = await models_1.FeedComment.findAll({
        where,
        include: [{ model: models_1.User, as: 'author' }],
        order: [['createdAt', 'ASC']],
        limit: limit + 1,
        paranoid: true,
    });
    const hasMore = comments.length > limit;
    const pageComments = comments.slice(0, limit);
    return {
        comments: pageComments.map((c) => ({
            id: c.id,
            author: toAuthorResponse(c.get('author')),
            content: c.content,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
        })),
        nextCursor: hasMore && pageComments.length > 0 ? pageComments[pageComments.length - 1].id : null,
        hasMore,
    };
}
//# sourceMappingURL=service.js.map
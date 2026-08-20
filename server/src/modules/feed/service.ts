import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import sequelize from '../../config/database';
import {
  FeedPost,
  FeedLike,
  FeedComment,
  FeedMedia,
  User,
  HouseholdMember,
  PostTag,
} from '../../database/models';
import { NotFoundError, ForbiddenError } from '../../shared/utils/errors';
import { CommentReaction } from '../../database/models';
import logger from '../../shared/utils/logger';
import * as notificationService from '../notification/service';
import { getIO } from '../../shared/utils/socket';
import type {
  CreatePostBody,
  CreateCommentBody,
  FeedPostResponse,
  PaginatedFeedResponse,
  FeedCommentResponse,
  PaginatedCommentsResponse,
  FeedAuthorResponse,
  FeedMediaResponse,
  CommentReactionResponse,
} from './types';

// ── Helpers ──

function toAuthorResponse(user: User): FeedAuthorResponse {
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    avatarEmoji: user.avatarEmoji,
  };
}

function toMediaResponse(items: FeedMedia[]): FeedMediaResponse[] {
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
async function getUserHousehold(userId: string): Promise<string> {
  const membership = await HouseholdMember.findOne({ where: { userId } });
  if (!membership) {
    throw new ForbiddenError('You must belong to a household to use the feed');
  }
  return membership.householdId;
}

/**
 * Build a full FeedPostResponse from a post model instance.
 */
interface LikeData {
  isLikedByMe: boolean;
  likeCount: number;
}

async function getLikeData(
  postIds: string[],
  userId: string,
): Promise<Map<string, LikeData>> {
  const [userLikes, counts] = await Promise.all([
    FeedLike.findAll({ where: { postId: { [Op.in]: postIds }, userId } }),
    FeedLike.findAll({
      attributes: [
        'postId',
        [FeedLike.sequelize!.fn('COUNT', FeedLike.sequelize!.col('id')), 'count'],
      ],
      where: { postId: { [Op.in]: postIds } },
      group: ['post_id'],
      raw: true,
    }),
  ]);

  const userLikeSet = new Set(userLikes.map((l) => l.postId));
  const countMap = new Map(
    (counts as unknown as Array<{ postId: string; count: number }>).map(
      (r) => [r.postId, r.count],
    ),
  );

  const result = new Map<string, LikeData>();
  for (const id of postIds) {
    result.set(id, {
      isLikedByMe: userLikeSet.has(id),
      likeCount: countMap.get(id) || 0,
    });
  }
  return result;
}

async function getCommentCounts(
  postIds: string[],
): Promise<Map<string, number>> {
  const rows = await FeedComment.findAll({
    attributes: [
      'postId',
      [FeedComment.sequelize!.fn('COUNT', FeedComment.sequelize!.col('id')), 'count'],
    ],
    where: { postId: { [Op.in]: postIds }, deletedAt: null },
    group: ['post_id'],
    raw: true,
  });
  const map = new Map<string, number>();
  for (const row of rows as unknown as Array<{ postId: string; count: number }>) {
    map.set(row.postId, row.count);
  }
  // Ensure every postId has an entry (0 for posts with no comments)
  for (const id of postIds) {
    if (!map.has(id)) map.set(id, 0);
  }
  return map;
}

function toPostResponse(
  post: FeedPost,
  likeData: LikeData,
  commentCount: number,
): FeedPostResponse {
  const postTags = post.get('postTags') as unknown as PostTag[] | undefined;
  const taggedUsers = (postTags || [])
    .filter((t) => t.get('taggedUser'))
    .map((t) => {
      const u = t.get('taggedUser') as User;
      return {
        id: u.id,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
      };
    }) || [];

  return {
    id: post.id,
    author: toAuthorResponse(post.get('author') as unknown as User),
    content: post.content,
    mediaType: post.mediaType,
    media: toMediaResponse(post.get('media') as unknown as FeedMedia[] || []),
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
export async function createPost(
  userId: string,
  body: CreatePostBody,
): Promise<FeedPostResponse> {
  const householdId = await getUserHousehold(userId);

  const post = await FeedPost.create({
    id: uuidv4(),
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
    await FeedMedia.bulkCreate(
      body.media.map((m) => ({
        id: uuidv4(),
        postId: post.id,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        thumbnailUrl: m.thumbnailUrl || null,
        fileSizeBytes: m.fileSizeBytes || null,
      })),
    );
  }

  // Create post tags if provided
  if (body.taggedUserIds && body.taggedUserIds.length > 0) {
    await PostTag.bulkCreate(
      body.taggedUserIds.map((taggedUserId) => ({
        id: uuidv4(),
        postId: post.id,
        userId: taggedUserId,
      })),
    );
  }

  // Reload with associations
  const fullPost = await FeedPost.findByPk(post.id, {
    include: [
      { model: User, as: 'author' },
      { model: FeedMedia, as: 'media' },
      { model: PostTag, as: 'postTags', include: [{ model: User, as: 'taggedUser' }] },
    ],
  });
  if (!fullPost) throw new Error('Failed to load created post');

  const postId = post.id as string;
  const likeData = (await getLikeData([postId], userId)).get(postId) || { isLikedByMe: false, likeCount: 0 };
  const commentCounts = await getCommentCounts([postId]);
  const result = toPostResponse(fullPost, likeData, commentCounts.get(postId) || 0);

  // FR-047: Notify household members (async, fire-and-forget)
  const members = await HouseholdMember.findAll({ where: { householdId } });
  const author = fullPost.get('author') as User | undefined;
  const authorName = author?.displayName || 'Someone';
  for (const m of members) {
    if (m.userId !== userId) {
      notificationService.sendToUser(m.userId, 'feed', 'New post',
        `${authorName} posted in the feed`, { postId: result.id, type: 'feed' }
      ).catch((e: Error) => logger.warn('[Push] Feed notify failed:', e.message));
    }
  }

  // FR-046: Broadcast new post to household via WebSocket
  try {
    getIO().to(`household:${householdId}`).emit('feed:new-post', result);
  } catch (e) {
    logger.warn('[WS] Feed broadcast failed:', (e as Error).message);
  }

  return result;
}

/**
 * FR-040/046/050: List feed posts for the user's household.
 * Supports cursor-based pagination and optional `since` filter for polling.
 */
export async function getFeed(
  userId: string,
  options: {
    cursor?: string;
    limit?: number;
    since?: string;
    authorId?: string;
  },
): Promise<PaginatedFeedResponse> {
  const householdId = await getUserHousehold(userId);
  const limit = options.limit || 20;
  const where: any = { householdId };
  if (options.authorId) {
    where.userId = options.authorId;
  }

  // Cursor-based: fetch posts with createdAt < cursor (older)
  if (options.cursor) {
    const cursorPost = await FeedPost.findByPk(options.cursor, {
      attributes: ['createdAt'],
      paranoid: false,
    });
    if (cursorPost) {
      where.createdAt = { [Op.lt]: cursorPost.createdAt };
    }
  }

  // Since filter for polling (FR-046)
  if (options.since) {
    where.createdAt = {
      ...(where.createdAt || {}),
      [Op.gt]: new Date(options.since),
    };
  }

  const posts = await FeedPost.findAll({
    where,
    include: [
      { model: User, as: 'author' },
      { model: FeedMedia, as: 'media' },
      { model: PostTag, as: 'postTags', include: [{ model: User, as: 'taggedUser' }] },
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

  const resultPosts: FeedPostResponse[] = pagePosts.map((post) => {
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
export async function getPostById(
  postId: string,
  userId: string,
): Promise<FeedPostResponse> {
  const householdId = await getUserHousehold(userId);

  const post = await FeedPost.findOne({
    where: { id: postId, householdId },
    include: [
      { model: User, as: 'author' },
      { model: FeedMedia, as: 'media' },
      { model: PostTag, as: 'postTags', include: [{ model: User, as: 'taggedUser' }] },
    ],
  });
  if (!post) throw new NotFoundError('Post');

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
export async function deletePost(
  postId: string,
  userId: string,
  userRole: string,
): Promise<void> {
  const householdId = await getUserHousehold(userId);

  const post = await FeedPost.findOne({
    where: { id: postId, householdId },
  });
  if (!post) throw new NotFoundError('Post');

  const isOwner = post.userId === userId;
  const isAdmin = userRole === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('You can only delete your own posts');
  }

  await post.destroy();
}

/**
 * FR-044: Like a post. Idempotent — returns false if already liked.
 */
export async function likePost(
  postId: string,
  userId: string,
): Promise<boolean> {
  const householdId = await getUserHousehold(userId);

  // Verify post exists in user's household
  const post = await FeedPost.findOne({
    where: { id: postId, householdId },
  });
  if (!post) throw new NotFoundError('Post');

  // Check if already liked
  const existing = await FeedLike.findOne({
    where: { postId, userId },
  });
  if (existing) return false; // Already liked, no-op

  await FeedLike.create({
    id: uuidv4(),
    postId,
    userId,
  });
  return true;
}

/**
 * FR-044: Unlike a post.
 */
export async function unlikePost(
  postId: string,
  userId: string,
): Promise<void> {
  const householdId = await getUserHousehold(userId);

  // Verify post exists
  const post = await FeedPost.findOne({
    where: { id: postId, householdId },
  });
  if (!post) throw new NotFoundError('Post');

  const like = await FeedLike.findOne({
    where: { postId, userId },
  });
  if (!like) throw new NotFoundError('Like');

  await like.destroy();
}

// ── Comment Methods ──

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/**
 * Build a comment response with reactions + nested replies.
 */
async function toCommentResponse(
  comment: FeedComment,
  viewerId: string,
  postOwnerId: string,
  includeReplies = true,
): Promise<FeedCommentResponse> {
  const [reactions, replyRows] = await Promise.all([
    CommentReaction.findAll({
      where: { commentId: comment.id },
      attributes: ['reaction', [sequelize.fn('COUNT', sequelize.col('reaction')), 'cnt']],
      group: ['reaction'],
      raw: true,
    }) as unknown as Array<{ reaction: string; cnt: string | number }>,
    includeReplies
      ? FeedComment.findAll({
          where: { parentId: comment.id },
          include: [{ model: User, as: 'author' }],
          order: [['createdAt', 'ASC']],
          paranoid: true,
        })
      : Promise.resolve([]),
  ]);

  const myReaction = await CommentReaction.findOne({
    where: { commentId: comment.id, userId: viewerId },
    attributes: ['reaction'],
  });

  const reactionMap = new Map<string, number>();
  for (const r of reactions) {
    reactionMap.set(r.reaction, Number(r.cnt) || 0);
  }

  const reactionList: CommentReactionResponse[] = REACTION_EMOJIS.filter((e) => reactionMap.has(e)).map(
    (e) => ({
      emoji: e,
      count: reactionMap.get(e) || 0,
      reactedByMe: myReaction?.reaction === e,
    }),
  );

  const replyResponses = await Promise.all(
    replyRows.map((r) => toCommentResponse(r, viewerId, postOwnerId, false)),
  );

  return {
    id: comment.id,
    author: toAuthorResponse(comment.get('author') as unknown as User),
    content: comment.content,
    parentId: comment.parentId,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    reactionCount: reactionMap.size > 0 ? [...reactionMap.values()].reduce((a, b) => a + b, 0) : 0,
    reactions: reactionList,
    myReaction: myReaction?.reaction || null,
    replies: replyResponses,
    isAuthor: comment.userId === viewerId,
    isPostOwner: comment.userId === postOwnerId,
  };
}

/**
 * FR-045: Add a comment or reply to a post.
 */
export async function addComment(
  postId: string,
  userId: string,
  body: CreateCommentBody,
): Promise<FeedCommentResponse> {
  const householdId = await getUserHousehold(userId);

  const post = await FeedPost.findOne({
    where: { id: postId, householdId },
  });
  if (!post) throw new NotFoundError('Post');

  let parentId: string | null = null;
  if (body.parentId) {
    const parent = await FeedComment.findOne({
      where: { id: body.parentId, postId, deletedAt: null },
      paranoid: false,
    });
    if (!parent) throw new NotFoundError('Comment');
    // Replies to replies attach to the root of the thread (one level deep)
    parentId = parent.parentId || parent.id;
  }

  const comment = await FeedComment.create({
    id: uuidv4(),
    postId,
    userId,
    parentId,
    content: body.content,
  });

  const withAuthor = await FeedComment.findByPk(comment.id, {
    include: [{ model: User, as: 'author' }],
    paranoid: false,
  });
  if (!withAuthor) throw new Error('Comment not found');

  return toCommentResponse(withAuthor, userId, post.userId, false);
}

/**
 * FR-045: Delete a comment (comment author, post owner, or admin).
 */
export async function deleteComment(
  commentId: string,
  userId: string,
  userRole: string,
): Promise<void> {
  const comment = await FeedComment.findByPk(commentId);
  if (!comment) throw new NotFoundError('Comment');

  const isOwner = comment.userId === userId;
  const isAdmin = userRole === 'admin';

  let isPostOwner = false;
  if (!isOwner && !isAdmin) {
    const post = await FeedPost.findByPk(comment.postId, { attributes: ['userId'] });
    isPostOwner = !!post && post.userId === userId;
  }

  if (!isOwner && !isAdmin && !isPostOwner) {
    throw new ForbiddenError('You can only delete your own comments or comments on your posts');
  }

  // Delete replies first (tree chain)
  await FeedComment.destroy({ where: { parentId: commentId } });
  await comment.destroy();
}

/**
 * Toggle a reaction on a comment. Returns the new reaction state.
 */
export async function toggleCommentReaction(
  commentId: string,
  userId: string,
  reaction: string,
): Promise<{ reacted: boolean; reaction: string | null; count: number }> {
  const comment = await FeedComment.findByPk(commentId);
  if (!comment) throw new NotFoundError('Comment');

  const existing = await CommentReaction.findOne({
    where: { commentId, userId, reaction },
  });

  if (existing) {
    await existing.destroy();
    return { reacted: false, reaction: null, count: await CommentReaction.count({ where: { commentId } }) };
  }

  await CommentReaction.create({
    id: uuidv4(),
    commentId,
    userId,
    reaction,
  });

  return { reacted: true, reaction, count: await CommentReaction.count({ where: { commentId } }) };
}

/**
 * FR-045: Get paginated comments for a post (flat list of roots, replies nested).
 */
export async function getComments(
  postId: string,
  userId: string,
  options: { cursor?: string; limit?: number },
): Promise<PaginatedCommentsResponse> {
  const householdId = await getUserHousehold(userId);
  const limit = options.limit || 20;

  // Verify post exists
  const post = await FeedPost.findOne({
    where: { id: postId, householdId },
  });
  if (!post) throw new NotFoundError('Post');

  const where: any = { postId, parentId: null };

  // Cursor-based pagination (by createdAt, oldest first for comments)
  if (options.cursor) {
    const cursorComment = await FeedComment.findByPk(options.cursor, {
      attributes: ['createdAt'],
      paranoid: false,
    });
    if (cursorComment) {
      where.createdAt = { [Op.gt]: cursorComment.createdAt };
    }
  }

  const comments = await FeedComment.findAll({
    where,
    include: [{ model: User, as: 'author' }],
    order: [['createdAt', 'ASC']],
    limit: limit + 1,
    paranoid: true,
  });

  const hasMore = comments.length > limit;
  const pageComments = comments.slice(0, limit);

  const responseComments = await Promise.all(
    pageComments.map((c) => toCommentResponse(c, userId, post.userId, true)),
  );

  return {
    comments: responseComments,
    nextCursor: hasMore && pageComments.length > 0 ? pageComments[pageComments.length - 1].id : null,
    hasMore,
  };
}

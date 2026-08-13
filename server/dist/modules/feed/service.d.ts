import type { CreatePostBody, CreateCommentBody, FeedPostResponse, PaginatedFeedResponse, FeedCommentResponse, PaginatedCommentsResponse } from './types';
/**
 * FR-040/041/042/043: Create a feed post (text, photo, or video).
 */
export declare function createPost(userId: string, body: CreatePostBody): Promise<FeedPostResponse>;
/**
 * FR-040/046/050: List feed posts for the user's household.
 * Supports cursor-based pagination and optional `since` filter for polling.
 */
export declare function getFeed(userId: string, options: {
    cursor?: string;
    limit?: number;
    since?: string;
}): Promise<PaginatedFeedResponse>;
/**
 * FR-040: Get a single post by ID (with household scope check).
 */
export declare function getPostById(postId: string, userId: string): Promise<FeedPostResponse>;
/**
 * FR-048/049: Delete a post.
 * - Post author can delete their own post.
 * - Admin users can delete any post in their household.
 */
export declare function deletePost(postId: string, userId: string, userRole: string): Promise<void>;
/**
 * FR-044: Like a post. Idempotent — returns false if already liked.
 */
export declare function likePost(postId: string, userId: string): Promise<boolean>;
/**
 * FR-044: Unlike a post.
 */
export declare function unlikePost(postId: string, userId: string): Promise<void>;
/**
 * FR-045: Add a comment to a post.
 */
export declare function addComment(postId: string, userId: string, body: CreateCommentBody): Promise<FeedCommentResponse>;
/**
 * FR-045: Delete a comment (self or admin).
 */
export declare function deleteComment(commentId: string, userId: string, userRole: string): Promise<void>;
/**
 * FR-045: Get paginated comments for a post.
 */
export declare function getComments(postId: string, userId: string, options: {
    cursor?: string;
    limit?: number;
}): Promise<PaginatedCommentsResponse>;
//# sourceMappingURL=service.d.ts.map
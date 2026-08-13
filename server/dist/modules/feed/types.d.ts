export interface CreatePostBody {
    content?: string;
    mediaType?: 'text' | 'photo' | 'video';
    media?: Array<{
        mediaUrl: string;
        mediaType: 'photo' | 'video';
        thumbnailUrl?: string;
        fileSizeBytes?: number;
    }>;
    activity?: string;
    location?: string;
    taggedUserIds?: string[];
    privacy?: 'household' | 'members';
}
export interface UpdatePostBody {
    content?: string;
}
export interface CreateCommentBody {
    content: string;
}
export interface FeedAuthorResponse {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarEmoji: string | null;
}
export interface FeedPostResponse {
    id: string;
    author: FeedAuthorResponse;
    content: string | null;
    mediaType: string;
    media: FeedMediaResponse[];
    likeCount: number;
    commentCount: number;
    isLikedByMe: boolean;
    isPinned: boolean;
    activity: string | null;
    location: string | null;
    taggedUsers: Array<{
        id: string;
        displayName: string;
        avatarUrl: string | null;
    }>;
    privacy: string;
    createdAt: string;
    updatedAt: string;
}
export interface PaginatedFeedResponse {
    posts: FeedPostResponse[];
    nextCursor: string | null;
    hasMore: boolean;
}
export interface FeedCommentResponse {
    id: string;
    author: FeedAuthorResponse;
    content: string;
    createdAt: string;
    updatedAt: string;
}
export interface PaginatedCommentsResponse {
    comments: FeedCommentResponse[];
    nextCursor: string | null;
    hasMore: boolean;
}
export interface FeedMediaResponse {
    id: string;
    mediaUrl: string;
    mediaType: string;
    thumbnailUrl: string | null;
    fileSizeBytes: number | null;
}
//# sourceMappingURL=types.d.ts.map
import { create } from 'zustand';
import { feedApi } from '../api/feed';

export const useFeedStore = create((set, get) => ({
  posts: [],
  cursor: null,
  hasMore: true,
  loading: false,
  refreshing: false,
  error: null,

  fetchFeed: async (since) => {
    set({ loading: true, error: null });
    try {
      const data = await feedApi.list({ limit: 20, since });
      set({
        posts: data.posts,
        cursor: data.nextCursor,
        hasMore: data.hasMore,
        loading: false,
      });
    } catch (e) {
      set({ loading: false, error: e?.message || 'Failed to load feed' });
    }
  },

  fetchMore: async () => {
    const { cursor, hasMore, loading } = get();
    if (!hasMore || loading) return;
    set({ loading: true });
    try {
      const data = await feedApi.list({ cursor: cursor || undefined, limit: 20 });
      set((state) => ({
        posts: [...state.posts, ...data.posts],
        cursor: data.nextCursor,
        hasMore: data.hasMore,
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  prependPost: (post) => {
    set((state) => {
      // Deduplicate — post already present (socket + creator both deliver it)
      if (state.posts.some((p) => p.id === post.id)) return state;
      return { posts: [post, ...state.posts] };
    });
  },

  removePost: (postId) => {
    set((state) => ({ posts: state.posts.filter((p) => p.id !== postId) }));
  },

  incrementCommentCount: (postId) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p,
      ),
    }));
  },

  toggleLike: async (postId) => {
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLikedByMe: !p.isLikedByMe,
              likeCount: p.isLikedByMe ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p,
      ),
    }));
    // Persist to server; revert on failure
    try {
      const current = useFeedStore.getState().posts.find((p) => p.id === postId);
      if (current?.isLikedByMe) {
        await feedApi.like(postId);
      } else {
        await feedApi.unlike(postId);
      }
    } catch {
      // Revert optimistic update
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLikedByMe: !p.isLikedByMe,
                likeCount: p.isLikedByMe ? p.likeCount - 1 : p.likeCount + 1,
              }
            : p,
        ),
      }));
    }
  },

  refresh: async () => {
    set({ refreshing: true });
    try {
      const data = await feedApi.list({ limit: 20 });
      set({
        posts: data.posts,
        cursor: data.nextCursor,
        hasMore: data.hasMore,
        refreshing: false,
      });
    } catch {
      set({ refreshing: false });
    }
  },
}));

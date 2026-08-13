import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  StatusBar,
} from 'react-native';
import PostCard from '../shared/components/PostCard';
import { feedApi } from '../shared/api/feed';
import { useAuthStore } from '../shared/store/authStore';
/* ── Helpers ────────────────────────────────────────────────────────────── */

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
const AVATAR_TONES = ['#C4A574', '#8FA88A', '#7A93A8', '#A888A0', '#D4A017'];
function avatarTone(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}
function elapsed(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function PostDetailScreen({ navigation, route }) {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const user = useAuthStore((s) => s.user);
  const inputRef = useRef(null);

  /* ── Fetch post + comments on mount ──────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [postData, commentsData] = await Promise.all([
          feedApi.getById(postId),
          feedApi.getComments(postId, {
            limit: 50,
          }),
        ]);
        if (cancelled) return;
        setPost(postData);
        setComments(commentsData.comments);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || 'Failed to load post');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  /* ── Handlers ────────────────────────────────────────────────────────── */

  const handleLike = useCallback((_postId, _liked) => {
    // no-op — we are already on the detail page
  }, []);
  const handleOpen = useCallback(() => {
    // no-op — already viewing the full post
  }, []);
  const handleAddComment = useCallback(async () => {
    const text = commentText.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      const newComment = await feedApi.addComment(postId, text);
      setComments((prev) => [newComment, ...prev]);
      setCommentText('');
      Keyboard.dismiss();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Could not add comment');
    } finally {
      setSubmitting(false);
    }
  }, [commentText, postId]);

  /* ── Loading / Error states ───────────────────────────────────────────── */

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{
              top: 10,
              bottom: 10,
              left: 10,
              right: 10,
            }}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBrand}>
            ROOTAROO<Text style={styles.topBrandDot}>.</Text>
          </Text>
          <Text style={styles.topRight}>Feed Detail</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4A017" />
        </View>
      </SafeAreaView>
    );
  }
  if (error || !post) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{
              top: 10,
              bottom: 10,
              left: 10,
              right: 10,
            }}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBrand}>
            ROOTAROO<Text style={styles.topBrandDot}>.</Text>
          </Text>
          <Text style={styles.topRight}>Feed Detail</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Post not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Main render ──────────────────────────────────────────────────────── */

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBrand}>
          ROOTAROO<Text style={styles.topBrandDot}>.</Text>
        </Text>
        <Text style={styles.topRight}>Feed Detail</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.flex}>
          {/* Scrollable area: PostCard + comments */}
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Post card — using existing shared component */}
            <PostCard
              post={post}
              onLike={handleLike}
              onOpen={handleOpen}
              canDelete={post.author.id === user?.id}
              onOptions={(_postId) => {
                Alert.alert('Post', undefined, [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await feedApi.delete(post.id);
                        navigation.goBack();
                      } catch {
                        Alert.alert('Error', 'Could not delete post');
                      }
                    },
                  },
                ]);
              }}
            />

            {/* Divider */}
            {/* <View style={styles.divider} /> */}

            {/* Comments section header */}
            <View style={styles.commentsSection}>
              <Text style={styles.commentsHeader}>
                Comments{comments.length > 0 ? ` (${comments.length})` : ''}
              </Text>
            </View>

            {/* Comments list */}
            {comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsText}>No comments yet. Be the first!</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentRow}>
                  {/* Author initials avatar */}
                  <View
                    style={[
                      styles.commentAvatar,
                      {
                        backgroundColor: avatarTone(comment.author.id),
                      },
                    ]}
                  >
                    <Text style={styles.commentAvatarText}>
                      {getInitials(comment.author.displayName)}
                    </Text>
                  </View>

                  {/* Comment body */}
                  <View style={styles.commentContent}>
                    <Text style={styles.commentAuthor} numberOfLines={1}>
                      {comment.author.displayName}
                    </Text>
                    <Text style={styles.commentBody}>{comment.content}</Text>
                  </View>
                  <Text style={styles.commentTime}>{elapsed(comment.createdAt)}</Text>
                </View>
              ))
            )}

            {/* Bottom spacer so content doesn't hide behind the input bar */}
            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Fixed comment input bar (pinned above keyboard) */}
          <View style={styles.inputBar}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              placeholderTextColor="rgba(13,13,26,0.35)"
              multiline={false}
              returnKeyType="send"
              onSubmitEditing={handleAddComment}
              editable={!submitting}
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!commentText.trim() || submitting}
              activeOpacity={0.7}
              style={styles.postButton}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.postButtonText,
                    !commentText.trim() && styles.postButtonTextDisabled,
                  ]}
                >
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  /* ── Top bar ─────────────────────────────────────── */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13,13,26,0.08)',
  },
  backArrow: {
    fontSize: 20,
    color: '#0D0D1A',
    lineHeight: 24,
    width: 30,
  },
  topBrand: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D0D1A',
    letterSpacing: 1.5,
  },
  topBrandDot: {
    color: '#D4A017',
  },
  topRight: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(13,13,26,0.45)',
    width: 80,
    textAlign: 'right',
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F2EB',
  },
  errorText: {
    color: '#0D0D1A',
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.5,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  /* ── Divider ─────────────────────────────────────── */
  divider: {
    height: 1,
    backgroundColor: 'rgba(13,13,26,0.08)',
    marginHorizontal: 22,
    marginTop: 4,
  },
  /* ── Comments section header ─────────────────────── */
  commentsSection: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 10,
  },
  commentsHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D0D1A',
    letterSpacing: 0.3,
  },
  /* ── Empty state ─────────────────────────────────── */
  emptyComments: {
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 14,
    color: 'rgba(13,13,26,0.4)',
  },
  /* ── Individual comment row ──────────────────────── */
  commentRow: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingVertical: 10,
    gap: 10,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'white',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D0D1A',
  },
  commentBody: {
    fontSize: 14,
    color: '#0D0D1A',
    lineHeight: 20,
    marginTop: 2,
  },
  commentTime: {
    fontSize: 11,
    color: 'rgba(13,13,26,0.38)',
    marginTop: 4,
  },
  /* ── Bottom input bar ────────────────────────────── */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(13,13,26,0.08)',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F2EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0D0D1A',
  },
  postButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#D4A017',
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postButtonTextDisabled: {
    opacity: 0.4,
  },
  bottomSpacer: {
    height: 24,
  },
});

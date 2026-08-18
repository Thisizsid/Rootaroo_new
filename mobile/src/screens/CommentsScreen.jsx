import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import { feedApi } from '../shared/api/feed';
import { colors, withAlpha } from '../shared/theme';
import { KeyboardAvoider } from '../shared/components/KeyboardAware';
const INK = colors.ink;
const MUTED = colors.textMuted;
const CANVAS = colors.canvas;
const GOLD = colors.gold;
const GLYPH_BG = colors.borderCool;
const GLYPH_FG = colors.inkMuted;
const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const BACK_SVG =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none">' +
  `<path d="M15 5l-7 7 7 7" stroke="${colors.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>` +
  '</svg>';
const SEND_SVG =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none">' +
  `<path d="M4 12l16-7-6 16-2-7-8-2z" fill="${colors.surface}"></path>` +
  '</svg>';
const DOTS_SVG =
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="${colors.textSecondary}">` +
  '<circle cx="5" cy="12" r="1.7"></circle>' +
  '<circle cx="12" cy="12" r="1.7"></circle>' +
  '<circle cx="19" cy="12" r="1.7"></circle>' +
  '</svg>';
function initialsOf(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
export default function CommentsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const postId = route.params?.postId;
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [menuComment, setMenuComment] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const load = useCallback(async () => {
    if (!postId) {
      setLoading(false);
      return;
    }
    try {
      const res = await feedApi.getComments(postId, {
        limit: 30,
      });
      setComments(res.comments);
      setNextCursor(res.nextCursor);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Could not load comments');
    } finally {
      setLoading(false);
    }
  }, [postId]);
  useEffect(() => {
    load();
  }, [load]);
  const loadMore = useCallback(async () => {
    if (!postId || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await feedApi.getComments(postId, {
        cursor: nextCursor,
        limit: 30,
      });
      setComments((prev) => [...prev, ...res.comments]);
      setNextCursor(res.nextCursor);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [postId, nextCursor, loadingMore]);
  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || !postId || sending) return;
    setSending(true);
    try {
      const created = await feedApi.addComment(postId, text, replyingTo?.id);
      if (replyingTo) {
        // Nest under the root comment of the thread
        const rootId = replyingTo.parentId || replyingTo.id;
        setComments((prev) =>
          prev.map((c) =>
            c.id === rootId
              ? {
                  ...c,
                  replies: [...c.replies, created],
                }
              : c,
          ),
        );
        setReplyingTo(null);
      } else {
        setComments((prev) => [created, ...prev]);
      }
      setInput('');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Could not post comment');
    } finally {
      setSending(false);
    }
  }, [input, postId, sending, replyingTo]);
  const handleReact = useCallback(
    async (comment, emoji) => {
      // Optimistic toggle
      const apply = (list) =>
        list.map((c) => {
          if (c.id === comment.id) {
            const has = c.myReaction === emoji;
            const reactions = has
              ? c.reactions
                  .map((r) =>
                    r.emoji === emoji
                      ? {
                          ...r,
                          count: r.count - 1,
                          reactedByMe: false,
                        }
                      : r,
                  )
                  .filter((r) => r.count > 0)
              : c.myReaction
                ? c.reactions
                    .map((r) =>
                      r.emoji === c.myReaction
                        ? {
                            ...r,
                            count: r.count - 1,
                            reactedByMe: false,
                          }
                        : r.emoji === emoji
                          ? {
                              ...r,
                              count: r.count + 1,
                              reactedByMe: true,
                            }
                          : r,
                    )
                    .filter((r) => r.count > 0)
                : [
                    ...c.reactions,
                    {
                      emoji,
                      count: 1,
                      reactedByMe: true,
                    },
                  ];
            return {
              ...c,
              myReaction: has ? null : emoji,
              reactionCount: Math.max(0, c.reactionCount + (has ? -1 : 1)),
              reactions,
            };
          }
          return {
            ...c,
            replies: apply(c.replies),
          };
        });
      setComments((prev) => apply(prev));
      try {
        await feedApi.toggleCommentReaction(comment.id, emoji);
      } catch (e) {
        Alert.alert('Error', e?.response?.data?.message || e?.message || 'Could not react');
        load(); // revert from server
      }
    },
    [load],
  );
  const handleDelete = useCallback(async (comment) => {
    setMenuComment(null);
    Alert.alert('Delete comment?', 'This will remove the comment and all its replies.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await feedApi.deleteComment(comment.id);
            if (comment.parentId) {
              const rootId = comment.parentId;
              setComments((prev) =>
                prev.map((c) =>
                  c.id === rootId
                    ? {
                        ...c,
                        replies: c.replies.filter((r) => r.id !== comment.id),
                      }
                    : c,
                ),
              );
            } else {
              setComments((prev) => prev.filter((c) => c.id !== comment.id));
            }
          } catch (e) {
            Alert.alert('Error', e?.response?.data?.message || e?.message || 'Could not delete');
          }
        },
      },
    ]);
  }, []);
  const openMenu = useCallback((comment, x, y) => {
    setMenuComment(comment);
    setMenuAnchor({
      x,
      y,
    });
  }, []);
  const closeMenu = useCallback(() => {
    setMenuComment(null);
    setMenuAnchor(null);
  }, []);
  const canDelete = (c) => c.isAuthor || c.isPostOwner;
  const renderComment = (c, depth) => {
    const name = c.author?.displayName || 'Member';
    const isReply = depth > 0;
    return (
      <View key={c.id} style={[styles.commentRow, isReply && styles.replyRow]}>
        {isReply && <View style={styles.threadLine} />}
        <View style={styles.avatar}>
          {c.author?.avatarUrl ? (
            <Image
              source={{
                uri: c.author.avatarUrl,
              }}
              style={styles.avatarImg}
            />
          ) : c.author?.avatarEmoji ? (
            <Text
              style={{
                fontSize: 16,
              }}
            >
              {c.author.avatarEmoji}
            </Text>
          ) : (
            <Text style={styles.avatarText}>{initialsOf(name)}</Text>
          )}
        </View>
        <View style={styles.commentBody}>
          <View style={styles.nameTimeRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {c.isAuthor && <Text style={styles.badge}>You</Text>}
            <Text style={styles.time}>{timeAgo(c.createdAt)}</Text>
            {canDelete(c) && (
              <TouchableOpacity
                style={styles.dotsBtn}
                activeOpacity={0.6}
                hitSlop={{
                  top: 8,
                  bottom: 8,
                  left: 8,
                  right: 8,
                }}
                onPress={() => {
                  // approximate anchor: use fixed offset
                  openMenu(c, 0, 0);
                }}
              >
                <SvgXml xml={DOTS_SVG} width={18} height={18} />
              </TouchableOpacity>
            )}
          </View>
          {isReply && c.parentId && <Text style={styles.replyToText}>↳ reply</Text>}
          <Text style={styles.text}>{c.content}</Text>

          {/* Actions: react + reply */}
          <View style={styles.commentActions}>
            <TouchableOpacity
              style={styles.actionChip}
              activeOpacity={0.7}
              onPress={() => handleReact(c, '👍')}
            >
              <Text
                style={[styles.actionChipText, c.myReaction === '👍' && styles.actionChipActive]}
              >
                👍 {c.reactions.find((r) => r.emoji === '👍')?.count || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionChip}
              activeOpacity={0.7}
              onPress={() => {
                setInput('');
                setReplyingTo(c);
              }}
            >
              <Text style={styles.actionChipText}>↩ Reply</Text>
            </TouchableOpacity>
            {c.reactions.length > 0 && (
              <Text style={styles.reactionSummary}>
                {c.reactions
                  .slice(0, 3)
                  .map((r) => r.emoji)
                  .join(' ')}{' '}
                {c.reactionCount}
              </Text>
            )}
          </View>

          {/* Replies (tree chain) */}
          {c.replies && c.replies.length > 0 && (
            <View style={styles.repliesBlock}>
              {c.replies.map((r) => renderComment(r, depth + 1))}
            </View>
          )}
        </View>
      </View>
    );
  };
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Status row */}

      {/* Title row */}
      <View style={styles.titleRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          hitSlop={{
            top: 12,
            bottom: 12,
            left: 12,
            right: 12,
          }}
        >
          <SvgXml xml={BACK_SVG} width={20} height={20} />
        </TouchableOpacity>
        <Text style={styles.title}>Comments</Text>
        {replyingTo && (
          <TouchableOpacity
            style={styles.cancelReply}
            activeOpacity={0.7}
            onPress={() => setReplyingTo(null)}
          >
            <Text style={styles.cancelReplyText}>Cancel reply</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Comments list + input bar move together as the keyboard opens */}
      <KeyboardAvoider style={styles.avoider}>
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 60) {
              loadMore();
            }
          }}
          scrollEventThrottle={200}
        >
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={GOLD} />
            </View>
          ) : comments.length === 0 ? (
            <Text style={styles.empty}>No comments yet — be the first.</Text>
          ) : (
            comments.map((c) => renderComment(c, 0))
          )}
          {loadingMore && (
            <View
              style={{
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <ActivityIndicator size="small" color={GOLD} />
            </View>
          )}
        </ScrollView>

        {/* Reply banner */}
        {replyingTo && (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText} numberOfLines={1}>
              Replying to {replyingTo.author?.displayName || 'comment'}
            </Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)} hitSlop={8}>
              <Text style={styles.replyBannerX}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBarWrap,
            {
              paddingBottom: Math.max(insets.bottom, 14),
            },
          ]}
        >
          <View style={styles.inputRow}>
            <View style={styles.inputPill}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={
                  replyingTo
                    ? `Reply to ${replyingTo.author?.displayName || 'member'}…`
                    : 'Add a comment…'
                }
                placeholderTextColor={MUTED}
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={handleSubmit}
                underlineColorAndroid="transparent"
                editable={!sending}
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit}
              style={[
                styles.sendBtn,
                (sending || !input.trim()) && {
                  opacity: 0.55,
                },
              ]}
              disabled={sending || !input.trim()}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.onAccent} />
              ) : (
                <SvgXml xml={SEND_SVG} width={18} height={18} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoider>

      {/* Delete menu dropdown */}
      <Modal visible={!!menuComment} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.menuBackdrop} onPress={closeMenu}>
          {menuComment && menuAnchor && (
            <View
              style={[
                styles.menuDropdown,
                {
                  top: 120,
                  right: 24,
                },
              ]}
            >
              {canDelete(menuComment) && (
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.6}
                  onPress={() => handleDelete(menuComment)}
                >
                  <Text style={styles.menuItemIcon}>🗑</Text>
                  <Text style={styles.menuItemTextDanger}>Delete comment</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CANVAS,
  },
  statusRow: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTime: {
    fontSize: 14,
    fontWeight: '600',
    color: INK,
    fontFamily: 'Inter_600SemiBold',
  },
  titleRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: INK,
    fontFamily: 'PlusJakartaSans_700Bold',
    flex: 1,
  },
  cancelReply: {
    backgroundColor: GLYPH_BG,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelReplyText: {
    fontSize: 12,
    fontWeight: '600',
    color: GLYPH_FG,
    fontFamily: 'Inter_600SemiBold',
  },
  avoider: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  loading: {
    padding: 24,
    alignItems: 'center',
  },
  empty: {
    paddingTop: 24,
    textAlign: 'center',
    fontSize: 14,
    color: MUTED,
    fontFamily: 'Inter_400Regular',
  },
  commentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  replyRow: {
    marginLeft: 22,
    marginTop: 2,
  },
  threadLine: {
    position: 'absolute',
    left: -14,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.borderCool,
    borderRadius: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: GLYPH_BG,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 9999,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: GLYPH_FG,
    fontFamily: 'Inter_600SemiBold',
  },
  commentBody: {
    flex: 1,
  },
  nameTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: INK,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    flexShrink: 1,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: GOLD,
    backgroundColor: withAlpha(colors.legacyGold, 0.14),
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
    fontFamily: 'Inter_700Bold',
  },
  time: {
    fontSize: 12,
    color: MUTED,
    fontFamily: 'Inter_400Regular',
  },
  dotsBtn: {
    marginLeft: 'auto',
    padding: 2,
  },
  replyToText: {
    fontSize: 11,
    color: MUTED,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  text: {
    fontSize: 14,
    lineHeight: 19.6,
    color: INK,
    fontFamily: 'Inter_400Regular',
    marginTop: 3,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  actionChip: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: GLYPH_FG,
    fontFamily: 'Inter_600SemiBold',
  },
  actionChipActive: {
    color: GOLD,
  },
  reactionSummary: {
    fontSize: 12,
    color: MUTED,
    fontFamily: 'Inter_400Regular',
  },
  repliesBlock: {
    marginTop: 12,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.canvasSoft,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  replyBannerText: {
    flex: 1,
    fontSize: 12,
    color: GLYPH_FG,
    fontFamily: 'Inter_500Medium',
  },
  replyBannerX: {
    fontSize: 16,
    color: MUTED,
    paddingLeft: 8,
  },
  inputBarWrap: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.canvasElevated,
    paddingTop: 14,
    paddingHorizontal: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputPill: {
    flex: 1,
    height: 46,
    borderRadius: 9999,
    backgroundColor: CANVAS,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  input: {
    fontSize: 14,
    color: INK,
    fontFamily: 'Inter_400Regular',
    padding: 0,
    margin: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: withAlpha(colors.shadow, 0.25),
  },
  menuDropdown: {
    position: 'absolute',
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  menuItemIcon: {
    fontSize: 16,
  },
  menuItemTextDanger: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dangerVivid,
    fontFamily: 'Inter_500Medium',
  },
});

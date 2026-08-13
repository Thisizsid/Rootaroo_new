import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SvgXml } from 'react-native-svg';
import { feedApi } from '../shared/api/feed';
import { householdApi } from '../shared/api/household';
import { useFeedStore } from '../shared/store/feedStore';
import { useAuthStore } from '../shared/store/authStore';
import { loadSignupProgress } from '../shared/store/signupProgress';
import apiClient from '../shared/api/client';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import OfflineBanner from '../components/OfflineBanner';
import ConfirmSheet from '../components/ConfirmSheet';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Import the family cover photo as placeholder for featured image
const FAMILY_COVER = require('../../assets/images/family-cover.png');
const PENCIL_SVG =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none">' +
  '<path d="M12 20h9" stroke="#2A2E33" stroke-width="2" stroke-linecap="round"></path>' +
  '<path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#2A2E33" stroke-width="2" stroke-linejoin="round"></path>' +
  '</svg>';
const DOTS_SVG =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="#2A2E33">' +
  '<circle cx="5" cy="12" r="1.7"></circle>' +
  '<circle cx="12" cy="12" r="1.7"></circle>' +
  '<circle cx="19" cy="12" r="1.7"></circle>' +
  '</svg>';
const TAG_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none">' +
  '<path d="M20.6 13.4L13.4 20.6a2 2 0 01-2.8 0L4 14V4h10l6.6 6.6a2 2 0 010 2.8z" stroke="#8A6A0A" stroke-width="1.8" stroke-linejoin="round"></path>' +
  '<circle cx="8.5" cy="8.5" r="1.3" fill="#8A6A0A"></circle>' +
  '</svg>';
const CHAT_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none">' +
  '<path d="M21 12a8 8 0 01-8 8H4l2-3a8 8 0 1115-5z" stroke="#757A80" stroke-width="1.8" stroke-linejoin="round"></path>' +
  '</svg>';
const PHOTO_SVG =
  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none">' +
  '<rect x="3" y="5" width="18" height="14" rx="2" stroke="#45566B" stroke-width="1.5"></rect>' +
  '<circle cx="8.5" cy="10" r="1.5" stroke="#45566B" stroke-width="1.5"></circle>' +
  '<path d="M21 16l-5-5-9 9" stroke="#45566B" stroke-width="1.5"></path>' +
  '</svg>';
const getServerBase = () => {
  const base = apiClient.defaults.baseURL || '';
  return base.replace(/\/api\/v1\/?$/, '');
};
function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { posts, loading, refreshing, error, fetchFeed, refresh, toggleLike, removePost } =
    useFeedStore();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const householdId = useAuthStore((s) => s.householdId);
  const [activeMediaIndex, setActiveMediaIndex] = useState({});
  const [menuPost, setMenuPost] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const dotsRefs = useRef({});

  // Family home card: cover photo + household message
  const [familyCover, setFamilyCover] = useState(null);
  const [householdName, setHouseholdName] = useState('');
  // Delete-post confirmation sheet
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  useEffect(() => {
    fetchFeed();
    loadSignupProgress()
      .then((p) => {
        if (p?.draft?.familyPhoto) setFamilyCover(p.draft.familyPhoto);
      })
      .catch(() => {});
    if (householdId) {
      householdApi
        .getHousehold(householdId)
        .then((hh) => setHouseholdName(hh.name))
        .catch(() => {});
    }
  }, [fetchFeed, householdId]);
  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);
  const handleDeletePost = useCallback(
    async (postId) => {
      try {
        await feedApi.delete(postId);
        removePost(postId);
      } catch (e) {
        alert('Could not delete post: ' + (e?.message || 'Try again'));
      }
    },
    [removePost],
  );
  const handleReportPost = useCallback((postId) => {
    alert('Post reported. Thank you for keeping the community safe.');
  }, []);
  const openPostMenu = useCallback((post, x, y) => {
    setMenuPost(post);
    setMenuAnchor({
      x,
      y,
    });
  }, []);
  const closePostMenu = useCallback(() => {
    setMenuPost(null);
    setMenuAnchor(null);
  }, []);
  const handleMenuAction = useCallback(
    (action) => {
      if (!menuPost) return;
      setMenuPost(null);
      if (action === 'report' || menuPost.author?.id !== currentUserId) {
        handleReportPost(menuPost.id);
      } else {
        setConfirmDeleteId(menuPost.id);
      }
    },
    [menuPost, currentUserId, handleReportPost],
  );
  const avatarSrc = (post) => {
    const url = post.author?.avatarUrl;
    if (!url) return null;
    return {
      uri: url.startsWith('http') ? url : `${getServerBase()}${url}`,
    };
  };
  const mediaSrc = (post) => {
    const list = post.media || [];
    const url = list[0]?.mediaUrl;
    if (!url) return null;
    return {
      uri: url.startsWith('http') ? url : `${getServerBase()}${url}`,
    };
  };
  const initialsOf = (name) =>
    (name || '?')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  const renderPost = ({ item }) => {
    const avatar = avatarSrc(item);
    const media = mediaSrc(item);
    const authorName = item.author?.displayName || 'Unknown';
    const isOwner = item.author?.id === currentUserId;
    const commentPreview =
      item.commentCount > 0
        ? `View ${item.commentCount} comment${item.commentCount > 1 ? 's' : ''}`
        : 'No comments yet';
    const feelings = (item.content || '').match(/Feeling: ([^\n]+)/)?.[1]?.trim();
    const bodyText = (item.content || '').replace(/^\s*Feeling: [^\n]*\n*/m, '').trim();
    const mediaIndex = activeMediaIndex[item.id] ?? 0;
    return (
      <View style={styles.postCard}>
        {/* Post header: avatar, name, time, feeling pill, menu */}
        <View style={styles.postHeader}>
          <View style={styles.avatarCircle}>
            {avatar ? (
              <Image source={avatar} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initialsOf(authorName)}</Text>
            )}
          </View>
          <View style={styles.postHeaderInfo}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.postTime}>
              {timeAgo(item.createdAt)}
              {item.activity ? ` · ${item.activity}` : ''}
            </Text>
          </View>
          {feelings ? (
            <View style={styles.headerFeeling}>
              <Text style={styles.headerFeelingText} numberOfLines={1}>
                {feelings}
              </Text>
            </View>
          ) : null}
          {/* 3-dot menu — anchored dropdown */}
          <TouchableOpacity
            style={styles.dotsButton}
            activeOpacity={0.6}
            ref={(ref) => {
              if (ref && !dotsRefs.current[item.id]) dotsRefs.current[item.id] = ref;
            }}
            onPress={() => {
              const ref = dotsRefs.current[item.id];
              if (ref && ref.measureInWindow) {
                ref.measureInWindow((x, y, w, h) => openPostMenu(item, x + w - 8, y + h + 6));
              } else {
                openPostMenu(item, SCREEN_WIDTH - 60, 200);
              }
            }}
            hitSlop={{
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
            }}
          >
            <SvgXml xml={DOTS_SVG} width={20} height={20} />
          </TouchableOpacity>
        </View>

        {/* Media slider (multiple images) — only when the post actually has media */}
        {media ? (
          <View style={styles.mediaWrap}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveMediaIndex((prev) => ({
                  ...prev,
                  [item.id]: idx,
                }));
              }}
            >
              {item.media.map((m, i) => (
                <Image
                  key={m.id || i}
                  source={{
                    uri: m.mediaUrl.startsWith('http')
                      ? m.mediaUrl
                      : `${getServerBase()}${m.mediaUrl}`,
                  }}
                  style={[
                    styles.postImage,
                    {
                      width: SCREEN_WIDTH,
                    },
                  ]}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {item.media.length > 1 && (
              <View style={styles.pageDots}>
                {item.media.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.pageDot, i === mediaIndex && styles.pageDotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : null}

        {/* Post content */}
        <View style={styles.postBody}>
          <Text style={styles.postText}>{bodyText || item.content || ''}</Text>

          {/* Tag row — below content, with icon */}
          {item.taggedUsers && item.taggedUsers.length > 0 && (
            <View style={styles.infoRow}>
              <SvgXml xml={TAG_SVG} width={16} height={16} />
              <Text style={styles.infoRowText} numberOfLines={1}>
                {item.taggedUsers.map((t) => t.displayName).join(', ')}
              </Text>
            </View>
          )}

          {/* Like + comment in one row — only on text posts (no media) */}
          {!media && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.likeButton}
                activeOpacity={0.7}
                onPress={() => toggleLike(item.id)}
              >
                <Text style={[styles.likeIcon, item.isLikedByMe && styles.likeIconActive]}>
                  {item.isLikedByMe ? '♥' : '♡'}
                </Text>
                <Text style={[styles.likeText, item.isLikedByMe && styles.likeTextActive]}>
                  {item.likeCount} {item.likeCount === 1 ? 'like' : 'likes'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.likeButton}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('Comments', {
                    postId: item.id,
                  })
                }
              >
                <SvgXml xml={CHAT_SVG} width={17} height={17} />
                <Text style={styles.likeText}>
                  {item.commentCount} {item.commentCount === 1 ? 'comment' : 'comments'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Comment count row — with icon, same row as tags */}
          {media && (
            <View style={styles.infoRow}>
              <SvgXml xml={CHAT_SVG} width={16} height={16} />
              <Text style={styles.infoRowText}>
                {item.commentCount} comment{item.commentCount !== 1 ? 's' : ''} · {commentPreview}
              </Text>
            </View>
          )}

          {/* Comment input — tap opens Comments screen */}
          <TouchableOpacity
            style={styles.commentInputBar}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('Comments', {
                postId: item.id,
              })
            }
          >
            <View style={styles.commentInputAvatar}>
              <Text style={styles.commentInputAvatarText}>✎</Text>
            </View>
            <Text style={styles.commentInputPlaceholder}>Add a comment…</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <StatusBar style="dark" />
      {/* Title bar: Feed + pencil icon */}
      <View style={styles.titleBar}>
        <Text style={styles.title}>Feed</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CreatePost')}
          hitSlop={{
            top: 8,
            bottom: 8,
            left: 8,
            right: 8,
          }}
        >
          <SvgXml xml={PENCIL_SVG} width={22} height={22} />
        </TouchableOpacity>
      </View>

      {loading && posts.length === 0 ? (
        <LoadingSkeleton variant="feed" />
      ) : error && posts.length === 0 ? (
        <ErrorState onRetry={fetchFeed} onGoHome={() => navigation.navigate('KnowsDashboard')} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.postsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B88A3E" />
          }
        >
          <View style={styles.bannerWrap}>
            <OfflineBanner onRetry={onRefresh} />
          </View>

          {/* Family home card — cover photo + household message */}
          <View style={styles.featuredMemory}>
            <Image
              source={
                familyCover
                  ? {
                      uri: familyCover,
                    }
                  : FAMILY_COVER
              }
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(27,30,36,0)', 'rgba(27,30,36,0.68)']}
              style={styles.featuredOverlay}
            />
            <View style={styles.featuredTextBlock}>
              <View style={styles.featuredEyebrow}>
                <Text style={styles.featuredEyebrowText}>OUR FAMILY HOME</Text>
              </View>
              <Text style={styles.featuredTitle} numberOfLines={1}>
                {householdName || 'Our Family'}
              </Text>
              <Text style={styles.featuredSub} numberOfLines={2}>
                {posts.length > 0
                  ? `${posts.length} new moment${posts.length > 1 ? 's' : ''} waiting — today's little moments become tomorrow's favorite memories. ✨`
                  : "Today's little moments become tomorrow's favorite memories. ✨"}
              </Text>
            </View>
          </View>

          {posts.length === 0 ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon={<SvgXml xml={PHOTO_SVG} width={28} height={28} />}
                title="Nothing here yet"
                subtitle="Share a photo or update with your household to get the feed going."
                actionLabel="Create a post"
                onAction={() => navigation.navigate('CreatePost')}
              />
            </View>
          ) : (
            posts.map((post) => (
              <View key={post.id}>
                {renderPost({
                  item: post,
                })}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* 3-dot anchored dropdown menu — appears right under the button */}
      <Modal visible={!!menuPost} transparent animationType="fade" onRequestClose={closePostMenu}>
        <Pressable style={styles.menuBackdrop} onPress={closePostMenu}>
          {menuAnchor && (
            <View
              style={[
                styles.menuDropdown,
                {
                  top: menuAnchor.y,
                  right: SCREEN_WIDTH - menuAnchor.x,
                },
              ]}
            >
              <View style={styles.menuArrow} />
              <View style={styles.menuHeaderCompact}>
                <Text style={styles.menuPostAuthor} numberOfLines={1}>
                  {menuPost?.author?.displayName || ''}
                </Text>
                <Text style={styles.menuPostTime}>
                  {menuPost ? timeAgo(menuPost.createdAt) : ''}
                </Text>
              </View>
              {menuPost && menuPost.author?.id === currentUserId ? (
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.6}
                  onPress={() => handleMenuAction('delete')}
                >
                  <Text style={styles.menuItemIcon}>🗑</Text>
                  <Text style={styles.menuItemText}>Delete post</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.6}
                  onPress={() => handleMenuAction('report')}
                >
                  <Text style={styles.menuItemIcon}>🚩</Text>
                  <Text style={styles.menuItemText}>Report post</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Pressable>
      </Modal>

      {/* Delete post confirmation sheet */}
      <ConfirmSheet
        visible={!!confirmDeleteId}
        title="Delete this post?"
        subtitle="This removes it for everyone in the household. This can't be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          const id = confirmDeleteId;
          setConfirmDeleteId(null);
          if (id) handleDeletePost(id);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F1EC',
    marginTop: 10,
    marginBottom: 90,
    paddingHorizontal: 4,
  },
  header: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    fontFamily: 'Inter_600SemiBold',
  },
  titleBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: '#F3F1EC',
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2A2E33',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  postsContainer: {
    paddingTop: 4,
    paddingBottom: 120,
  },
  bannerWrap: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 8,
  },
  emptyWrap: {
    height: 340,
  },
  featuredMemory: {
    position: 'relative',
    height: 210,
    marginHorizontal: 12,
    marginBottom: 22,
    borderRadius: 20,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredTextBlock: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
  },
  featuredEyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(27,30,36,0.45)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  featuredEyebrowText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F0DCC8',
    letterSpacing: 1.2,
    fontFamily: 'Inter_600SemiBold',
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    marginBottom: 6,
    textShadowColor: 'rgba(27,30,36,0.4)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 4,
  },
  featuredSub: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    opacity: 0.92,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(27,30,36,0.25)',
  },
  menuDropdown: {
    position: 'absolute',
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#1B1E24',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  menuArrow: {
    position: 'absolute',
    top: -6,
    right: 14,
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    transform: [
      {
        rotate: '45deg',
      },
    ],
    borderTopLeftRadius: 3,
  },
  menuHeaderCompact: {
    paddingVertical: 8,
    marginBottom: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(13,13,26,0.1)',
  },
  menuPostAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    fontFamily: 'Inter_600SemiBold',
  },
  menuPostTime: {
    fontSize: 12,
    color: '#A6ABB0',
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
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
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2E33',
    fontFamily: 'Inter_500Medium',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 12,
    marginTop: 2,
  },
  likeIcon: {
    fontSize: 17,
    color: '#757A80',
  },
  likeIconActive: {
    color: '#B88A3E',
  },
  likeText: {
    fontSize: 13,
    color: '#757A80',
    fontFamily: 'Inter_500Medium',
  },
  likeTextActive: {
    color: '#B88A3E',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E1E6EA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#45566B',
    fontFamily: 'Inter_600SemiBold',
  },
  postHeaderInfo: {
    flex: 1,
  },
  dotsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerFeeling: {
    backgroundColor: 'rgba(212,160,23,0.14)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 110,
    marginRight: 4,
  },
  headerFeelingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A6A0A',
    fontFamily: 'Inter_600SemiBold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  infoRowText: {
    fontSize: 13,
    color: '#757A80',
    fontFamily: 'Inter_400Regular',
    flexShrink: 1,
  },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F3F1EC',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  commentInputAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E1E6EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInputAvatarText: {
    fontSize: 12,
    color: '#45566B',
  },
  commentInputPlaceholder: {
    fontSize: 13,
    color: '#A6ABB0',
    fontFamily: 'Inter_400Regular',
  },
  mediaWrap: {
    position: 'relative',
  },
  pageDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  pageDotActive: {
    backgroundColor: '#FFFFFF',
    width: 16,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: '#A6ABB0',
    fontFamily: 'Inter_400Regular',
  },
  postImage: {
    width: '100%',
    height: 440,
  },
  postBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  postText: {
    fontSize: 15,
    color: '#2A2E33',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    paddingRight: 40,
    marginBottom: 14,
  },
  taggedText: {
    fontSize: 13,
    color: '#8A6A0A',
    fontFamily: 'Inter_500Medium',
    marginBottom: 14,
  },
  loading: {
    padding: 24,
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E33',
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#757A80',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#B88A3E',
    borderRadius: 9999,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#B88A3E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});

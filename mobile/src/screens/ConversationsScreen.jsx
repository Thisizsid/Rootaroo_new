import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Image,
} from 'react-native';
import { showAlert } from '../shared/services/themedAlert';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { chatApi } from '../shared/api/chat';
import { householdApi } from '../shared/api/household';
import { useAuthStore } from '../shared/store/authStore';
import { colors, withAlpha, fonts, spacing, radius } from '../shared/theme';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import OfflineBanner from '../components/OfflineBanner';
import { KeyboardAvoider } from '../shared/components/KeyboardAware';
import { useTabBarDockHeight } from '../shared/hooks/useTabBarDockHeight';
const AVATAR_COLORS = [colors.gold, colors.avatarTan, colors.avatarLilac, colors.avatarSage, colors.avatarSky];
const PAD = 24;
function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
function formatTimestamp(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHrs < 24) return `${diffHrs}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
function getOtherParticipant(conversation, currentUserId) {
  return conversation.participants.find((p) => p.id !== currentUserId);
}

/* ──────────────────────────────────────────── */
/*  Header icons — hand-drawn, no icon library   */
/* ──────────────────────────────────────────── */

/* New message: a pencil, tip lower-left / cap upper-right */
function ComposeIcon({ size = 18, color = colors.ink }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M9 3h6a1.5 1.5 0 0 1 1.5 1.5v10L12 21l-4.5-6.5v-10A1.5 1.5 0 0 1 9 3Z"
        fill={color}
        opacity={0.5}
        transform="rotate(-45 12 12)"
      />
      <Path
        d="M9 3h6v9a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 12Z"
        fill={color}
        transform="rotate(-45 12 12)"
      />
    </Svg>
  );
}

/* Household chat: two overlapping people */
function PeopleIcon({ size = 20, color = colors.ink }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="8" cy="8" r="3" fill={color} opacity={0.45} />
      <Path d="M2,20 A6,6 0 0 1 14,20 Z" fill={color} opacity={0.45} />
      <Circle cx="15.5" cy="9" r="3.5" fill={color} />
      <Path d="M8.5,21 A7,7 0 0 1 22.5,21 Z" fill={color} />
    </Svg>
  );
}

/* ──────────────────────────────────────────── */
/*  Conversation Item                           */
/* ──────────────────────────────────────────── */

function ConversationItem({ item, currentUserId, onPress }) {
  const isEveryone = item.type === 'household';
  const isGroup = item.type === 'group' || isEveryone;
  const otherUser = isGroup ? null : getOtherParticipant(item, currentUserId);
  const displayName = isGroup
    ? item.name || (isEveryone ? 'Everyone' : 'Group Chat')
    : otherUser?.displayName || 'Unknown';
  const avatarUrl = isGroup ? null : otherUser?.avatarUrl;
  const lastMessage =
    item.lastMessage?.content ||
    (item.lastMessage?.type === 'voice'
      ? '🎤 Voice message'
      : item.lastMessage?.type === 'image'
        ? '📷 Photo'
        : null);
  const timestamp = item.lastMessage?.createdAt || item.createdAt;
  const avatarColor =
    AVATAR_COLORS[
      Math.abs((isGroup ? item.name || 'G' : displayName).charCodeAt(0)) % AVATAR_COLORS.length
    ];
  return (
    <TouchableOpacity style={styles.conversationItem} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: avatarColor,
          },
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{
              uri: avatarUrl,
            }}
            style={styles.avatarImage}
          />
        ) : (
          <Text style={styles.avatarText}>
            {isEveryone ? '👥' : isGroup ? '#' : initials(displayName)}
          </Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.timestamp}>{formatTimestamp(timestamp)}</Text>
        </View>
        {isGroup && item.lastMessage?.senderName && (
          <Text style={styles.senderPrefix} numberOfLines={1}>
            {item.lastMessage.senderName}
          </Text>
        )}
        <Text style={styles.lastMessage} numberOfLines={2}>
          {lastMessage || 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/* ──────────────────────────────────────────── */
/*  Main Screen                                 */
/* ──────────────────────────────────────────── */

export default function ConversationsScreen() {
  const insets = useSafeAreaInsets();
  const dockHeight = useTabBarDockHeight();
  const nav = useNavigation();
  const user = useAuthStore((s) => s.user);
  const householdId = useAuthStore((s) => s.householdId);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [members, setMembers] = useState([]);
  const [householdName, setHouseholdName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const currentUserId = user?.id || '';
  const otherMembers = members.filter((m) => m.userId !== currentUserId);

  /* ── Fetch conversations ── */

  const fetchConversations = useCallback(async () => {
    try {
      setFetchError(false);
      const data = await chatApi.listConversations();
      setConversations(data);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations]),
  );

  // Fetch household members on mount for the member strip
  useEffect(() => {
    if (!householdId) return;
    householdApi
      .getMembers(householdId)
      .then(setMembers)
      .catch(() => {});
  }, [householdId]);

  // Fetch household name (used as the auto-name for the Everyone conversation)
  useEffect(() => {
    if (!householdId) return;
    householdApi
      .getHousehold(householdId)
      .then((h) => setHouseholdName(h.name))
      .catch(() => {});
  }, [householdId]);
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  /* ── DM: tap member to create immediately ── */

  const handleDMSelect = useCallback(
    async (member) => {
      setCreating(true);
      try {
        const conv = await chatApi.createConversation({
          type: 'dm',
          participantIds: [member.userId],
        });
        setModalVisible(false);
        nav.navigate('ChatScreen', {
          conversationId: conv.id,
          title: member.displayName,
          type: 'dm',
          participantCount: 2,
        });
      } catch (e) {
        showAlert(
          'Error',
          e?.response?.data?.error || e?.message || 'Could not create conversation',
        );
      } finally {
        setCreating(false);
      }
    },
    [nav],
  );

  /* ── Everyone: one persistent household-wide conversation ── */

  const handleMessageEveryone = useCallback(async () => {
    const existing = conversations.find((c) => c.type === 'household');
    if (existing) {
      setModalVisible(false);
      nav.navigate('ChatScreen', {
        conversationId: existing.id,
        title: existing.name || 'Everyone',
        type: 'household',
        participantCount: existing.participants?.length || otherMembers.length + 1,
      });
      return;
    }
    if (otherMembers.length === 0) return;
    setCreating(true);
    try {
      const conv = await chatApi.createConversation({
        type: 'household',
        participantIds: otherMembers.map((m) => m.userId),
        name: householdName || 'Everyone',
      });
      setModalVisible(false);
      nav.navigate('ChatScreen', {
        conversationId: conv.id,
        title: conv.name || 'Everyone',
        type: 'household',
        participantCount: otherMembers.length + 1,
      });
    } catch (e) {
      showAlert('Error', e?.response?.data?.error || e?.message || 'Could not open Everyone chat');
    } finally {
      setCreating(false);
    }
  }, [conversations, otherMembers, householdName, nav]);

  /* ── Navigate to conversation ── */

  const handleConversationPress = useCallback(
    (conv) => {
      const otherUser = getOtherParticipant(conv, currentUserId);
      nav.navigate('ChatScreen', {
        conversationId: conv.id,
        title: conv.name || otherUser?.displayName || 'Chat',
        type: conv.type,
        participantCount: conv.participants?.length || 2,
      });
    },
    [currentUserId, nav],
  );

  /* ── Render helpers ── */

  const renderConversationItem = useCallback(
    ({ item }) => (
      <ConversationItem
        item={item}
        currentUserId={currentUserId}
        onPress={() => handleConversationPress(item)}
      />
    ),
    [currentUserId, handleConversationPress],
  );
  const keyExtractor = useCallback((item) => item.id, []);

  /* ── Empty state ── */

  const ListEmptyComponent = fetchError ? (
    <ErrorState onRetry={handleRefresh} onGoHome={() => {}} />
  ) : (
    <EmptyState
      icon={
        <View style={styles.chatIcon}>
          <Text style={styles.chatIconText}>💬</Text>
        </View>
      }
      title="No conversations yet."
      subtitle="Start a new chat!"
    />
  );

  /* ── Loading state ── */

  if (loading) {
    return <LoadingSkeleton variant="list" />;
  }
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.canvas} />

      <View style={styles.bannerWrap}>
        <OfflineBanner onRetry={handleRefresh} />
      </View>

      {/* ── Brand bar ── */}

      {/* ── Messages header ── */}
      <View style={styles.msgsHeader}>
        <Text style={styles.msgsTitle}>Messages</Text>
        <View style={styles.msgsActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => {
              setSearchQuery('');
              setModalVisible(true);
            }}
          >
            <ComposeIcon size={18} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleMessageEveryone}
            disabled={creating || otherMembers.length === 0}
            activeOpacity={0.7}
          >
            {creating ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : (
              <PeopleIcon size={20} color={colors.ink} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Members grid ── */}
      <View style={styles.memberGrid}>
        {otherMembers.map((m) => (
            <TouchableOpacity
              key={m.userId}
              style={styles.memberItem}
              onPress={async () => {
                try {
                  // Check if DM already exists
                  const existing = conversations.find(
                    (c) => c.type === 'dm' && c.participants.some((p) => p.id === m.userId),
                  );
                  if (existing) {
                    nav.navigate('ChatScreen', {
                      conversationId: existing.id,
                      title: m.displayName,
                      type: 'dm',
                      participantCount: 2,
                    });
                    return;
                  }
                  const conv = await chatApi.createConversation({
                    type: 'dm',
                    participantIds: [m.userId],
                  });
                  nav.navigate('ChatScreen', {
                    conversationId: conv.id,
                    title: m.displayName,
                    type: 'dm',
                    participantCount: 2,
                  });
                } catch {
                  showAlert('Error', 'Could not start conversation');
                }
              }}
            >
              <View style={styles.memberAvatarWrap}>
                {m.avatarUrl ? (
                  <Image
                    source={{
                      uri: m.avatarUrl,
                    }}
                    style={styles.memberAvatar}
                  />
                ) : (
                  <View style={styles.memberAvatarInit}>
                    <Text style={styles.memberAvatarText}>{initials(m.displayName)}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.memberName} numberOfLines={1}>
                {m.displayName.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
      </View>

      {/* ── Conversations list ── */}
      <FlatList
        style={styles.listFlex}
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={
          conversations.length === 0
            ? styles.listEmptyContent
            : [styles.listContent, { paddingBottom: dockHeight + 16 }]
        }
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* ── New Message Sheet ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
        navigationBarTranslucent
      >
        <KeyboardAvoider style={[searchModal.container, { paddingTop: insets.top }]}>
          <StatusBar barStyle="light-content" backgroundColor={colors.surface} />

          {/* Sheet header */}
          <View style={searchModal.sheetHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              hitSlop={10}
              style={searchModal.closeBtn}
              activeOpacity={0.7}
            >
              <Text style={searchModal.closeIcon}>{'✕'}</Text>
            </TouchableOpacity>
            <Text style={searchModal.sheetTitle}>New Message</Text>
            <View style={searchModal.closeBtn} />
          </View>

          {/* Search */}
          <View style={searchModal.searchBar}>
            <Text style={searchModal.searchIcon}>{'⌕'}</Text>
            <TextInput
              style={searchModal.searchInput}
              placeholder="Search household members"
              placeholderTextColor={colors.textFaint}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          {/* Member list */}
          {otherMembers.length === 0 ? (
            <View style={searchModal.emptyBox}>
              <Text style={searchModal.emptyText}>No other members in your household.</Text>
            </View>
          ) : (
            <FlatList
              data={otherMembers.filter((m) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return m.displayName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
              })}
              keyExtractor={(item) => item.userId}
              style={searchModal.list}
              contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
              ListHeaderComponent={
                <Text style={searchModal.sectionLabel}>HOUSEHOLD MEMBERS</Text>
              }
              renderItem={({ item: member }) => (
                <TouchableOpacity
                  style={searchModal.mRow}
                  onPress={() => handleDMSelect(member)}
                  activeOpacity={0.7}
                >
                  <View style={searchModal.mRowLeft}>
                    <View
                      style={[
                        searchModal.mAv,
                        {
                          backgroundColor:
                            AVATAR_COLORS[
                              Math.abs(
                                (member.displayName || member.email || '?').charCodeAt(0),
                              ) % AVATAR_COLORS.length
                            ],
                        },
                      ]}
                    >
                      <Text style={searchModal.mAvText}>
                        {initials(member.displayName || member.email || '??')}
                      </Text>
                    </View>
                    <View style={searchModal.mNameCol}>
                      <Text style={searchModal.mName}>{member.displayName || member.email}</Text>
                      <Text style={searchModal.mRole}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}

          {/* Creating overlay */}
          {creating && (
            <View style={searchModal.creatingOverlay}>
              <ActivityIndicator size="small" color={colors.gold} />
              <Text style={searchModal.creatingText}>Creating...</Text>
            </View>
          )}
        </KeyboardAvoider>
      </Modal>
    </View>
  );
}

/* ──────────────────────────────────────────── */
/*  Styles                                       */
/* ──────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerWrap: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 8,
  },
  /* Header */
  memberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
    maxHeight: 160,
  },
  memberItem: {
    alignItems: 'center',
    gap: 5,
    width: 64,
  },
  memberAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberAvatarInit: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onAccent,
  },
  memberName: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    maxWidth: 52,
    textAlign: 'center',
  },
  brandBar: {
    paddingHorizontal: PAD,
    height: 48,
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  msgsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingVertical: 10,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  msgsTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  msgsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  brand: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 2.5,
  },
  brandDot: {
    color: colors.gold,
  },
  /* List */
  listFlex: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: PAD,
  },
  /* Conversation item */
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onAccent,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textFaint,
  },
  senderPrefix: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gold,
    marginBottom: 1,
  },
  lastMessage: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  chatIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.cardLg,
    backgroundColor: colors.skeleton,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  chatIconText: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textFaint,
    textAlign: 'center',
  },
});

/* ──────────────────────────────────────────── */
/*  Modal styles                                 */
/* ──────────────────────────────────────────── */

const searchModal = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: colors.textSecondary,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 42,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 16,
    color: colors.textFaint,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: colors.textFaint,
    letterSpacing: 0.6,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: {
    flex: 1,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textFaint,
  },
  mRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  mRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mAv: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mAvText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
  mNameCol: {},
  mName: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
  },
  mRole: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textFaint,
    marginTop: 2,
  },
  creatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: withAlpha(colors.white, 0.8),
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  creatingText: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.gold,
  },
});

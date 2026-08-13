import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { chatApi } from '../shared/api/chat';
import { householdApi } from '../shared/api/household';
import { useAuthStore } from '../shared/store/authStore';
import { colors } from '../shared/theme';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import OfflineBanner from '../components/OfflineBanner';
const AVATAR_COLORS = [colors.gold, '#D4B896', '#C4A0D4', '#A8C8A0', '#A0B8D4'];
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
/*  Conversation Item                           */
/* ──────────────────────────────────────────── */

function ConversationItem({ item, currentUserId, onPress }) {
  const isGroup = item.type === 'group';
  const otherUser = isGroup ? null : getOtherParticipant(item, currentUserId);
  const displayName = isGroup ? item.name || 'Group Chat' : otherUser?.displayName || 'Unknown';
  const avatarUrl = isGroup ? null : otherUser?.avatarUrl;
  const lastMessage = item.lastMessage?.content || null;
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
          <Text style={styles.avatarText}>{isGroup ? '#' : initials(displayName)}</Text>
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
  const nav = useNavigation();
  const user = useAuthStore((s) => s.user);
  const householdId = useAuthStore((s) => s.householdId);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [members, setMembers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('search');
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const currentUserId = user?.id || '';

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
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);
  const handleNewConversation = useCallback(() => {
    setSearchQuery('');
    setGroupName('');
    setSelectedMembers(new Set());
    setModalMode('new');
    setModalVisible(true);
  }, []);

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
        Alert.alert(
          'Error',
          e?.response?.data?.error || e?.message || 'Could not create conversation',
        );
      } finally {
        setCreating(false);
      }
    },
    [nav],
  );

  /* ── Group: multi-select + name + create ── */

  const handleToggleMember = useCallback((userId) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);
  const handleCreateGroup = useCallback(async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    if (selectedMembers.size === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }
    setCreating(true);
    try {
      const conv = await chatApi.createConversation({
        type: 'group',
        participantIds: Array.from(selectedMembers),
        name: groupName.trim(),
      });
      setModalVisible(false);
      nav.navigate('ChatScreen', {
        conversationId: conv.id,
        title: groupName.trim(),
        type: 'group',
        participantCount: selectedMembers.size + 1,
      });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'Could not create group');
    } finally {
      setCreating(false);
    }
  }, [groupName, selectedMembers, nav]);

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

  /* ── Filter out self from member list ── */

  const otherMembers = members.filter((m) => m.userId !== currentUserId);

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
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />

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
              setModalMode('search');
              setModalVisible(true);
            }}
          >
            <View style={styles.searchIcon}>
              <View style={styles.searchGlass} />
              <View style={styles.searchHandle} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleNewConversation}
            activeOpacity={0.7}
          >
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Members grid ── */}
      <View style={styles.memberGrid}>
        {members
          .filter((m) => m.userId !== currentUserId)
          .map((m) => (
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
                  Alert.alert('Error', 'Could not start conversation');
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
          conversations.length === 0 ? styles.listEmptyContent : styles.listContent
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

      {/* ── Unified Search Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={searchModal.container}>
          {/* <StatusBar barStyle="dark-content" backgroundColor="#ffffff" /> */}
          {/* ConversationsScreen header */}
          {/* <View style={styles.brandBar}>
            <Text style={styles.brand}>ROOTAROO<Text style={styles.brandDot}>.</Text></Text>
           </View> */}
          <View style={styles.msgsHeader}>
            <Text style={styles.msgsTitle}>Messages</Text>
            <View style={styles.msgsActions}>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
                <View style={styles.searchIcon}>
                  <View style={styles.searchGlass} />
                  <View style={styles.searchHandle} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
                <Text style={styles.plusIcon}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search + back */}
          <View style={searchModal.searchBar}>
            <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={10}>
              <Text style={searchModal.backArrow}>←</Text>
            </TouchableOpacity>
            <TextInput
              style={searchModal.searchInput}
              placeholder="Search members..."
              placeholderTextColor={colors.textFaint}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          {/* Groups section (only in 'new' mode) */}
          {modalMode === 'new' && (
            <View style={searchModal.groupsSection}>
              <View style={searchModal.groupsRow}>
                <View style={searchModal.groupsLeft}>
                  <Text style={searchModal.groupsIcon}>👥</Text>

                  <Text style={searchModal.newGroupLabel}>New Group</Text>
                </View>
                <TouchableOpacity
                  style={[
                    searchModal.createBtn,
                    (selectedMembers.size === 0 || !groupName.trim() || creating) &&
                      searchModal.createBtnDisabled,
                  ]}
                  onPress={handleCreateGroup}
                  disabled={selectedMembers.size === 0 || !groupName.trim() || creating}
                  activeOpacity={0.7}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#1A1A2A" />
                  ) : (
                    <Text style={searchModal.createText}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
              {modalMode === 'new' && (
                <TextInput
                  style={searchModal.groupNameInput}
                  placeholder="Group name"
                  placeholderTextColor={colors.textFaint}
                  value={groupName}
                  onChangeText={setGroupName}
                />
              )}
            </View>
          )}

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
              renderItem={({ item: member }) => {
                const checked = selectedMembers.has(member.userId);
                return (
                  <TouchableOpacity
                    key={member.userId}
                    style={[searchModal.mRow, checked && searchModal.mRowSel]}
                    onPress={
                      modalMode === 'search'
                        ? () => handleDMSelect(member)
                        : () => handleToggleMember(member.userId)
                    }
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
                    {modalMode === 'new' && (
                      <View style={[searchModal.cb, checked && searchModal.cbOn]}>
                        {checked && <Text style={searchModal.cbCheck}>{'✓'}</Text>}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Creating overlay */}
          {creating && (
            <View style={searchModal.creatingOverlay}>
              <ActivityIndicator size="small" color={colors.gold} />
              <Text style={searchModal.creatingText}>Creating...</Text>
            </View>
          )}
        </View>
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
    marginTop: 20,
    marginBottom: 90,
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
    color: colors.surface,
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
    shadowColor: colors.inkDeep,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchGlass: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
  },
  searchHandle: {
    position: 'absolute',
    bottom: 2,
    right: 0,
    width: 7,
    height: 1.5,
    backgroundColor: colors.textMuted,
    transform: [
      {
        rotate: '45deg',
      },
    ],
  },
  plusIcon: {
    fontSize: 22,
    color: colors.gold,
    fontWeight: '600',
    lineHeight: 24,
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
    color: colors.surface,
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
    borderRadius: 18,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backArrow: {
    fontSize: 22,
    color: colors.ink,
    lineHeight: 24,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.canvas,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.ink,
  },
  groupsSection: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupsIcon: {
    fontSize: 20,
  },
  groupsLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  newGroupLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  groupNameInput: {
    marginTop: 10,
    height: 40,
    backgroundColor: colors.canvas,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.ink,
  },
  createBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.gold,
    minWidth: 70,
    alignItems: 'center',
  },
  createBtnDisabled: {
    opacity: 0.35,
  },
  createText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
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
    fontWeight: '500',
    color: colors.textFaint,
  },
  mRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(27,30,36,0.04)',
    backgroundColor: colors.surface,
  },
  mRowSel: {
    backgroundColor: 'rgba(184,138,62,0.06)',
  },
  mRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontWeight: '700',
    color: colors.ink,
  },
  mNameCol: {},
  mName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  mRole: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textFaint,
    marginTop: 2,
  },
  cb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(27,30,36,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cbOn: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  cbCheck: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.surface,
  },
  creatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  creatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold,
  },
});

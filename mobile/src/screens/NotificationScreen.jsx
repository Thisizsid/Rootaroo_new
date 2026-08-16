import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationApi } from '../shared/api/notification';
import { colors, fonts } from '../shared/theme';
// ── Helpers ────────────────────────────────────────────────────────────────

function timeOfDay(ts) {
  const d = new Date(ts);
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${mins}${ampm}`;
}
function dateLabel(ts) {
  const d = new Date(ts);
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.floor((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

// Mention-like notification types (mapped; the model has no explicit mention flag)
const MENTION_TYPES = ['task_assigned', 'chat_message', 'new_post', 'check_in'];
const TABS = [
  {
    key: 'ALL',
    label: 'All',
  },
  {
    key: 'UNREAD',
    label: 'Unread',
  },
  {
    key: 'MENTIONS',
    label: 'Mentions',
  },
];
function groupByDate(items) {
  const map = new Map();
  for (const item of items) {
    const key = dateLabel(item.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return Array.from(map.entries()).map(([title, data]) => ({
    title,
    data,
  }));
}

// ── Component ──────────────────────────────────────────────────────────────

export default function NotificationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const load = useCallback(
    async (reset = false) => {
      try {
        const data = await notificationApi.getHistory({
          cursor: reset ? undefined : cursor || undefined,
          limit: 30,
        });
        setAll((prev) => (reset ? data.notifications : [...prev, ...data.notifications]));
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch {
        Alert.alert('Error', 'Could not load notifications');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [cursor],
  );
  useEffect(() => {
    load(true);
  }, []);
  const handleRefresh = () => {
    setRefreshing(true);
    setCursor(null);
    load(true);
  };
  const handleMarkRead = useCallback(async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setAll((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                isRead: true,
              }
            : n,
        ),
      );
    } catch {
      /* silent */
    }
  }, []);

  // ── Filter + group ─────────────────────────────────────────────────────
  const filtered = (() => {
    if (activeTab === 'UNREAD') return all.filter((n) => !n.isRead);
    if (activeTab === 'MENTIONS') return all.filter((n) => MENTION_TYPES.includes(n.type));
    return all;
  })();
  const sections = groupByDate(filtered);

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View
        style={[
          styles.root,
          {
            paddingTop: insets.top,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.gold}
          style={{
            flex: 1,
          }}
        />
      </View>
    );
  }

  // ── Render helpers ─────────────────────────────────────────────────────
  const renderSectionHeader = ({ section }) => (
    <Text style={styles.dateLabel}>{section.title}</Text>
  );
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => handleMarkRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, !item.isRead && styles.rowTitleUnread]} numberOfLines={1}>
          {item.title}
        </Text>
        {item.body ? (
          <Text style={styles.rowBody} numberOfLines={2}>
            {item.body}
          </Text>
        ) : null}
      </View>

      <View style={styles.rowAside}>
        <Text style={styles.rowTime}>{timeOfDay(item.createdAt)}</Text>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />

      {/* ── Header (SCREEN 41): centered title ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{
            top: 8,
            bottom: 8,
            left: 8,
            right: 8,
          }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* ── Filter tabs (SCREEN 41) ── */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.6}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── List (SCREEN 41 flat rows) ── */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
        onEndReached={() => {
          if (hasMore) load();
        }}
        onEndReachedThreshold={0.3}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptySub}>No notifications here.</Text>
          </View>
        }
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  // Header (SCREEN 41)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  headerSpacer: {
    width: 32,
  },
  // Filter tabs (SCREEN 41)
  tabRow: {
    flexDirection: 'row',
    gap: 26,
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  tabTextActive: {
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
  },
  // Date group label (SCREEN 41)
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.textMuted,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 6,
  },
  // Notification row (SCREEN 41)
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  rowTitleUnread: {
    fontWeight: '700',
  },
  rowBody: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowAside: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  rowTime: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginBottom: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  // Empty
  listContent: {
    paddingBottom: 60,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: fonts.display,
    color: colors.ink,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { expenseApi } from '../shared/api/expense';
import { colors, withAlpha } from '../shared/theme';
import Avatar from '../components/Avatar';
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
export default function ExpenseSettlementScreen({ navigation }) {
  const [settlements, setSettlements] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fetchSettlements = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await expenseApi.listSettlements({
        limit: 20,
      });
      setSettlements(data.settlements);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to load settlements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  const fetchMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await expenseApi.listSettlements({
        cursor: cursor || undefined,
        limit: 20,
      });
      setSettlements((prev) => [...prev, ...data.settlements]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loadingMore]);
  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);
  const renderItem = useCallback(
    ({ item }) => (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userGroup}>
            <View style={styles.userChip}>
              <Avatar
                url={item.fromUser?.avatarUrl}
                emoji={item.fromUser?.avatarEmoji}
                name={item.fromUser?.displayName || 'Unknown'}
                id={item.fromUserId}
                size={18}
              />
              <Text style={styles.userName}>{item.fromUser?.displayName || 'Unknown'}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.userChip}>
              <Avatar
                url={item.toUser?.avatarUrl}
                emoji={item.toUser?.avatarEmoji}
                name={item.toUser?.displayName || 'Unknown'}
                id={item.toUserId}
                size={18}
              />
              <Text style={styles.userName}>{item.toUser?.displayName || 'Unknown'}</Text>
            </View>
          </View>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {formatDate(item.settledAt)} at {formatTime(item.settledAt)}
          </Text>
        </View>
      </View>
    ),
    [],
  );
  const renderEmpty = useCallback(
    () => (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🤝</Text>
        <Text style={styles.emptyTitle}>No settlements yet</Text>
        <Text style={styles.emptySubtitle}>Record a settlement from the ledger to see it here</Text>
      </View>
    ),
    [],
  );
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return <ActivityIndicator size="small" color={colors.legacyGold} style={styles.footerLoader} />;
  }, [loadingMore]);
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.surface} />
        <ActivityIndicator size="large" color={colors.legacyGold} style={styles.loading} />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settlements</Text>
        </View>
        {settlements.length > 0 && <Text style={styles.countText}>{settlements.length}</Text>}
      </View>

      <FlatList
        data={settlements}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => fetchSettlements(true)}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={fetchMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(colors.legacyNavy, 0.08),
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    paddingVertical: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.legacyGold,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.legacyNavySoft,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: withAlpha(colors.legacyNavy, 0.35),
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: withAlpha(colors.legacyNavy, 0.06),
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(colors.legacyNavy, 0.04),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.legacyNavySoft,
  },
  arrow: {
    fontSize: 14,
    color: withAlpha(colors.legacyNavy, 0.25),
    fontWeight: '300',
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.legacyGold,
    marginLeft: 8,
  },
  cardFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: withAlpha(colors.legacyNavy, 0.05),
  },
  dateText: {
    fontSize: 11,
    color: withAlpha(colors.legacyNavy, 0.35),
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.legacyNavySoft,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: withAlpha(colors.legacyNavy, 0.5),
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
  },
});

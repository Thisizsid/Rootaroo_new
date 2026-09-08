import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { expenseApi } from '../shared/api/expense';
import { colors, fonts, radius, withAlpha } from '../shared/theme';
import Avatar from '../components/Avatar';

function formatMoneyCompact(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function MemberBalanceDetailScreen({ route, navigation }) {
  const { userId, displayName, avatarUrl, avatarEmoji } = route.params;
  const insets = useSafeAreaInsets();
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await expenseApi.getPairwiseBalances(userId);
      setBalances(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load balances');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const renderItem = useCallback(({ item }) => {
    // amount > 0 => target member (displayName) owes item; amount < 0 => item owes target member
    const owesThem = item.amount > 0;
    const owedByThem = item.amount < 0;
    return (
      <View style={styles.row}>
        <Avatar
          url={item.avatarUrl}
          emoji={item.avatarEmoji}
          name={item.displayName}
          id={item.userId}
          size={40}
        />
        <Text style={styles.name}>{item.displayName}</Text>
        <View style={styles.right}>
          <Text
            style={[
              styles.amount,
              { color: owesThem ? colors.danger : colors.success },
            ]}
          >
            {formatMoneyCompact(Math.abs(item.amount))}
          </Text>
          <Text style={styles.status}>
            {owesThem
              ? `${displayName} owes`
              : owedByThem
                ? `owes ${displayName}`
                : 'settled'}
          </Text>
        </View>
      </View>
    );
  }, [displayName]);

  const renderEmpty = useCallback(
    () => (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>💰</Text>
        <Text style={styles.emptyTitle}>All settled up</Text>
        <Text style={styles.emptySubtitle}>
          {displayName} has no outstanding balance with anyone
        </Text>
      </View>
    ),
    [displayName],
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.surface} />
        <ActivityIndicator size="large" color={colors.legacyGold} style={styles.loading} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Avatar
          url={avatarUrl}
          emoji={avatarEmoji}
          name={displayName}
          id={userId}
          size={28}
        />
        <Text style={styles.headerTitle}>{displayName}</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={balances}
        renderItem={renderItem}
        keyExtractor={(item) => item.userId}
        refreshing={refreshing}
        onRefresh={() => load(true)}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(colors.legacyNavy, 0.08),
  },
  backButton: {
    paddingVertical: 4,
    marginRight: 2,
  },
  backText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: colors.legacyGold,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  errorBanner: {
    backgroundColor: withAlpha(colors.dangerBright, 0.08),
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    color: colors.dangerBright,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: withAlpha(colors.legacyNavy, 0.06),
    gap: 12,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontFamily: fonts.display,
    fontSize: 17,
    fontWeight: '800',
  },
  status: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
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
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

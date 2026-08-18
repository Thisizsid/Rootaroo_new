import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { householdApi } from '../shared/api/household';
import { useAuthStore } from '../shared/store/authStore';
import { useExpenseStore } from '../shared/store/expenseStore';
import { colors, fonts, withAlpha } from '../shared/theme';
import Avatar from '../components/Avatar';
function formatMoney(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
function formatMoneyCompact(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
const CATEGORY_KEYWORDS = [
  ['grocery', 'Groceries'],
  ['market', 'Groceries'],
  ['dinner', 'Dining'],
  ['lunch', 'Dining'],
  ['restaurant', 'Dining'],
  ['coffee', 'Dining'],
  ['shopping', 'Shopping'],
  ['clothes', 'Shopping'],
  ['uber', 'Transport'],
  ['taxi', 'Transport'],
  ['gas', 'Transport'],
  ['fuel', 'Transport'],
  ['electric', 'Bills'],
  ['water', 'Bills'],
  ['internet', 'Bills'],
  ['bill', 'Bills'],
  ['pharmacy', 'Health'],
  ['medicine', 'Health'],
  ['doctor', 'Health'],
];
function deriveTopCategory(expenses) {
  const totals = {};
  for (const e of expenses) {
    const t = e.title.toLowerCase();
    let cat = 'Other';
    for (const [kw, name] of CATEGORY_KEYWORDS) {
      if (t.includes(kw)) {
        cat = name;
        break;
      }
    }
    totals[cat] = (totals[cat] || 0) + e.amount;
  }
  let best = null;
  for (const [name, total] of Object.entries(totals)) {
    if (!best || total > best.total)
      best = {
        name,
        total,
      };
  }
  return best;
}
export default function ExpenseListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const householdId = useAuthStore((s) => s.householdId);
  const {
    expenses,
    loading,
    refreshing,
    summary,
    settlements,
    fetchExpenses,
    refreshExpenses,
    fetchSummary,
    fetchSettlements,
  } = useExpenseStore();
  const [members, setMembers] = useState([]);
  useEffect(() => {
    fetchExpenses();
    fetchSummary();
    fetchSettlements();
    if (householdId)
      householdApi
        .getMembers(householdId)
        .then(setMembers)
        .catch(() => {});
  }, [fetchExpenses, fetchSummary, fetchSettlements, householdId]);
  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshExpenses(), fetchSummary(), fetchSettlements()]);
  }, [refreshExpenses, fetchSummary, fetchSettlements]);
  if (loading && expenses.length === 0) {
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
  const myBalance = summary?.netBalances.find((nb) => nb.userId === user?.id)?.netBalance ?? null;
  const owes = myBalance !== null && myBalance < 0;
  const owed = myBalance !== null && myBalance > 0;
  const balanceText =
    myBalance === null
      ? '$0.00'
      : myBalance < 0
        ? `−${formatMoney(Math.abs(myBalance))}`
        : `+${formatMoney(myBalance)}`;
  const balanceStatus = owes ? 'You owe' : owed ? 'You are owed' : 'All settled';
  const payerMost = summary?.netBalances.reduce(
    (a, b) => (b.paidTotal > a.paidTotal ? b : a),
    summary?.netBalances[0],
  );
  const mostPayerName =
    payerMost && payerMost.displayName && payerMost.displayName !== user?.name
      ? `${payerMost.displayName.split(' ')[0]} paid more`
      : null;
  const subText = [
    `${summary?.totalExpenses ?? 0} shared expense${(summary?.totalExpenses ?? 0) === 1 ? '' : 's'} this month`,
    mostPayerName,
  ]
    .filter(Boolean)
    .join(' · ');
  const topCategory = deriveTopCategory(expenses);
  const recentLedger = summary?.ledger?.[0];
  const recentSettlement = recentLedger
    ? {
        from: recentLedger.fromUserName,
        to: recentLedger.toUserName,
        amount: recentLedger.amount,
      }
    : settlements?.[0]
      ? {
          from: settlements[0].fromUser?.displayName || 'Someone',
          to: settlements[0].toUser?.displayName || 'Someone',
          amount: settlements[0].amount,
        }
      : null;
  const familyName = user?.name ? `${user.name.split(' ')[0]}'s Family` : 'Your Family';
  const avatarMembers = members.slice(0, 4);
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.canvas} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        {/* ── Header (SCREEN 22) ── */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Bills</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateExpense')}
            hitSlop={8}
            activeOpacity={0.6}
          >
            <Text style={styles.addLink}>Add expense</Text>
          </TouchableOpacity>
        </View>

        {/* ── Balance card (Visa-style dark card) ── */}
        <LinearGradient
          colors={[colors.canvasElevated, colors.canvas]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={styles.balanceCard}
        >
          <View style={styles.cardTop}>
            <View style={styles.chip}>
              <View style={styles.chipLine} />
              <View style={[styles.chipLine, styles.chipLineMid]} />
            </View>
            <View style={styles.avatarStack}>
              {avatarMembers.map((m) => (
                <Avatar
                  key={m.userId}
                  url={m.avatarUrl}
                  emoji={m.avatarEmoji}
                  name={m.displayName}
                  id={m.userId}
                  size={24}
                  style={styles.stackAvatar}
                />
              ))}
            </View>
          </View>
          <Text style={styles.familyLabel}>{familyName}</Text>
          <Text style={styles.balanceAmount}>{balanceText}</Text>
          <Text
            style={[
              styles.balanceStatus,
              {
                color: owes ? colors.rustDeep : owed ? colors.success : colors.textSecondary,
              },
            ]}
          >
            {balanceStatus}
          </Text>
          <Text style={styles.cardSub}>{subText}</Text>
        </LinearGradient>

        {/* ── Widgets ── */}
        <View style={styles.widgetRow}>
          <View style={styles.widget}>
            <Text style={styles.widgetLabel}>THIS MONTH</Text>
            <Text style={styles.widgetValue}>{formatMoneyCompact(summary?.totalAmount ?? 0)}</Text>
          </View>
          <View style={styles.widget}>
            <Text style={styles.widgetLabel}>TOP CATEGORY</Text>
            <Text style={styles.widgetValue}>{topCategory?.name ?? '—'}</Text>
            {topCategory ? (
              <Text style={styles.widgetSub}>{formatMoneyCompact(topCategory.total)}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.widget}
            onPress={() => navigation.navigate('ExpenseSettlements')}
            activeOpacity={0.7}
          >
            <Text style={styles.widgetLabel}>RECENT SETTLEMENT</Text>
            {recentSettlement ? (
              <>
                <Text style={styles.widgetValue}>
                  {recentSettlement.from} → {recentSettlement.to}
                </Text>
                <Text style={styles.widgetSub}>{formatMoneyCompact(recentSettlement.amount)}</Text>
              </>
            ) : (
              <Text style={styles.widgetValue}>—</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Family balance ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>FAMILY BALANCE</Text>
          {/* <TouchableOpacity onPress={() => navigation.navigate('ExpenseLedger')} hitSlop={8}>
            <Text style={styles.sectionLink}>Ledger ›</Text>
           </TouchableOpacity> */}
        </View>
        {(summary?.netBalances ?? []).map((nb) => {
          const pos = nb.netBalance > 0;
          const neg = nb.netBalance < 0;
          return (
            <View key={nb.userId} style={styles.peopleRow}>
              <Avatar
                url={nb.avatarUrl}
                emoji={nb.avatarEmoji}
                name={nb.displayName}
                id={nb.userId}
                size={40}
              />
              <Text style={styles.peopleName}>{nb.displayName}</Text>
              <View style={styles.peopleRight}>
                <Text
                  style={[
                    styles.peopleBalance,
                    {
                      color: neg ? colors.danger : pos ? colors.success : colors.ink,
                    },
                  ]}
                >
                  {pos ? '+' : neg ? '−' : ''}
                  {formatMoneyCompact(Math.abs(nb.netBalance))}
                </Text>
                <Text style={styles.peopleStatus}>
                  {neg ? 'owes' : pos ? 'gets back' : 'settled'}
                </Text>
              </View>
            </View>
          );
        })}

        {/* ── Recent expenses ── */}
        <Text style={[styles.sectionLabel, styles.sectionSpaced]}>RECENT EXPENSES</Text>
        {expenses.length === 0 ? (
          <Text style={styles.emptyText}>No expenses yet — add your first one above.</Text>
        ) : (
          expenses.slice(0, 6).map((e) => {
            const payer = e.payer?.displayName || 'You';
            const split =
              e.splitType === 'equal' ? `split among ${e.participants.length}` : 'custom split';
            return (
              <TouchableOpacity
                key={e.id}
                style={styles.expenseRow}
                onPress={() =>
                  navigation.navigate('ExpenseDetail', {
                    expenseId: e.id,
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.expenseTop}>
                  <Text style={styles.expenseTitle} numberOfLines={1}>
                    {e.title}
                  </Text>
                  <Text style={styles.expenseAmount}>{formatMoneyCompact(e.amount)}</Text>
                </View>
                <View style={styles.expenseBottom}>
                  <Text style={styles.expenseMeta} numberOfLines={1}>
                    {payer} · {split}
                  </Text>
                  <Text style={styles.expenseDate}>{formatShortDate(e.date)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* ── Insight card ── */}
        <LinearGradient
          colors={[colors.borderCool, colors.canvas]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={styles.insightCard}
        >
          <Text style={styles.insightText}>
            This month your family shared {summary?.totalExpenses ?? 0} expenses.
            {topCategory ? ` ${topCategory.name} were your biggest category.` : ''}
          </Text>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  // Header (SCREEN 22)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  screenTitle: {
    fontSize: 19,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  addLink: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.bodyMedium,
    color: colors.goldDeep,
  },
  // Balance card (SCREEN 22) — Visa-style dark card
  balanceCard: {
    borderRadius: 28,
    padding: 24,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 8,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.3),
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  chip: {
    width: 34,
    height: 24,
    borderRadius: 5,
    backgroundColor: colors.goldSoft,
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 5,
  },
  chipLine: {
    height: 1.5,
    borderRadius: 1,
    backgroundColor: withAlpha(colors.canvas, 0.35),
  },
  chipLineMid: {
    width: '70%',
  },
  familyLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.goldSoft,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  stackAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: colors.canvasElevated,
  },
  balanceAmount: {
    fontSize: 46,
    fontWeight: '800',
    fontFamily: fonts.display,
    color: colors.onAccent,
    letterSpacing: -0.02,
    marginBottom: 6,
  },
  balanceStatus: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  // Widgets (SCREEN 22)
  widgetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 26,
  },
  widget: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  widgetLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.3,
    color: colors.textMuted,
    marginBottom: 8,
  },
  widgetValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  widgetSub: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Sections (SCREEN 22)
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
  sectionSpaced: {
    marginTop: 26,
    marginBottom: 14,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.goldDeep,
  },
  // Family balance rows
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  peopleName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  peopleRight: {
    alignItems: 'flex-end',
  },
  peopleBalance: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.mono,
  },
  peopleStatus: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginTop: 3,
  },
  // Recent expense rows
  expenseRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  expenseTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  expenseTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: colors.ink,
    marginRight: 8,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.mono,
    color: colors.ink,
  },
  expenseBottom: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  expenseMeta: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginRight: 8,
  },
  expenseDate: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  // Empty
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    paddingVertical: 14,
  },
  // Insight card
  insightCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 22,
    marginBottom: 66,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.body,
    color: colors.brownDeep,
  },
});

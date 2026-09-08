import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../shared/services/themedAlert';
import { expenseApi } from '../shared/api/expense';
import { householdApi } from '../shared/api/household';
import { useAuthStore } from '../shared/store/authStore';
import { colors, fonts, withAlpha } from '../shared/theme';
import Avatar from '../components/Avatar';
import { KeyboardAvoider } from '../shared/components/KeyboardAware';

const GOLD = colors.goldGlow;

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ExpenseLedgerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const householdId = useAuthStore((s) => s.householdId);
  const [ledger, setLedger] = useState([]);
  const [membersById, setMembersById] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!householdId) return;
    householdApi
      .getMembers(householdId)
      .then((list) => {
        const map = {};
        for (const m of list) map[m.userId] = m;
        setMembersById(map);
      })
      .catch(() => {});
  }, [householdId]);

  // Settlement modal
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleFrom, setSettleFrom] = useState('');
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const loadLedger = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await expenseApi.getLedger();
      setLedger(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load ledger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    loadLedger();
  }, [loadLedger]);
  const handleSettle = useCallback(async () => {
    const amt = parseFloat(settleAmount);
    if (!settleFrom || !settleTo || isNaN(amt) || amt <= 0) {
      showAlert('Required', 'Select users and enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      const body = {
        fromUserId: settleFrom,
        toUserId: settleTo,
        amount: amt,
      };
      await expenseApi.recordSettlement(body);
      setShowSettleModal(false);
      showAlert('Settled', 'Settlement recorded successfully');
      loadLedger(true);
    } catch (e) {
      showAlert('Error', e?.response?.data?.message || 'Could not record settlement');
    } finally {
      setSaving(false);
    }
  }, [settleFrom, settleTo, settleAmount, loadLedger]);
  const handleQuickSettle = useCallback((entry) => {
    setSettleFrom(entry.fromUserId);
    setSettleTo(entry.toUserId);
    setSettleAmount(entry.amount.toString());
    setShowSettleModal(true);
  }, []);
  const handleOpenCustomSettle = useCallback(() => {
    const members = Array.from(new Set(ledger.flatMap((e) => [e.fromUserId, e.toUserId])));
    if (members.length > 0) {
      setSettleFrom(user?.id || members[0]);
      setSettleTo(members.find((m) => m !== (user?.id || members[0])) || members[1] || members[0]);
    }
    setSettleAmount('');
    setShowSettleModal(true);
  }, [ledger, user]);
  const renderItem = useCallback(
    ({ item }) => {
      const fromMember = membersById[item.fromUserId];
      const toMember = membersById[item.toUserId];
      return (
        <View style={styles.row}>
          <View style={styles.userBlock}>
            <Avatar
              url={fromMember?.avatarUrl}
              emoji={fromMember?.avatarEmoji}
              name={item.fromUserName}
              id={item.fromUserId}
              size={32}
            />
            <Text style={styles.userName} numberOfLines={1}>
              {item.fromUserName}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={colors.textOnDarkMuted} />
          <View style={styles.userBlock}>
            <Avatar
              url={toMember?.avatarUrl}
              emoji={toMember?.avatarEmoji}
              name={item.toUserName}
              id={item.toUserId}
              size={32}
            />
            <Text style={styles.userName} numberOfLines={1}>
              {item.toUserName}
            </Text>
          </View>
          <View style={styles.spacer} />
          <View style={styles.rowRight}>
            <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
            <TouchableOpacity onPress={() => handleQuickSettle(item)} activeOpacity={0.7}>
              <Text style={styles.settleLink}>Settle ›</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [handleQuickSettle, membersById],
  );
  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);
  const renderEmpty = useCallback(
    () => (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>💰</Text>
        <Text style={styles.emptyTitle}>All settled up</Text>
        <Text style={styles.emptySubtitle}>No outstanding balances between members</Text>
      </View>
    ),
    [],
  );
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.navyDeep} />
        <ActivityIndicator size="large" color={GOLD} style={styles.loading} />
      </View>
    );
  }
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navyDeep} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ledger</Text>
        </View>
        <TouchableOpacity onPress={handleOpenCustomSettle} activeOpacity={0.7}>
          <Text style={styles.customSettleText}>+ Settle</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {ledger.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {ledger.length} outstanding {ledger.length === 1 ? 'balance' : 'balances'}
          </Text>
        </View>
      )}

      <FlatList
        data={ledger}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.fromUserId}-${item.toUserId}-${index}`}
        refreshing={refreshing}
        onRefresh={() => loadLedger(true)}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={renderSeparator}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Settlement Modal */}
      <Modal
        visible={showSettleModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettleModal(false)}
        statusBarTranslucent
        navigationBarTranslucent
      >
        <KeyboardAvoider style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Settlement</Text>
              <TouchableOpacity onPress={() => setShowSettleModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.fieldLabel}>From</Text>
              <View style={styles.userRow}>
                {Array.from(new Set(ledger.flatMap((e) => [e.fromUserId, e.toUserId]))).map(
                  (memberId) => {
                    const member = ledger.find(
                      (e) => e.fromUserId === memberId || e.toUserId === memberId,
                    );
                    const name =
                      member?.fromUserId === memberId
                        ? member.fromUserName
                        : member?.toUserName || 'Unknown';
                    const active = settleFrom === memberId;
                    return (
                      <TouchableOpacity
                        key={memberId}
                        style={[styles.memberOption, active && styles.memberOptionActive]}
                        onPress={() => setSettleFrom(memberId)}
                        activeOpacity={0.8}
                      >
                        <Avatar
                          url={membersById[memberId]?.avatarUrl}
                          emoji={membersById[memberId]?.avatarEmoji}
                          name={name}
                          id={memberId}
                          size={28}
                        />
                        <Text
                          style={[styles.memberOptionText, active && styles.memberOptionTextActive]}
                          numberOfLines={1}
                        >
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  },
                )}
              </View>

              <Text style={styles.fieldLabel}>To</Text>
              <View style={styles.userRow}>
                {Array.from(new Set(ledger.flatMap((e) => [e.fromUserId, e.toUserId]))).map(
                  (memberId) => {
                    const member = ledger.find(
                      (e) => e.fromUserId === memberId || e.toUserId === memberId,
                    );
                    const name =
                      member?.fromUserId === memberId
                        ? member.fromUserName
                        : member?.toUserName || 'Unknown';
                    const active = settleTo === memberId;
                    return (
                      <TouchableOpacity
                        key={memberId}
                        style={[styles.memberOption, active && styles.memberOptionActive]}
                        onPress={() => setSettleTo(memberId)}
                        activeOpacity={0.8}
                      >
                        <Avatar
                          url={membersById[memberId]?.avatarUrl}
                          emoji={membersById[memberId]?.avatarEmoji}
                          name={name}
                          id={memberId}
                          size={28}
                        />
                        <Text
                          style={[styles.memberOptionText, active && styles.memberOptionTextActive]}
                          numberOfLines={1}
                        >
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  },
                )}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Amount ($)"
                placeholderTextColor={colors.textOnDarkMuted}
                value={settleAmount}
                onChangeText={setSettleAmount}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSettle}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Recording...' : 'Record Settlement'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoider>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDeep,
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
    borderBottomColor: withAlpha(colors.white, 0.08),
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: GOLD,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  customSettleText: {
    fontFamily: fonts.bodySemiBold,
    color: GOLD,
    fontWeight: '600',
    fontSize: 15,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    color: colors.dangerOnDark,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  summary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textOnDarkLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  separator: {
    height: 1,
    backgroundColor: withAlpha(colors.white, 0.08),
  },
  userBlock: {
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink,
    maxWidth: 60,
  },
  spacer: {
    flex: 1,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: fonts.mono,
    color: GOLD,
  },
  settleLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: GOLD,
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
    color: colors.textOnDarkMuted,
    textAlign: 'center',
  },
  // Settlement modal
  modalOverlay: {
    flex: 1,
    backgroundColor: withAlpha(colors.black, 0.5),
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.navyDeep,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.08),
    borderBottomWidth: 0,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(colors.white, 0.08),
  },
  modalTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  modalClose: {
    fontSize: 22,
    color: colors.textOnDarkMuted,
  },
  modalContent: {
    padding: 16,
  },
  fieldLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textOnDarkLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  userRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberOption: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: withAlpha(colors.white, 0.045),
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.08),
    width: 72,
  },
  memberOptionActive: {
    borderColor: GOLD,
  },
  memberOptionText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textOnDarkMuted,
  },
  memberOptionTextActive: {
    color: GOLD,
  },
  input: {
    backgroundColor: withAlpha(colors.white, 0.045),
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
    marginTop: 12,
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.08),
  },
  saveButton: {
    backgroundColor: GOLD,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: fonts.bodyBold,
    color: colors.navyDeep,
    fontSize: 15,
    fontWeight: '700',
  },
});

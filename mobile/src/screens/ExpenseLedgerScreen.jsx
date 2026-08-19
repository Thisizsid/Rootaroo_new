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
  SafeAreaView,
} from 'react-native';
import { showAlert } from '../shared/services/themedAlert';
import { expenseApi } from '../shared/api/expense';
import { householdApi } from '../shared/api/household';
import { useAuthStore } from '../shared/store/authStore';
import { colors, radius, withAlpha } from '../shared/theme';
import Avatar from '../components/Avatar';
import { KeyboardAvoider } from '../shared/components/KeyboardAware';
function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
export default function ExpenseLedgerScreen({ navigation }) {
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
      <View style={styles.entryCard}>
        <View style={styles.entryRow}>
          <View style={styles.userChip}>
            <Avatar
              url={fromMember?.avatarUrl}
              emoji={fromMember?.avatarEmoji}
              name={item.fromUserName}
              id={item.fromUserId}
              size={18}
            />
            <Text style={styles.userName}>{item.fromUserName}</Text>
          </View>
          <Text style={styles.arrowText}>→</Text>
          <View style={styles.userChip}>
            <Avatar
              url={toMember?.avatarUrl}
              emoji={toMember?.avatarEmoji}
              name={item.toUserName}
              id={item.toUserId}
              size={18}
            />
            <Text style={styles.userName}>{item.toUserName}</Text>
          </View>
        </View>
        <View style={styles.entryFooter}>
          <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
          <TouchableOpacity
            style={styles.settleButton}
            onPress={() => handleQuickSettle(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.settleButtonText}>Settle</Text>
          </TouchableOpacity>
        </View>
      </View>
      );
    },
    [handleQuickSettle, membersById],
  );
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
          <Text style={styles.headerTitle}>Ledger</Text>
        </View>
        <TouchableOpacity
          style={styles.customSettleButton}
          onPress={handleOpenCustomSettle}
          activeOpacity={0.8}
        >
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
                    return (
                      <TouchableOpacity
                        key={memberId}
                        style={[
                          styles.userOption,
                          settleFrom === memberId && styles.userOptionActive,
                        ]}
                        onPress={() => setSettleFrom(memberId)}
                      >
                        <Text
                          style={[
                            styles.userOptionText,
                            settleFrom === memberId && styles.userOptionTextActive,
                          ]}
                        >
                          {getInitials(name)}
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
                    return (
                      <TouchableOpacity
                        key={memberId}
                        style={[
                          styles.userOption,
                          settleTo === memberId && styles.userOptionActive,
                        ]}
                        onPress={() => setSettleTo(memberId)}
                      >
                        <Text
                          style={[
                            styles.userOptionText,
                            settleTo === memberId && styles.userOptionTextActive,
                          ]}
                        >
                          {getInitials(name)}
                        </Text>
                      </TouchableOpacity>
                    );
                  },
                )}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Amount (₹)"
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
  customSettleButton: {
    backgroundColor: withAlpha(colors.legacyGold, 0.08),
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  customSettleText: {
    color: colors.legacyGold,
    fontWeight: '600',
    fontSize: 13,
  },
  errorBanner: {
    backgroundColor: withAlpha(colors.dangerBright, 0.08),
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: colors.dangerBright,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  summary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: withAlpha(colors.legacyNavy, 0.35),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
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
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(colors.legacyNavy, 0.04),
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.legacyNavySoft,
  },
  arrowText: {
    fontSize: 18,
    color: withAlpha(colors.legacyNavy, 0.25),
    fontWeight: '300',
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: withAlpha(colors.legacyNavy, 0.05),
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.legacyGold,
  },
  settleButton: {
    backgroundColor: colors.legacyGold,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  settleButtonText: {
    color: colors.onAccent,
    fontSize: 13,
    fontWeight: '700',
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
  // Settlement modal
  modalOverlay: {
    flex: 1,
    backgroundColor: withAlpha(colors.black, 0.4),
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(colors.legacyNavy, 0.08),
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.legacyNavySoft,
  },
  modalClose: {
    fontSize: 22,
    color: withAlpha(colors.legacyNavy, 0.35),
  },
  modalContent: {
    padding: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: withAlpha(colors.legacyNavy, 0.35),
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
  userOption: {
    backgroundColor: colors.canvasCool,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: withAlpha(colors.legacyNavy, 0.08),
  },
  userOptionActive: {
    backgroundColor: withAlpha(colors.legacyGold, 0.12),
    borderColor: colors.legacyGold,
  },
  userOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: withAlpha(colors.legacyNavy, 0.5),
  },
  userOptionTextActive: {
    color: colors.legacyGold,
  },
  input: {
    backgroundColor: colors.canvasCool,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.legacyNavySoft,
    marginTop: 12,
    borderWidth: 1,
    borderColor: withAlpha(colors.legacyNavy, 0.08),
  },
  saveButton: {
    backgroundColor: colors.legacyGold,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: colors.legacyGold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '700',
  },
});

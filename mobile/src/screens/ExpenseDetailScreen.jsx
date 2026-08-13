import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { expenseApi } from '../shared/api/expense';
import { householdApi } from '../shared/api/household';
import { useAuthStore } from '../shared/store/authStore';
import ConfirmSheet from '../components/ConfirmSheet';
import { useExpenseStore } from '../shared/store/expenseStore';
import { colors, radius, fonts } from '../shared/theme';
function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
function formatMoney(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
export default function ExpenseDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { expenseId } = route.params;
  const user = useAuthStore((s) => s.user);
  const householdId = useAuthStore((s) => s.householdId);
  const { role } = useAuthStore(
    (s) =>
      s.user || {
        role: 'member',
      },
  );
  const { updateExpense, removeExpense } = useExpenseStore();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settling, setSettling] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(null);
  const [splitType, setSplitType] = useState('equal');
  const [participants, setParticipants] = useState([]);
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPaidBySheet, setShowPaidBySheet] = useState(false);
  const loadExpense = useCallback(async () => {
    if (!expenseId) return;
    setLoading(true);
    try {
      const data = await expenseApi.getById(expenseId);
      setExpense(data);
    } catch {
      Alert.alert('Error', 'Could not load expense');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [expenseId, navigation]);
  const loadMembers = useCallback(async () => {
    if (!householdId) return;
    try {
      setMembers(await householdApi.getMembers(householdId));
    } catch {
      Alert.alert('Error', 'Could not load household members');
    }
  }, [householdId]);
  useEffect(() => {
    loadExpense();
    loadMembers();
  }, [loadExpense, loadMembers]);
  const handleOpenEditModal = useCallback(() => {
    if (!expense) return;
    setTitle(expense.title);
    setAmount(expense.amount.toString());
    setSplitType(expense.splitType);
    setDate(expense.date);
    setPaidBy(expense.paidBy);
    setParticipants(
      expense.participants.map((p) => ({
        userId: p.userId,
        shareAmount: p.shareAmount,
      })),
    );
    setShowEditModal(true);
  }, [expense]);
  const handleToggleParticipant = useCallback((memberId) => {
    setParticipants((prev) => {
      const exists = prev.find((p) => p.userId === memberId);
      if (exists) return prev.filter((p) => p.userId !== memberId);
      return [
        ...prev,
        {
          userId: memberId,
        },
      ];
    });
  }, []);
  const handleShareChange = useCallback((userId, value) => {
    const num = parseFloat(value) || 0;
    setParticipants((prev) =>
      prev.map((p) =>
        p.userId === userId
          ? {
              ...p,
              shareAmount: num,
            }
          : p,
      ),
    );
  }, []);
  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Required', 'Title is required');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Required', 'Valid amount is required');
      return;
    }
    if (!paidBy) {
      Alert.alert('Required', 'Select who paid');
      return;
    }
    if (participants.length === 0) {
      Alert.alert('Required', 'Add at least one participant');
      return;
    }
    if (splitType === 'custom') {
      const customTotal = participants.reduce((sum, p) => sum + (p.shareAmount || 0), 0);
      if (Math.abs(customTotal - amt) > 0.01) {
        Alert.alert(
          'Split Mismatch',
          `Custom amounts total $${customTotal.toFixed(2)}, but the expense is $${amt.toFixed(2)}`,
        );
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        title: trimmedTitle,
        amount: amt,
        paidBy,
        date,
        splitType,
        participants:
          splitType === 'equal'
            ? participants.map((p) => ({
                userId: p.userId,
              }))
            : participants.map((p) => ({
                userId: p.userId,
                shareAmount: p.shareAmount,
              })),
      };
      await expenseApi.update(expense.id, payload);
      const updated = await expenseApi.getById(expense.id);
      updateExpense(updated);
      setExpense(updated);
      setShowEditModal(false);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not save expense');
    } finally {
      setSaving(false);
    }
  }, [title, amount, paidBy, splitType, participants, date, expense, updateExpense]);
  const handleDelete = useCallback(() => {
    setConfirmAction('delete');
  }, []);
  const handleSettle = useCallback(() => {
    setConfirmAction('settle');
  }, []);
  const confirmActionNow = useCallback(async () => {
    if (!expense || !confirmAction) return;
    setConfirmAction(null);
    if (confirmAction === 'delete') {
      try {
        await expenseApi.remove(expense.id);
        removeExpense(expense.id);
        navigation.goBack();
      } catch {
        Alert.alert('Error', 'Could not delete');
      }
    } else {
      setSettling(true);
      try {
        const updated = await expenseApi.markSettled(expense.id);
        updateExpense(updated);
        setExpense(updated);
      } catch {
        Alert.alert('Error', 'Could not mark expense as settled');
      } finally {
        setSettling(false);
      }
    }
  }, [expense, confirmAction, navigation, removeExpense, updateExpense]);
  const handleReminder = useCallback(() => {
    Alert.alert('Reminder sent', 'A payment reminder has been sent.');
  }, []);
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
  if (!expense) {
    return (
      <View
        style={[
          styles.root,
          {
            paddingTop: insets.top,
          },
        ]}
      >
        <Text style={styles.missing}>Expense not found</Text>
      </View>
    );
  }
  const allSettled = expense.participants.every((p) => p.isSettled);
  const statusText = allSettled ? 'Settled' : 'Waiting for payment';
  const statusColor = allSettled ? colors.success : colors.goldDeep;
  const isCreatorOrAdmin = expense.paidBy === user?.id || role === 'admin';
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

      {/* ── Header (SCREEN 24): back + Expense ── */}
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
        <Text style={styles.headerTitle}>Expense</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title + amount (SCREEN 24) */}
        <Text style={styles.title}>{expense.title}</Text>
        <Text style={styles.amount}>{formatMoney(expense.amount)}</Text>

        {/* Paid by */}
        <Text style={styles.metaLabel}>Paid by</Text>
        <Text style={styles.metaValue}>{expense.payer?.displayName || 'You'}</Text>

        {/* Split */}
        <Text style={[styles.metaLabel, styles.spaced]}>Split</Text>
        {expense.participants.map((p) => (
          <View key={p.userId} style={styles.splitRow}>
            <View style={styles.splitAvatar}>
              <Text style={styles.splitAvatarText}>{getInitials(p.user?.displayName || '?')}</Text>
            </View>
            <Text style={styles.splitName}>{p.user?.displayName || 'Unknown'}</Text>
            <Text style={styles.splitAmount}>{formatMoney(p.shareAmount ?? 0)}</Text>
          </View>
        ))}

        {/* Status (SCREEN 24) */}
        <Text
          style={[
            styles.status,
            {
              color: statusColor,
            },
          ]}
        >
          {statusText}
        </Text>
      </ScrollView>

      {/* ── Bottom actions (SCREEN 24) ── */}
      <View
        style={[
          styles.actions,
          {
            paddingBottom: insets.bottom + 120,
          },
        ]}
      >
        {isCreatorOrAdmin && !allSettled && (
          <TouchableOpacity
            style={[styles.primaryBtn, settling && styles.primaryBtnDisabled]}
            onPress={handleSettle}
            disabled={settling}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{settling ? 'Settling…' : 'Mark as settled'}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.linkRow}>
          <TouchableOpacity onPress={handleReminder} hitSlop={8} activeOpacity={0.6}>
            <Text style={styles.linkText}>Send reminder</Text>
          </TouchableOpacity>
          {isCreatorOrAdmin && (
            <TouchableOpacity onPress={handleOpenEditModal} hitSlop={8} activeOpacity={0.6}>
              <Text style={styles.linkText}>Edit</Text>
            </TouchableOpacity>
          )}
          {isCreatorOrAdmin && (
            <TouchableOpacity onPress={handleDelete} hitSlop={8} activeOpacity={0.6}>
              <Text style={styles.linkTextDanger}>Delete expense</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Edit expense (bottom sheet, matches CreateExpenseScreen design) ── */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.editOverlay}
          keyboardVerticalOffset={insets.top}
        >
          <TouchableOpacity
            style={styles.editBackdrop}
            activeOpacity={1}
            onPress={() => setShowEditModal(false)}
          />
          <View style={styles.editSheet}>
            <View style={styles.editHandle} />
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>Edit expense</Text>
              <TouchableOpacity
                style={styles.editClose}
                onPress={() => setShowEditModal(false)}
                hitSlop={{
                  top: 8,
                  bottom: 8,
                  left: 8,
                  right: 8,
                }}
              >
                <Text style={styles.editCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.editScroll}
              contentContainerStyle={styles.editScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Big amount */}
              <View style={styles.editAmountRow}>
                <Text style={styles.editAmountSymbol}>$</Text>
                <TextInput
                  style={styles.editAmountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  maxLength={12}
                />
              </View>

              {/* Description */}
              <Text style={styles.editFieldLabel}>Description</Text>
              <TextInput
                style={[styles.editInput, styles.editInputFocused]}
                placeholder="Dinner"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                maxLength={120}
              />

              {/* Paid by */}
              <Text style={styles.editFieldLabel}>Paid by</Text>
              <TouchableOpacity
                style={styles.editInput}
                onPress={() => setShowPaidBySheet(true)}
                activeOpacity={0.7}
              >
                <Text style={paidBy ? styles.editInputValue : styles.editInputPlaceholder}>
                  {paidBy
                    ? members.find((m) => m.userId === paidBy)?.displayName || 'Select'
                    : 'Select'}
                </Text>
              </TouchableOpacity>

              {/* Split between */}
              <Text style={styles.editFieldLabel}>Split between</Text>
              <View style={styles.editAvatarRow}>
                {members.map((m) => {
                  const sel = participants.some((p) => p.userId === m.userId);
                  return (
                    <TouchableOpacity
                      key={m.userId}
                      style={[styles.editAvatar, sel && styles.editAvatarSelected]}
                      onPress={() => handleToggleParticipant(m.userId)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editAvatarText}>{getInitials(m.displayName)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.editChips}>
                {['equal', 'custom'].map((opt) => {
                  const active = splitType === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.editChip, active && styles.editChipActive]}
                      onPress={() => setSplitType(opt)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.editChipText, active && styles.editChipTextActive]}>
                        {opt === 'equal' ? 'Equal' : 'Custom'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {splitType === 'custom' && (
                <View style={styles.editShares}>
                  {participants.map((p) => {
                    const member = members.find((m) => m.userId === p.userId);
                    return (
                      <View key={p.userId} style={styles.editShareRow}>
                        <Text style={styles.editShareName}>{member?.displayName || '?'}</Text>
                        <TextInput
                          style={styles.editShareInput}
                          placeholder="$0"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="numeric"
                          value={p.shareAmount?.toString() || ''}
                          onChangeText={(v) => handleShareChange(p.userId, v)}
                          maxLength={8}
                        />
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Date */}
              <Text style={styles.editFieldLabel}>Date</Text>
              <TouchableOpacity
                style={styles.editInput}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.editInputValue}>
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Actions */}
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.editCancel}
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.editCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editUpdate, saving && styles.editUpdateDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.editUpdateText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Paid by picker ── */}
      <Modal
        visible={showPaidBySheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaidBySheet(false)}
      >
        <View style={styles.pickOverlay}>
          <TouchableOpacity
            style={styles.pickBackdrop}
            activeOpacity={1}
            onPress={() => setShowPaidBySheet(false)}
          />
          <View
            style={[
              styles.pickSheet,
              {
                paddingBottom: 32,
              },
            ]}
          >
            <Text style={styles.pickTitle}>Paid by</Text>
            <FlatList
              data={members}
              keyExtractor={(item) => item.userId}
              renderItem={({ item }) => {
                const sel = paidBy === item.userId;
                return (
                  <TouchableOpacity
                    style={styles.pickRow}
                    onPress={() => {
                      setPaidBy(item.userId);
                      setShowPaidBySheet(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pickAvatar}>
                      <Text style={styles.pickAvatarText}>{getInitials(item.displayName)}</Text>
                    </View>
                    <Text style={styles.pickName}>{item.displayName}</Text>
                    {sel && <Text style={styles.pickCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(date + 'T00:00:00')}
          mode="date"
          onChange={(_, newDate) => {
            setShowDatePicker(false);
            if (newDate) setDate(newDate.toISOString().split('T')[0]);
          }}
        />
      )}

      {/* Delete / settle confirmation sheets */}
      <ConfirmSheet
        visible={confirmAction === 'delete'}
        title="Delete this expense?"
        subtitle="This removes it for everyone in the household. This can't be undone."
        confirmLabel="Delete expense"
        onConfirm={confirmActionNow}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmSheet
        visible={confirmAction === 'settle'}
        title="Mark as settled"
        subtitle={expense ? `Mark "${expense.title}" as settled?` : ''}
        confirmLabel="Mark as settled"
        danger={false}
        onConfirm={confirmActionNow}
        onCancel={() => setConfirmAction(null)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  missing: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
    color: colors.textSecondary,
  },
  // Header (SCREEN 24)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  // Content (SCREEN 24)
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
    marginBottom: 4,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
    marginBottom: 26,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.textMuted,
    marginBottom: 12,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
    marginBottom: 26,
  },
  spaced: {
    marginTop: 10,
  },
  // Split rows (SCREEN 24)
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  splitAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderCool,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.inkMuted,
  },
  splitName: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  splitAmount: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.mono,
    color: colors.ink,
  },
  // Status (SCREEN 24)
  status: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    marginTop: 20,
    marginBottom: 26,
  },
  // Bottom actions (SCREEN 24)
  actions: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
  },
  primaryBtn: {
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 5,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: '#fff',
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 22,
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  linkTextDanger: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.bodyMedium,
    color: colors.danger,
  },
  // ── Edit expense sheet (matches CreateExpenseScreen design) ──
  editOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  editBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27,30,36,0.55)',
  },
  editSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 14,
    paddingHorizontal: 24,
    paddingBottom: 12,
    maxHeight: '92%',
    shadowColor: colors.inkDeep,
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 16,
  },
  editHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    marginBottom: 8,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: colors.ink,
    textAlign: 'center',
  },
  editClose: {
    position: 'absolute',
    right: 0,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCloseText: {
    fontSize: 22,
    color: colors.textMuted,
    lineHeight: 24,
  },
  editScroll: {
    flexShrink: 1,
  },
  editScrollContent: {
    paddingBottom: 8,
  },
  // Big amount
  editAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  editAmountSymbol: {
    fontSize: 42,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  editAmountInput: {
    fontSize: 42,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
    padding: 0,
    minWidth: 120,
    textAlign: 'left',
  },
  // Fields
  editFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.textSecondary,
    marginBottom: 7,
    marginTop: 14,
  },
  editInput: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.canvas,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.ink,
    justifyContent: 'center',
  },
  editInputFocused: {
    borderWidth: 2,
    borderColor: colors.gold,
  },
  editInputValue: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  editInputPlaceholder: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  // Split between
  editAvatarRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  editAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.borderCool,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  editAvatarSelected: {
    borderColor: colors.gold,
  },
  editAvatarText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.inkMuted,
  },
  editChips: {
    flexDirection: 'row',
    gap: 8,
  },
  editChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  editChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  editChipText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.textSecondary,
  },
  editChipTextActive: {
    color: '#fff',
  },
  // Custom shares
  editShares: {
    marginTop: 12,
    gap: 8,
  },
  editShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.canvas,
  },
  editShareName: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  editShareInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    width: 80,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Actions
  editActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  editCancel: {
    flex: 1,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCancelText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.textSecondary,
  },
  editUpdate: {
    flex: 2,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 5,
  },
  editUpdateDisabled: {
    opacity: 0.5,
  },
  editUpdateText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: '#fff',
  },
  // Paid-by picker
  pickOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27,30,36,0.55)',
  },
  pickSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  pickTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 12,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  pickAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderCool,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickAvatarText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.inkMuted,
  },
  pickName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
  },
  pickCheck: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.goldDeep,
  },
});

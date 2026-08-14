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
  Alert,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '../shared/store/authStore';
import { householdApi } from '../shared/api/household';
import { colors, fonts, withAlpha } from '../shared/theme';
import ConfirmSheet from '../components/ConfirmSheet';
// Role options match mock Screen 37 exactly — Admin & Member only.
const ROLE_OPTIONS = [
  {
    key: 'admin',
    label: 'Admin',
  },
  {
    key: 'member',
    label: 'Member',
  },
];

// Display mapping — backend `child` renders as Member (mock shows only Admin/Member).
const ROLE_DISPLAY = {
  admin: 'Admin',
  member: 'Member',
  child: 'Member',
};
const ROLE_COLOR = {
  admin: colors.gold,
  member: colors.textMuted,
  child: colors.textMuted,
};
const AVATAR_BG = colors.skeleton; // #E1E6EA (mock)
const AVATAR_TEXT = colors.inkMuted; // #45566B (mock)

const EMOJI_OPTIONS = ['🏡', '🏠', '🏕️', '🌳', '🌻', '🐾', '⭐', '🌙'];
function initials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
function sinceLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
function memberCount(n) {
  return `${n} member${n !== 1 ? 's' : ''}`;
}
export default function HouseholdSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const householdId = useAuthStore((s) => s.householdId);
  const logout = useAuthStore((s) => s.logout);
  const [members, setMembers] = useState([]);
  const [householdName, setHouseholdName] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [myRole, setMyRole] = useState('');
  const [householdEmoji, setHouseholdEmoji] = useState('🏡');
  const [scheduledDeletionAt, setScheduledDeletionAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRole, setSelectedRole] = useState('member');
  const [showEmojiModal, setShowEmojiModal] = useState(false);

  // Destructive confirm sheets
  const [confirmRemoveMember, setConfirmRemoveMember] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Password-confirm modal for household deletion (schedule or immediate)
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const currentUserRole = myRole || user?.role || 'member';
  const isAdmin = currentUserRole === 'admin';
  const load = useCallback(async () => {
    if (!householdId) {
      setLoading(false);
      return;
    }
    try {
      const [hh, memberList] = await Promise.all([
        householdApi.getHousehold(householdId),
        householdApi.getMembers(householdId),
      ]);
      setHouseholdName(hh.name);
      setInviteCode(hh.inviteCode);
      setMyRole(hh.role);
      setCreatedAt(hh.createdAt);
      setScheduledDeletionAt(hh.scheduledDeletionAt);
      setMembers(memberList);
    } catch {
      Alert.alert('Error', 'Failed to load household settings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [householdId]);
  useEffect(() => {
    load();
  }, [load]);
  const handleCopyInvite = async () => {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };
  const handleSaveRole = async () => {
    if (!selectedMember || !householdId) return;
    setActionLoading(true);
    try {
      await householdApi.changeRole(householdId, selectedMember.userId, selectedRole);
      setMembers((p) =>
        p.map((m) =>
          m.userId === selectedMember.userId
            ? {
                ...m,
                role: selectedRole,
              }
            : m,
        ),
      );
      setShowRoleModal(false);
      setSelectedMember(null);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to change role.');
    } finally {
      setActionLoading(false);
    }
  };
  const handleRemoveMember = (member) => {
    setShowRoleModal(false);
    setConfirmRemoveMember(member);
  };
  const confirmRemoveMemberNow = async () => {
    if (!confirmRemoveMember || !householdId) return;
    setActionLoading(true);
    try {
      await householdApi.removeMember(householdId, confirmRemoveMember.userId);
      setMembers((p) => p.filter((m) => m.userId !== confirmRemoveMember.userId));
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to remove member.');
    } finally {
      setActionLoading(false);
      setConfirmRemoveMember(null);
    }
  };
  const openRoleModal = (member) => {
    setSelectedMember(member);
    setSelectedRole(member.role === 'admin' ? 'admin' : 'member');
    setShowRoleModal(true);
  };
  const handleLeave = () => {
    if (isAdmin) {
      Alert.alert('Transfer Admin First', 'Transfer admin to another member before leaving.');
      return;
    }
    setConfirmLeave(true);
  };
  const confirmLeaveNow = async () => {
    if (!householdId) return;
    setActionLoading(true);
    try {
      await householdApi.leave(householdId);
      logout();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to leave.');
    } finally {
      setActionLoading(false);
      setConfirmLeave(false);
    }
  };
  const handleDeleteNest = () => {
    setConfirmDelete(true);
  };
  const confirmDeleteNow = () => {
    setConfirmDelete(false);
    setDeletePassword('');
    setShowDeletePasswordModal(true);
  };
  const handleScheduleDeletion = async () => {
    if (!householdId || !deletePassword) {
      Alert.alert('Error', 'Enter your password to confirm.');
      return;
    }
    setDeleteLoading(true);
    try {
      await householdApi.scheduleDeletion(householdId, deletePassword);
      setShowDeletePasswordModal(false);
      setDeletePassword('');
      await load();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed. Wrong password?');
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleDeleteImmediately = () => {
    if (!householdId || !deletePassword) {
      Alert.alert('Error', 'Enter your password to confirm.');
      return;
    }
    Alert.alert(
      'Permanent Deletion',
      'This will immediately delete the household for every member. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            try {
              await householdApi.confirmDeletion(householdId, deletePassword);
              setShowDeletePasswordModal(false);
              logout();
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.error || 'Deletion failed.');
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ],
    );
  };
  const handleCancelScheduledDeletion = async () => {
    if (!householdId) return;
    setActionLoading(true);
    try {
      await householdApi.cancelDeletion(householdId);
      await load();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to cancel.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View
        style={[
          styles.centered,
          {
            paddingTop: insets.top,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }
  if (!householdId) {
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Household Settings</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <Text
            style={{
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            🏡
          </Text>
          <Text style={styles.emptyTitle}>No Household</Text>
          <Text style={styles.emptyDesc}>You need to create or join a household first.</Text>
        </View>
      </View>
    );
  }

  // ── Main render (mock Screen 36) ───────────────────────────────────────
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

      {/* Minimal header so the user can navigate back (mock has no header bar) */}
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
        <Text style={styles.headerTitle}>Household Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.gold}
          />
        }
      >
        {/* ── Hero: household name + emoji ── */}
        <View style={styles.hero}>
          <Text style={styles.heroName}>
            {householdName} {householdEmoji}
          </Text>
          <Text style={styles.heroMeta}>
            {memberCount(members.length)} · since {createdAt ? sinceLabel(createdAt) : '—'}
          </Text>
        </View>

        {/* ── Members ── */}
        <Text style={styles.sectionLabel}>Members</Text>
        {members.map((member, i) => {
          const isSelf = member.userId === user?.id;
          const canManage = isAdmin && !isSelf;
          return (
            <TouchableOpacity
              key={member.userId}
              disabled={!canManage}
              activeOpacity={0.7}
              onPress={() => openRoleModal(member)}
              style={[styles.memberRow, i === members.length - 1 && styles.memberRowLast]}
            >
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{initials(member.displayName)}</Text>
              </View>
              <Text style={styles.memberName} numberOfLines={1}>
                {member.displayName}
              </Text>
              <Text
                style={[
                  styles.memberRole,
                  {
                    color: ROLE_COLOR[member.role] || colors.textMuted,
                  },
                ]}
              >
                {ROLE_DISPLAY[member.role] || 'Member'}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* ── Invite code card ── */}
        <View style={styles.inviteCard}>
          <View>
            <Text style={styles.inviteLabel}>Invite code</Text>
            <Text style={styles.inviteCode}>{inviteCode || '--------'}</Text>
          </View>
          <TouchableOpacity
            onPress={handleCopyInvite}
            hitSlop={{
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
            }}
          >
            <Text style={styles.inviteCopy}>{codeCopied ? 'Copied!' : 'Copy'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Nav rows ── */}
        <TouchableOpacity
          style={styles.navRow}
          onPress={() => navigation.navigate('NotificationPreferences')}
          activeOpacity={0.7}
        >
          <Text style={styles.navLabel}>Notification preferences</Text>
          <Text style={styles.navChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navRow}
          onPress={() => setShowEmojiModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.navLabel}>Household emoji</Text>
          <Text style={styles.navChevron}>›</Text>
        </TouchableOpacity>

        {/* ── Danger zone ── */}
        <Text style={styles.dangerLabel}>Danger zone</Text>
        <TouchableOpacity style={styles.dangerRow} onPress={handleLeave} activeOpacity={0.7}>
          <Text style={styles.dangerText}>Leave household</Text>
        </TouchableOpacity>
        {isAdmin &&
          (scheduledDeletionAt ? (
            <View style={styles.deletionBanner}>
              <Text style={styles.deletionBannerText}>
                Deletion scheduled for{' '}
                {new Date(scheduledDeletionAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <TouchableOpacity onPress={handleCancelScheduledDeletion} activeOpacity={0.7}>
                <Text style={styles.deletionBannerCancel}>Cancel deletion</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.dangerRow}
              onPress={handleDeleteNest}
              activeOpacity={0.7}
            >
              <Text style={styles.dangerText}>Delete household</Text>
            </TouchableOpacity>
          ))}

        {actionLoading && (
          <ActivityIndicator
            size="small"
            color={colors.gold}
            style={{
              marginTop: 20,
            }}
          />
        )}
      </ScrollView>

      {/* ── Role Edit Modal (mock Screen 37) ── */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowRoleModal(false)}>
          <Pressable
            style={[
              styles.modalSheet,
              {
                paddingBottom: insets.bottom + 44,
              },
            ]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit role · {selectedMember?.displayName}</Text>

            <View style={styles.roleOptions}>
              {ROLE_OPTIONS.map((opt) => {
                const active = selectedRole === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.roleCard,
                      active ? styles.roleCardActive : styles.roleCardInactive,
                    ]}
                    onPress={() => setSelectedRole(opt.key)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.roleCircle,
                        active ? styles.roleCircleActive : styles.roleCircleInactive,
                      ]}
                    />
                    <Text style={styles.roleLabel}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, actionLoading && styles.saveBtnLoading]}
              onPress={handleSaveRole}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>{actionLoading ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>

            {selectedMember && (
              <TouchableOpacity
                style={styles.removeLink}
                onPress={() => handleRemoveMember(selectedMember)}
                hitSlop={{
                  top: 8,
                  bottom: 8,
                  left: 8,
                  right: 8,
                }}
              >
                <Text style={styles.removeLinkText}>Remove from household</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Household emoji picker (session-only, no backend field) ── */}
      <Modal
        visible={showEmojiModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmojiModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowEmojiModal(false)}>
          <Pressable
            style={[
              styles.modalSheet,
              styles.emojiSheet,
              {
                paddingBottom: insets.bottom + 44,
              },
            ]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Household emoji</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiOption, householdEmoji === e && styles.emojiOptionActive]}
                  onPress={() => {
                    setHouseholdEmoji(e);
                    setShowEmojiModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiOptionText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Remove member confirmation sheet */}
      <ConfirmSheet
        visible={!!confirmRemoveMember}
        title={`Remove ${confirmRemoveMember?.displayName}?`}
        subtitle="This cannot be undone."
        confirmLabel="Remove"
        onConfirm={confirmRemoveMemberNow}
        onCancel={() => setConfirmRemoveMember(null)}
      />

      {/* Leave household confirmation sheet */}
      <ConfirmSheet
        visible={confirmLeave}
        title="Leave Household?"
        subtitle="You will need a new invite code to rejoin."
        confirmLabel="Leave"
        onConfirm={confirmLeaveNow}
        onCancel={() => setConfirmLeave(false)}
      />

      {/* Delete household confirmation sheet */}
      <ConfirmSheet
        visible={confirmDelete}
        title="Delete Household?"
        subtitle="This can be scheduled 30 days out (cancelable anytime) or done immediately. Everyone will lose access."
        confirmLabel="Continue"
        onConfirm={confirmDeleteNow}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* Password-confirm modal — schedule (30 days) or delete immediately */}
      <Modal
        visible={showDeletePasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeletePasswordModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDeletePasswordModal(false)}>
          <Pressable
            style={[
              styles.modalSheet,
              {
                paddingBottom: insets.bottom + 44,
              },
            ]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Confirm with password</Text>
            <TextInput
              style={styles.deletePasswordInput}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Your account password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoFocus
            />
            <TouchableOpacity
              style={[styles.saveBtn, deleteLoading && styles.saveBtnLoading]}
              onPress={handleScheduleDeletion}
              disabled={deleteLoading}
              activeOpacity={0.85}
            >
              {deleteLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.saveBtnText}>Schedule deletion (30 days)</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteImmediately}
              disabled={deleteLoading}
              activeOpacity={0.7}
              style={{
                marginTop: 14,
              }}
            >
              <Text style={styles.deleteImmediateText}>Delete immediately instead</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.canvas,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  // Header (minimal, mirrors mock Screen 38 header pattern)
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 26,
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
  // Hero (mock: 21px bold name + 13px muted meta, centered)
  hero: {
    alignItems: 'center',
    marginBottom: 30,
  },
  heroName: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  heroMeta: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginTop: 4,
  },
  // Section label (mock: 600 11px, letter-spacing 0.4, #A6ABB0)
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.textMuted,
    marginBottom: 14,
  },
  // Member rows (mock: 36px avatar, name, colored role, bottom border)
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  memberRowLast: {
    borderBottomWidth: 0,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AVATAR_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: AVATAR_TEXT,
  },
  memberName: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  memberRole: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
  },
  // Invite code card (mock: white, radius 20, soft shadow)
  inviteCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginVertical: 26,
    shadowColor: colors.ink,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.textMuted,
    marginBottom: 7,
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: fonts.mono,
    color: colors.ink,
  },
  inviteCopy: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.bodyMedium,
    color: colors.gold,
  },
  // Nav rows (mock: 14px label + chevron, bottom border)
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  navLabel: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  navChevron: {
    fontSize: 20,
    color: colors.textMuted,
    marginTop: -2,
  },
  // Danger zone (mock: #B54B3A)
  dangerLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.danger,
    marginTop: 26,
    marginBottom: 8,
  },
  dangerRow: {
    paddingVertical: 8,
  },
  dangerText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.danger,
  },
  deletionBanner: {
    backgroundColor: colors.goldTint,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    gap: 8,
  },
  deletionBannerText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  deletionBannerCancel: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.goldDeep,
  },
  deletePasswordInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.canvasElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.ink,
    marginBottom: 18,
  },
  deleteImmediateText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.danger,
    textAlign: 'center',
  },
  // Role Edit modal (mock Screen 37)
  modalOverlay: {
    flex: 1,
    backgroundColor: withAlpha(colors.inkDeep, 0.55),
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 14,
    paddingHorizontal: 24,
    shadowColor: colors.inkDeep,
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 22,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 22,
  },
  roleOptions: {
    gap: 12,
    marginBottom: 26,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  roleCardActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.ink,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  roleCardInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  roleCircleActive: {
    backgroundColor: colors.gold,
  },
  roleCircleInactive: {
    borderWidth: 2,
    borderColor: colors.divider,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  saveBtn: {
    width: '100%',
    height: 54,
    backgroundColor: colors.gold,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 14,
  },
  saveBtnLoading: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: colors.surface,
  },
  removeLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  removeLinkText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.bodyMedium,
    color: colors.danger,
  },
  // Emoji picker sheet
  emojiSheet: {},
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  emojiOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emojiOptionActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldLight,
  },
  emojiOptionText: {
    fontSize: 26,
  },
  // Empty state
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});

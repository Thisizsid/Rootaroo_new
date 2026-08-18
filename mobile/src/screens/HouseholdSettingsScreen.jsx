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
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import QRCodeSvg from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '../shared/store/authStore';
import { householdApi } from '../shared/api/household';
import { colors, fonts, withAlpha } from '../shared/theme';
import ConfirmSheet from '../components/ConfirmSheet';
import Avatar from '../components/Avatar';
import { KeyboardAvoider } from '../shared/components/KeyboardAware';
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
const EMOJI_OPTIONS = ['🏡', '🏠', '🏕️', '🌳', '🌻', '🐾', '⭐', '🌙'];
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
  const joinLink = inviteCode ? `rootaru://join?code=${inviteCode}` : null;
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
  const handleShareInvite = async () => {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `Join our household on Rootaroo! Use invite code: ${inviteCode}`,
      });
    } catch {
      /* dismissed */
    }
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
        <StatusBar barStyle="light-content" backgroundColor={colors.canvas} />
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
      <StatusBar barStyle="light-content" backgroundColor={colors.canvas} />

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
        {/* ── Hero: household name + emoji, gold gradient panel ── */}
        <LinearGradient
          colors={[colors.goldLight, withAlpha(colors.gold, 0.08)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeEmoji}>{householdEmoji}</Text>
          </View>
          <Text style={styles.heroName}>{householdName}</Text>
          <Text style={styles.heroMeta}>
            {memberCount(members.length)} · since {createdAt ? sinceLabel(createdAt) : '—'}
          </Text>
        </LinearGradient>

        {/* ── Members ── */}
        <Text style={styles.sectionLabel}>Members</Text>
        <View style={styles.membersCard}>
          {members.map((member, i) => {
            const isSelf = member.userId === user?.id;
            const canManage = isAdmin && !isSelf;
            const roleColor = ROLE_COLOR[member.role] || colors.textMuted;
            return (
              <TouchableOpacity
                key={member.userId}
                disabled={!canManage}
                activeOpacity={0.7}
                onPress={() => openRoleModal(member)}
                style={[styles.memberRow, i === members.length - 1 && styles.memberRowLast]}
              >
                <View style={[styles.memberAccent, { backgroundColor: roleColor }]} />
                <Avatar
                  url={member.avatarUrl}
                  emoji={member.avatarEmoji}
                  name={member.displayName}
                  id={member.userId}
                  size={36}
                />
                <Text style={styles.memberName} numberOfLines={1}>
                  {member.displayName}
                </Text>
                <View
                  style={[
                    styles.memberRolePill,
                    {
                      backgroundColor: withAlpha(roleColor, 0.14),
                    },
                  ]}
                >
                  <Text style={[styles.memberRoleText, { color: roleColor }]}>
                    {ROLE_DISPLAY[member.role] || 'Member'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Invite section: QR + code, one permanent code for the whole household ── */}
        <Text style={styles.sectionLabel}>Invite to household</Text>
        <View style={styles.inviteCard}>
          <View style={styles.inviteQrWrap}>
            {joinLink ? (
              <QRCodeSvg value={joinLink} size={132} color={colors.ink} backgroundColor={colors.surface} />
            ) : (
              <ActivityIndicator color={colors.gold} />
            )}
          </View>
          <Text style={styles.inviteHint}>Anyone can scan this to join instantly</Text>
          <View style={styles.inviteCodeBox}>
            <Text style={styles.inviteCode}>{inviteCode || '--------'}</Text>
          </View>
          <View style={styles.inviteActions}>
            <TouchableOpacity
              style={styles.invitePillBtn}
              onPress={handleCopyInvite}
              activeOpacity={0.85}
            >
              <Text style={styles.invitePillBtnText}>{codeCopied ? 'Copied!' : 'Copy code'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.invitePillBtn, styles.invitePillBtnOutline]}
              onPress={handleShareInvite}
              activeOpacity={0.85}
            >
              <Text style={[styles.invitePillBtnText, styles.invitePillBtnOutlineText]}>
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Nav rows ── */}
        <TouchableOpacity
          style={styles.navRow}
          onPress={() => setShowEmojiModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.navLabel}>Household emoji</Text>
          <Text style={styles.navChevron}>›</Text>
        </TouchableOpacity>

        {/* ── Danger zone ── */}
        <View style={styles.dangerCard}>
          <TouchableOpacity
            style={[styles.dangerRow, !isAdmin && styles.dangerRowLast]}
            onPress={handleLeave}
            activeOpacity={0.7}
          >
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
                style={[styles.dangerRow, styles.dangerRowLast]}
                onPress={handleDeleteNest}
                activeOpacity={0.7}
              >
                <Text style={styles.dangerText}>Delete household</Text>
              </TouchableOpacity>
            ))}
        </View>

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
        statusBarTranslucent
        navigationBarTranslucent
      >
        <KeyboardAvoider>
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
                <ActivityIndicator color={colors.onAccent} />
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
        </KeyboardAvoider>
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
  // Hero: gold gradient panel with a badge, name, meta
  hero: {
    alignItems: 'center',
    borderRadius: 26,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  heroBadgeEmoji: {
    fontSize: 30,
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
    color: colors.inkMuted,
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
  // Members — grouped rows, role accent bar + pill badge (no card background)
  membersCard: {
    marginBottom: 28,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  memberRowLast: {
    borderBottomWidth: 0,
  },
  memberAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  memberName: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  memberRolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  memberRoleText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.bodySemiBold,
  },
  // Invite card — QR + permanent code + gold pill actions
  inviteCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.goldLight,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 3,
  },
  inviteQrWrap: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  inviteHint: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginBottom: 16,
  },
  inviteCodeBox: {
    backgroundColor: colors.goldLight,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fonts.mono,
    letterSpacing: 2,
    color: colors.goldDeep,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  invitePillBtn: {
    paddingHorizontal: 22,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 4,
  },
  invitePillBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  invitePillBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.onAccent,
  },
  invitePillBtnOutlineText: {
    color: colors.ink,
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
  dangerCard: {
    marginTop: 26,
  },
  dangerRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(colors.danger, 0.15),
  },
  dangerRowLast: {
    borderBottomWidth: 0,
  },
  dangerText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.danger,
  },
  deletionBanner: {
    backgroundColor: colors.goldTint,
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
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
    backgroundColor: withAlpha(colors.shadow, 0.55),
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 14,
    paddingHorizontal: 24,
    shadowColor: colors.shadow,
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
    shadowColor: colors.shadow,
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
    color: colors.onAccent,
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

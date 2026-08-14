import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import SignupWizardShell from '../shared/components/SignupWizardShell';
import { useAuthStore } from '../shared/store/authStore';
import { householdApi } from '../shared/api/household';
import { updateSignupProgress } from '../shared/store/signupProgress';
import { colors, fonts } from '../shared/theme';
// Soft pastel colours for initials avatars
const AVATAR_COLORS = [colors.avatarGold2, colors.avatarBlush, colors.avatarSage, colors.avatarSky, colors.avatarLilac];
function initials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* Mockup QR block (screen11) — static ink squares on white */
function QRCode() {
  return (
    <Svg width="96" height="96" viewBox="0 0 100 100">
      <Rect width="100" height="100" fill={colors.surface} />
      {[
        [8, 8],
        [18, 8],
        [38, 8],
        [8, 18],
        [38, 18],
        [8, 28],
        [18, 28],
        [28, 28],
        [55, 40],
        [70, 40],
        [45, 50],
        [60, 50],
        [80, 50],
        [55, 60],
        [70, 60],
        [45, 70],
        [65, 70],
        [80, 70],
      ].map(([x, y], i) => (
        <Rect key={i} x={x} y={y} width="10" height="10" fill={colors.textPrimary} />
      ))}
    </Svg>
  );
}
export default function InviteMembersScreen({ navigation }) {
  const completeSetup = useAuthStore((s) => s.completeSetup);
  const householdId = useAuthStore((s) => s.householdId);
  const user = useAuthStore((s) => s.user);
  const [inviteCode, setInviteCode] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }
    Promise.all([
      householdApi.generateInvite(householdId).then((inv) => setInviteCode(inv.code)),
      householdApi.getMembers(householdId).then(setMembers),
    ])
      .catch(() => Alert.alert('Error', 'Failed to load invite details.'))
      .finally(() => setLoading(false));
  }, [householdId]);
  const displayCode = loading ? '···-···' : inviteCode || 'MND-482';
  const handleCopy = async () => {
    await Clipboard.setStringAsync(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my household on Rootaroo! Use invite code: ${displayCode}`,
      });
    } catch {
      /* dismissed */
    }
  };
  const currentUser = members.find((m) => m.userId === user?.id);
  const otherMembers = members.filter((m) => m.userId !== user?.id);
  const currentUserName = currentUser?.displayName || user?.name || user?.email || 'You';
  const finish = async () => {
    await updateSignupProgress({
      step: 'done',
    });
    navigation.navigate('Ready');
  };
  return (
    <SignupWizardShell
      step={7}
      stepName="Invite"
      title="Bring everyone together"
      onBack={() => navigation.goBack()}
      onContinue={finish}
      continueDisabled={loading}
      loading={false}
    >
      {/* Invite code card */}
      <View style={styles.inviteCard}>
        <Text style={styles.inviteLabel}>Invite code</Text>
        <Text style={styles.inviteCode}>{displayCode}</Text>

        <View style={styles.qrWrap}>
          {loading ? <ActivityIndicator color={colors.goldWarm} /> : <QRCode />}
        </View>

        <View style={styles.inviteActions}>
          <TouchableOpacity style={styles.pillBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.pillBtnText}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pillBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.pillBtnText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pillBtn} onPress={handleCopy} activeOpacity={0.8}>
            <Text style={styles.pillBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Joining now */}
      <Text style={styles.joiningLabel}>Joining now</Text>

      {otherMembers.map((m, i) => (
        <View key={m.userId} style={styles.joinRow}>
          <Text style={styles.joinCheck}>✓</Text>
          <View
            style={[
              styles.memberAvatar,
              {
                backgroundColor: AVATAR_COLORS[(i + 1) % AVATAR_COLORS.length],
              },
            ]}
          >
            <Text style={styles.memberAvatarText}>{initials(m.displayName)}</Text>
          </View>
          <Text style={styles.joinName}>{m.displayName} joined</Text>
        </View>
      ))}

      {/* You + waiting for more */}
      <View style={styles.joinRow}>
        <Text style={styles.joinCheck}>✓</Text>
        <View
          style={[
            styles.memberAvatar,
            {
              backgroundColor: AVATAR_COLORS[0],
            },
          ]}
        >
          <Text style={styles.memberAvatarText}>{initials(currentUserName)}</Text>
        </View>
        <Text style={styles.joinName}>
          {currentUserName}
          <Text style={styles.joinYou}> (you)</Text>
        </Text>
      </View>

      <View style={styles.joinRow}>
        <Text style={styles.joinPending}>…</Text>
        <View style={[styles.memberAvatar, styles.memberAvatarPending]}>
          <Text style={styles.memberAvatarText}>?</Text>
        </View>
        <Text style={styles.joinName}>Waiting for family</Text>
      </View>

      {/* Skip for now */}
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={finish}
        hitSlop={{
          top: 8,
          bottom: 8,
          left: 8,
          right: 8,
        }}
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </SignupWizardShell>
  );
}
const styles = StyleSheet.create({
  inviteCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
  },
  inviteLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.labelWarm,
    marginBottom: 10,
  },
  inviteCode: {
    fontFamily: fonts.mono,
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 4,
    marginBottom: 16,
  },
  qrWrap: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.fieldBorder,
    backgroundColor: colors.surface,
  },
  pillBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  joiningLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    lineHeight: 12.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.labelWarm,
    marginBottom: 12,
  },
  joinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 3,
  },
  joinCheck: {
    width: 18,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
  },
  joinPending: {
    width: 18,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarPending: {
    backgroundColor: colors.surfaceDark,
  },
  memberAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.surface,
  },
  joinName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  joinYou: {
    fontWeight: '400',
    color: colors.textSecondaryWarm,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 6,
  },
  skipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondaryWarm,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../shared/store/authStore';
import apiClient from '../shared/api/client';
import { colors, fonts } from '../shared/theme';
function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
function getServerBase() {
  const base = apiClient.defaults.baseURL || '';
  return base.replace(/\/api\/v1\/?$/, '');
}
export default function MoreScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.name || user?.email || 'You';
  const initials = getInitials(displayName);
  const email = user?.email || '';
  const avatarSrc = user?.avatarUrl
    ? {
        uri: user.avatarUrl.startsWith('http')
          ? user.avatarUrl
          : `${getServerBase()}${user.avatarUrl}`,
      }
    : null;
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => useAuthStore.getState().logout(),
      },
    ]);
  };
  const go = (screen) => () => navigation.navigate(screen);
  const sections = [
    {
      title: 'Household',
      rows: [
        {
          label: 'Household settings',
          onPress: go('HouseholdSettings'),
        },
        {
          label: 'Notification preferences',
          onPress: go('NotificationPreferences'),
        },
        {
          label: 'Document vault',
          onPress: go('Vault'),
        },
      ],
    },
    {
      title: 'Features',
      rows: [
        {
          label: 'Ping',
          onPress: go('CheckIn'),
        },
        {
          label: 'Grocery List',
          onPress: go('GroceryList'),
        },
        {
          label: 'Bills & Splits',
          onPress: go('ExpenseList'),
        },
        {
          label: 'Calendar',
          onPress: go('Calendar'),
        },
      ],
    },
    {
      title: 'Support',
      rows: [
        {
          label: 'Help center',
          onPress: go('HelpCenter'),
        },
        {
          label: 'Privacy policy',
          onPress: go('PrivacyPolicy'),
        },
      ],
    },
  ];
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
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        {/* ── Profile row (SCREEN 39) ── */}
        <TouchableOpacity
          style={styles.profileRow}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.7}
        >
          {avatarSrc ? (
            <Image source={avatarSrc} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {email}
            </Text>
          </View>

          <Text style={styles.editLink}>Edit</Text>
        </TouchableOpacity>

        {/* ── Menu sections ── */}
        {sections.map((section, si) => (
          <View key={section.title}>
            <Text style={[styles.sectionLabel, si > 0 && styles.sectionLabelSpaced]}>
              {section.title}
            </Text>
            {section.rows.map((row) => (
              <TouchableOpacity
                key={row.label}
                style={styles.menuRow}
                onPress={row.onPress}
                activeOpacity={0.7}
              >
                <Text style={styles.menuRowLabel}>{row.label}</Text>
                <Text style={styles.menuRowChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* ── Sign out (SCREEN 39) ── */}
        <TouchableOpacity style={styles.signOut} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Version footer (SCREEN 39) ── */}
      <Text style={styles.versionText}>Rootaroo 2.4.1</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  // Profile row (SCREEN 39)
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 32,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.borderCool,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.inkMuted,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.bodyMedium,
    color: colors.goldDeep,
  },
  // Sections (SCREEN 39)
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.textMuted,
    marginBottom: 10,
  },
  sectionLabelSpaced: {
    marginTop: 26,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuRowLabel: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  menuRowChevron: {
    fontSize: 18,
    color: colors.textMuted,
  },
  // Sign out (SCREEN 39)
  signOut: {
    paddingVertical: 18,
    marginTop: 4,
  },
  signOutText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.danger,
  },
  // Version footer (SCREEN 39)
  versionText: {
    textAlign: 'center',
    paddingBottom: 12,
    fontSize: 11,
    fontFamily: fonts.mono,
    color: colors.textMuted,
  },
});

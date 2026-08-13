import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationApi } from '../shared/api/notification';
import PreferenceToggle from '../components/PreferenceToggle';
import { colors, fonts } from '../shared/theme';
// Activity group (mock Screen 38)
const ACTIVITY_ROWS = [
  {
    label: 'New tasks',
    key: 'taskAssigned',
  },
  {
    label: 'Feed posts',
    key: 'newPost',
  },
  {
    label: 'Chat messages',
    key: 'chatMessage',
  },
];

// Reminders group (mock Screen 38)
const REMINDER_ROWS = [
  {
    label: 'Bill due reminders',
    key: 'newExpense',
  },
  {
    label: 'Check-in alerts',
    key: 'checkIn',
  },
];
const DEFAULT_PREFS = {
  newPost: true,
  taskAssigned: true,
  taskCompleted: true,
  checkIn: true,
  newExpense: true,
  chatMessage: true,
  calendarEvent: true,
  memberJoined: true,
};
export default function NotificationPreferencesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        setPrefs(await notificationApi.getPreferences());
      } catch {
        Alert.alert('Error', 'Could not load notification preferences.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const handleToggle = useCallback(async (key, next) => {
    setPrefs((p) => ({
      ...p,
      [key]: next,
    }));
    try {
      const saved = await notificationApi.updatePreferences({
        [key]: next,
      });
      setPrefs(saved);
    } catch {
      // Revert optimistic update on failure.
      setPrefs((p) => ({
        ...p,
        [key]: !next,
      }));
      Alert.alert('Error', 'Could not save preference.');
    }
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

      {/* Header (mock Screen 38) */}
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
        <Text style={styles.headerTitle}>Notifications</Text>
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
      >
        {/* Activity */}
        <Text style={styles.sectionLabel}>Activity</Text>
        {ACTIVITY_ROWS.map((row) => (
          <View key={row.key} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <PreferenceToggle
              value={prefs[row.key]}
              onChange={(next) => handleToggle(row.key, next)}
            />
          </View>
        ))}

        {/* Reminders */}
        <Text style={[styles.sectionLabel, styles.sectionLabelGap]}>Reminders</Text>
        {REMINDER_ROWS.map((row) => (
          <View key={row.key} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <PreferenceToggle
              value={prefs[row.key]}
              onChange={(next) => handleToggle(row.key, next)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  // Header (mock Screen 38)
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
  // Section label (mock: 600 11px, letter-spacing 0.4, #A6ABB0)
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.textMuted,
    marginBottom: 14,
  },
  sectionLabelGap: {
    marginTop: 26,
    marginBottom: 14,
  },
  // Toggle row (mock: 14px label, 14px padding, bottom border #E3E1DB)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.ink,
  },
});

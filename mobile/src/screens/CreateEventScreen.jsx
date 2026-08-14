/**
 * CreateEventScreen — new event form (SCREEN 35, 07-Calendar-Household.html).
 *
 * TransparentModal bottom sheet: dark overlay + white sheet with a handle and
 * "New event" title. Fields: Title (gold focus ring), Starts/Ends time pickers,
 * Invite (household member chips), Repeats, Sync to Google Calendar toggle,
 * and a gold "Create event" button.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { householdApi } from '../shared/api/household';
import { eventApi } from '../shared/api/event';
import { useAuthStore } from '../shared/store/authStore';
import { colors, fonts, withAlpha } from '../shared/theme';
const REPEAT_OPTIONS = [
  {
    key: 'none',
    label: 'Does not repeat',
  },
  {
    key: 'daily',
    label: 'Daily',
  },
  {
    key: 'weekly',
    label: 'Weekly',
  },
  {
    key: 'monthly',
    label: 'Monthly',
  },
];
const AVATAR_COLORS = [colors.gold, colors.success, colors.goldSoft, colors.info];
function getInitials(name) {
  return (name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
export default function CreateEventScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const householdId = useAuthStore((s) => s.householdId);
  const [title, setTitle] = useState('');
  const [starts, setStarts] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  });
  const [ends, setEnds] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d;
  });
  const [inviteeIds, setInviteeIds] = useState([]);
  const [repeats, setRepeats] = useState('none');
  const [syncToGoogle, setSyncToGoogle] = useState(false);
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pickingField, setPickingField] = useState(null);
  useEffect(() => {
    if (!householdId) return;
    householdApi
      .getMembers(householdId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [householdId]);
  const toggleInvitee = (id) => {
    setInviteeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const timeLabel = (d) =>
    d
      .toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
      .toLowerCase();
  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Enter a title');
      return;
    }
    if (ends <= starts) {
      Alert.alert('Invalid time', 'End time must be after the start time');
      return;
    }
    setSaving(true);
    try {
      await eventApi.create({
        title: trimmed,
        startsAt: starts.toISOString(),
        endsAt: ends.toISOString(),
        inviteeIds,
        repeats,
        syncToGoogle,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert(
        'Could not create event',
        e?.response?.data?.message ||
          e?.message ||
          'The events API is not available yet. Create the event from the backend first.',
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => navigation.goBack()}
      />

      <View
        style={[
          styles.sheet,
          {
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>New event</Text>

        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={[styles.input, styles.inputFocused]}
            placeholder="Family dinner"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />

          {/* Starts / Ends */}
          <View style={styles.row}>
            <View
              style={{
                flex: 1,
              }}
            >
              <Text style={styles.fieldLabel}>Starts</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setPickingField('starts')}
                activeOpacity={0.7}
              >
                <Text style={styles.inputValue}>{timeLabel(starts)}</Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                flex: 1,
              }}
            >
              <Text style={styles.fieldLabel}>Ends</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setPickingField('ends')}
                activeOpacity={0.7}
              >
                <Text style={styles.inputValue}>{timeLabel(ends)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Invite */}
          <Text style={styles.fieldLabel}>Invite</Text>
          <View style={styles.chips}>
            {members.map((m, i) => {
              const sel = inviteeIds.includes(m.userId);
              return (
                <TouchableOpacity
                  key={m.userId}
                  style={[styles.chip, sel && styles.chipSelected]}
                  onPress={() => toggleInvitee(m.userId)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.chipAvatar,
                      {
                        backgroundColor: sel
                          ? colors.gold
                          : AVATAR_COLORS[i % AVATAR_COLORS.length],
                      },
                    ]}
                  >
                    <Text style={styles.chipAvatarText}>{getInitials(m.displayName)}</Text>
                  </View>
                  <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                    {m.displayName}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {members.length === 0 && (
              <Text style={styles.emptyHint}>No household members to invite</Text>
            )}
          </View>

          {/* Repeats */}
          <Text style={styles.fieldLabel}>Repeats</Text>
          <View style={styles.chips}>
            {REPEAT_OPTIONS.map((opt) => {
              const sel = repeats === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.repeatChip, sel && styles.repeatChipSelected]}
                  onPress={() => setRepeats(opt.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.repeatChipText, sel && styles.repeatChipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sync to Google Calendar */}
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Sync to Google Calendar</Text>
            <TouchableOpacity
              style={[styles.toggle, syncToGoogle && styles.toggleOn]}
              onPress={() => setSyncToGoogle((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.toggleThumb, syncToGoogle && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Create button */}
        <TouchableOpacity
          style={[styles.createButton, saving && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.createButtonText}>Create event</Text>
          )}
        </TouchableOpacity>
      </View>

      {pickingField && (
        <DateTimePicker
          value={pickingField === 'starts' ? starts : ends}
          mode="time"
          is24Hour={false}
          onChange={(_, d) => {
            setPickingField(null);
            if (d) {
              if (pickingField === 'starts') setStarts(d);
              else setEnds(d);
            }
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withAlpha(colors.inkDeep, 0.55),
  },
  sheet: {
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
    elevation: 16,
    maxHeight: '92%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 22,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: fonts.displayBold,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 22,
  },
  form: {
    gap: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.textSecondary,
    marginBottom: 7,
  },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.canvas,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.ink,
    justifyContent: 'center',
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: colors.gold,
  },
  inputValue: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.canvas,
    borderRadius: 9999,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
  },
  chipSelected: {
    backgroundColor: colors.goldLight,
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarText: {
    fontSize: 9,
    fontFamily: fonts.bodySemiBold,
    color: colors.surface,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  chipTextSelected: {
    color: colors.goldDeep,
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  repeatChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9999,
    backgroundColor: colors.canvas,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  repeatChipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  repeatChipText: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: colors.textSecondary,
  },
  repeatChipTextSelected: {
    color: colors.surface,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  syncLabel: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  toggle: {
    width: 46,
    height: 27,
    borderRadius: 9999,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: {
    backgroundColor: colors.gold,
  },
  toggleThumb: {
    width: 21,
    height: 21,
    borderRadius: 9999,
    backgroundColor: colors.surface,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  createButton: {
    height: 54,
    borderRadius: 9999,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 75,
    shadowColor: colors.gold,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 15,
    fontFamily: fonts.displayBold,
    color: colors.surface,
  },
});

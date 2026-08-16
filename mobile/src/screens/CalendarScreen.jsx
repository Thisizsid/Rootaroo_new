/**
 * CalendarScreen — family calendar (SCREEN 34, 07-Calendar-Household.html).
 *
 * Light theme (#F3F1EC canvas). Hero header + avatar stack, dark "Today's
 * agenda" card, month grid, selected-day timeline, upcoming card, and the
 * Birthdays / Availability tiles. A gold FAB opens the Create Event sheet.
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { householdApi } from '../shared/api/household';
import { eventApi } from '../shared/api/event';
import { checkInApi } from '../shared/api/checkin';
import { useGoogleCalendarConnect } from '../shared/hooks/useGoogleCalendarConnect';
import { useAuthStore } from '../shared/store/authStore';
import { colors, fonts } from '../shared/theme';
import Avatar from '../components/Avatar';
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function eventTimeLabel(iso) {
  const d = new Date(iso);
  return d
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
    .toLowerCase();
}
function timeGroupLabel(date) {
  const h = date.getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}
/** Next upcoming birthday among household members with a saved date of birth. */
function nextBirthday(members) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = members
    .filter((m) => m.dateOfBirth)
    .map((m) => {
      const dob = new Date(m.dateOfBirth + 'T00:00:00');
      let next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (next < today) next.setFullYear(today.getFullYear() + 1);
      const age = next.getFullYear() - dob.getFullYear();
      return {
        name: m.displayName,
        date: next,
        age,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  return upcoming[0] || null;
}
export default function CalendarScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const householdId = useAuthStore((s) => s.householdId);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleStatus, setGoogleStatus] = useState(null);
  const [checkedInTodayCount, setCheckedInTodayCount] = useState(0);
  const viewDate = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState(() => new Date());
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const month = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
    try {
      const [memberList, eventList, syncStatus] = await Promise.all([
        householdId ? householdApi.getMembers(householdId) : Promise.resolve([]),
        eventApi
          .list({
            month,
          })
          .catch(() => []),
        eventApi.getGoogleSyncStatus().catch(() => null),
      ]);
      setMembers(memberList);
      setEvents(eventList);
      setGoogleStatus(syncStatus);
      try {
        const ci = await checkInApi.list({
          limit: 50,
        });
        const items = ci?.items || [];
        const todayKey = new Date().toDateString();
        const todayCount = new Set(
          items
            .filter((i) => new Date(i.checkedInAt).toDateString() === todayKey)
            .map((i) => i.userId),
        ).size;
        setCheckedInTodayCount(todayCount);
      } catch {
        setCheckedInTodayCount(0);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Could not load calendar');
    } finally {
      setLoading(false);
    }
  }, [householdId]);
  const { connect: connectGoogle, isLoading: connectingGoogle } = useGoogleCalendarConnect(
    (status) => {
      setGoogleStatus(status);
      Alert.alert('Connected', 'Your Google Calendar is now syncing with Rootaroo.');
    },
  );
  const handleGoogleSyncPress = useCallback(() => {
    if (googleStatus?.connected) {
      Alert.alert(
        'Disconnect Google Calendar?',
        'Rootaroo will stop syncing events with your Google Calendar.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              try {
                await eventApi.disconnectGoogleCalendar();
                setGoogleStatus({
                  connected: false,
                  googleCalendarId: null,
                  lastSyncedAt: null,
                });
              } catch {
                Alert.alert('Error', 'Could not disconnect Google Calendar.');
              }
            },
          },
        ],
      );
    } else {
      connectGoogle();
    }
  }, [googleStatus, connectGoogle]);

  // Reload members + events each time the screen gains focus, so newly created
  // events show up when returning from the Create Event sheet.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const grid = useMemo(
    () => buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate],
  );
  const monthTitle = viewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const weekdayTitle = selected.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const eventsForSelected = useMemo(
    () =>
      events
        .filter((e) => isSameDay(new Date(e.startsAt), selected))
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [events, selected],
  );

  // Group selected-day events by time of day (Morning / Afternoon / Evening)
  const dayGroups = useMemo(() => {
    const groups = new Map();
    for (const e of eventsForSelected) {
      const label = timeGroupLabel(new Date(e.startsAt));
      const list = groups.get(label) ?? [];
      list.push(e);
      groups.set(label, list);
    }
    return Array.from(groups.entries());
  }, [eventsForSelected]);
  const upcoming = useMemo(
    () =>
      events
        .filter((e) => new Date(e.startsAt).getTime() > Date.now())
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
        .slice(0, 3),
    [events],
  );
  const birthday = useMemo(() => nextBirthday(members), [members]);
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero header ── */}
        <View
          style={[
            styles.hero,
            {
              paddingTop: insets.top,
            },
          ]}
        >
          <View
            style={{
              flexShrink: 1,
            }}
          >
            <Text style={styles.monthTitle}>{monthTitle}</Text>
            <Text style={styles.eventsCount}>
              {events.length === 1
                ? '1 family event this month'
                : `${events.length} family events this month`}
            </Text>
            <TouchableOpacity
              style={[
                styles.googleSyncChip,
                googleStatus?.connected && styles.googleSyncChipConnected,
              ]}
              onPress={handleGoogleSyncPress}
              disabled={connectingGoogle}
              activeOpacity={0.8}
            >
              {connectingGoogle ? (
                <ActivityIndicator size="small" color={colors.goldDeep} />
              ) : (
                <Text style={styles.googleSyncChipText}>
                  {googleStatus?.connected ? 'Google Calendar synced' : 'Connect Google Calendar'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.avatarStack}>
            {members.slice(0, 4).map((m, i) => (
              <Avatar
                key={m.userId}
                url={m.avatarUrl}
                emoji={m.avatarEmoji}
                name={m.displayName}
                id={m.userId}
                size={30}
                style={[
                  styles.avatarRing,
                  {
                    marginLeft: i === 0 ? 0 : -8,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── Today's agenda widget ── */}
        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>TODAY</Text>
          <Text style={styles.todayTitle}>{todayHeadline(events, viewDate)}</Text>
          <Text style={styles.todaySub}>
            {todayEventCount(events, viewDate)} things happening today
          </Text>
        </View>

        {/* ── Month grid ── */}
        <View style={styles.weekRow}>
          {WEEKDAYS.map((w, i) => (
            <Text key={`wd-${i}`} style={styles.weekday}>
              {w}
            </Text>
          ))}
        </View>
        <View style={styles.monthGrid}>
          {grid.map((day, i) => {
            if (day === null) return <View key={`b${i}`} style={styles.dayCell} />;
            const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
            const isToday = isSameDay(d, new Date());
            const isSelected = isSameDay(d, selected);
            const hasEvent = events.some((e) => isSameDay(new Date(e.startsAt), d));
            return (
              <TouchableOpacity
                key={`d${i}`}
                style={styles.dayCell}
                onPress={() => setSelected(d)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isToday && styles.dayCircleToday,
                    isSelected && styles.dayCircleSelected,
                  ]}
                >
                  <Text style={[styles.dayNum, (isToday || isSelected) && styles.dayNumActive]}>
                    {day}
                  </Text>
                </View>
                <View style={[styles.dayDot, hasEvent && styles.dayDotActive]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Selected day timeline ── */}
        <Text style={styles.dayTitle}>{weekdayTitle}</Text>
        {dayGroups.length === 0 && <Text style={styles.noEvents}>No events this day</Text>}
        {dayGroups.map(([label, items]) => (
          <View key={label} style={styles.dayGroup}>
            <Text style={styles.groupLabel}>{label.toUpperCase()}</Text>
            {items.map((e) => (
              <View key={e.id} style={styles.eventRow}>
                <Text style={styles.eventTime}>{eventTimeLabel(e.startsAt)}</Text>
                <View style={styles.eventDot} />
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {e.title}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* ── Upcoming ── */}
        <View style={styles.whiteCard}>
          <Text style={styles.cardLabel}>UPCOMING</Text>
          {upcoming.length === 0 && <Text style={styles.noEvents}>No upcoming events</Text>}
          {upcoming.map((e, i) => (
            <View key={e.id} style={[styles.upcomingRow, i > 0 && styles.upcomingRowBorder]}>
              <Text style={styles.upcomingTitle} numberOfLines={1}>
                {e.title}
              </Text>
              <Text style={styles.upcomingContext}>
                {new Date(e.startsAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                · {eventTimeLabel(e.startsAt)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Birthdays + Availability ── */}
        <View style={styles.tilesRow}>
          <View style={styles.whiteCardSmall}>
            <Text style={styles.cardLabel}>BIRTHDAYS</Text>
            {birthday ? (
              <>
                <Text style={styles.tileTitle} numberOfLines={1}>
                  {birthday.name} turns {birthday.age}
                </Text>
                <Text style={styles.tileSub}>
                  {birthday.date.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </>
            ) : (
              <Text style={styles.tileSub}>No birthdays on file</Text>
            )}
          </View>
          <View style={styles.whiteCardSmall}>
            <Text style={styles.cardLabel}>CHECKED IN</Text>
            <Text style={styles.tileTitle}>
              {checkedInTodayCount} of {members.length || 0}
            </Text>
            <Text style={styles.tileSub}>home today</Text>
          </View>
        </View>

        {loading && <ActivityIndicator color={colors.gold} style={styles.listFooter} />}
        {error && (
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.7}>
            <Text style={styles.retryText}>Couldn't load calendar — tap to retry</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Create event FAB ── */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            bottom: insets.bottom + 104,
          },
        ]}
        onPress={() => navigation.navigate('CreateEvent')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// Sample-free helpers — today widget content derived from real events when present.
function todayHeadline(events, ref) {
  if (events.length === 0) return 'Nothing planned today';
  const firstToday = events.find((e) => isSameDay(new Date(e.startsAt), ref));
  if (!firstToday) return 'No events today';
  const count = events.filter((e) => isSameDay(new Date(e.startsAt), ref)).length;
  return count === 1 ? `${firstToday.title} today` : `${firstToday.title} +${count - 1} more today`;
}
function todayEventCount(events, ref) {
  return events.filter((e) => isSameDay(new Date(e.startsAt), ref)).length;
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  // Hero
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 6,
  },
  monthTitle: {
    fontSize: 25,
    lineHeight: 30,
    fontFamily: fonts.displayBold,
    color: colors.ink,
    letterSpacing: -0.01,
    marginBottom: 4,
  },
  eventsCount: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  googleSyncChip: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.canvasElevated,
    borderWidth: 1.4,
    borderColor: colors.border,
  },
  googleSyncChipConnected: {
    backgroundColor: colors.goldTint,
    borderColor: colors.gold,
  },
  googleSyncChipText: {
    fontSize: 11.5,
    fontFamily: fonts.bodySemiBold,
    color: colors.goldDeep,
  },
  avatarStack: {
    flexDirection: 'row',
    paddingTop: 6,
  },
  avatarRing: {
    borderWidth: 2,
    borderColor: colors.canvas,
  },
  // Today's agenda
  todayCard: {
    backgroundColor: colors.ink,
    borderRadius: 20,
    padding: 18,
    marginVertical: 18,
  },
  todayLabel: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.goldSoft,
    marginBottom: 10,
  },
  todayTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: fonts.displayBold,
    color: colors.surface,
    marginBottom: 4,
  },
  todaySub: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textFaint,
  },
  // Month grid
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.3,
    color: colors.textMuted,
    paddingBottom: 8,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    marginBottom: 24,
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: colors.gold,
  },
  dayCircleSelected: {
    backgroundColor: colors.ink,
  },
  dayNum: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  dayNumActive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.surface,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  dayDotActive: {
    backgroundColor: colors.gold,
  },
  // Selected day timeline
  dayTitle: {
    fontSize: 16,
    fontFamily: fonts.displayBold,
    color: colors.ink,
    marginBottom: 16,
  },
  dayGroup: {
    marginBottom: 18,
  },
  groupLabel: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.textMuted,
    marginBottom: 10,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 9,
  },
  eventTime: {
    width: 62,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginTop: 5,
  },
  eventTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
    lineHeight: 18,
  },
  // White cards
  whiteCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: colors.ink,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 3,
  },
  whiteCardSmall: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    shadowColor: colors.ink,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.textMuted,
    marginBottom: 14,
  },
  upcomingRow: {
    paddingVertical: 9,
  },
  upcomingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.canvasElevated,
  },
  upcomingTitle: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  upcomingContext: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tileTitle: {
    fontSize: 14,
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  tileSub: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Tiles row
  tilesRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  // States
  noEvents: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginBottom: 12,
  },
  listFooter: {
    marginVertical: 16,
  },
  retryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.goldDeep,
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
  },
  fabText: {
    fontSize: 24,
    fontFamily: fonts.displayBold,
    color: colors.surface,
    lineHeight: 28,
  },
});

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
  Image,
  Modal,
  Platform,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SvgXml } from 'react-native-svg';
import { dashboardApi } from '../shared/api/dashboard';
import * as NavigationBar from 'expo-navigation-bar';
import { useAuthStore } from '../shared/store/authStore';
import { householdApi } from '../shared/api/household';
import { feedApi } from '../shared/api/feed';
import { taskApi } from '../shared/api/task';
import { expenseApi } from '../shared/api/expense';
import { vaultApi } from '../shared/api/vault';
import { eventApi } from '../shared/api/event';
import { checkInApi } from '../shared/api/checkin';
import { colors, fonts, spacing, radius } from '../shared/theme';
import { loadSignupProgress } from '../shared/store/signupProgress';

// Family cover photo (Boss's pick, 2026-08-01) — default hero image
const FAMILY_COVER = require('../../assets/images/family-cover.png');

/* ═══════════════════════════════════════════════
   Mockup: 03-Home-Feed.html SCREEN 11 · Dashboard
   Canvas #E9E6E0 · white r22 cards · hero cover +
   frosted glass greeting card · 10 widgets
   ═══════════════════════════════════════════════ */

const AVATAR_COLORS = ['#D9B87A', '#C4A0D4', '#A8C8A0', '#A0B8D4', '#E8B4A0'];
const MEDALS = ['🥇', '🥈', '🥉'];
const GOLD = '#B88A3E';
const INK = '#2A2E33';

// Notification bell (Feather "bell") — Dashboard top-right, over the hero photo.
const BELL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
</svg>`;
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 18) return 'Good afternoon,';
  return 'Good evening,';
}
function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
function initials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
function timeHM(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
function startOfWeek(d) {
  const day = new Date(d);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7)); // Monday
  day.setHours(0, 0, 0, 0);
  return day;
}
function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ── Widget label (mockup: 11px w600 ls 0.4 #A6ABB0) ── */
function WidgetLabel({ children, color = '#A6ABB0', style }) {
  return (
    <Text
      style={[
        styles.widgetLabel,
        {
          color,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/* ── Card (mockup: white, r22, soft double shadow) ── */
function Card({ children, style, radius = 22 }) {
  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export default function DashboardScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const householdId = useAuthStore((s) => s.householdId);
  const [data, setData] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Widget data
  const [heroUri, setHeroUri] = useState(null);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [oweText, setOweText] = useState(null);
  const [oweName, setOweName] = useState(null);
  const [latestDoc, setLatestDoc] = useState(null);
  const [latestDocTime, setLatestDocTime] = useState('');
  const [feedPost, setFeedPost] = useState(null);

  // Calendar + household widgets (real data)
  const [events, setEvents] = useState([]);
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [latestCheckIn, setLatestCheckIn] = useState(null);
  const [checkedInTodayCount, setCheckedInTodayCount] = useState(0);

  // Quick notify
  const [showPicker, setShowPicker] = useState(false);
  const [pendingAction, setPendingAction] = useState('');
  const [customMsg, setCustomMsg] = useState('');
  const [selMembers, setSelMembers] = useState(new Set());
  const [sending, setSending] = useState(false);
  const load = useCallback(async () => {
    setFetchError(false);
    try {
      const [d, m] = await Promise.all([
        dashboardApi.get(),
        householdId ? householdApi.getMembers(householdId) : Promise.resolve([]),
      ]);
      setData(d);
      setMembers(m);

      // Calendar widget — all household events (filtered per selected day in the widget)
      try {
        const calendarEvents = await eventApi.list();
        setEvents(calendarEvents || []);
      } catch {
        setEvents([]);
      }

      // Household widget — latest check-in + how many members checked in today
      try {
        const ci = await checkInApi.list({
          limit: 50,
        });
        const items = ci?.items || [];
        if (items.length > 0) {
          const latest = items[0]; // list is DESC by checkedInAt
          const who = m.find((mem) => mem.userId === latest.userId);
          const todayKey = new Date().toDateString();
          const todayCount = new Set(
            items
              .filter((i) => new Date(i.checkedInAt).toDateString() === todayKey)
              .map((i) => i.userId),
          ).size;
          setLatestCheckIn({
            name: who?.displayName || latest.user?.displayName || 'Someone',
            time: timeHM(latest.checkedInAt),
          });
          setCheckedInTodayCount(todayCount);
        } else {
          setLatestCheckIn(null);
          setCheckedInTodayCount(0);
        }
      } catch {
        setLatestCheckIn(null);
        setCheckedInTodayCount(0);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [householdId]);
  useEffect(() => {
    load();
  }, [load]);

  // Hero cover — saved family photo from signup, else first member avatar
  useEffect(() => {
    loadSignupProgress().then((p) => {
      if (p?.draft?.familyPhoto) setHeroUri(p.draft.familyPhoto);
    });
  }, []);

  // Today's Focus — top 3 pending tasks
  useEffect(() => {
    taskApi
      .list({
        group: 'pending',
      })
      .then((res) => {
        const arr = Array.isArray(res) ? res : res?.pending || [];
        setPendingTasks(arr.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  // Balance — expense summary
  useEffect(() => {
    expenseApi
      .getSummary()
      .then((s) => {
        const mine = (s?.netBalances || []).find((b) => b.userId === user?.id);
        if (mine && Math.abs(mine.netBalance) > 0.01) {
          const amt = `$${Math.abs(mine.netBalance).toFixed(0)}`;
          if (mine.netBalance > 0) {
            setOweText(`You owe ${amt}`);
          } else {
            setOweText(`You're owed ${amt}`);
          }
          // counterparty from ledger
          const entry = (s?.ledger || []).find(
            (l) => l.toUserId === user?.id || l.fromUserId === user?.id,
          );
          if (entry) setOweName(mine.netBalance > 0 ? entry.toUserName : entry.fromUserName);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  // Vault — latest document
  useEffect(() => {
    vaultApi
      .listDocuments({
        limit: 1,
      })
      .then((r) => {
        if (r.documents?.length) {
          setLatestDoc(r.documents[0].name);
          setLatestDocTime(timeHM(r.documents[0].uploadedAt));
        }
      })
      .catch(() => {});
  }, []);

  // Feed widget — newest post
  useEffect(() => {
    feedApi
      .list({
        limit: 1,
      })
      .then((r) => {
        if (r.posts?.length) setFeedPost(r.posts[0]);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setBackgroundColorAsync('#FFFFFF');
    NavigationBar.setButtonStyleAsync('dark');
    return () => {
      NavigationBar.setBackgroundColorAsync('#FFFFFF');
      NavigationBar.setButtonStyleAsync('dark');
    };
  }, []);
  const activity = data?.activity || [];
  const recentActivity = data?.recentActivity || [];
  const completedToday = data?.tasks.completedToday || 0;

  /* ── Streak: 7 bars ── */
  const streakDays = (() => {
    const days = activity.slice(-7);
    while (days.length < 7)
      days.unshift({
        date: '',
        tasksCompleted: 0,
        todosCompleted: 0,
        groceriesBought: 0,
      });
    return days.map((d, i) => {
      const total = (d.tasksCompleted || 0) + (d.todosCompleted || 0) + (d.groceriesBought || 0);
      const isToday = i === days.length - 1;
      const done = total > 0 || (isToday && completedToday > 0);
      return {
        bg: done ? GOLD : isToday ? '#D9B87A' : '#ECEAE5',
        label: d.date
          ? new Date(d.date).toLocaleDateString('en-US', {
              weekday: 'narrow',
            })
          : '',
      };
    });
  })();

  /* ── Harmony score ── */
  const weekTotal = activity.reduce(
    (a, d) => a + (d.tasksCompleted || 0) + (d.todosCompleted || 0) + (d.groceriesBought || 0),
    0,
  );
  const harmonyScore = Math.min(100, 40 + weekTotal * 3);
  const weeklyPct = Math.min(100, Math.round(weekTotal * 4));
  const activitiesThisWeek = weekTotal;

  /* ── Leaderboard (server-computed, real) ── */
  const leaderboard = (data?.leaderboard || [])
    .map((e) => ({
      name: e.displayName,
      points: e.points,
    }))
    .slice(0, 3);
  const topMemberName = data?.leaderboard?.[0]?.displayName || '';

  /* ── Household status (real check-ins) ── */
  const everyoneHome = members.length > 0 && checkedInTodayCount >= members.length;
  const QUICK_ACTIONS = [
    {
      glyph: '⌂',
      label: 'Home',
      template: "I've reached home safe! 🏠",
    },
    {
      glyph: '➤',
      label: 'On My Way',
      template: "I'm on my way now! 🚗",
    },
    {
      glyph: '✓',
      label: 'Safe',
      template: "Just checking in — I'm safe! ✅",
    },
    {
      glyph: '🛒',
      label: 'Groceries',
      template: 'Heading out to grab groceries! 🛒',
    },
    {
      glyph: '✉️',
      label: 'Custom',
      template: '',
    },
  ];
  const handleQuickNotify = (action) => {
    const q = QUICK_ACTIONS.find((x) => x.label === action);
    setPendingAction(q?.label || action);
    setCustomMsg(q?.template || '');
    setSelMembers(new Set());
    setShowPicker(true);
  };
  const selectPreset = (label) => {
    const q = QUICK_ACTIONS.find((x) => x.label === label);
    setPendingAction(q?.label || '');
    setCustomMsg(q?.template || '');
  };
  const canSend = selMembers.size > 0 && (customMsg.trim().length > 0 || !!pendingAction);
  const handleSendNotify = async () => {
    const ids = Array.from(selMembers);
    if (!ids.length) return;
    const msg = customMsg.trim();
    const action =
      pendingAction && pendingAction !== 'Custom' ? pendingAction : 'sent you a message';
    setSending(true);
    setShowPicker(false);
    try {
      await dashboardApi.quickNotify(action, ids, msg || undefined);
    } catch (e) {
      Alert.alert(
        'Error',
        e?.response?.data?.message || e?.message || 'Could not send notification',
      );
    } finally {
      setSending(false);
    }
  };
  const focusItems = pendingTasks.map((t) => ({
    title: t.title,
    meta: t.dueDate
      ? new Date(t.dueDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : 'Anytime',
  }));
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
        <StatusBar barStyle="dark-content" backgroundColor="#E9E6E0" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={GOLD} size="large" />
          <Text style={styles.loadingText}>Loading your home…</Text>
        </View>
      </View>
    );
  }
  const weekStrip = Array.from({
    length: 7,
  }).map((_, i) => {
    const d = new Date(weekAnchor);
    d.setDate(weekAnchor.getDate() + i);
    const isToday = sameDay(d, new Date());
    const isSelected = sameDay(d, selectedDate);
    return {
      key: d.toDateString(),
      date: d,
      label: d.toLocaleDateString('en-US', {
        weekday: 'narrow',
      }),
      num: d.getDate(),
      bg: isToday ? GOLD : 'transparent',
      color: isToday ? '#FFFFFF' : INK,
      dot: events.some((e) => sameDay(new Date(e.startsAt), d)) ? GOLD : 'transparent',
      isSelected,
    };
  });
  const selectedDayEvents = events
    .filter((e) => sameDay(new Date(e.startsAt), selectedDate))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ═══════ NOTIFICATION BELL (top-right, pinned over the hero photo) ═══════ */}
      <TouchableOpacity
        style={[
          styles.notifBtn,
          {
            top: insets.top + 8,
          },
        ]}
        onPress={() => nav.navigate('Notifications')}
        activeOpacity={0.8}
        hitSlop={{
          top: 8,
          bottom: 8,
          left: 8,
          right: 8,
        }}
      >
        <SvgXml xml={BELL_SVG} width={22} height={22} />
      </TouchableOpacity>

      {/* ═══════ FIXED LAYER: family photo sticks while cards scroll over it ═══════ */}
      <View
        style={[
          styles.photoLayer,
          {
            height: 320,
          },
        ]}
        pointerEvents="none"
      >
        <Image
          source={
            heroUri
              ? {
                  uri: heroUri,
                }
              : FAMILY_COVER
          }
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(27,30,36,0.05)', 'rgba(27,30,36,0.10)', 'rgba(27,30,36,0.55)']}
          style={styles.heroOverlay}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 96,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={GOLD}
          />
        }
      >
        {/* Spacer keeps the photo visible above the scroll body (photo height) */}
        <View
          style={{
            height: 320 - insets.top + 4,
          }}
        />

        {/* ═══════ FROSTED GLASS CARD (overlaps photo, scrolls with content) ═══════ */}
        <BlurView
          intensity={0}
          tint="light"
          style={[
            styles.frost,
            {
              marginTop: -122,
              borderRadius: 26,
            },
          ]}
        >
          <Text style={styles.frostDate}>{formatDate()}</Text>
          <Text style={styles.frostGreeting} numberOfLines={1}>
            {getGreeting()} {user?.name?.split(' ')[0] || 'there'}
          </Text>

          {/* Member avatars */}
          <View style={styles.avatarStack}>
            {members.slice(0, 5).map((m, i) => (
              <View
                key={m.userId}
                style={[
                  styles.avatarWrap,
                  i > 0 && {
                    marginLeft: -8,
                  },
                ]}
              >
                {m.avatarUrl ? (
                  <Image
                    source={{
                      uri: m.avatarUrl,
                    }}
                    style={styles.avatarCircle}
                  />
                ) : m.avatarEmoji ? (
                  <View
                    style={[
                      styles.avatarCircle,
                      {
                        backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                      },
                    ]}
                  >
                    <Text style={styles.avatarEmoji}>{m.avatarEmoji}</Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.avatarCircle,
                      {
                        backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                      },
                    ]}
                  >
                    <Text style={styles.avatarInitials}>
                      {initials(m.displayName || m.name || '??')}
                    </Text>
                  </View>
                )}
                <View style={styles.onlineDot} />
              </View>
            ))}
          </View>

          <View style={styles.frostDivider} />

          {/* Family streak */}
          <View style={styles.streakTop}>
            <WidgetLabel>FAMILY STREAK</WidgetLabel>
            <Text style={styles.streakNum}>{data?.streak?.current ?? 0} days</Text>
          </View>
          <View style={styles.streakBars}>
            {streakDays.map((d, i) => (
              <View
                key={i}
                style={[
                  styles.streakBar,
                  {
                    backgroundColor: d.bg,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.streakLabels}>
            {streakDays.map((d, i) => (
              <Text key={i} style={styles.streakLabel}>
                {d.label || ''}
              </Text>
            ))}
          </View>
          <Text style={styles.streakSub}>
            {completedToday > 0
              ? `${completedToday} task${completedToday > 1 ? 's' : ''} completed today — keep it going.`
              : 'No completions yet today — complete a task to keep the streak alive.'}
          </Text>
        </BlurView>

        {/* ═══════ BODY (cards scroll up over the photo) ═══════ */}
        <View style={styles.body}>
          {fetchError && (
            <Card
              style={{
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: '#757A80',
                }}
              >
                Couldn't load your dashboard
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  setLoading(true);
                  load();
                }}
              >
                <Text style={styles.retryText}>Tap to retry</Text>
              </TouchableOpacity>
            </Card>
          )}

          {!fetchError && data && (
            <>
              {/* ── Family Harmony Score ── */}
              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    borderRadius: 22,
                  },
                ]}
                onPress={() => nav.navigate('TasksStack')}
                activeOpacity={0.7}
              >
                <View style={styles.rowBetween}>
                  <WidgetLabel>FAMILY HARMONY SCORE</WidgetLabel>
                  <Text style={styles.greenDelta}>▲ +{activitiesThisWeek} this week</Text>
                </View>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreNum}>{harmonyScore}</Text>
                  <Text style={styles.scoreMeta}>weekly progress {weeklyPct}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${weeklyPct}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.scoreCaption}>
                  {activitiesThisWeek} family activities completed this week
                </Text>
                {leaderboard.map((p, i) => (
                  <View key={i} style={styles.lbRow}>
                    <Text style={styles.lbMedal}>{MEDALS[i] || '•'}</Text>
                    <Text style={styles.lbName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.lbPts}>{p.points} pts</Text>
                  </View>
                ))}
              </TouchableOpacity>

              {/* ── Today's Focus ── */}
              <Card>
                <WidgetLabel
                  style={{
                    marginBottom: 14,
                  }}
                >
                  TODAY'S FOCUS
                </WidgetLabel>
                {focusItems.length === 0 ? (
                  <Text style={styles.emptyText}>No tasks for today — enjoy the calm 🎉</Text>
                ) : (
                  focusItems.map((f, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.focusRow, i < focusItems.length - 1 && styles.focusRowBorder]}
                      onPress={() => nav.navigate('TasksStack')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.focusTitle} numberOfLines={1}>
                        {f.title}
                      </Text>
                      <Text style={styles.focusMeta}>{f.meta}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </Card>

              {/* ── Calendar ── */}
              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    borderRadius: 22,
                    padding: 20,
                  },
                ]}
                onPress={() =>
                  nav.navigate('MoreStack', {
                    screen: 'Calendar',
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.rowBetween}>
                  <WidgetLabel>CALENDAR</WidgetLabel>
                  <View style={styles.calControls}>
                    <TouchableOpacity
                      onPress={() =>
                        setWeekAnchor((p) => {
                          const n = new Date(p);
                          n.setDate(n.getDate() - 7);
                          return n;
                        })
                      }
                      hitSlop={{
                        top: 6,
                        bottom: 6,
                        left: 6,
                        right: 6,
                      }}
                    >
                      <Text style={styles.calArrow}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.calMonth}>
                      {weekAnchor.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setWeekAnchor((p) => {
                          const n = new Date(p);
                          n.setDate(n.getDate() + 7);
                          return n;
                        })
                      }
                      hitSlop={{
                        top: 6,
                        bottom: 6,
                        left: 6,
                        right: 6,
                      }}
                    >
                      <Text style={styles.calArrow}>›</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.weekStrip}>
                  {weekStrip.map((w) => (
                    <TouchableOpacity
                      key={w.key}
                      style={styles.weekCol}
                      onPress={() => setSelectedDate(w.date)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.weekLabel}>{w.label}</Text>
                      <View
                        style={[
                          styles.weekDay,
                          {
                            backgroundColor: w.bg,
                          },
                          w.isSelected && styles.weekDaySelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.weekNum,
                            {
                              color: w.color,
                            },
                          ]}
                        >
                          {w.num}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.weekDot,
                          {
                            backgroundColor: w.dot,
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.calDivider} />
                {events.length === 0 ? (
                  <Text style={styles.calMeta}>No events yet — add one in the Calendar</Text>
                ) : selectedDayEvents.length === 0 ? (
                  <Text style={styles.calMeta}>No events this day — tap a date to switch</Text>
                ) : (
                  selectedDayEvents.slice(0, 3).map((e) => (
                    <View key={e.id} style={styles.calEventRow}>
                      <View style={styles.calEventDot} />
                      <Text style={styles.calEvent} numberOfLines={1}>
                        {e.title}
                      </Text>
                      <Text style={styles.calEventTime}>{timeHM(e.startsAt)}</Text>
                    </View>
                  ))
                )}
              </TouchableOpacity>

              {/* ── Tasks + Balance two-up ── */}
              <View style={styles.twoUp}>
                <TouchableOpacity
                  style={styles.halfCard}
                  onPress={() => nav.navigate('TasksStack')}
                  activeOpacity={0.7}
                >
                  <WidgetLabel
                    style={{
                      marginBottom: 12,
                    }}
                  >
                    TASKS
                  </WidgetLabel>
                  <Text style={styles.halfNum}>{data.tasks.pending}</Text>
                  <Text style={styles.halfMeta}>
                    {data.tasks.pending === 0 ? 'all clear' : 'due today'}
                    {data.tasks.overdue > 0 ? ` · ${data.tasks.overdue} overdue` : ''}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.halfCard}
                  onPress={() =>
                    nav.navigate('MoreStack', {
                      screen: 'ExpenseList',
                    })
                  }
                  activeOpacity={0.7}
                >
                  <WidgetLabel
                    style={{
                      marginBottom: 12,
                    }}
                  >
                    BALANCE
                  </WidgetLabel>
                  <Text style={[styles.halfNum, styles.balanceNum]} numberOfLines={1}>
                    {oweText || 'Settled up'}
                  </Text>
                  <Text style={styles.halfMeta} numberOfLines={1}>
                    {oweName || (oweText ? '' : 'nothing owed')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Grocery ── */}
              <TouchableOpacity
                style={styles.card20}
                onPress={() =>
                  nav.navigate('MoreStack', {
                    screen: 'GroceryList',
                  })
                }
                activeOpacity={0.7}
              >
                <WidgetLabel
                  style={{
                    marginBottom: 12,
                  }}
                >
                  GROCERY
                </WidgetLabel>
                <Text style={styles.halfNum}>{data.groceries.pending} left</Text>
                <Text style={styles.halfMeta}>
                  {data.groceries.pending > 0
                    ? `${data.groceries.pending} item${data.groceries.pending > 1 ? 's' : ''} on the list`
                    : 'list is clear'}
                </Text>
              </TouchableOpacity>

              {/* ── Feed + Household two-up ── */}
              <View style={styles.twoUp}>
                <TouchableOpacity
                  style={styles.feedCard}
                  onPress={() => nav.navigate('FeedStack')}
                  activeOpacity={0.85}
                >
                  {feedPost?.media?.[0]?.mediaUrl ? (
                    <Image
                      source={{
                        uri: feedPost.media[0].mediaUrl,
                      }}
                      style={styles.feedImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.feedImage, styles.feedPlaceholder]}>
                      <Text
                        style={{
                          fontSize: 26,
                          opacity: 0.5,
                        }}
                      >
                        📸
                      </Text>
                    </View>
                  )}
                  <LinearGradient
                    colors={['rgba(27,30,36,0)', 'rgba(27,30,36,0.55)']}
                    style={styles.feedGradient}
                  />
                  <Text style={styles.feedCaption} numberOfLines={1}>
                    {feedPost?.content || 'Share a moment'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.card,
                    styles.hhCard,
                    {
                      borderRadius: 20,
                    },
                  ]}
                  onPress={() =>
                    nav.navigate('MoreStack', {
                      screen: 'HouseholdSettings',
                    })
                  }
                  activeOpacity={0.7}
                >
                  <WidgetLabel>HOUSEHOLD</WidgetLabel>
                  <View
                    style={{
                      marginTop: 10,
                    }}
                  >
                    <Text style={styles.hhTitle} numberOfLines={1}>
                      {everyoneHome
                        ? "Everyone's home"
                        : latestCheckIn
                          ? 'On the move'
                          : 'No pings yet'}
                    </Text>
                    <Text style={styles.hhMeta} numberOfLines={1}>
                      {everyoneHome
                        ? `${members.length} member${members.length > 1 ? 's' : ''} at home`
                        : latestCheckIn
                          ? `${latestCheckIn.name.split(' ')[0]} arrived · ${latestCheckIn.time}`
                          : 'Tap Ping to share your status'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* ── Quick Actions ── */}
              <Card
                radius={20}
                style={{
                  paddingVertical: 18,
                  paddingHorizontal: 16,
                }}
              >
                <WidgetLabel
                  style={{
                    marginBottom: 14,
                    marginHorizontal: 2,
                  }}
                >
                  QUICK ACTIONS
                </WidgetLabel>
                <View style={styles.qaRow}>
                  {QUICK_ACTIONS.map((q, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.qaItem}
                      onPress={() => handleQuickNotify(q.label)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.qaGlyph}>
                        <Text style={styles.qaGlyphText}>{q.glyph}</Text>
                      </View>
                      <Text style={styles.qaLabel} numberOfLines={1}>
                        {q.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>

              {/* ── Family Activity ── */}
              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    borderRadius: 20,
                    padding: 20,
                  },
                ]}
                onPress={() => nav.navigate('TasksStack')}
                activeOpacity={0.7}
              >
                <WidgetLabel
                  style={{
                    marginBottom: 14,
                  }}
                >
                  FAMILY ACTIVITY
                </WidgetLabel>
                {recentActivity.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No activity yet — complete tasks to see it here
                  </Text>
                ) : (
                  recentActivity.slice(0, 4).map((a, i) => {
                    const verb =
                      a.kind === 'grocery'
                        ? 'bought groceries'
                        : a.kind === 'todo'
                          ? 'finished a todo'
                          : 'completed a task';
                    const date = new Date(a.date);
                    return (
                      <View key={i} style={styles.actRow}>
                        {a.avatarUrl ? (
                          <Image
                            source={{
                              uri: a.avatarUrl,
                            }}
                            style={styles.actAvatar}
                          />
                        ) : (
                          <View
                            style={[
                              styles.actAvatar,
                              {
                                backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                              },
                            ]}
                          >
                            <Text style={styles.actAvatarText}>
                              {a.avatarEmoji || initials(a.displayName)}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.actText} numberOfLines={1}>
                          {a.displayName} {verb}
                        </Text>
                        <Text style={styles.actTime}>
                          {date.toLocaleDateString('en-US', {
                            weekday: 'short',
                          })}
                        </Text>
                      </View>
                    );
                  })
                )}
              </TouchableOpacity>

              {/* ── Vault · LOCKED ── */}
              <TouchableOpacity
                style={[styles.card20, styles.vaultCard]}
                onPress={() =>
                  nav.navigate('MoreStack', {
                    screen: 'Vault',
                  })
                }
                activeOpacity={0.85}
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text style={styles.vaultLabel}>VAULT · LOCKED</Text>
                  <Text style={styles.vaultTitle}>{latestDoc || 'No documents yet'}</Text>
                </View>
                <Text style={styles.vaultTime}>{latestDocTime || ''}</Text>
              </TouchableOpacity>

              {/* ── This Week ── */}
              <View style={styles.insightsCard}>
                <Text style={styles.insightsLabel}>THIS WEEK</Text>
                <Text style={styles.insightsText}>
                  Family completed {activitiesThisWeek} activit
                  {activitiesThisWeek === 1 ? 'y' : 'ies'} this week
                  {topMemberName ? `. ${topMemberName.split(' ')[0]} was the most active.` : ''}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Quick notify modal ── */}
      <Modal
        visible={showPicker}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={mo.overlay}>
          <View
            style={[
              mo.sheet,
              {
                paddingBottom: insets.bottom + spacing.lg,
              },
            ]}
          >
            <View style={mo.handle} />
            <Text style={mo.title}>Notify Members</Text>

            {/* Quick action presets */}
            <View style={mo.chipRow}>
              {QUICK_ACTIONS.map((q) => (
                <TouchableOpacity
                  key={q.label}
                  style={[mo.chip, pendingAction === q.label && mo.chipActive]}
                  onPress={() => selectPreset(q.label)}
                  activeOpacity={0.7}
                >
                  <Text style={[mo.chipText, pendingAction === q.label && mo.chipTextActive]}>
                    {q.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom message */}
            <TextInput
              style={mo.input}
              value={customMsg}
              onChangeText={setCustomMsg}
              placeholder="Type a custom message…"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
            />

            {/* Recipients */}
            <TouchableOpacity
              style={mo.allRow}
              onPress={() => {
                const o = members.filter((m) => m.userId !== user?.id);
                selMembers.size === o.length
                  ? setSelMembers(new Set())
                  : setSelMembers(new Set(o.map((m) => m.userId)));
              }}
              activeOpacity={0.7}
            >
              <Text style={mo.allText}>Notify All</Text>
              <View style={[mo.cb, selMembers.size > 0 && mo.cbOn]}>
                {selMembers.size > 0 && <CheckIcon size={10} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
            <ScrollView style={mo.list} keyboardShouldPersistTaps="handled">
              {members
                .filter((m) => m.userId !== user?.id)
                .map((m) => {
                  const checked = selMembers.has(m.userId);
                  return (
                    <TouchableOpacity
                      key={m.userId}
                      style={[mo.mRow, checked && mo.mRowSel]}
                      onPress={() => {
                        const n = new Set(selMembers);
                        checked ? n.delete(m.userId) : n.add(m.userId);
                        setSelMembers(n);
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <View
                          style={[
                            mo.mAv,
                            {
                              backgroundColor:
                                AVATAR_COLORS[
                                  Math.abs(m.userId?.charCodeAt(0) || 0) % AVATAR_COLORS.length
                                ],
                            },
                          ]}
                        >
                          <Text style={mo.mAvText}>
                            {initials(m.displayName || m.name || m.email || '??')}
                          </Text>
                        </View>
                        <Text style={mo.mName}>{m.displayName || m.name || m.email}</Text>
                      </View>
                      <View style={[mo.cb, checked && mo.cbOn]}>
                        {checked && <CheckIcon size={10} color="#FFFFFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
            <View style={mo.actions}>
              <TouchableOpacity
                style={mo.cancelBtn}
                onPress={() => setShowPicker(false)}
                activeOpacity={0.7}
              >
                <Text style={mo.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[mo.sendBtn, !canSend && mo.sendBtnDisabled]}
                onPress={handleSendNotify}
                disabled={!canSend || sending}
                activeOpacity={0.7}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={mo.sendText}>Notify ({selMembers.size})</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
function CheckIcon({ size = 10, color = '#FFFFFF' }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size * 0.6,
          height: size * 0.35,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
          transform: [
            {
              rotate: '-45deg',
            },
          ],
          marginTop: -2,
        }}
      />
    </View>
  );
}

/* ═══════════════════ Styles ═══════════════════ */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E9E6E0',
  },
  scroll: {
    flex: 1,
  },
  // Notification bell (top-right, pinned over hero photo)
  notifBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
    elevation: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(27,30,36,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#757A80',
  },
  /* Cards */
  card: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    marginBottom: 14,
    shadowColor: INK,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 3,
  },
  card20: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: INK,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 3,
  },
  widgetLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    fontFamily: 'Inter_600SemiBold',
  },
  /* Photo layer — fixed behind scroll content, sticks at top */
  photoLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  /* Frosted glass card */
  frost: {
    borderRadius: 26,
    marginHorizontal: 20,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    shadowColor: INK,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 8,
  },
  frostDate: {
    fontSize: 11,
    color: '#6B6153',
    marginBottom: 5,
  },
  frostGreeting: {
    fontSize: 22,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.2,
    marginBottom: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  avatarStack: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarEmoji: {
    fontSize: 15,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  frostDivider: {
    height: 1,
    backgroundColor: 'rgba(42,46,51,0.1)',
    marginBottom: 16,
  },
  streakTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  streakNum: {
    fontSize: 18,
    fontWeight: '700',
    color: INK,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  streakBars: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  streakBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  streakLabels: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  streakLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: '#757A80',
  },
  streakSub: {
    fontSize: 12,
    lineHeight: 17,
    color: '#6B6153',
  },
  /* Body — cards scroll over the photo */
  body: {
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  retryBtn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  greenDelta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B8F5A',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 6,
  },
  scoreNum: {
    fontSize: 40,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.8,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  scoreMeta: {
    fontSize: 13,
    color: '#757A80',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ECEAE5',
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: GOLD,
  },
  scoreCaption: {
    fontSize: 12,
    lineHeight: 17,
    color: '#757A80',
    marginBottom: 18,
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  lbMedal: {
    fontSize: 16,
    fontWeight: '600',
    width: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  lbName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: INK,
  },
  lbPts: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757A80',
    fontFamily: 'Inter_500Medium',
  },
  emptyText: {
    fontSize: 13,
    color: '#757A80',
    paddingVertical: 6,
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  focusRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAE5',
  },
  focusTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: INK,
    fontFamily: 'Inter_500Medium',
    marginRight: 10,
  },
  focusMeta: {
    fontSize: 13,
    color: '#757A80',
  },
  calMonth: {
    fontSize: 12,
    fontWeight: '500',
    color: '#757A80',
  },
  weekStrip: {
    flexDirection: 'row',
    marginBottom: 14,
    marginTop: 14,
  },
  weekCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weekLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A6ABB0',
  },
  weekDay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNum: {
    fontSize: 12,
    fontWeight: '600',
  },
  weekDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calDivider: {
    height: 1,
    backgroundColor: '#ECEAE5',
    marginBottom: 12,
  },
  calEvent: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
    marginBottom: 3,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  calMeta: {
    fontSize: 12,
    color: '#757A80',
  },
  calControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calArrow: {
    fontSize: 20,
    fontWeight: '600',
    color: INK,
    lineHeight: 22,
  },
  weekDaySelected: {
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  calEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  calEventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
  },
  calEventTime: {
    fontSize: 12,
    color: '#A6ABB0',
    marginLeft: 'auto',
  },
  twoUp: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  halfCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: INK,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 3,
  },
  halfNum: {
    fontSize: 24,
    fontWeight: '700',
    color: INK,
    marginBottom: 4,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  balanceNum: {
    color: '#B54B3A',
    fontSize: 20,
  },
  halfMeta: {
    fontSize: 12,
    color: '#757A80',
  },
  feedCard: {
    flex: 1.2,
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    height: 130,
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  feedPlaceholder: {
    backgroundColor: '#E1E6EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  feedCaption: {
    position: 'absolute',
    left: 14,
    bottom: 12,
    right: 14,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  hhCard: {
    padding: 18,
    marginBottom: 0,
    flex: 1,
  },
  hhTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
    marginBottom: 4,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  hhMeta: {
    fontSize: 12,
    color: '#757A80',
  },
  qaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qaItem: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  qaGlyph: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E1E6EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaGlyphText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#45566B',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  qaLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#757A80',
    textAlign: 'center',
  },
  actRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
  },
  actAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E1E6EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actAvatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#45566B',
  },
  actText: {
    flex: 1,
    fontSize: 13,
    color: INK,
  },
  actTime: {
    fontSize: 11,
    color: '#A6ABB0',
  },
  vaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1B1E24',
  },
  vaultLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: '#9CA3AC',
    marginBottom: 8,
  },
  vaultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  vaultTime: {
    fontSize: 11,
    fontWeight: '500',
    color: GOLD,
    fontFamily: 'Inter_500Medium',
  },
  insightsCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#E9E6E0',
    marginBottom: 14,
  },
  insightsLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: '#45566B',
    marginBottom: 10,
  },
  insightsText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: INK,
    fontFamily: 'Inter_600SemiBold',
  },
});

/* ── Modal ── */
/* Notify Members sheet — design-system tokens (colors/fonts/spacing/radius) */
const mo = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(27,30,36,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xxl,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: fonts.display,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  // Preset action chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.surface,
  },
  // Custom message input
  input: {
    minHeight: 72,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.ink,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  // Recipients
  allRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  allText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  list: {
    maxHeight: 240,
  },
  mRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderCool,
  },
  mRowSel: {
    backgroundColor: colors.goldLight,
  },
  mAv: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mAvText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fonts.bodyBold,
    color: colors.surface,
  },
  mName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
  },
  cb: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  cbOn: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  // Footer actions
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: radius.md,
    backgroundColor: colors.canvasElevated,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.bodySemiBold,
    color: colors.textSecondary,
  },
  sendBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
  sendText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.surface,
  },
});

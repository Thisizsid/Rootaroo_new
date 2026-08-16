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
import Svg, { Circle, SvgXml } from 'react-native-svg';
import { dashboardApi } from '../shared/api/dashboard';
import * as NavigationBar from 'expo-navigation-bar';
import { useAuthStore } from '../shared/store/authStore';
import { householdApi } from '../shared/api/household';
import { feedApi } from '../shared/api/feed';
import { taskApi } from '../shared/api/task';
import { todoApi } from '../shared/api/todo';
import { expenseApi } from '../shared/api/expense';
import { vaultApi } from '../shared/api/vault';
import { eventApi } from '../shared/api/event';
import { checkInApi } from '../shared/api/checkin';
import { colors, fonts, spacing, radius, withAlpha } from '../shared/theme';
import Avatar from '../components/Avatar';

// Family cover photo (Boss's pick, 2026-08-01) — default hero image
const FAMILY_COVER = require('../../assets/images/family-cover.png');

/* ═══════════════════════════════════════════════
   Dashboard · Night glass
   Deep navy ambient field · frosted translucent
   cards · gold ember accents. Same widgets and
   data as before — restyled for the dark theme.
   ═══════════════════════════════════════════════ */

const GOLD = colors.goldGlow;

/* Ambient navy field — radial washes behind the glass. Stretched to fill. */
const AMBIENT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
  <defs>
    <radialGradient id="lift" cx="0.12" cy="-0.06" r="0.75">
      <stop offset="0" stop-color="${colors.navyLift}" stop-opacity="1"/>
      <stop offset="1" stop-color="${colors.navyLift}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ember" cx="0.96" cy="0.10" r="0.55">
      <stop offset="0" stop-color="${colors.goldGlow}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${colors.goldGlow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="floor" cx="0.5" cy="1.05" r="0.65">
      <stop offset="0" stop-color="${colors.navyMid}" stop-opacity="1"/>
      <stop offset="1" stop-color="${colors.navyMid}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" fill="${colors.navyBase}"/>
  <rect width="100" height="100" fill="url(#lift)"/>
  <rect width="100" height="100" fill="url(#ember)"/>
  <rect width="100" height="100" fill="url(#floor)"/>
</svg>`;

// Notification bell (Feather "bell") — Dashboard top-right, over the hero photo.
const BELL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${colors.textOnDark}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

/* ── Widget label (11px w600 ls 0.5, muted slate) ── */
function WidgetLabel({ children, color = colors.textOnDarkLabel, style }) {
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

/* ── Glass card (translucent white over the navy field) ── */
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

/* ── Streak ring — SVG arc, gold sweep over a faint track ── */
function StreakRing({ value, progress }) {
  const size = 92;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={withAlpha(colors.white, 0.1)}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={GOLD}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringInner} pointerEvents="none">
        <Text style={styles.ringNum}>{value}</Text>
        <Text style={styles.ringUnit}>DAYS</Text>
      </View>
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
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(null);
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

  // Streak strip — which of the 7 days the detail line describes (6 = today)
  const [streakIdx, setStreakIdx] = useState(6);

  // Quick notify
  const [showPicker, setShowPicker] = useState(false);
  const [pendingAction, setPendingAction] = useState('');
  const [customMsg, setCustomMsg] = useState('');
  const [selMembers, setSelMembers] = useState(new Set());
  const [sending, setSending] = useState(false);

  // Nudge — reminder tied to a specific pending task/todo
  const [nudgeItems, setNudgeItems] = useState([]);
  const [nudgeItemsLoading, setNudgeItemsLoading] = useState(false);
  const [selectedNudgeItem, setSelectedNudgeItem] = useState(null);
  const load = useCallback(async () => {
    setFetchError(false);
    try {
      const [d, m, hh] = await Promise.all([
        dashboardApi.get(),
        householdId ? householdApi.getMembers(householdId) : Promise.resolve([]),
        householdId ? householdApi.getHousehold(householdId) : Promise.resolve(null),
      ]);
      setData(d);
      setMembers(m);
      setCoverPhotoUrl(hh?.coverPhotoUrl || null);

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
    // Dark screen → dark system nav bar; restore the light chrome on the way out.
    NavigationBar.setBackgroundColorAsync(colors.navyDeep);
    NavigationBar.setButtonStyleAsync('light');
    return () => {
      NavigationBar.setBackgroundColorAsync(colors.surface);
      NavigationBar.setButtonStyleAsync('dark');
    };
  }, []);
  const activity = data?.activity || [];
  const recentActivity = data?.recentActivity || [];
  const completedToday = data?.tasks.completedToday || 0;

  /* ── Streak: 7 day pills ── */
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
        done,
        isToday,
        total,
        label: d.date
          ? new Date(d.date).toLocaleDateString('en-US', {
              weekday: 'narrow',
            })
          : '',
      };
    });
  })();
  const doneCount = streakDays.filter((d) => d.done).length;
  const selDay = streakDays[streakIdx] || streakDays[6];
  const streakDetail = selDay?.isToday
    ? completedToday > 0
      ? `${completedToday} task${completedToday > 1 ? 's' : ''} completed today — keep it going.`
      : 'No completions yet today — complete a task to keep the streak alive.'
    : selDay?.total > 0
      ? `${selDay.total} activit${selDay.total === 1 ? 'y' : 'ies'} completed this day.`
      : 'No activity recorded this day.';
  const streakDetailMeta = selDay?.isToday ? 'TODAY' : selDay?.label || '';
  const bestStreak = data?.streak?.longest ?? data?.streak?.best ?? null;

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
      glyph: '🔔',
      label: 'Nudge',
      template: '',
    },
  ];
  const handleQuickNotify = (action) => {
    const q = QUICK_ACTIONS.find((x) => x.label === action);
    setPendingAction(q?.label || action);
    setCustomMsg(q?.template || '');
    setSelMembers(new Set());
    setNudgeItems([]);
    setSelectedNudgeItem(null);
    setShowPicker(true);
  };
  const selectPreset = (label) => {
    const q = QUICK_ACTIONS.find((x) => x.label === label);
    setPendingAction(q?.label || '');
    setCustomMsg(q?.template || '');
    setNudgeItems([]);
    setSelectedNudgeItem(null);
    if (label === 'Nudge' && selMembers.size > 1) {
      setSelMembers(new Set(Array.from(selMembers).slice(0, 1)));
    }
  };

  // Nudge: fetch the single selected recipient's pending tasks + todos
  useEffect(() => {
    if (pendingAction !== 'Nudge' || selMembers.size !== 1) {
      return;
    }
    const memberId = Array.from(selMembers)[0];
    let cancelled = false;
    setNudgeItemsLoading(true);
    Promise.all([
      taskApi.list({ group: 'pending' }).catch(() => []),
      todoApi.list().catch(() => ({ pending: [] })),
    ])
      .then(([taskRes, todoRes]) => {
        if (cancelled) return;
        const tasks = Array.isArray(taskRes) ? taskRes : taskRes?.pending || [];
        const todos = todoRes?.pending || [];
        const items = [
          ...tasks
            .filter((t) => t.assignees?.some((a) => a.id === memberId))
            .map((t) => ({ id: t.id, title: t.title, kind: 'task' })),
          ...todos
            .filter((t) => t.assignedTo?.id === memberId)
            .map((t) => ({ id: t.id, title: t.title, kind: 'todo' })),
        ];
        setNudgeItems(items);
      })
      .finally(() => {
        if (!cancelled) setNudgeItemsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pendingAction, selMembers]);

  const handleSelectNudgeItem = (item) => {
    setSelectedNudgeItem(item);
    setCustomMsg(`Reminder: "${item.title}" is still pending`);
  };

  const canSend = selMembers.size > 0 && (customMsg.trim().length > 0 || !!pendingAction);
  const handleSendNotify = async () => {
    const ids = Array.from(selMembers);
    if (!ids.length) return;
    const msg = customMsg.trim();
    const action = pendingAction === 'Nudge' ? 'nudged you' : pendingAction || 'sent you a message';
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
        <StatusBar barStyle="light-content" backgroundColor={colors.navyDeep} />
        <SvgXml xml={AMBIENT_SVG} width="100%" height="100%" style={styles.ambient} />
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
      color: isToday ? colors.navyDeep : colors.textOnDarkBody,
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

      {/* ═══════ AMBIENT NAVY FIELD (behind everything) ═══════ */}
      <SvgXml xml={AMBIENT_SVG} width="100%" height="100%" style={styles.ambient} />

      {/* ═══════ SELF AVATAR (top-left, pinned over the hero photo) ═══════ */}
      <TouchableOpacity
        style={[
          styles.selfAvatarBtn,
          {
            top: insets.top + 20,
          },
        ]}
        onPress={() => nav.navigate('MoreStack', { screen: 'EditProfile' })}
        activeOpacity={0.8}
        hitSlop={{
          top: 8,
          bottom: 8,
          left: 8,
          right: 8,
        }}
      >
        <Avatar
          url={user?.avatarUrl}
          emoji={user?.avatarEmoji}
          name={user?.name}
          id={user?.id}
          size={46}
          style={styles.selfAvatarRing}
        />
      </TouchableOpacity>

      {/* ═══════ NOTIFICATION BELL (top-right, pinned over the hero photo) ═══════ */}
      <TouchableOpacity
        style={[
          styles.notifBtn,
          {
            top: insets.top + 23,
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

      {/* ═══════ FIXED LAYER: family photo dissolves into the navy field ═══════ */}
      <View
        style={[
          styles.photoLayer,
          {
            height: 300,
          },
        ]}
        pointerEvents="none"
      >
        <Image
          source={
            coverPhotoUrl
              ? {
                  uri: coverPhotoUrl,
                }
              : FAMILY_COVER
          }
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[
            withAlpha(colors.navyDeep, 0.55),
            withAlpha(colors.navyDeep, 0.82),
            colors.navyDeep,
          ]}
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
        {/* Spacer keeps the photo visible above the scroll body */}
        <View
          style={{
            height: 168 - insets.top,
          }}
        />

        {/* ═══════ GREETING (sits directly on the field) ═══════ */}
        <View style={styles.greetBlock}>
          <Text style={styles.greetDate}>{formatDate()}</Text>
          <View style={styles.greetRow}>
            <Text style={styles.greetTitle} numberOfLines={2}>
              {getGreeting()} {user?.name?.split(' ')[0] || 'there'}
            </Text>

            {/* Member avatars — other household members only, not yourself */}
            <View style={styles.avatarStack}>
              {members.filter((m) => m.userId !== user?.id).slice(0, 5).map((m, i) => (
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
                          backgroundColor: withAlpha(colors.white, 0.1),
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
                          backgroundColor: withAlpha(colors.white, 0.1),
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
          </View>
        </View>

        {/* ═══════ BODY ═══════ */}
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
                  color: colors.textOnDarkMuted,
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
              {/* ── Family Streak (hero) ── */}
              <BlurView intensity={22} tint="dark" style={styles.streakCard}>
                <View style={styles.rowBetween}>
                  <WidgetLabel>FAMILY STREAK</WidgetLabel>
                  {bestStreak != null && (
                    <View style={styles.bestChip}>
                      <Text style={styles.bestChipText}>BEST {bestStreak}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.streakBody}>
                  <StreakRing value={data?.streak?.current ?? 0} progress={doneCount / 7} />
                  <View style={styles.streakCopy}>
                    <Text style={styles.streakHeadline}>
                      {doneCount >= 7
                        ? 'Perfect week — everyone showed up.'
                        : `${7 - doneCount} more day${7 - doneCount === 1 ? '' : 's'} to a full week`}
                    </Text>
                    <Text style={styles.streakSub}>
                      {doneCount} of the last 7 days had activity.
                    </Text>
                    <View style={styles.progressTrack}>
                      <LinearGradient
                        colors={[colors.goldGlowDeep, GOLD]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.round((doneCount / 7) * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>

                {/* 7 day pills */}
                <View style={styles.pillRow}>
                  {streakDays.map((d, i) => {
                    const sel = i === streakIdx;
                    return (
                      <TouchableOpacity
                        key={i}
                        style={styles.pillCol}
                        onPress={() => setStreakIdx(i)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.pill,
                            d.done && styles.pillDone,
                            sel && styles.pillSelected,
                          ]}
                        >
                          <Text style={[styles.pillGlyph, d.done && styles.pillGlyphDone]}>
                            {d.done ? '✓' : '·'}
                          </Text>
                        </View>
                        <Text style={[styles.pillLabel, sel && styles.pillLabelSel]}>
                          {d.label || '·'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.streakFooter}>
                  <Text style={styles.streakDetail}>{streakDetail}</Text>
                  {!!streakDetailMeta && (
                    <Text style={styles.streakDetailMeta}>{streakDetailMeta}</Text>
                  )}
                </View>
              </BlurView>

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
                  <LinearGradient
                    colors={[colors.goldGlowDeep, GOLD]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
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
                    <Text style={[styles.lbRank, i === 0 && styles.lbRankTop]}>
                      {String(i + 1).padStart(2, '0')}
                    </Text>
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
                    colors={[withAlpha(colors.navyDark, 0), withAlpha(colors.navyDark, 0.8)]}
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
                          <View style={styles.actAvatar}>
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
                style={styles.vaultCard}
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
                  <Text style={styles.vaultTitle} numberOfLines={1}>
                    {latestDoc || 'No documents yet'}
                  </Text>
                </View>
                <Text style={styles.vaultTime}>{latestDocTime || ''}</Text>
              </TouchableOpacity>

              {/* ── This Week ── */}
              <Card radius={20} style={{ padding: 20 }}>
                <WidgetLabel
                  style={{
                    marginBottom: 10,
                  }}
                >
                  THIS WEEK
                </WidgetLabel>
                <Text style={styles.insightsText}>
                  Family completed {activitiesThisWeek} activit
                  {activitiesThisWeek === 1 ? 'y' : 'ies'} this week
                  {topMemberName ? `. ${topMemberName.split(' ')[0]} was the most active.` : ''}
                </Text>
              </Card>
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
              placeholderTextColor={colors.textOnDarkDim}
              multiline
              maxLength={500}
            />

            {/* Recipients */}
            {pendingAction !== 'Nudge' && (
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
                  {selMembers.size > 0 && <CheckIcon size={10} color={colors.navyDeep} />}
                </View>
              </TouchableOpacity>
            )}
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
                        if (pendingAction === 'Nudge') {
                          setSelectedNudgeItem(null);
                          setCustomMsg('');
                          setSelMembers(checked ? new Set() : new Set([m.userId]));
                          return;
                        }
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
                        <Avatar
                          url={m.avatarUrl}
                          emoji={m.avatarEmoji}
                          name={m.displayName || m.name || m.email || '??'}
                          id={m.userId}
                          size={36}
                        />
                        <Text style={mo.mName}>{m.displayName || m.name || m.email}</Text>
                      </View>
                      <View style={[mo.cb, checked && mo.cbOn]}>
                        {checked && <CheckIcon size={10} color={colors.navyDeep} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            {/* Nudge: their pending tasks/todos */}
            {pendingAction === 'Nudge' && selMembers.size === 1 && (
              <View style={mo.nudgeSection}>
                <Text style={mo.nudgeSectionLabel}>PENDING FOR THEM</Text>
                {nudgeItemsLoading ? (
                  <ActivityIndicator size="small" color={colors.gold} style={mo.nudgeLoading} />
                ) : nudgeItems.length === 0 ? (
                  <Text style={mo.nudgeEmpty}>No pending tasks or todos right now.</Text>
                ) : (
                  <ScrollView style={mo.nudgeList} keyboardShouldPersistTaps="handled">
                    {nudgeItems.map((item) => {
                      const picked = selectedNudgeItem?.id === item.id && selectedNudgeItem?.kind === item.kind;
                      return (
                        <TouchableOpacity
                          key={`${item.kind}-${item.id}`}
                          style={[mo.mRow, picked && mo.mRowSel]}
                          onPress={() => handleSelectNudgeItem(item)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 12,
                              flex: 1,
                            }}
                          >
                            <Text style={mo.nudgeItemGlyph}>{item.kind === 'task' ? '📋' : '📝'}</Text>
                            <Text style={mo.mName} numberOfLines={1}>
                              {item.title}
                            </Text>
                          </View>
                          {picked && <CheckIcon size={12} color={colors.gold} />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}
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
                  <ActivityIndicator size="small" color={colors.navyDeep} />
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
function CheckIcon({ size = 10, color = colors.navyDeep }) {
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
/* Glass recipe: translucent white fill + hairline white border + deep drop
   shadow. Repeated on every card so they read as one material. */
const GLASS_FILL = withAlpha(colors.white, 0.045);
const GLASS_FILL_LIFT = withAlpha(colors.white, 0.055);
const GLASS_BORDER = withAlpha(colors.white, 0.09);
const GLASS_BORDER_LIFT = withAlpha(colors.white, 0.1);
const GLASS_HAIRLINE = withAlpha(colors.white, 0.06);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  ambient: {
    ...StyleSheet.absoluteFillObject,
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
    backgroundColor: withAlpha(colors.white, 0.1),
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfAvatarBtn: {
    position: 'absolute',
    left: 24,
    zIndex: 30,
    elevation: 30,
  },
  selfAvatarRing: {
    borderWidth: 2,
    borderColor: withAlpha(colors.surface, 0.85),
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textOnDarkMuted,
  },
  /* Glass cards */
  card: {
    backgroundColor: GLASS_FILL,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    padding: 22,
    marginBottom: 14,
    shadowColor: colors.navyDark,
    shadowOffset: {
      width: 0,
      height: 18,
    },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 6,
  },
  card20: {
    backgroundColor: GLASS_FILL,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: colors.navyDark,
    shadowOffset: {
      width: 0,
      height: 18,
    },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 6,
  },
  widgetLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'Inter_600SemiBold',
  },
  /* Photo layer — fixed behind scroll content, fades into the navy field */
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
  /* Greeting */
  greetBlock: {
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  greetDate: {
    fontSize: 11,
    letterSpacing: 0.3,
    color: colors.textOnDarkFaint,
    marginBottom: 8,
  },
  greetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  greetTitle: {
    flex: 1,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
    color: colors.textOnDark,
    letterSpacing: -0.4,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  avatarStack: {
    flexDirection: 'row',
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
    borderColor: withAlpha(colors.navyDeep, 0.9),
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textOnDarkBody,
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
    backgroundColor: colors.successOnDark,
    borderWidth: 2,
    borderColor: colors.navyDeep,
  },
  /* Body */
  body: {
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
    color: colors.navyDeep,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  /* ── Streak hero ── */
  streakCard: {
    borderRadius: 26,
    overflow: 'hidden',
    padding: 20,
    marginBottom: 14,
    backgroundColor: GLASS_FILL_LIFT,
    borderWidth: 1,
    borderColor: GLASS_BORDER_LIFT,
  },
  bestChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: withAlpha(colors.goldGlow, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.goldGlow, 0.25),
  },
  bestChipText: {
    fontSize: 10,
    fontWeight: '500',
    color: GOLD,
    fontFamily: fonts.mono,
  },
  streakBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 12,
    marginBottom: 18,
  },
  ringWrap: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNum: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textOnDark,
    letterSpacing: -0.6,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  ringUnit: {
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '500',
    color: colors.textOnDarkMuted,
    marginTop: 2,
  },
  streakCopy: {
    flex: 1,
  },
  streakHeadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textOnDark,
    marginBottom: 6,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  streakSub: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textOnDarkMuted,
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  pillCol: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
  },
  pill: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.white, 0.06),
    borderWidth: 1,
    borderColor: GLASS_BORDER_LIFT,
  },
  pillDone: {
    backgroundColor: withAlpha(colors.goldGlow, 0.2),
    borderColor: withAlpha(colors.goldGlow, 0.32),
  },
  pillSelected: {
    borderColor: withAlpha(colors.goldGlow, 0.75),
  },
  pillGlyph: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textOnDarkFaint,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  pillGlyphDone: {
    color: colors.goldGlowPale,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textOnDarkFaint,
  },
  pillLabelSel: {
    color: GOLD,
  },
  streakFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: withAlpha(colors.white, 0.08),
    paddingTop: 12,
  },
  streakDetail: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textOnDarkLabel,
  },
  streakDetailMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: GOLD,
    fontFamily: fonts.mono,
  },
  /* ── Harmony ── */
  greenDelta: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.successOnDark,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 8,
  },
  scoreNum: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textOnDark,
    letterSpacing: -0.8,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  scoreMeta: {
    fontSize: 13,
    color: colors.textOnDarkMuted,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: withAlpha(colors.white, 0.1),
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreCaption: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textOnDarkMuted,
    marginBottom: 14,
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: GLASS_HAIRLINE,
  },
  lbRank: {
    width: 20,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textOnDarkLabel,
    fontFamily: fonts.mono,
  },
  lbRankTop: {
    color: GOLD,
  },
  lbName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textOnDarkBody,
  },
  lbPts: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textOnDarkMuted,
    fontFamily: fonts.mono,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textOnDarkMuted,
    paddingVertical: 6,
  },
  /* ── Focus ── */
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  focusRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: GLASS_HAIRLINE,
  },
  focusTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textOnDarkSoft,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginRight: 10,
  },
  focusMeta: {
    fontSize: 13,
    color: colors.textOnDarkMuted,
  },
  /* ── Calendar ── */
  calMonth: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textOnDarkMuted,
  },
  weekStrip: {
    flexDirection: 'row',
    marginBottom: 14,
    marginTop: 16,
  },
  weekCol: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  weekLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textOnDarkDim,
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
    backgroundColor: withAlpha(colors.white, 0.08),
    marginBottom: 12,
  },
  calEvent: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnDarkSoft,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  calMeta: {
    fontSize: 12,
    color: colors.textOnDarkMuted,
  },
  calControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calArrow: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textOnDarkBody,
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
    color: colors.textOnDarkDim,
    marginLeft: 'auto',
  },
  /* ── Two-up ── */
  twoUp: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  halfCard: {
    flex: 1,
    backgroundColor: GLASS_FILL,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 20,
    padding: 18,
    shadowColor: colors.navyDark,
    shadowOffset: {
      width: 0,
      height: 18,
    },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 6,
  },
  halfNum: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textOnDark,
    marginBottom: 5,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  balanceNum: {
    color: colors.dangerOnDark,
    fontSize: 20,
  },
  halfMeta: {
    fontSize: 12,
    color: colors.textOnDarkMuted,
  },
  feedCard: {
    flex: 1.2,
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    height: 130,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  feedPlaceholder: {
    backgroundColor: colors.navySurface,
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
    color: colors.white,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  hhCard: {
    padding: 18,
    marginBottom: 0,
    flex: 1,
    justifyContent: 'space-between',
  },
  hhTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnDarkSoft,
    marginBottom: 4,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  hhMeta: {
    fontSize: 12,
    color: colors.textOnDarkMuted,
  },
  /* ── Quick actions ── */
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
    backgroundColor: withAlpha(colors.white, 0.07),
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaGlyphText: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  qaLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textOnDarkMuted,
    textAlign: 'center',
  },
  /* ── Activity ── */
  actRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: GLASS_HAIRLINE,
  },
  actAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: withAlpha(colors.white, 0.09),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actAvatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textOnDarkBody,
  },
  actText: {
    flex: 1,
    fontSize: 13,
    color: colors.textOnDarkBody,
  },
  actTime: {
    fontSize: 11,
    color: colors.textOnDarkDim,
  },
  /* ── Vault (gold-tinted glass) ── */
  vaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    backgroundColor: withAlpha(colors.goldGlow, 0.07),
    borderWidth: 1,
    borderColor: withAlpha(colors.goldGlow, 0.22),
    shadowColor: colors.navyDark,
    shadowOffset: {
      width: 0,
      height: 18,
    },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 6,
  },
  vaultLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.goldGlowDim,
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  vaultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textOnDark,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  vaultTime: {
    fontSize: 11,
    fontWeight: '500',
    color: GOLD,
    fontFamily: fonts.mono,
  },
  insightsText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textOnDarkSoft,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});

/* ── Modal ── */
/* Notify Members sheet — night glass to match the screen it opens from. */
const mo = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: withAlpha(colors.navyDark, 0.7),
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.navyBase,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    borderTopWidth: 1,
    borderColor: GLASS_BORDER,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xxl,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: withAlpha(colors.white, 0.18),
    alignSelf: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: fonts.display,
    color: colors.textOnDark,
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
    backgroundColor: withAlpha(colors.white, 0.06),
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  chipActive: {
    backgroundColor: colors.goldGlow,
    borderColor: colors.goldGlow,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.textOnDarkBody,
  },
  chipTextActive: {
    color: colors.navyDeep,
  },
  // Custom message input
  input: {
    minHeight: 72,
    backgroundColor: withAlpha(colors.white, 0.05),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textOnDark,
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
    borderBottomColor: GLASS_BORDER,
  },
  allText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.textOnDark,
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
    borderBottomColor: GLASS_HAIRLINE,
  },
  mRowSel: {
    backgroundColor: withAlpha(colors.goldGlow, 0.1),
  },
  mName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.textOnDarkBody,
  },
  cb: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: withAlpha(colors.white, 0.2),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cbOn: {
    backgroundColor: colors.goldGlow,
    borderColor: colors.goldGlow,
  },
  // Nudge: pending items for the selected recipient
  nudgeSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nudgeSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.bodySemiBold,
    color: colors.textFaint,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  nudgeList: {
    maxHeight: 180,
  },
  nudgeLoading: {
    marginVertical: spacing.lg,
  },
  nudgeEmpty: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textFaint,
    paddingVertical: spacing.md,
  },
  nudgeItemGlyph: {
    fontSize: 16,
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
    backgroundColor: withAlpha(colors.white, 0.07),
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.bodySemiBold,
    color: colors.textOnDarkMuted,
  },
  sendBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: radius.md,
    backgroundColor: colors.goldGlow,
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
  sendText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.navyDeep,
  },
});

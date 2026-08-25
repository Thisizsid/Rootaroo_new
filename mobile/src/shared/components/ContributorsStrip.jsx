import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, PanResponder, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius, withAlpha } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
// Two layers of horizontal padding sit outside this component: the screen
// body wrapper (20 each side) and the Family Streak card itself (20 each
// side) — subtract all 80px so the chip fills exactly the card's content width.
const CHIP_W = SCREEN_W - 80;
const AUTOPLAY_INTERVAL = 2800;
const SLIDE_DURATION = 420;
const SWIPE_THRESHOLD = CHIP_W * 0.22;

// Card background stays the same navy-glass gradient for every kind — same
// family as every other card on this screen. Only the accent (avatar ring +
// icon badge) differs per kind, drawn from the app's existing muted avatar
// pastel set (already tuned for legibility on navy, already used elsewhere
// for per-item variety) rather than an unrelated rainbow of saturated hues.
// Gold stays reserved for the XP badge — the one honey accent, spent only on
// the actual "you earned points" moment, per the app's own design language.
const CARD_GRADIENT = [colors.navyLift, colors.navySurface];
const KIND_STYLE = {
  task: { accent: colors.avatarSky, icon: '✅' },
  todo: { accent: colors.avatarMoss, icon: '📝' },
  grocery: { accent: colors.avatarSage, icon: '🛒' },
  feed: { accent: colors.avatarLilac, icon: '📸' },
  ping: { accent: colors.avatarPeach, icon: '📍' },
  checkin: { accent: colors.avatarSlate, icon: '🧭' },
  calendar: { accent: colors.avatarMauve, icon: '📅' },
};
const DEFAULT_KIND_STYLE = KIND_STYLE.task;

function initials(name) {
  return (name || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function verbFor(kind) {
  if (kind === 'grocery') return 'bought groceries';
  if (kind === 'todo') return 'finished a todo';
  if (kind === 'ping') return 'pinged the household';
  if (kind === 'checkin') return 'checked in';
  if (kind === 'calendar') return 'added an event';
  if (kind === 'feed') return 'shared a post';
  return 'completed a task';
}

export default function ContributorsStrip({ activity }) {
  const items = (activity || []).slice(0, 8);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0.9)).current;
  const dragBase = useRef(0);
  const autoplayTimer = useRef(null);

  const playBounce = () => {
    bounce.setValue(0.9);
    Animated.spring(bounce, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  };

  const goToPage = (page) => {
    if (!items.length) return;
    const clamped = ((page % items.length) + items.length) % items.length;
    Animated.timing(translateX, {
      toValue: -clamped * CHIP_W,
      duration: SLIDE_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      activeIndexRef.current = clamped;
      setActiveIndex(clamped);
      playBounce();
    });
  };

  const stopAutoplay = () => {
    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current);
      autoplayTimer.current = null;
    }
  };
  const startAutoplay = () => {
    stopAutoplay();
    if (items.length < 2) return;
    autoplayTimer.current = setInterval(() => {
      goToPage(activeIndexRef.current + 1);
    }, AUTOPLAY_INTERVAL);
  };

  useEffect(() => {
    playBounce();
    startAutoplay();
    return stopAutoplay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const goToChip = (idx) => {
    stopAutoplay();
    goToPage(idx);
    startAutoplay();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        stopAutoplay();
        translateX.stopAnimation((value) => {
          dragBase.current = value;
        });
      },
      onPanResponderMove: (_, g) => {
        const raw = dragBase.current + g.dx;
        const min = -(items.length - 1) * CHIP_W;
        const overdrag = raw > 0 ? raw * 0.3 : raw < min ? min + (raw - min) * 0.3 : raw;
        translateX.setValue(overdrag);
      },
      onPanResponderRelease: (_, g) => {
        const passedThreshold = Math.abs(g.dx) > SWIPE_THRESHOLD || Math.abs(g.vx) > 0.5;
        let target = activeIndexRef.current;
        if (passedThreshold) target += g.dx < 0 ? 1 : -1;
        goToPage(target);
        startAutoplay();
      },
    }),
  ).current;

  if (!items.length) {
    return <Text style={styles.emptyText}>No activity yet</Text>;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.viewport} {...panResponder.panHandlers}>
        <Animated.View
          style={{
            flexDirection: 'row',
            width: CHIP_W * items.length,
            transform: [{ translateX }],
          }}
        >
          {items.map((a, i) => {
            const kindStyle = KIND_STYLE[a.kind] || DEFAULT_KIND_STYLE;
            const isActive = i === activeIndex;
            return (
              <View key={i} style={[styles.chipSlot, { width: CHIP_W }]}>
                <Animated.View
                  style={[
                    styles.chipAnimatedWrap,
                    isActive && { transform: [{ scale: bounce }] },
                  ]}
                >
                  <LinearGradient
                    colors={CARD_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.chip}
                  >
                    <View style={[styles.accentBar, { backgroundColor: kindStyle.accent }]} />

                    <View style={styles.avatarWrap}>
                      {a.avatarUrl ? (
                        <Image source={{ uri: a.avatarUrl }} style={[styles.avatar, { borderColor: kindStyle.accent }]} />
                      ) : (
                        <View style={[styles.avatar, { borderColor: kindStyle.accent, backgroundColor: withAlpha(colors.white, 0.08) }]}>
                          <Text style={styles.avatarText}>{a.avatarEmoji || initials(a.displayName)}</Text>
                        </View>
                      )}
                      <View style={[styles.kindBadge, { backgroundColor: kindStyle.accent }]}>
                        <Text style={styles.kindBadgeIcon}>{kindStyle.icon}</Text>
                      </View>
                    </View>

                    <View style={styles.chipTextCol}>
                      <Text style={styles.chipName} numberOfLines={1}>{a.displayName}</Text>
                      <Text style={styles.chipVerb} numberOfLines={1}>{verbFor(a.kind)}</Text>
                    </View>

                    <View style={styles.xpBadge}>
                      <Text style={styles.xpText}>+{a.points}</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              </View>
            );
          })}
        </Animated.View>
      </View>

      {items.length > 1 && (
        <View style={styles.dotsRow}>
          {items.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goToChip(i)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
  },
  viewport: {
    overflow: 'hidden',
    paddingVertical: 4,
  },
  chipSlot: {
    paddingHorizontal: 1,
  },
  chipAnimatedWrap: {
    borderRadius: radius.card,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.08),
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 3,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textOnDarkBody,
  },
  kindBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.navySurface,
  },
  kindBadgeIcon: {
    fontSize: 8,
  },
  chipTextCol: {
    flex: 1,
    gap: 1,
  },
  chipName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textOnDark,
  },
  chipVerb: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textOnDarkMuted,
  },
  xpBadge: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.goldGlow, 0.14),
    borderWidth: 1,
    borderColor: withAlpha(colors.goldGlow, 0.3),
  },
  xpText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.goldGlow,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: withAlpha(colors.white, 0.18),
  },
  dotActive: {
    width: 16,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.goldGlow,
  },
  emptyText: {
    marginTop: 14,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.textOnDarkMuted,
  },
});

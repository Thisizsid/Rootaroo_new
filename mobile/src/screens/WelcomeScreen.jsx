import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Ellipse, Rect, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, withAlpha } from '../shared/theme';
const { width: W } = Dimensions.get('window');
const BREATHE_DURATION = 3600; // mockup: breathe 3.6s
const PULSE_DURATION = 2200; // mockup: softPulse 2.2s
const AUTOPLAY_INTERVAL = 4200;
const SLIDE_DURATION = 460; // eased forward/loop transition
const SWIPE_THRESHOLD = W * 0.22;

/* ------------------------------------------------------------------ */
/* Shared: breathing wrapper + pulsing accent dots (Fabric-safe:       */
/* static SVG paths + RN Animated.Views for anything animated).        */
/* ------------------------------------------------------------------ */
function useBreathe(duration = BREATHE_DURATION) {
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe, duration]);
  return breathe.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.014, 1],
  });
}
function PulsingDot({ xPct, yPct, r, color, delay = 0, boxW = 300, boxH = 210 }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(pulse, {
          toValue: 1,
          duration: PULSE_DURATION / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: PULSE_DURATION / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, delay]);
  const opacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.45, 1],
  });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${(xPct / boxW) * 100}%`,
        top: `${(yPct / boxH) * 100}%`,
        width: r * 2,
        height: r * 2,
        marginLeft: -r,
        marginTop: -r,
        borderRadius: r,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* SLIDE 1 — Family coordination: kangaroo family (from the mockup)    */
/* ------------------------------------------------------------------ */
function KangarooHero() {
  const scale = useBreathe();
  return (
    <Animated.View
      style={{
        width: '100%',
        height: '100%',
        transform: [
          {
            scale,
          },
        ],
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 300 210">
        <Ellipse cx="130" cy="195" rx="60" ry="9" fill={withAlpha(colors.ink, 0.07)} />
        {/* Joey */}
        <Path
          d="M172 195 Q210 200 206 160 Q204 145 188 153 Q196 172 180 189 Z"
          fill={colors.goldDeep}
        />
        <Path d="M160 195 Q178 195 182 213 Q168 220 152 214 Z" fill={colors.goldDeep} />
        {/* Adult body */}
        <Path d="M108 198 Q92 202 88 216 Q102 222 116 214 Z" fill={colors.gold} />
        <Path
          d="M98 130 Q86 162 100 190 Q124 206 152 190 Q168 158 156 126 Q132 108 98 130 Z"
          fill={colors.gold}
        />
        {/* Chest */}
        <Ellipse
          cx="128"
          cy="168"
          rx="34"
          ry="24"
          fill={colors.canvasIvory}
          stroke={colors.ink}
          strokeWidth="2"
        />
        {/* Ears */}
        <Ellipse cx="113" cy="52" rx="10" ry="18" rotation={-16} fill={colors.gold} />
        <Ellipse cx="150" cy="52" rx="10" ry="18" rotation={16} fill={colors.gold} />
        {/* Head */}
        <Circle cx="131" cy="86" r="33" fill={colors.gold} />
        <Ellipse cx="131" cy="98" rx="14" ry="11" fill={colors.canvasIvory} />
        <Circle cx="122" cy="82" r="2.8" fill={colors.ink} />
        <Circle cx="140" cy="82" r="2.8" fill={colors.ink} />
        <Path
          d="M124 103 Q131 108 138 103"
          stroke={colors.ink}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* Phone */}
        <G transform="translate(232,150)">
          <Path
            d="M-22 0l22-19 22 19"
            stroke={colors.inkMuted}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M-16 -3v33h32v-33"
            stroke={colors.inkMuted}
            strokeWidth="2.4"
            strokeLinejoin="round"
            fill={colors.borderCool}
          />
          <Rect x="-5" y="12" width="10" height="18" fill={colors.inkMuted} opacity="0.5" />
        </G>
      </Svg>
      {/* Chest dots — pulsing */}
      <PulsingDot xPct={118} yPct={166} r={3} color={colors.goldLight} />
      <PulsingDot xPct={130} yPct={162} r={3} color={colors.goldLight} delay={300} />
      <PulsingDot xPct={140} yPct={167} r={3} color={colors.goldLight} delay={600} />
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* SLIDE 2 — Harmonious organization: checklist + calendar card        */
/* ------------------------------------------------------------------ */
function OrganizeHero() {
  const scale = useBreathe();
  return (
    <Animated.View
      style={{
        width: '100%',
        height: '100%',
        transform: [
          {
            scale,
          },
        ],
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 300 210">
        {/* Ground shadow */}
        <Ellipse cx="150" cy="192" rx="80" ry="9" fill={withAlpha(colors.ink, 0.07)} />
        {/* Checklist card */}
        <Rect
          x="78"
          y="48"
          width="144"
          height="136"
          rx="16"
          fill={colors.surface}
          stroke={colors.ink}
          strokeWidth="2.5"
        />
        <Rect x="78" y="48" width="144" height="34" rx="16" fill={colors.gold} />
        <Rect x="78" y="66" width="144" height="16" fill={colors.gold} />
        {/* Checked rows */}
        <Circle cx="104" cy="106" r="10" fill={colors.gold} />
        <Path
          d="M99 106 l4 4 l8 -8"
          stroke={colors.surface}
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Rect x="122" y="101" width="82" height="10" rx="5" fill={colors.ink} opacity="0.85" />
        <Circle cx="104" cy="136" r="10" fill="none" stroke={colors.ink} strokeWidth="2.4" />
        <Rect x="122" y="131" width="66" height="10" rx="5" fill={colors.divider} />
        <Circle cx="104" cy="166" r="10" fill="none" stroke={colors.ink} strokeWidth="2.4" />
        <Rect x="122" y="161" width="74" height="10" rx="5" fill={colors.divider} />
        {/* Small calendar peeking */}
        <G transform="translate(232,140)">
          <Rect
            x="0"
            y="0"
            width="44"
            height="48"
            rx="8"
            fill={colors.surface}
            stroke={colors.ink}
            strokeWidth="2.4"
          />
          <Rect x="0" y="0" width="44" height="14" rx="8" fill={colors.gold} />
          <Circle cx="12" cy="26" r="3" fill={colors.gold} />
          <Circle cx="22" cy="26" r="3" fill={colors.divider} />
          <Circle cx="32" cy="26" r="3" fill={colors.divider} />
          <Circle cx="12" cy="38" r="3" fill={colors.divider} />
          <Circle cx="22" cy="38" r="3" fill={colors.divider} />
        </G>
      </Svg>
      {/* Floating gold sparkles */}
      <PulsingDot xPct={60} yPct={40} r={3} color={colors.gold} delay={0} />
      <PulsingDot xPct={245} yPct={60} r={3.5} color={colors.gold} delay={400} />
      <PulsingDot xPct={52} yPct={150} r={3} color={colors.goldSoft} delay={800} />
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* SLIDE 3 — Private by design: shield + lock with pulsing aura        */
/* ------------------------------------------------------------------ */
function SecurityHero() {
  const scale = useBreathe();
  const aura = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(aura, {
          toValue: 1,
          duration: 2600,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(aura, {
          toValue: 0,
          duration: 2600,
          easing: Easing.in(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [aura]);
  const auraScale = aura.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });
  const auraOpacity = aura.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });
  return (
    <View
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 150,
          height: 170,
          marginLeft: -75,
          marginTop: -85,
          borderRadius: 85,
          borderWidth: 2,
          borderColor: colors.gold,
          opacity: auraOpacity,
          transform: [
            {
              scale: auraScale,
            },
          ],
        }}
      />
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          transform: [
            {
              scale,
            },
          ],
        }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 300 210">
          {/* Ground shadow */}
          <Ellipse cx="150" cy="192" rx="64" ry="9" fill={withAlpha(colors.ink, 0.07)} />
          {/* Shield */}
          <Path d="M150 42 L212 66 V118 Q212 164 150 186 Q88 164 88 118 V66 Z" fill={colors.gold} />
          <Path
            d="M150 54 L200 73 V118 Q200 156 150 175 Q100 156 100 118 V73 Z"
            fill={colors.surface}
          />
          {/* Lock */}
          <Path
            d="M126 108 h48 v-8 a24 24 0 0 0 -48 0 z"
            fill="none"
            stroke={colors.ink}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <Rect x="126" y="106" width="48" height="36" rx="8" fill={colors.ink} />
          <Circle cx="150" cy="124" r="5" fill={colors.gold} />
        </Svg>
        {/* Keyhole sparkle */}
        <PulsingDot xPct={150} yPct={124} r={2.5} color={colors.gold} delay={0} />
        <PulsingDot xPct={110} yPct={60} r={3} color={colors.gold} delay={300} />
        <PulsingDot xPct={195} yPct={55} r={3} color={colors.gold} delay={600} />
        <PulsingDot xPct={90} yPct={150} r={3} color={colors.goldSoft} delay={900} />
      </Animated.View>
    </View>
  );
}

/* ------------------------------------------------------------------ */

const SLIDES = [
  {
    hero: KangarooHero,
    title: 'Family coordination',
    body: 'Tasks, groceries, schedules, and reminders — all in one place.',
  },
  {
    hero: OrganizeHero,
    title: 'Harmonious organization',
    body: 'Every shared list, bill, and event sorted beautifully for the whole household.',
  },
  {
    hero: SecurityHero,
    title: 'Private by design',
    body: 'End-to-end encrypted messages, vaults, and documents — yours alone.',
  },
];
/* Trailing clone of slide 0 lets autoplay/swipe always animate forward,
   even when looping from the last slide back to the first. */
const LOOP_SLIDES = [...SLIDES, SLIDES[0]];
export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeSlide, setActiveSlide] = useState(0);
  const activeSlideRef = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const dragBase = useRef(0);
  const autoplayTimer = useRef(null);

  /* Animate to `page` (0..SLIDES.length). Landing on the trailing clone
     snaps invisibly back to the real first slide once settled. */
  const goToPage = (page, animated = true) => {
    const clamped = Math.max(0, Math.min(SLIDES.length, page));
    Animated.timing(translateX, {
      toValue: -clamped * W,
      duration: animated ? SLIDE_DURATION : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      const landedOnClone = clamped === SLIDES.length;
      const settled = landedOnClone ? 0 : clamped;
      if (landedOnClone) translateX.setValue(0);
      activeSlideRef.current = settled;
      setActiveSlide(settled);
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
    autoplayTimer.current = setInterval(() => {
      goToPage(activeSlideRef.current + 1);
    }, AUTOPLAY_INTERVAL);
  };
  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, []);
  const goToSlide = (idx) => {
    stopAutoplay();
    goToPage(idx);
    startAutoplay();
  };

  /* Drag both pagers together — same translateX drives hero + card in lockstep. */
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
        const min = -SLIDES.length * W;
        const overdrag = raw > 0 ? raw * 0.3 : raw < min ? min + (raw - min) * 0.3 : raw;
        translateX.setValue(overdrag);
      },
      onPanResponderRelease: (_, g) => {
        const passedThreshold = Math.abs(g.dx) > SWIPE_THRESHOLD || Math.abs(g.vx) > 0.5;
        let target = activeSlideRef.current;
        if (passedThreshold) target += g.dx < 0 ? 1 : -1;
        goToPage(target);
        startAutoplay();
      },
    }),
  ).current;
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />

      {/* Hero carousel — eased slide-in-from-right / release-to-left transition */}
      <View style={styles.carousel} {...panResponder.panHandlers}>
        <Animated.View
          style={{
            flexDirection: 'row',
            width: W * LOOP_SLIDES.length,
            transform: [
              {
                translateX,
              },
            ],
          }}
        >
          {LOOP_SLIDES.map((slide, i) => {
            const Hero = slide.hero;
            return (
              <View
                key={`hero-${i}`}
                style={{
                  width: W,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={styles.heroBox}>
                  <Hero />
                </View>
              </View>
            );
          })}
        </Animated.View>
      </View>

      {/* Content — pushed down below the hero */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Welcome to Rootaroo</Text>
        <Text style={styles.subtitle}>
          Everything your family needs lives in one place — shared safely, organized beautifully,
          and always with you.
        </Text>

        {/* Feature card — same translateX, always synced with the hero */}
        <View style={styles.cardPager} {...panResponder.panHandlers}>
          <Animated.View
            style={{
              flexDirection: 'row',
              width: W * LOOP_SLIDES.length,
              transform: [
                {
                  translateX,
                },
              ],
            }}
          >
            {LOOP_SLIDES.map((slide, i) => (
              <View
                key={`card-${i}`}
                style={{
                  width: W,
                }}
              >
                <View style={styles.cardWrap}>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>{slide.title}</Text>
                    <Text style={styles.cardBody}>{slide.body}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Animated.View>
        </View>

        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goToSlide(i)}
              hitSlop={{
                top: 8,
                bottom: 8,
                left: 4,
                right: 4,
              }}
            >
              <View style={[styles.dot, i === activeSlide && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.privacyPill}>
          <Text style={styles.privacyText}>🔒 Private by design</Text>
        </View>
      </ScrollView>

      {/* Fixed CTA area */}
      <View
        style={[
          styles.ctaArea,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ChooseMethod')}
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('SignIn')}
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 20,
            right: 20,
          }}
        >
          <Text style={styles.existingLink}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  /* Hero carousel zone — fixed height so the top element never clips */
  carousel: {
    flexGrow: 0,
    height: 230,
    overflow: 'hidden',
  },
  heroBox: {
    width: '86%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    lineHeight: 32.5,
    letterSpacing: -0.01,
    color: colors.ink,
    marginBottom: 10,
    paddingHorizontal: 28,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: 22,
    paddingHorizontal: 28,
  },
  /* Feature card pager — full-width pages, swipeable */
  cardPager: {
    flexGrow: 0,
    overflow: 'hidden',
  },
  cardWrap: {
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 22,
    marginBottom: 16,
    shadowColor: colors.ink,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 4,
  },
  cardTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    lineHeight: 20.8,
    color: colors.ink,
    marginBottom: 8,
  },
  cardBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19.5,
    color: colors.textSecondary,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    minHeight: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.divider,
  },
  dotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink,
  },
  privacyPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: colors.borderCool,
    borderRadius: radius.pill,
  },
  privacyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 12,
    color: colors.info,
  },
  ctaArea: {
    paddingHorizontal: 28,
    paddingTop: 16,
    backgroundColor: colors.canvas,
  },
  ctaButton: {
    width: '100%',
    height: 54,
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.gold,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 15,
    color: colors.surface,
  },
  existingLink: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 13,
    color: colors.ink,
    textAlign: 'center',
  },
});

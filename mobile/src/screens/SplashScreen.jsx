import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { useAuthStore } from '../shared/store/authStore';
import { colors, fonts } from '../shared/theme';

const SPLASH_DURATION = 3000;
const LOAD_DURATION = 2600;
const HOP_UP_DURATION = 380;
const HOP_DOWN_DURATION = 440;
const HOP_REST = 160;

/* ------------------------------------------------------------------ */
/* A warm, illustrated splash — replaces the old flat dark background  */
/* + abstract line-art with a "golden hour" gradient, a real hopping   */
/* kangaroo silhouette, and a soft grain texture. Splash-only: doesn't */
/* touch RootarooKangarooAnimation.jsx (shared with ReadyScreen).      */
/* ------------------------------------------------------------------ */

function KangarooMark({ hop }) {
  const translateY = hop.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -26],
  });
  const scaleY = hop.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.06],
  });
  const scaleX = hop.interpolate({
    inputRange: [0, 1],
    outputRange: [1.06, 0.95],
  });
  const shadowScaleX = hop.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.55],
  });
  const shadowOpacity = hop.interpolate({
    inputRange: [0, 1],
    outputRange: [0.32, 0.12],
  });
  return (
    <View style={styles.markWrap}>
      <Animated.View
        style={[
          styles.shadow,
          {
            opacity: shadowOpacity,
            transform: [{ scaleX: shadowScaleX }],
          },
        ]}
      />
      <Svg width={176} height={176} viewBox="0 0 176 176" style={styles.glowSvg}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="55%" r="55%">
            <Stop offset="0%" stopColor={colors.splashMarkRim} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={colors.splashMarkRim} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={88} cy={88} r={88} fill="url(#glow)" />
      </Svg>
      <Animated.View
        style={{
          transform: [{ translateY }, { scaleX }, { scaleY }],
        }}
      >
        <MaterialCommunityIcons name="kangaroo" size={140} color={colors.splashMarkRim} />
      </Animated.View>
    </View>
  );
}

function LoaderDots({ progress }) {
  const dots = [0, 1, 2];
  return (
    <View style={styles.dotsRow}>
      {dots.map((i) => {
        const start = i * 0.18;
        const scale = progress.interpolate({
          inputRange: [
            0,
            Math.min(start, 0.99),
            Math.min(start + 0.22, 1),
            Math.min(start + 0.44, 1),
            1,
          ],
          outputRange: [0.6, 0.6, 1.12, 0.6, 0.6],
        });
        const opacity = progress.interpolate({
          inputRange: [
            0,
            Math.min(start, 0.99),
            Math.min(start + 0.22, 1),
            Math.min(start + 0.44, 1),
            1,
          ],
          outputRange: [0.35, 0.35, 1, 0.35, 0.35],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                opacity,
                transform: [{ scale }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */

export default function SplashScreen() {
  const setLoading = useAuthStore((s) => s.setLoading);

  const markScale = useRef(new Animated.Value(0.5)).current;
  const markOpacity = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(16)).current;
  const dotsProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(colors.splashBg);
    return () => {
      NavigationBar.setBackgroundColorAsync(colors.surface);
    };
  }, []);

  useEffect(() => {
    /* Entry: mark springs in with a touch of overshoot */
    Animated.parallel([
      Animated.spring(markScale, {
        toValue: 1,
        tension: 70,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(markOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    /* Idle: real hop loop — quick launch, faster fall, brief rest on landing */
    const hopLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hop, {
          toValue: 1,
          duration: HOP_UP_DURATION,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(hop, {
          toValue: 0,
          duration: HOP_DOWN_DURATION,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(HOP_REST),
      ]),
    );
    const hopDelay = setTimeout(() => hopLoop.start(), 550);

    /* Text fade in */
    const textDelay = setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 650,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    }, 700);

    /* Loading dots — continuous staggered pulse */
    const dotsLoop = Animated.loop(
      Animated.timing(dotsProgress, {
        toValue: 1,
        duration: LOAD_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    dotsLoop.start();

    /* Auto-transition */
    const timer = setTimeout(() => setLoading(false), SPLASH_DURATION);
    return () => {
      clearTimeout(hopDelay);
      clearTimeout(textDelay);
      clearTimeout(timer);
      hopLoop.stop();
      dotsLoop.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.splashBg} />

      <View style={styles.centerRegion}>
        <Animated.View
          style={{
            opacity: markOpacity,
            transform: [{ scale: markScale }],
          }}
        >
          <KangarooMark hop={hop} />
        </Animated.View>

        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.brand}>Rootaroo</Text>
          <Text style={styles.tagline}>Your family's digital home</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <LoaderDots progress={dotsProgress} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.splashBg,
  },
  centerRegion: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  markWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 200,
    position: 'relative',
  },
  glowSvg: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    marginLeft: -88,
  },
  shadow: {
    width: 120,
    height: 20,
    borderRadius: 14,
    backgroundColor: colors.splashShadow,
    marginBottom: -6,
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 34,
    letterSpacing: -0.02,
    fontWeight: '800',
    color: colors.surface,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '400',
    color: colors.goldSoft,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 64,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
});

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as NavigationBar from 'expo-navigation-bar';
import { useAuthStore } from '../shared/store/authStore';
import { colors, fonts, layout } from '../shared/theme';
const BREATHE_DURATION = 3200; // mockup: breathe 3.2s
const DOT_DRIFT_DURATION = 1800; // mockup: dotDrift 1.8s
const LOAD_DURATION = 2600;
const SPLASH_DURATION = 3000;

/* ------------------------------------------------------------------ */
/* Line-art kangaroo + drifting gold dots — translated 1:1 from the   */
/* design mockup (02-Auth-Onboarding.html, SCREEN 01 · Splash).       */
/*                                                                     */
/* Mockup layout (390×844 frame):                                     */
/*   • art zone:   absolute, top:70, height:220 (kangaroo + dots)     */
/*   • content:    centered in the region top:340 → bottom:90         */
/*   • loader:     absolute, bottom:64, left/right:40, height:3       */
/*                                                                     */
/* Mockup animations:                                                 */
/*   • breathe:  scale 1 → 1.014 → 1 (3.2s infinite)                 */
/*   • dotDrift: opacity 0.35→1 + translateX 0→3px (1.8s infinite,   */
/*                staggered 0.2s between dots)                        */
/*                                                                     */
/* NOTE: react-native-svg v15 on Fabric does NOT reliably support       */
/* Animated.createAnimatedComponent — animated SVG props can make the  */
/* whole SVG subtree fail to mount. So: kangaroo paths are STATIC SVG, */
/* and the drifting dots are plain RN Animated.Views positioned by %   */
/* coordinates over the SVG (RN views animate with native driver).    */
/* ------------------------------------------------------------------ */

const DOTS = [
  {
    cx: 118,
    cy: 145,
    r: 3,
    fill: colors.gold,
    delay: 0,
  },
  {
    cx: 150,
    cy: 128,
    r: 3,
    fill: colors.gold,
    delay: 200,
  },
  {
    cx: 182,
    cy: 115,
    r: 3.5,
    fill: colors.gold,
    delay: 400,
  },
  {
    cx: 205,
    cy: 106,
    r: 4,
    fill: colors.splashDot,
    delay: 600,
  },
];

/* One dot as an animated RN View. Position uses % of the art box so it
   lines up with the SVG viewBox (390×220) at any screen width. */
function DriftingDot({ dot, drift }) {
  const opacity = drift.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.35, 0.75, 1, 0.75, 0.35],
  });
  const translateX = drift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 3, 0],
  });
  const size = dot.r * 2;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${(dot.cx / 390) * 100}%`,
        top: `${(dot.cy / 220) * 100}%`,
        width: size,
        height: size,
        marginLeft: -dot.r,
        marginTop: -dot.r,
        borderRadius: dot.r,
        backgroundColor: dot.fill,
        opacity,
        transform: [
          {
            translateX,
          },
        ],
      }}
    />
  );
}
function KangarooArt({ breathe }) {
  /* Mockup breathe: scale pulse 1 → 1.014 */
  const scale = breathe.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.014, 1],
  });

  /* Single shared clock for the dot-drift sway. */
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: DOT_DRIFT_DURATION,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);
  return (
    <Animated.View
      style={{
        width: '100%',
        aspectRatio: 390 / 220,
        transform: [
          {
            scale,
          },
        ],
      }}
    >
      {/* Static kangaroo — tail + body (no animated SVG props) */}
      <Svg width="100%" height="100%" viewBox="0 0 390 220">
        {/* Tail */}
        <Path
          d="M55 175 Q75 180 85 160"
          stroke={colors.splashKangarooTail}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* Body */}
        <Path
          d="M65 155 Q85 145 95 160 Q101 173 87 179 Q71 183 65 169 Z"
          fill={colors.splashKangarooBody}
        />
      </Svg>
      {/* Drifting gold dots — RN views, staggered 1.8s sway loop */}
      {DOTS.map((dot) => (
        <DriftingDot key={dot.cx} dot={dot} drift={drift} />
      ))}
    </Animated.View>
  );
}

/* Gold rounded-square logo mark — 58×58, radius 20 */
function LogoMark() {
  return (
    <View
      style={{
        width: layout.splashLogoSize,
        height: layout.splashLogoSize,
        borderRadius: layout.splashLogoRadius,
        backgroundColor: colors.gold,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */

export default function SplashScreen() {
  const setLoading = useAuthStore((s) => s.setLoading);

  /* Entry animations */
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  /* Idle breathe (kangaroo group) */
  const breathe = useRef(new Animated.Value(0)).current;

  /* Typography */
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;

  /* Loading bar */
  const loadAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(colors.splashBg);
    return () => {
      NavigationBar.setBackgroundColorAsync(colors.surface);
    };
  }, []);
  useEffect(() => {
    /* Entry: spring logo group in */
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    /* Idle: mockup breathe — scale 1 → 1.014, 3.2s loop */
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: BREATHE_DURATION / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: BREATHE_DURATION / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const breatheDelay = setTimeout(() => breathLoop.start(), 500);

    /* Text fade in */
    const textDelay = setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);

    /* Loading bar */
    const load = Animated.timing(loadAnim, {
      toValue: 1,
      duration: LOAD_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    load.start();

    /* Auto-transition */
    const timer = setTimeout(() => setLoading(false), SPLASH_DURATION);
    return () => {
      clearTimeout(breatheDelay);
      clearTimeout(textDelay);
      clearTimeout(timer);
      breathLoop.stop();
      load.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const loadWidth = loadAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0%', '72%', '100%'],
  });
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.splashBg} />

      {/* Art zone — absolute top:70, height:220 (mockup) */}
      <Animated.View
        style={[
          styles.artZone,
          {
            opacity: logoOpacity,
          },
        ]}
      >
        <KangarooArt breathe={breathe} />
      </Animated.View>

      {/* Content — centered in the region top:340 → bottom:90 (mockup) */}
      <View style={styles.contentRegion}>
        <Animated.View
          style={[
            styles.centerBlock,
            {
              opacity: logoOpacity,
              transform: [
                {
                  scale: logoScale,
                },
              ],
            },
          ]}
        >
          <LogoMark />
          <Text style={styles.brand}>Rootaroo</Text>
          <Text style={styles.tagline}>Your family's digital home</Text>
        </Animated.View>
      </View>

      {/* Loading bar — absolute bottom:64, left/right:40, height:3 (mockup) */}
      <View style={styles.footer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: loadWidth,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.splashBg,
  },
  /* Mockup: art zone at top:70, height:220 */
  artZone: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Mockup: content region = top:340 → bottom:90 (below true center) */
  contentRegion: {
    position: 'absolute',
    top: 340,
    left: 0,
    right: 0,
    bottom: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
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
  /* Mockup: bottom:64, left/right:40, height:3 */
  footer: {
    position: 'absolute',
    bottom: 64,
    left: 40,
    right: 40,
    height: 3,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.splashTrack,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
});

import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../shared/theme';

const BREATHE_DURATION = 3200; // mockup: breathe 3.2s
const DOT_DRIFT_DURATION = 1800; // mockup: dotDrift 1.8s

const DOTS = [
  { cx: 118, cy: 145, r: 3, fill: colors.gold, delay: 0 },
  { cx: 150, cy: 128, r: 3, fill: colors.gold, delay: 200 },
  { cx: 182, cy: 115, r: 3.5, fill: colors.gold, delay: 400 },
  { cx: 205, cy: 106, r: 4, fill: colors.splashDot, delay: 600 },
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
        transform: [{ translateX }],
      }}
    />
  );
}

/**
 * Line-art kangaroo + drifting gold dots — the app's brand animation
 * (originally built for SplashScreen). Self-contained: drives its own
 * breathing scale pulse and dot-drift sway so it can be dropped into any
 * screen standalone. Pass `breathe` (an Animated.Value in [0,1]) to have
 * the caller drive the breathing pulse instead (e.g. to sync with a
 * larger entry-animation sequence, as SplashScreen does).
 */
export default function RootarooKangarooAnimation({ breathe: breatheProp, style }) {
  const ownBreathe = useRef(new Animated.Value(0)).current;
  const breathe = breatheProp || ownBreathe;

  useEffect(() => {
    if (breatheProp) return;
    const loop = Animated.loop(
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
    loop.start();
    return () => loop.stop();
  }, [breatheProp, breathe]);

  const scale = breathe.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.014, 1],
  });

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
      style={[
        {
          width: '100%',
          aspectRatio: 390 / 220,
          transform: [{ scale }],
        },
        style,
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 390 220">
        <Path
          d="M55 175 Q75 180 85 160"
          stroke={colors.splashKangarooTail}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M65 155 Q85 145 95 160 Q101 173 87 179 Q71 183 65 169 Z"
          fill={colors.splashKangarooBody}
        />
      </Svg>
      {DOTS.map((dot) => (
        <DriftingDot key={dot.cx} dot={dot} drift={drift} />
      ))}
    </Animated.View>
  );
}

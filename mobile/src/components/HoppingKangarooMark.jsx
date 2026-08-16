import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../shared/theme';

const HOP_UP_DURATION = 380;
const HOP_DOWN_DURATION = 440;
const HOP_REST = 160;

/**
 * Rootaroo's hopping kangaroo mark — a real MaterialCommunityIcons glyph in
 * warm gold, with a soft glow, a squash/stretch hop, and a ground shadow.
 * Shared between SplashScreen and WelcomeScreen's "Family coordination"
 * slide so both use the exact same icon + motion.
 *
 * Pass `hop` (an Animated.Value in [0,1]) to have the caller drive the hop
 * itself (e.g. to delay it until an entrance animation settles, as
 * SplashScreen does); omit it to have this component loop on its own.
 */
export default function HoppingKangarooMark({
  hop: hopProp,
  size = 140,
  autoStartDelay = 0,
  color = colors.splashMarkRim,
}) {
  const ownHop = useRef(new Animated.Value(0)).current;
  const hop = hopProp || ownHop;

  useEffect(() => {
    if (hopProp) return;
    const loop = Animated.loop(
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
    const delayId = setTimeout(() => loop.start(), autoStartDelay);
    return () => {
      clearTimeout(delayId);
      loop.stop();
    };
  }, [hopProp, hop, autoStartDelay]);

  const translateY = hop.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -size * 0.185],
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

  const glowSize = size * 1.26;
  const shadowWidth = size * 0.86;

  return (
    <View style={[styles.wrap, { height: size * 1.43 }]}>
      <Svg
        width={glowSize}
        height={glowSize}
        viewBox={`0 0 ${glowSize} ${glowSize}`}
        style={[
          styles.glowSvg,
          {
            bottom: size * 0.09,
            marginLeft: -glowSize / 2,
          },
        ]}
      >
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="55%" r="55%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={glowSize / 2} cy={glowSize / 2} r={glowSize / 2} fill="url(#glow)" />
      </Svg>
      <Animated.View
        style={[
          styles.shadow,
          {
            width: shadowWidth,
            height: shadowWidth * 0.17,
            borderRadius: shadowWidth * 0.12,
            opacity: shadowOpacity,
            transform: [{ scaleX: shadowScaleX }],
          },
        ]}
      />
      <Animated.View
        style={{
          transform: [{ translateY }, { scaleX }, { scaleY }],
        }}
      >
        <MaterialCommunityIcons name="kangaroo" size={size} color={color} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  glowSvg: {
    position: 'absolute',
    left: '50%',
  },
  shadow: {
    backgroundColor: colors.splashShadow,
    marginBottom: -6,
  },
});

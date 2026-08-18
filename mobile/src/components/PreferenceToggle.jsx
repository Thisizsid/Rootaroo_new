import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { colors } from '../shared/theme';

/**
 * Preference toggle matching mock Screen 38 (Notification Preferences):
 * 46×27 pill track, 21×21 white knob.
 */
const TRACK_WIDTH = 46;
const TRACK_HEIGHT = 27;
const KNOB_SIZE = 21;
const KNOB_INSET = 3;
// Knob travel = track width − knob − 2×inset (46 − 21 − 6 = 19).
const KNOB_OFFSET = TRACK_WIDTH - KNOB_SIZE - KNOB_INSET * 2;

export default function PreferenceToggle({ value, onChange, disabled }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [value, anim]);

  return (
    <Pressable
      onPress={() => !disabled && onChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[
        styles.track,
        { backgroundColor: value ? colors.gold : colors.divider },
      ]}
    >
      <Animated.View
        style={[
          styles.knob,
          {
            transform: [
              {
                translateX: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, KNOB_OFFSET],
                }),
              },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: KNOB_INSET,
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});

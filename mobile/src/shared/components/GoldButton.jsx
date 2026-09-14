import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, goldButton, radius } from '../theme';

/**
 * The lit gold surface, as an overlay you drop inside a button you already
 * have. Two absolutely-positioned layers, both non-interactive:
 *
 *   the gradient  — the four weighted stops that make it read as metal
 *   the specular  — a 1px lit top edge, standing in for CSS's inset shadow,
 *                   which React Native has no equivalent for
 *
 * Render it as the FIRST child so the label paints on top of it, and pass the
 * host's own `borderRadius` so both layers follow its corners:
 *
 *   <TouchableOpacity style={styles.primaryBtn}>
 *     <GoldFill radius={radius.pill} />
 *     <Text style={styles.primaryBtnText}>Save</Text>
 *   </TouchableOpacity>
 *
 * The host keeps its size, layout, and the `goldButton.glow` shadow — the
 * glow must stay on the host because a shadow drawn on a clipped child does
 * not escape its parent.
 */
export function GoldFill({ radius: r = radius.pill, disabled = false }) {
  // A disabled button paints its own muted background; laying the gradient
  // over it would erase that and leave a button that looks tappable when it
  // isn't. Render nothing and let the host's disabled style show through.
  if (disabled) return null;
  return (
    <>
      <LinearGradient
        colors={goldButton.colors}
        locations={goldButton.locations}
        start={goldButton.start}
        end={goldButton.end}
        style={[StyleSheet.absoluteFill, { borderRadius: r }]}
        pointerEvents="none"
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: r, borderTopWidth: 1, borderTopColor: goldButton.specular },
        ]}
        pointerEvents="none"
      />
    </>
  );
}

/**
 * A complete primary button using that surface — for new call sites, so they
 * don't have to re-derive the height, radius, glow, and label treatment.
 * Existing buttons generally want `GoldFill` instead, which leaves their
 * layout alone.
 */
export default function GoldButton({
  label,
  onPress,
  disabled,
  style,
  textStyle,
  children,
  ...rest
}) {
  return (
    <TouchableOpacity
      style={[styles.btn, disabled && styles.btnDisabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      {...rest}
    >
      {!disabled && <GoldFill radius={radius.pill} />}
      {children ?? <Text style={[styles.label, textStyle]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    height: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...goldButton.glow,
  },
  btnDisabled: {
    backgroundColor: colors.btnDisabledBg,
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    fontSize: 15.5,
    letterSpacing: -0.15,
    fontFamily: fonts.display,
    color: goldButton.onGold,
  },
});

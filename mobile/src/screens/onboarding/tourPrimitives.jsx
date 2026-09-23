import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius, withAlpha } from '../../shared/theme';
import Avatar from '../../components/Avatar';

/**
 * The handful of shapes the five tour screens share. Each is the design's
 * recipe expressed in app tokens — the mock's `#141b27` panel becomes the
 * app's own glass `colors.surface` over `colors.bgApp`, which lands in the
 * same place visually while keeping the tour on the product's palette.
 */

/** Small gold all-caps kicker above a step title. */
export function Eyebrow({ children, style }) {
  return <Text style={[styles.eyebrow, style]}>{children}</Text>;
}

/** The dark panel every list/preview card sits in. */
export function TourCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/**
 * A stand-in household member. Rendered through the app's real `Avatar` so
 * the demo faces are the same shape, tone ramp and initials treatment as
 * every member avatar elsewhere in the product.
 */
export function TourAvatar({ name, size = 36, style }) {
  return <Avatar name={name} id={`tour-${name}`} size={size} style={style} />;
}

/** Overlapping avatar row — the design's "who's in this household" cluster. */
export function AvatarStack({ names, size = 36, ringColor = colors.bgApp, extra }) {
  return (
    <View style={styles.stack}>
      {names.map((name, i) => (
        <TourAvatar
          key={`${name}-${i}`}
          name={name}
          size={size}
          style={[
            { borderWidth: 2.5, borderColor: ringColor },
            i > 0 && { marginLeft: -(size * 0.3) },
          ]}
        />
      ))}
      {extra ? (
        <View
          style={[
            styles.extra,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -(size * 0.3),
              borderColor: ringColor,
            },
          ]}
        >
          <Text style={styles.extraText}>{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.7,
    color: colors.gold,
  },

  card: {
    borderRadius: radius.cardLg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderCool,
  },

  stack: { flexDirection: 'row' },

  extra: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
  },
});

/** Shared hairline used as an in-card row divider. */
export const rowDivider = withAlpha(colors.white, 0.05);

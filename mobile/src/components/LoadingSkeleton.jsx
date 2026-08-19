import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, withAlpha } from '../shared/theme';

/**
 * Animated loading skeleton (design: 09-States-Errors — Loading Skeleton).
 * Pulsing gradient blocks in list / feed / vault grid layouts.
 */
export default function LoadingSkeleton({ variant = 'list', dark }) {
  if (variant === 'feed') {
    return (
      <View style={styles.feedWrap}>
        <FeedCard dark={dark} />
        <FeedCard dark={dark} />
      </View>
    );
  }
  if (variant === 'vault') {
    const card = (key) => <ShimmerBlock key={key} dark height={122} style={styles.vaultCard} />;
    return (
      <View style={styles.vaultWrap}>
        <View style={styles.vaultRow}>{card(0)}{card(1)}</View>
        <View style={styles.vaultRow}>{card(2)}{card(3)}</View>
      </View>
    );
  }
  // list
  return (
    <View style={styles.listWrap}>
      {[74, 74, 74, 56].map((h, i) => <ShimmerBlock key={i} dark height={h} />)}
    </View>
  );
}

function FeedCard({ dark }) {
  return (
    <View style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <ShimmerBlock dark width={36} height={36} style={styles.feedAvatar} />
        <View style={styles.feedHeaderLines}>
          <ShimmerBlock dark width={120} height={14} style={styles.feedLine} />
          <ShimmerBlock dark width={80} height={12} style={styles.feedLineShort} />
        </View>
      </View>
      <ShimmerBlock dark height={220} style={styles.feedMedia} />
    </View>
  );
}

function ShimmerBlock({ height, width, dark, style }) {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const gradient = dark
    ? [colors.skeleton, withAlpha(colors.white, 0.14), colors.skeleton]
    : [colors.sandLight, colors.sandPale, colors.sandLight];

  return (
    <Animated.View style={[{ width, height, borderRadius: 18, overflow: 'hidden', opacity }, style]}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },

  // list
  listWrap: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 14,
  },

  // vault grid (dark)
  vaultWrap: { padding: 24, gap: 14 },
  vaultRow: { flexDirection: 'row', gap: 14 },
  vaultCard: { flex: 1 },

  // feed cards
  feedWrap: { paddingHorizontal: 4, paddingTop: 4, gap: 16 },
  feedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardLg,
    overflow: 'hidden',
    marginBottom: 4,
  },
  feedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  feedAvatar: { borderRadius: 18 },
  feedHeaderLines: { gap: 8 },
  feedLine: { borderRadius: 6 },
  feedLineShort: { borderRadius: 6 },
  feedMedia: { borderRadius: 0 },
});

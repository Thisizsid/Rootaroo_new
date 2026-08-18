import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { colors, fonts, radius } from '../shared/theme';
import { useNetworkStatus } from '../shared/hooks/useNetworkStatus';

// Placeholder stroke color below is a literal string target for the runtime
// `.replace()` swap in the render below — do not tokenize it directly.
const INFO_SVG_STROKE_PLACEHOLDER = '#45566B';
const INFO_SVG =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none">' +
  `<path d="M12 9v4M12 17h.01" stroke="${INFO_SVG_STROKE_PLACEHOLDER}" stroke-width="2" stroke-linecap="round"></path>` +
  `<circle cx="12" cy="12" r="9" stroke="${INFO_SVG_STROKE_PLACEHOLDER}" stroke-width="1.5"></circle>` +
  '</svg>';

/**
 * Offline network banner (design: 09-States-Errors — Network Error Banner).
 * Renders only while the device is offline. `onRetry` re-runs a refresh.
 */
export default function OfflineBanner({ onRetry, dark }) {
  const { isOffline } = useNetworkStatus();
  if (!isOffline) return null;

  const stroke = dark ? colors.textMuted : colors.inkMuted;
  return (
    <View style={[styles.banner, dark && styles.bannerDark]}>
      <SvgXml xml={INFO_SVG.replace(/#45566B/g, stroke)} width={18} height={18} />
      <Text style={[styles.text, dark && styles.textDark]} numberOfLines={2}>
        You're offline. Changes will sync when you're back online.
      </Text>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={[styles.retry, dark && styles.textDark]}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.skeleton,
    borderRadius: radius.md + 2,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  bannerDark: { backgroundColor: colors.surfaceRaised },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.body,
    color: colors.inkMuted,
  },
  textDark: { color: colors.textMuted },
  retry: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.inkMuted,
    flexShrink: 0,
  },
});

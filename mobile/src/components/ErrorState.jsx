import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, radius, spacing } from '../shared/theme';

/**
 * Full-screen generic error (design: 09-States-Errors — Generic Error).
 * Centered icon + message, with "Try again" (gold) and "Go home" (outlined)
 * actions pinned at the bottom.
 */
export default function ErrorState({
  icon,
  title = 'Something went wrong',
  subtitle = "We couldn't load this page. Try again in a moment.",
  onRetry,
  onGoHome,
  dark,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.content}>
        <View style={[styles.iconTile, dark && styles.iconTileDark]}>
          {icon || (
            <Text style={[styles.fallbackIcon, dark && styles.fallbackIconDark]}>!</Text>
          )}
        </View>
        <Text style={[styles.title, dark && styles.titleDark]}>{title}</Text>
        <Text style={[styles.subtitle, dark && styles.subtitleDark]}>{subtitle}</Text>
      </View>

      {(onRetry || onGoHome) && (
        <View style={styles.actions}>
          {onRetry ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={onRetry} activeOpacity={0.85}>
              <Text style={styles.primaryText}>Try again</Text>
            </TouchableOpacity>
          ) : null}
          {onGoHome ? (
            <TouchableOpacity
              style={[styles.secondaryBtn, dark && styles.secondaryBtnDark]}
              onPress={onGoHome}
              activeOpacity={0.85}
            >
              <Text style={[styles.secondaryText, dark && styles.secondaryTextDark]}>Go home</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: radius.cardLg,
    backgroundColor: colors.skeleton,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  iconTileDark: { backgroundColor: colors.surfaceRaised },
  fallbackIcon: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.inkMuted,
  },
  fallbackIconDark: { color: colors.gold },
  title: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
    marginBottom: 10,
    textAlign: 'center',
  },
  titleDark: { color: colors.onAccent },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subtitleDark: { color: colors.textMutedDark },
  actions: {
    paddingHorizontal: 32,
    paddingBottom: 44,
    gap: 12,
  },
  primaryBtn: {
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: colors.onAccent,
  },
  secondaryBtn: {
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnDark: { backgroundColor: colors.surfaceRaised, borderColor: colors.inkSoft },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  secondaryTextDark: { color: colors.onAccent },
});

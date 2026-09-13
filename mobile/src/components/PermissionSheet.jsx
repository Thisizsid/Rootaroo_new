import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing, withAlpha } from '../shared/theme';

/**
 * THE permission-denied surface. Every runtime permission the app asks for —
 * camera, photo library, microphone, location, notifications — renders this
 * one component when access is refused; only the icon and the copy change.
 *
 * Presentational and stateless by design: it knows nothing about which
 * permission it is describing or how to request one. shared/permissions owns
 * the copy and the state machine, PermissionHost owns the visibility, and
 * this file owns the look. Adding a new permission should never mean adding
 * a new denied-state UI.
 *
 * Same sheet mechanics as AlertModal (transparent modal, slide up, tap-out
 * to dismiss) so it sits in the app's existing bottom-sheet language.
 */
export default function PermissionSheet({ visible, content, onAllow, onDismiss }) {
  const insets = useSafeAreaInsets();
  const {
    icon = 'lock-closed',
    eyebrow = 'Permission needed',
    title,
    body,
    allowLabel = 'Allow',
    dismissLabel = 'Maybe later',
  } = content || {};

  return (
    <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        {/* Swallows taps so pressing the sheet itself never dismisses it. */}
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xxl }]}>
          <View style={styles.iconTile}>
            <Ionicons name={icon} size={26} color={colors.gold} />
          </View>

          <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!body && <Text style={styles.body}>{body}</Text>}

          <TouchableOpacity
            style={styles.allowBtn}
            onPress={onAllow}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={allowLabel}
          >
            <LinearGradient
              colors={[colors.goldSoft, colors.gold, colors.goldWarmDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.allowText}>{allowLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={onDismiss}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={dismissLabel}
          >
            <Text style={styles.dismissText}>{dismissLabel}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: withAlpha(colors.shadow, 0.55), justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.canvasElevated,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 12,
  },
  iconTile: {
    width: 62,
    height: 62,
    borderRadius: radius.xl,
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.18),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.4,
    fontFamily: fonts.bodySemiBold,
    color: colors.gold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontFamily: fonts.displayBold,
    color: colors.ink,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxxl,
    textAlign: 'center',
  },
  allowBtn: {
    width: '100%',
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 6,
  },
  allowText: {
    fontSize: 16,
    fontFamily: fonts.displayBold,
    // Dark-on-gold: the accent is light enough that onAccent white would
    // fail contrast here, unlike the flat-gold buttons elsewhere.
    color: colors.shadow,
  },
  dismissBtn: { marginTop: spacing.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  dismissText: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMuted,
  },
});

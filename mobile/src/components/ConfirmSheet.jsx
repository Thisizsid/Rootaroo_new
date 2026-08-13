import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { colors, fonts, radius, spacing } from '../shared/theme';

const TRASH_SVG =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">' +
  '<path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" stroke="#B54B3A" stroke-width="1.5" stroke-linecap="round"></path>' +
  '</svg>';

const CHECK_SVG =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">' +
  '<path d="M5 13l4 4L19 7" stroke="#6B8F5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>' +
  '</svg>';

/**
 * Destructive/non-destructive confirmation bottom sheet
 * (design: 09-States-Errors — Destructive Confirmation).
 */
export default function ConfirmSheet({
  visible,
  title,
  subtitle,
  confirmLabel,
  icon,
  danger = true,
  loading,
  onConfirm,
  onCancel,
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 44 }]}>
          <View style={styles.handle} />
          <View style={[styles.iconCircle, !danger && styles.iconCircleNeutral]}>
            {icon || <SvgXml xml={danger ? TRASH_SVG : CHECK_SVG} width={24} height={24} />}
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              danger ? styles.confirmDanger : styles.confirmGold,
              loading && styles.confirmDisabled,
            ]}
            onPress={onConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(27,30,36,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 26,
    alignItems: 'center',
    shadowColor: colors.inkDeep,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 26,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5E3DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  iconCircleNeutral: { backgroundColor: '#E8F0E4' },
  title: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: 28,
    textAlign: 'center',
  },
  confirmBtn: {
    width: '100%',
    height: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  confirmDanger: {
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 6,
  },
  confirmGold: {
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  },
  confirmDisabled: { opacity: 0.6 },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: colors.surface,
  },
  cancelBtn: {
    width: '100%',
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
});

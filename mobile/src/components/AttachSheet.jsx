import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fonts, radius } from '../shared/theme';
import { chatTheme } from '../shared/theme/chat';

function AttachRow({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rowIconTile}>
        <Ionicons name={icon} size={20} color={chatTheme.rowIconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={chatTheme.chevron} />
    </TouchableOpacity>
  );
}

/**
 * "Attach To" bottom sheet opened from ChatInputBar's + button. Replaces the
 * old showAlert-based Photo/Voice/Cancel list with the mock's dedicated
 * sheet (eyebrow + participant count + conversation title + two option rows).
 */
export default function AttachSheet({ visible, onClose, chatTitle, participantCount, onPickImage, onStartVoice }) {
  const insets = useSafeAreaInsets();

  const handlePick = () => {
    onClose();
    onPickImage?.();
  };

  const handleVoice = () => {
    onClose();
    onStartVoice?.();
  };

  return (
    <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.eyebrow}>ATTACH TO</Text>
            {!!participantCount && (
              <Text style={styles.sharedWith}>Shared with {participantCount}</Text>
            )}
          </View>
          {!!chatTitle && <Text style={styles.title}>{chatTitle}</Text>}

          <View style={styles.rows}>
            <AttachRow
              icon="image"
              title="Photo or video"
              subtitle="From your library"
              onPress={handlePick}
            />
            <AttachRow
              icon="mic"
              title="Voice message"
              subtitle="Hold to record, release to send"
              onPress={handleVoice}
            />
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: chatTheme.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: chatTheme.chipBorder,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: chatTheme.chipBorder,
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    letterSpacing: 1.2,
    color: chatTheme.eyebrowGold,
  },
  sharedWith: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: chatTheme.sheetSubtext,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: chatTheme.headerTitle,
    marginTop: 6,
    marginBottom: 18,
  },
  rows: {
    backgroundColor: chatTheme.chip,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: chatTheme.chipBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowIconTile: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: chatTheme.rowIconTileBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: {
    fontSize: 15.5,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: chatTheme.headerTitle,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: chatTheme.sheetSubtext,
  },
  cancelBtn: {
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: chatTheme.cancelBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.displayBold,
    color: chatTheme.headerTitle,
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts } from '../shared/theme';

export default function ThreadedReplyPreview({ senderName, content, onDismiss }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label} numberOfLines={1}>
          Replying to <Text style={styles.name}>{senderName}</Text>
        </Text>
        {content ? (
          <Text style={styles.preview} numberOfLines={1}>
            {content}
          </Text>
        ) : (
          <Text style={styles.preview} numberOfLines={1}>
            [Image]
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.canvasGray,
    borderLeftWidth: 3,
    borderLeftColor: colors.legacyGold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  content: { flex: 1, marginRight: 8 },
  label: { fontSize: 12, color: colors.grayMuted, fontFamily: fonts.body },
  name: { fontFamily: fonts.bodyBold, color: colors.legacyGold },
  preview: { fontSize: 13, color: colors.grayDeep, marginTop: 2, fontFamily: fonts.body },
  dismissBtn: { padding: 4 },
  dismissText: { fontSize: 14, color: colors.grayCool },
});

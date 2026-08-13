import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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
    backgroundColor: '#f3f4f6',
    borderLeftWidth: 3,
    borderLeftColor: '#D4A017',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  content: { flex: 1, marginRight: 8 },
  label: { fontSize: 12, color: '#6b7280' },
  name: { fontWeight: '700', color: '#D4A017' },
  preview: { fontSize: 13, color: '#374151', marginTop: 2 },
  dismissBtn: { padding: 4 },
  dismissText: { fontSize: 14, color: '#9ca3af' },
});

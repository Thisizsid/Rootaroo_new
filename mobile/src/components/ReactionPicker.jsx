import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const EMOJIS = ['👍', '❤️', '😂', '😲', '😢'];

export default function ReactionPicker({ reactions, onToggle }) {
  return (
    <View style={styles.container}>
      {EMOJIS.map((emoji) => {
        const reaction = reactions.find((r) => r.emoji === emoji);
        const count = reaction?.count || 0;
        const reacted = reaction?.userReacted || false;

        return (
          <TouchableOpacity
            key={emoji}
            onPress={() => onToggle(emoji)}
            style={[styles.button, reacted && styles.buttonActive]}
          >
            <Text style={styles.emoji}>{emoji}</Text>
            {count > 0 && <Text style={[styles.count, reacted && styles.countActive]}>{count}</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 2,
  },
  buttonActive: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#D4A017',
  },
  emoji: { fontSize: 14 },
  count: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  countActive: { color: '#D4A017' },
});

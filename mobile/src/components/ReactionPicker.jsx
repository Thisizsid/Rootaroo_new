import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../shared/theme';

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
    backgroundColor: colors.canvasGray,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 2,
  },
  buttonActive: {
    backgroundColor: colors.amberPale,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  emoji: { fontSize: 14 },
  count: { fontSize: 11, color: colors.grayMuted, fontWeight: '600' },
  countActive: { color: colors.gold },
});

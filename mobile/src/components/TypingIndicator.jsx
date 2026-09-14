import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { chatTheme } from '../shared/theme/chat';
import Avatar from './Avatar';

function Dot({ anim, color }) {
  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: color, transform: [{ translateY: anim }] }]}
    />
  );
}

/** One bubble per person currently typing — same shape as an "other" message
 * bubble (avatar + rounded pill), holding three bouncing dots instead of
 * text. The mock shows exactly this for a single typer; multiple typers
 * simply stack as one row each, rather than collapsing into a name list the
 * mock never depicts. */
function TypingBubble({ typer }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -4, duration: 200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.delay(400),
        ]),
      );
    const anims = [bounce(dot1, 0), bounce(dot2, 150), bounce(dot3, 300)];
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.row}>
      <Avatar
        url={typer.avatarUrl}
        emoji={typer.avatarEmoji}
        name={typer.displayName}
        id={typer.userId}
        size={30}
      />
      <View style={styles.bubble}>
        <Dot anim={dot1} color={chatTheme.typingDotDim} />
        <Dot anim={dot2} color={chatTheme.typingDotMid} />
        <Dot anim={dot3} color={chatTheme.typingDotDim} />
      </View>
    </View>
  );
}

export default function TypingIndicator({ typers }) {
  if (!typers || typers.length === 0) return null;
  return (
    <View style={styles.container}>
      {typers.map((t) => (
        <TypingBubble key={t.userId} typer={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    backgroundColor: chatTheme.bubbleOtherBg,
    borderWidth: 1,
    borderColor: chatTheme.bubbleOtherBorder,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

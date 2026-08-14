import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors } from '../shared/theme';

export default function MessageBubble({
  message,
  isOwn,
  isSelected,
  onToggleReaction,
  onPressReply,
  onSelectMessage,
  onMediaPress,
}) {
  const containerRef = useRef(null);

  const format12HourTime = (iso) => {
    const d = new Date(iso);
    let hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${mins}${ampm}`;
  };

  const isDeleted = !!message.deletedAt;
  const isEdited = !!message.editedAt;

  if (isDeleted) {
    return (
      <View style={[styles.container, isOwn && styles.containerOwn]}>
        <View style={[styles.bubble, styles.deletedBubble]}>
          <Text style={styles.deletedText}>Message deleted</Text>
        </View>
      </View>
    );
  }

  // Only reactions with count > 0 should be displayed in the main stream
  const activeReactions = (message.reactions || []).filter((r) => r.count > 0);

  return (
    <View ref={containerRef} style={[styles.container, isOwn && styles.containerOwn]}>
      {/* Reply preview */}
      {message.replyPreview && (
        <TouchableOpacity
          style={styles.replyPreview}
          onPress={() => onPressReply(message.replyToId)}
        >
          <View style={styles.replyBar} />
          <View style={styles.replyContent}>
            <Text style={styles.replyName}>{message.replyPreview.senderName}</Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {message.replyPreview.content || '[Image]'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Message content */}
      <TouchableOpacity
        onLongPress={() => {
          containerRef.current?.measureInWindow((x, y, width, height) => {
            onSelectMessage?.(message, { x, y, width, height });
          });
        }}
        onPress={() => {
          if (isSelected) {
            onSelectMessage?.(message);
          }
        }}
        activeOpacity={0.9}
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          isSelected && styles.bubbleSelected,
        ]}
      >
        {message.content && (
          <Text style={[styles.text, isOwn ? styles.textOwn : styles.textOther]}>
            {message.content}
          </Text>
        )}
        {message.mediaUrl && (
          <TouchableOpacity
            onPress={() => onMediaPress?.(message.mediaUrl)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: message.mediaUrl }}
              style={styles.media}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Reaction Pill Badges */}
      {activeReactions.length > 0 && (
        <View style={[styles.reactionBadgeRow, isOwn ? styles.reactionBadgeOwn : styles.reactionBadgeOther]}>
          {activeReactions.map((r) => (
            <TouchableOpacity
              key={r.emoji}
              style={[styles.reactionPill, r.userReacted && styles.reactionPillActive]}
              onPress={() => onToggleReaction(message.id, r.emoji)}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
              <Text style={[styles.reactionCountText, r.userReacted && styles.reactionCountActive]}>
                {r.count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Footer metadata below bubble */}
      <View style={[styles.metaRow, isOwn && styles.metaRowOwn]}>
        {!isOwn && (
          <Text style={styles.metaText}>{message.sender.displayName} · </Text>
        )}
        <Text style={styles.metaText}>{format12HourTime(message.createdAt)}</Text>
        {isEdited && <Text style={styles.editedText}> (edited)</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  containerOwn: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  bubbleOwn: {
    backgroundColor: colors.gold,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    shadowColor: colors.inkDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleSelected: {
    borderWidth: 2,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  focusedBubble: {
    marginBottom: 12,
    shadowColor: colors.inkDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  deletedBubble: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deletedText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  textOwn: {
    color: colors.surface,
  },
  textOther: {
    color: colors.ink,
  },
  media: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 4,
  },
  metaRowOwn: {
    marginRight: 4,
    marginLeft: 0,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '400',
  },
  editedText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  metaReaction: {
    fontSize: 12,
    color: colors.ink,
    fontWeight: '600',
  },
  replyPreview: {
    flexDirection: 'row',
    marginBottom: 4,
    maxWidth: '80%',
  },
  replyBar: {
    width: 3,
    backgroundColor: colors.gold,
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold,
  },
  replyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reactionBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: -6,
    marginBottom: 4,
    zIndex: 2,
  },
  reactionBadgeOwn: {
    alignSelf: 'flex-end',
    marginRight: 12,
  },
  reactionBadgeOther: {
    alignSelf: 'flex-start',
    marginLeft: 12,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 3,
    shadowColor: colors.inkDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionPillActive: {
    backgroundColor: colors.goldLight,
    borderColor: colors.gold,
  },
  reactionEmoji: { fontSize: 12 },
  reactionCountText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  reactionCountActive: { color: colors.goldDeep },
});

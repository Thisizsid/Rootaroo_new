import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import ThreadedReplyPreview from './ThreadedReplyPreview';
import { chatApi } from '../shared/api/chat';
import { colors, radius } from '../shared/theme';

export default function ChatInputBar({ onSend, replyTo, onDismissReply }) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const typingTimer = useRef(null);
  const typingStopped = useRef(true);

  // Debounced typing indicator
  const handleTextChange = useCallback(
    (val) => {
      setText(val);

      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (typingStopped.current) {
        typingStopped.current = false;
        chatApi.typing('start').catch(() => { });
      }

      typingTimer.current = setTimeout(() => {
        typingStopped.current = true;
        chatApi.typing('stop').catch(() => { });
      }, 1500);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (!typingStopped.current) {
        chatApi.typing('stop').catch(() => { });
      }
    };
  }, []);

  const handleSend = async () => {
    if (sending) return;
    if (!text.trim() && !replyTo) return;

    setSending(true);
    try {
      await onSend(text.trim() || undefined);
      setText('');
      Keyboard.dismiss();

      if (!typingStopped.current) {
        typingStopped.current = true;
        chatApi.typing('stop').catch(() => { });
      }
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setSending(true);

    try {
      const uploaded = await chatApi.uploadMedia({
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });

      if (uploaded?.id) {
        await onSend(undefined, [uploaded.id]);
      }
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  const isDisabled = !text.trim() && !replyTo;

  return (

    <KeyboardAvoidingView
      // style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 22}
    >
      <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 0) }]}>
        {replyTo && (
          <ThreadedReplyPreview
            senderName={replyTo.senderName}
            content={replyTo.content}
            onDismiss={onDismissReply}
          />
        )}
        <View style={styles.container}>
          <TouchableOpacity onPress={handlePickImage} style={styles.attachBtn} disabled={sending}>
            <Text style={styles.attachIcon}>+</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={handleTextChange}
            multiline
            maxLength={5000}
            editable={!sending}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendBtn, isDisabled ? styles.sendBtnDisabled : styles.sendBtnActive]}
            disabled={isDisabled || sending}
            activeOpacity={0.8}
          >
            <Text style={[styles.sendIconText, isDisabled ? styles.sendIconDisabled : styles.sendIconActive]}>
              {sending ? '...' : '↑'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.canvas,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 85
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.inkDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  attachIcon: { fontSize: 20, color: colors.textSecondary, fontWeight: '500', lineHeight: 22 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: colors.ink,
    shadowColor: colors.inkDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: colors.gold,
  },
  sendBtnDisabled: {
    backgroundColor: colors.surfaceDark,
  },
  sendIconText: {
    fontSize: 17,
    fontWeight: '800',
  },
  sendIconActive: {
    color: colors.surface,
  },
  sendIconDisabled: {
    color: colors.textMuted,
  },
});

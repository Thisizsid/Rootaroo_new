import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../shared/services/themedAlert';
import ThreadedReplyPreview from './ThreadedReplyPreview';
import { chatApi } from '../shared/api/chat';
import { colors, fonts, radius } from '../shared/theme';

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ChatInputBar({ onSend, onSendVoice, replyTo, onDismissReply }) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const typingTimer = useRef(null);
  const typingStopped = useRef(true);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordingRef = useRef(null);
  const recordTimerRef = useRef(null);

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
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
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

  const handleSendLike = async () => {
    if (sending) return;
    setSending(true);
    try {
      await onSend('👍');
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

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Microphone access needed', 'Enable microphone access to record voice messages.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setRecordSeconds(0);
      setIsRecording(true);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      showAlert('Recording failed', 'Could not start recording.');
    }
  };

  const stopRecording = async ({ send }) => {
    const recording = recordingRef.current;
    if (!recording) return;
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const duration = recordSeconds;
    recordingRef.current = null;
    setIsRecording(false);
    setRecordSeconds(0);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (send && uri && duration > 0) {
        setSending(true);
        const uploaded = await chatApi.uploadVoice({
          uri,
          name: `voice_${Date.now()}.m4a`,
          type: 'audio/m4a',
          durationSeconds: duration,
        });
        if (uploaded?.url) {
          await onSendVoice(uploaded.url, uploaded.durationSeconds ?? duration);
        }
      }
    } catch {
      showAlert('Voice message failed', 'Could not send the voice message.');
    } finally {
      setSending(false);
    }
  };

  const isDisabled = !text.trim() && !replyTo;

  // No KeyboardAvoidingView here on purpose: ChatScreen already wraps this bar
  // in one. Nesting a second avoider double-offsets the input once Android
  // stops being a no-op under edge-to-edge.
  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 0) }]}>
      {replyTo && (
          <ThreadedReplyPreview
            senderName={replyTo.senderName}
            content={replyTo.content}
            onDismiss={onDismissReply}
          />
        )}
        {isRecording ? (
          <View style={styles.container}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTimer}>{formatTimer(recordSeconds)}</Text>
            <Text style={styles.recordingHint}>Recording…</Text>
            <TouchableOpacity
              onPress={() => stopRecording({ send: false })}
              style={styles.iconBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => stopRecording({ send: true })}
              style={[styles.sendBtn, styles.sendBtnActive]}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up" size={18} color={colors.onAccent} />
            </TouchableOpacity>
          </View>
        ) : (
        <View style={styles.container}>
          <TouchableOpacity onPress={handlePickImage} style={styles.iconBtn} disabled={sending}>
            <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={startRecording} style={styles.iconBtn} disabled={sending}>
            <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
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
          {isDisabled ? (
            <TouchableOpacity
              onPress={handleSendLike}
              style={[styles.sendBtn, styles.sendBtnActive]}
              disabled={sending}
              activeOpacity={0.8}
            >
              <Ionicons name="thumbs-up" size={18} color={colors.onAccent} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSend}
              style={[styles.sendBtn, styles.sendBtnActive]}
              disabled={sending}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up" size={18} color={colors.onAccent} />
            </TouchableOpacity>
          )}
        </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.canvas,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: fonts.body,
    maxHeight: 100,
    color: colors.ink,
    shadowColor: colors.shadow,
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
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
  recordingTimer: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.mono,
    color: colors.ink,
  },
  recordingHint: {
    flex: 1,
    fontSize: 14,
    color: colors.textMuted,
  },
});

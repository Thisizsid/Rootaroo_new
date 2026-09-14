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
import { LinearGradient } from 'expo-linear-gradient';
import { showAlert } from '../shared/services/themedAlert';
import { ensureMicrophone } from '../shared/permissions';
import ThreadedReplyPreview from './ThreadedReplyPreview';
import AttachSheet from './AttachSheet';
import { chatApi } from '../shared/api/chat';
import { getSocket } from '../shared/socket';
import { useAuthStore } from '../shared/store/authStore';
import { colors, fonts, radius } from '../shared/theme';
import { chatTheme } from '../shared/theme/chat';

function emitTyping(householdId, isTyping) {
  const socket = getSocket();
  if (!socket || !householdId) return;
  socket.emit(isTyping ? 'chat:typing' : 'chat:stop-typing', { householdId });
}

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ChatInputBar({ onSend, onSendVoice, onSendImage, replyTo, onDismissReply, chatTitle, participantCount }) {
  const insets = useSafeAreaInsets();
  const householdId = useAuthStore((s) => s.householdId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [attachVisible, setAttachVisible] = useState(false);
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
        emitTyping(householdId, true);
      }

      typingTimer.current = setTimeout(() => {
        typingStopped.current = true;
        emitTyping(householdId, false);
      }, 1500);
    },
    [householdId]
  );

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (!typingStopped.current) {
        emitTyping(householdId, false);
      }
    };
  }, [householdId]);

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
        emitTyping(householdId, false);
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

  const handleAttach = () => {
    setAttachVisible(true);
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
      const uploaded = await chatApi.uploadImage({
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });

      if (uploaded?.url) {
        await onSendImage(uploaded.url);
      }
    } catch {
      showAlert('Image failed to send', 'Could not upload the image.');
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!(await ensureMicrophone())) return;
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
            <Ionicons name="close" size={18} color={chatTheme.inputIcon} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => stopRecording({ send: true })}
            style={styles.sendBtn}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={chatTheme.sendGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="arrow-up" size={18} color={chatTheme.sendIcon} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.container}>
          <TouchableOpacity
            onPress={handleAttach}
            style={styles.attachBtn}
            disabled={sending}
            accessibilityRole="button"
            accessibilityLabel="Attach"
          >
            <Ionicons name="add" size={22} color={chatTheme.inputIcon} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={chatTitle ? `Message ${chatTitle}…` : 'Message…'}
            placeholderTextColor={chatTheme.inputPlaceholder}
            value={text}
            onChangeText={handleTextChange}
            multiline
            maxLength={5000}
            editable={!sending}
          />
          <TouchableOpacity
            onPress={isDisabled ? handleSendLike : handleSend}
            style={styles.sendBtn}
            disabled={sending}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={chatTheme.sendGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons
              name={isDisabled ? 'thumbs-up' : 'arrow-up'}
              size={16}
              color={chatTheme.sendIcon}
            />
          </TouchableOpacity>
        </View>
      )}
      <AttachSheet
        visible={attachVisible}
        onClose={() => setAttachVisible(false)}
        chatTitle={chatTitle}
        participantCount={participantCount}
        onPickImage={handlePickImage}
        onStartVoice={startRecording}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: chatTheme.bg,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  // The mock's single rounded pill — attach button, input, and send button
  // all sit inside this one container instead of three separate surfaces.
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: chatTheme.inputBg,
    borderWidth: 1,
    borderColor: chatTheme.inputBorder,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 6,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 10,
    fontSize: 14.5,
    fontFamily: fonts.bodySemiBold,
    maxHeight: 100,
    color: chatTheme.inputText,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
    marginLeft: 4,
  },
  recordingTimer: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.mono,
    color: chatTheme.inputText,
  },
  recordingHint: {
    fontFamily: fonts.body,
    flex: 1,
    fontSize: 14,
    color: chatTheme.inputIcon,
  },
});

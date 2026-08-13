import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../shared/store/authStore';
import { authApi } from '../shared/api/auth';
import apiClient from '../shared/api/client';
import { colors, fonts } from '../shared/theme';
const EMOJIS = ['🏠', '🌿', '🌟', '🦘', '🌱', '🦋', '🌸', '🦁', '🍀', '🌊', '🔥', '⭐'];
function getServerBase() {
  const base = apiClient.defaults.baseURL || '';
  return base.replace(/\/api\/v1\/?$/, '');
}
function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
export default function EditProfileScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [selectedEmoji, setSelectedEmoji] = useState(() => {
    const idx = EMOJIS.indexOf(user?.avatarEmoji ?? '');
    return idx >= 0 ? idx : 3;
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const canSave = name.trim().length > 0 && !saving && !uploadingAvatar;
  const pickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingAvatar(true);
    try {
      const data = await authApi.uploadAvatar(result.assets[0].uri);
      setAvatarUrl(data.avatarUrl);
      if (user)
        setUser({
          ...user,
          avatarUrl: data.avatarUrl,
        });
    } catch (e) {
      Alert.alert('Upload failed', e?.message || 'Could not upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  }, [user, setUser]);
  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        displayName: name.trim(),
        avatarEmoji: EMOJIS[selectedEmoji],
        avatarUrl: avatarUrl ?? undefined,
      });
      if (user) {
        setUser({
          ...user,
          name: updated.displayName,
          avatarEmoji: updated.avatarEmoji,
          avatarUrl: updated.avatarUrl,
          phone: phone.trim() || null,
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }, [name, phone, selectedEmoji, avatarUrl, user, setUser, navigation]);
  const avatarSrc = avatarUrl
    ? {
        uri: avatarUrl.startsWith('http') ? avatarUrl : `${getServerBase()}${avatarUrl}`,
      }
    : null;
  const initials = getInitials(name || user?.name || 'ME');
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />

      {/* ── Header (SCREEN 40): back + Edit profile + Save ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{
            top: 8,
            bottom: 8,
            left: 8,
            right: 8,
          }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          hitSlop={{
            top: 8,
            bottom: 8,
            left: 8,
            right: 8,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.gold} />
          ) : (
            <Text style={[styles.saveLink, !canSave && styles.saveLinkDisabled]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.form,
          {
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar (SCREEN 40) ── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={pickAvatar}
            activeOpacity={0.85}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <View style={styles.avatarCircle}>
                <ActivityIndicator color={colors.gold} />
              </View>
            ) : avatarSrc ? (
              <Image source={avatarSrc} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraBadgeIcon}>📷</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Name ── */}
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Sara Mendez"
          placeholderTextColor={colors.textMuted}
          maxLength={80}
          returnKeyType="next"
        />

        {/* ── Phone ── */}
        <Text style={styles.fieldLabel}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="(555) 010-0192"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          maxLength={20}
        />

        {/* ── Email (read-only) ── */}
        <Text style={styles.fieldLabel}>Email</Text>
        <View style={[styles.input, styles.inputReadOnly]}>
          <Text style={styles.inputReadOnlyText}>{user?.email || ''}</Text>
        </View>

        {/* ── Your emoji ── */}
        <Text style={[styles.fieldLabel, styles.emojiLabel]}>Your emoji</Text>
        <View style={styles.emojiGrid}>
          {EMOJIS.map((e, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.emojiCell, i === selectedEmoji && styles.emojiCellSelected]}
              onPress={() => setSelectedEmoji(i)}
              activeOpacity={0.75}
            >
              <Text style={styles.emojiText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Delete account ── */}
        <TouchableOpacity
          style={styles.deleteRow}
          onPress={() => navigation.navigate('AccountDeletion')}
          activeOpacity={0.75}
        >
          <Text style={styles.deleteRowText}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  // Header (SCREEN 40)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  saveLink: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.goldDeep,
    minWidth: 32,
    textAlign: 'right',
  },
  saveLinkDisabled: {
    opacity: 0.4,
  },
  // Form
  form: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  // Avatar (SCREEN 40)
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.borderCool,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.inkMuted,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.canvas,
  },
  cameraBadgeIcon: {
    fontSize: 14,
  },
  // Fields (SCREEN 40 design inputs)
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 0.4,
    color: colors.textSecondary,
    marginBottom: 7,
    marginTop: 14,
  },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.ink,
    justifyContent: 'center',
  },
  inputReadOnly: {
    backgroundColor: colors.surfaceDark,
  },
  inputReadOnlyText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  // Emoji (SCREEN 40 — keep 12, restyled)
  emojiLabel: {
    marginTop: 26,
    marginBottom: 10,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  emojiCell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCellSelected: {
    borderColor: colors.gold,
  },
  emojiText: {
    fontSize: 20,
  },
  // Delete account (SCREEN 40)
  deleteRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteRowText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.bodyMedium,
    color: colors.danger,
  },
});

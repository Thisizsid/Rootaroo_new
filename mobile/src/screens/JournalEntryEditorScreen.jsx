import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { format, parseISO } from 'date-fns';
import { colors, fonts, radius, spacing, withAlpha } from '../shared/theme';
import { journalApi } from '../shared/api/journal';
import { MOODS } from '../shared/constants/journalMoods';
import { showAlert } from '../shared/services/themedAlert';
import { KEYBOARD_BEHAVIOR } from '../shared/components/KeyboardAware';

/** Suggested when the tag sheet opens with nothing typed. */
const SUGGESTED_TAGS = ['gratitude', 'family', 'work', 'health', 'rest', 'money'];
const MAX_TAGS = 8;
const MAX_MEDIA = 10;

/**
 * The three attach buttons under the entry, left to right. Each produces the
 * same kind of draft — only the picker differs.
 */
const ATTACH_ACTIONS = [
  { key: 'library', icon: 'image-outline', label: 'Add a photo' },
  { key: 'camera', icon: 'camera-outline', label: 'Take a photo' },
  { key: 'video', icon: 'videocam-outline', label: 'Add a video' },
];

/**
 * Compose or edit one entry.
 *
 * Route params:
 *   `entry`   — the full entry object when editing (passed straight from the
 *               detail screen, so opening the editor costs no extra fetch)
 *   `prompt`  — the day's writing prompt, when arrived at from the prompt card
 */
export default function JournalEntryEditorScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const existing = route.params?.entry || null;
  const prompt = route.params?.prompt || null;
  const isEditing = !!existing;

  const [content, setContent] = useState(existing?.content || '');
  const [mood, setMood] = useState(existing?.mood || null);
  const [tags, setTags] = useState(existing?.tags || []);
  const [tagDraft, setTagDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  // Existing attachments keep their server id and signed preview URL; newly
  // picked ones carry the local uri plus, once uploaded, the S3 descriptor the
  // save call needs.
  const [media, setMedia] = useState(() =>
    (existing?.media || []).map((m) => ({
      key: m.id,
      id: m.id,
      previewUri: m.thumbnailUrl || m.mediaUrl,
      kind: m.mediaType,
      uploading: false,
    })),
  );
  const tagInputRef = useRef(null);

  // The header date names the entry's own day, not today — editing last
  // Tuesday's entry must not relabel it "Today".
  const entryDate = useMemo(
    () => (existing ? parseISO(existing.createdAt) : new Date()),
    [existing],
  );
  const headerDate = isEditing
    ? format(entryDate, 'EEE, MMM d')
    : `Today, ${format(entryDate, 'MMM d')}`;

  const uploading = media.some((m) => m.uploading);
  const hasMedia = media.length > 0;
  // A photo-only entry is a valid entry, so text is not required when
  // something is attached — but an in-flight upload has no S3 key yet, so
  // saving waits for it rather than dropping the attachment.
  const canSave = (content.trim().length > 0 || hasMedia) && !saving && !uploading;

  useEffect(() => {
    if (tagDraft !== null) tagInputRef.current?.focus();
  }, [tagDraft]);

  const addTag = useCallback(
    (raw) => {
      const tag = raw.trim().toLowerCase();
      setTagDraft(null);
      if (!tag) return;
      setTags((current) =>
        current.includes(tag) || current.length >= MAX_TAGS ? current : [...current, tag],
      );
    },
    [],
  );

  const removeTag = useCallback((tag) => {
    setTags((current) => current.filter((t) => t !== tag));
  }, []);

  const removeMedia = useCallback((key) => {
    setMedia((current) => current.filter((m) => m.key !== key));
  }, []);

  /**
   * Upload happens as soon as an asset is picked, not at save time — a
   * thumbnail appears immediately and Save stays instant. A draft that fails
   * keeps its slot and is marked, so nothing disappears silently.
   */
  const uploadAssets = useCallback(async (assets) => {
    const room = MAX_MEDIA - media.length;
    if (room <= 0) {
      showAlert('Attachment limit', `An entry can hold up to ${MAX_MEDIA} photos or videos.`, [
        { text: 'OK' },
      ]);
      return;
    }
    const batch = assets.slice(0, room);
    const drafts = batch.map((asset, i) => ({
      key: `draft-${Date.now()}-${i}`,
      previewUri: asset.uri,
      kind: asset.type === 'video' ? 'video' : 'photo',
      uploading: true,
    }));
    setMedia((current) => [...current, ...drafts]);

    try {
      const formData = new FormData();
      batch.forEach((asset) => {
        formData.append('files', {
          uri: asset.uri,
          name: asset.fileName || asset.uri.split('/').pop() || `journal-${Date.now()}.jpg`,
          type: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        });
      });
      const uploaded = await journalApi.uploadMedia(formData);
      setMedia((current) =>
        current.map((m) => {
          const index = drafts.findIndex((d) => d.key === m.key);
          if (index === -1) return m;
          const result = uploaded[index];
          if (!result) return { ...m, uploading: false, failed: true };
          return {
            ...m,
            uploading: false,
            // `fileName` is the durable S3 key — the value the entry stores.
            upload: {
              mediaUrl: result.fileName,
              mediaType: m.kind,
              fileSizeBytes: result.size,
            },
          };
        }),
      );
    } catch (e) {
      setMedia((current) =>
        current.map((m) =>
          drafts.some((d) => d.key === m.key) ? { ...m, uploading: false, failed: true } : m,
        ),
      );
      showAlert('Upload failed', e?.message || 'That attachment could not be uploaded.', [
        { text: 'OK' },
      ]);
    }
  }, [media.length]);

  const handleAttach = useCallback(
    async (action) => {
      const wantsCamera = action === 'camera';
      const permission = wantsCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        showAlert(
          'Permission needed',
          wantsCamera
            ? 'Allow camera access to add a photo to this entry.'
            : 'Allow photo library access to attach media to this entry.',
          [{ text: 'OK' }],
        );
        return;
      }
      const result = wantsCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: action === 'video' ? ['videos'] : ['images'],
            allowsMultipleSelection: action !== 'video',
            selectionLimit: MAX_MEDIA,
            quality: 0.85,
            videoMaxDuration: 120,
          });
      if (result.canceled || !result.assets?.length) return;
      await uploadAssets(result.assets);
    },
    [uploadAssets],
  );

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      // Failed uploads never reach the server: they have no S3 key, so
      // sending them would either 400 the whole save or store a broken row.
      const attachments = media
        .filter((m) => !m.failed)
        .map((m) => (m.id ? { id: m.id } : m.upload))
        .filter(Boolean);
      const text = content.trim();
      const body = { tags, media: attachments };
      if (isEditing) {
        // `mood` is sent as null (not omitted) when cleared, so unpicking a
        // face actually removes it rather than silently keeping the old one.
        // `content` is omitted when empty — the API rejects a blank string,
        // and a photo-only entry legitimately has none.
        await journalApi.update(existing.id, {
          ...body,
          mood: mood || null,
          ...(text ? { content: text } : {}),
        });
      } else {
        await journalApi.create({
          ...body,
          ...(text ? { content: text } : {}),
          ...(mood ? { mood } : {}),
        });
      }
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      showAlert(
        'Could not save',
        e?.response?.data?.message || 'Your entry was not saved. Try again in a moment.',
        [{ text: 'OK' }],
      );
    }
  }, [canSave, content, tags, mood, media, isEditing, existing, navigation]);

  const handleCancel = useCallback(() => {
    const dirty = isEditing
      ? content !== (existing.content || '') ||
        mood !== (existing.mood || null) ||
        tags.join() !== (existing.tags || []).join() ||
        media.length !== (existing.media || []).length ||
        media.some((m) => !m.id)
      : content.trim().length > 0 || !!mood || tags.length > 0 || media.length > 0;
    if (!dirty) {
      navigation.goBack();
      return;
    }
    showAlert('Discard this entry?', 'What you have written here will not be saved.', [
      { text: 'Keep writing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  }, [isEditing, content, mood, tags, media, existing, navigation]);

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={KEYBOARD_BEHAVIOR}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.canvas} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleCancel} hitSlop={12} activeOpacity={0.7}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{headerDate}</Text>
        <TouchableOpacity onPress={handleSave} hitSlop={12} activeOpacity={0.7} disabled={!canSave}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.gold} />
          ) : (
            <Text style={[styles.save, !canSave && styles.saveDisabled]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.fieldLabel}>How are you feeling?</Text>
        <View style={styles.moodRow}>
          {MOODS.map((option) => {
            const selected = mood === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.moodCell, selected && styles.moodCellSelected]}
                // Tapping the selected face again clears it — the row is the
                // only place a mood can be unset.
                onPress={() => setMood(selected ? null : option.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={option.label}
              >
                <Text style={styles.moodEmoji}>{option.emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, styles.entryLabel]}>Entry</Text>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder={prompt || 'Write about your day…'}
          placeholderTextColor={colors.placeholderWarm}
          multiline
          textAlignVertical="top"
          autoFocus={!isEditing}
          scrollEnabled={false}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {hasMedia ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mediaStrip}
          >
            {media.map((item) => (
              <View key={item.key} style={styles.mediaThumb}>
                <Image source={{ uri: item.previewUri }} style={styles.mediaImage} />
                {item.uploading ? (
                  <View style={styles.mediaOverlay}>
                    <ActivityIndicator size="small" color={colors.onAccent} />
                  </View>
                ) : null}
                {item.failed ? (
                  <View style={styles.mediaOverlay}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  </View>
                ) : null}
                {item.kind === 'video' && !item.uploading ? (
                  <View style={styles.mediaBadge}>
                    <Ionicons name="videocam" size={10} color={colors.onAccent} />
                  </View>
                ) : null}
                <TouchableOpacity
                  style={styles.mediaRemove}
                  onPress={() => removeMedia(item.key)}
                  hitSlop={8}
                  accessibilityLabel="Remove attachment"
                >
                  <Ionicons name="close" size={11} color={colors.onAccent} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <Text style={styles.fieldLabel}>Tags</Text>
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.tagChip}
              onPress={() => removeTag(tag)}
              activeOpacity={0.75}
              accessibilityLabel={`Remove tag ${tag}`}
            >
              <Text style={styles.tagChipText}>{tag}</Text>
              <Ionicons name="close" size={11} color={colors.textMuted} />
            </TouchableOpacity>
          ))}

          {tagDraft !== null ? (
            <TextInput
              ref={tagInputRef}
              style={[styles.tagChip, styles.tagInput]}
              value={tagDraft}
              onChangeText={setTagDraft}
              onSubmitEditing={() => addTag(tagDraft)}
              onBlur={() => addTag(tagDraft)}
              placeholder="tag"
              placeholderTextColor={colors.placeholderWarm}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              maxLength={24}
            />
          ) : tags.length < MAX_TAGS ? (
            <TouchableOpacity
              style={[styles.tagChip, styles.tagAdd]}
              onPress={() => setTagDraft('')}
              activeOpacity={0.75}
            >
              <Text style={styles.tagAddText}>+ add</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {tagDraft !== null && tags.length === 0 ? (
          <View style={styles.suggestRow}>
            {SUGGESTED_TAGS.map((tag) => (
              <TouchableOpacity key={tag} onPress={() => addTag(tag)} activeOpacity={0.7}>
                <Text style={styles.suggestText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.footerBar}>
          <View style={styles.attachRow}>
            {ATTACH_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={styles.attachBtn}
                onPress={() => handleAttach(action.key)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <Ionicons name={action.icon} size={15} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.privacyWrap}>
            <Ionicons name="lock-closed" size={11} color={colors.textMuted} />
            <Text style={styles.privacyText}>Private · only you</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  cancel: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textSecondary },
  topBarTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  save: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.gold },
  saveDisabled: { color: colors.btnDisabledText },

  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  fieldLabel: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  entryLabel: { marginTop: spacing.xl },

  moodRow: { flexDirection: 'row', gap: spacing.sm },
  moodCell: {
    flex: 1,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceDark,
    borderWidth: 1.5,
    borderColor: colors.borderCool,
  },
  moodCellSelected: {
    borderColor: colors.gold,
    backgroundColor: withAlpha(colors.goldGlow, 0.12),
  },
  moodEmoji: { fontSize: 20 },

  input: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.ink,
    minHeight: 220,
    padding: 0,
  },

  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  tagChipText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkDeep },
  tagAdd: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagAddText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textSecondary },
  tagInput: {
    minWidth: 90,
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.ink,
    paddingVertical: 0,
  },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  suggestText: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },

  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  attachRow: { flexDirection: 'row', gap: spacing.sm },
  attachBtn: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderCool,
  },

  mediaStrip: { gap: spacing.sm, paddingBottom: spacing.md },
  mediaThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceDark,
  },
  mediaImage: { width: '100%', height: '100%' },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.overlaySlate, 0.55),
  },
  mediaBadge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    borderRadius: radius.xs,
    paddingHorizontal: 3,
    paddingVertical: 1,
    backgroundColor: withAlpha(colors.overlaySlate, 0.7),
  },
  mediaRemove: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.overlaySlate, 0.75),
  },
  privacyWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  privacyText: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import apiClient from '../shared/api/client';
import { colors, fonts } from '../shared/theme';

const AVATAR_FALLBACKS = [colors.avatarBronze, colors.avatarMoss, colors.avatarSlate, colors.avatarMauve, colors.legacyGold];

function getServerBase() {
  const base = apiClient.defaults.baseURL || '';
  return base.replace(/\/api\/v1\/?$/, '');
}

export function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file:')) {
    return url;
  }
  return `${getServerBase()}${url}`;
}

export function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * expo-image's `cachePolicy="disk"` treats `cacheKey` (not `uri`) as the
 * cache identity when both are given. Keying by a stable entity id would
 * mean a real photo change (a genuinely new URL) still hits the old cached
 * bytes. Keying by the raw URL defeats caching too — presigned S3 URLs get
 * a new query-string signature on every fetch even for the *same* photo.
 * Stripping the query string gives a key that's stable across repeat views
 * of the same photo, but changes the moment the photo is actually replaced
 * (the underlying S3 key/path changes).
 */
export function cacheKeyFromUrl(url) {
  if (!url) return undefined;
  return url.split('?')[0];
}

export function avatarTone(id) {
  let hash = 0;
  const key = id || '?';
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_FALLBACKS[Math.abs(hash) % AVATAR_FALLBACKS.length];
}

/**
 * Shared member-identity avatar: real photo (url) → emoji → initials.
 * Used everywhere a household member's picture should show — feed, chat,
 * map, tasks, calendar, expenses, vault, etc.
 */
export default function Avatar({ url, emoji, name, id, size = 40, style }) {
  const resolved = resolveUrl(url);
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatarTone(id),
        },
        style,
      ]}
    >
      {resolved ? (
        <Image
          source={{ uri: resolved, cacheKey: cacheKeyFromUrl(resolved) }}
          style={{ width: size, height: size }}
          cachePolicy="disk"
        />
      ) : emoji ? (
        <Text style={{ fontSize: size * 0.48 }}>{emoji}</Text>
      ) : (
        <Text style={[styles.avatarInitials, { fontSize: size * 0.32 }]}>
          {getInitials(name || 'ME')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarInitials: {
    fontWeight: '700',
    fontFamily: fonts.bodyBold,
    color: colors.onAccent,
  },
});

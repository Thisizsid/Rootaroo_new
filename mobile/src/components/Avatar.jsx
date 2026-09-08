import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
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
        <Image source={{ uri: resolved }} style={{ width: size, height: size }} />
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

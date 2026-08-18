import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFeedPhotos } from '../shared/hooks/useFeedPhotos';
import { useFeedStore } from '../shared/store/feedStore';
import { useAuthStore } from '../shared/store/authStore';
import { householdApi } from '../shared/api/household';
import { colors, fonts, withAlpha } from '../shared/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = 3;
const EDGE = 16;
const GAP = 6;
const TILE = Math.floor((SCREEN_WIDTH - EDGE * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

// "abc" → "abc's", "Jones" → "Jones'"
function possessive(name) {
  const trimmed = name.trim();
  return /s$/i.test(trimmed) ? `${trimmed}'` : `${trimmed}'s`;
}

export default function PhotoGalleryScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const photos = useFeedPhotos();
  const refresh = useFeedStore((s) => s.refresh);
  const refreshing = useFeedStore((s) => s.refreshing);
  const hasMore = useFeedStore((s) => s.hasMore);
  const fetchMore = useFeedStore((s) => s.fetchMore);
  const [viewerIndex, setViewerIndex] = useState(null);
  const householdId = useAuthStore((s) => s.householdId);
  const [householdName, setHouseholdName] = useState('');

  useEffect(() => {
    if (!householdId) return undefined;
    let cancelled = false;
    householdApi
      .getHousehold(householdId)
      .then((hh) => {
        if (!cancelled) setHouseholdName(hh?.name || '');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [householdId]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <TouchableOpacity
        style={[
          styles.tile,
          { marginRight: (index + 1) % COLUMNS === 0 ? 0 : GAP },
        ]}
        activeOpacity={0.85}
        onPress={() => setViewerIndex(index)}
      >
        <Image source={{ uri: item.uri }} style={styles.tileImage} resizeMode="cover" />
      </TouchableOpacity>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => nav.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {householdName ? `${possessive(householdName)} Household` : 'Photos'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        numColumns={COLUMNS}
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: insets.bottom + 24 },
          photos.length === 0 && styles.gridEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasMore) fetchMore();
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.goldDeep}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptyHint}>Photos shared to the Feed show up here.</Text>
          </View>
        }
      />

      <Modal
        visible={viewerIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerIndex(null)}
      >
        <Pressable style={styles.viewer} onPress={() => setViewerIndex(null)}>
          {viewerIndex !== null && photos[viewerIndex] ? (
            <Image
              source={{ uri: photos[viewerIndex].uri }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: EDGE,
    paddingBottom: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 28,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  grid: {
    paddingHorizontal: EDGE,
    paddingTop: 4,
  },
  gridEmpty: {
    flexGrow: 1,
  },
  tile: {
    width: TILE,
    height: TILE,
    marginBottom: GAP,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyEmoji: {
    fontSize: 34,
    opacity: 0.5,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.displayBold,
    color: colors.ink,
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  viewer: {
    flex: 1,
    backgroundColor: withAlpha(colors.canvas, 0.96),
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '80%',
  },
});

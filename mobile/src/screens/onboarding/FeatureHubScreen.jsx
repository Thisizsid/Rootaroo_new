import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FeatureTourShell, { TourIcon } from './FeatureTourShell';
import { Eyebrow, AvatarStack } from './tourPrimitives';
import { useTourHousehold } from './useTourHousehold';
import { hub, hubTiles } from './featureTourContent';
import { colors, fonts, radius, withAlpha } from '../../shared/theme';

const FALLBACK_NAMES = ['Sid', 'Sera', 'Vacancy'];

/**
 * Step 3 of 5 — the inventory. After the day-in-the-life, the nine features
 * are named plainly in one grid, then tied back to the household that owns
 * them. The ninth tile (Private vault) carries a gold rim: it is the only
 * one whose data the rest of the household cannot see, and the next step is
 * about exactly that.
 */
export default function FeatureHubScreen({ navigation }) {
  const { name, memberNames } = useTourHousehold();

  const names = (memberNames.length ? memberNames : FALLBACK_NAMES).slice(0, 3);

  return (
    <FeatureTourShell
      step={2}
      navigation={navigation}
      contentPadding={16}
      header={
        <>
          <Eyebrow>{hub.eyebrow}</Eyebrow>
          <Text style={styles.title}>{hub.title}</Text>
          <Text style={styles.body}>{hub.body}</Text>
        </>
      }
      ctaLabel={hub.cta}
      onContinue={() => navigation.navigate('FeaturePrivacy')}
    >
      <View style={styles.grid}>
        {hubTiles.map((tile, i) => (
          <View
            key={tile.label}
            style={[styles.tile, i === hubTiles.length - 1 && styles.tileAccent]}
          >
            <View style={styles.tileIcon}>
              <TourIcon paths={tile.paths} />
            </View>
            <Text style={styles.tileLabel}>{tile.label}</Text>
          </View>
        ))}
      </View>

      <LinearGradient
        colors={[colors.canvasBright, colors.canvasGray]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.householdCard}
      >
        <AvatarStack names={names} size={32} ringColor={colors.canvasBright} />
        <View style={styles.householdText}>
          <Text style={styles.householdName} numberOfLines={1}>
            {name || hub.fallbackHouseholdTitle}
          </Text>
          <Text style={styles.householdSub}>{hub.householdSub}</Text>
        </View>
      </LinearGradient>
    </FeatureTourShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.display,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: colors.ink,
    marginTop: 6,
  },
  body: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 8,
  },

  // Three-up wrap rather than a fixed grid: with `flexBasis` as a percentage
  // the tiles reflow on narrow phones instead of overflowing.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  tile: {
    flexBasis: '31%',
    flexGrow: 1,
    borderRadius: radius.cardLg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.06),
    paddingTop: 13,
    paddingBottom: 11,
    paddingHorizontal: 9,
    alignItems: 'center',
    gap: 9,
  },
  tileAccent: { borderColor: withAlpha(colors.gold, 0.24) },
  tileIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: withAlpha(colors.gold, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.26),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.grayDeep,
    textAlign: 'center',
  },

  householdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: radius.sheet,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.18),
    padding: 17,
    marginTop: 12,
    overflow: 'hidden',
  },
  householdText: { flex: 1, minWidth: 0 },
  householdName: {
    fontFamily: fonts.display,
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  householdSub: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 3,
  },
});

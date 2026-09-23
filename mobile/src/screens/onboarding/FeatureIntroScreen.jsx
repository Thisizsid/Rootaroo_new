import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FeatureTourShell from './FeatureTourShell';
import { AvatarStack } from './tourPrimitives';
import { useTourHousehold } from './useTourHousehold';
import { intro } from './featureTourContent';
import { colors, fonts, withAlpha } from '../../shared/theme';

/** The mock's three faces, used until the real household has members. */
const FALLBACK_NAMES = ['Sid', 'Sera', 'Vacancy'];

/**
 * Step 1 of 5 — the opening. A centred statement rather than a list: the
 * design opens on what Rootaroo IS ("a private home for the <family>") and
 * saves the feature inventory for step 3.
 */
export default function FeatureIntroScreen({ navigation }) {
  const { name, memberNames } = useTourHousehold();

  const householdName = name || intro.fallbackHouseholdName;
  const names = memberNames.length ? memberNames : FALLBACK_NAMES;
  const shown = names.slice(0, 3);
  const extra = names.length > 3 ? `+${names.length - 3}` : null;

  return (
    <FeatureTourShell
      step={0}
      navigation={navigation}
      ctaLabel={intro.cta}
      ctaSubLabel={intro.ctaSub}
      onContinue={() => navigation.navigate('FeatureDay')}
      contentPadding={26}
    >
      {/* The warm halo behind the statement. Absolutely positioned and
          non-interactive so it tints the field without affecting layout. */}
      <LinearGradient
        colors={[withAlpha(colors.goldGlow, 0.18), withAlpha(colors.goldGlow, 0.03), 'transparent']}
        style={styles.halo}
        pointerEvents="none"
      />

      <View style={styles.body}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <View style={styles.brandDot} />
          </View>
          <Text style={styles.brand}>{intro.brand}</Text>
        </View>

        <Text style={styles.title}>
          {intro.titleLead}
          {'\n'}
          {intro.titleTail}
          <Text style={styles.titleAccent}>{householdName}</Text>.
        </Text>

        <Text style={styles.subtitle}>{intro.body}</Text>

        <View style={styles.seatRow}>
          <AvatarStack names={shown} extra={extra} />
          <Text style={styles.seatText}>
            {intro.seatLine[0]}
            {'\n'}
            {intro.seatLine[1]}
          </Text>
        </View>
      </View>
    </FeatureTourShell>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
    alignSelf: 'center',
    top: '8%',
    width: 520,
    height: 520,
    borderRadius: 260,
  },

  // `justifyContent: center` is what makes this step read as a title card:
  // the statement sits in the optical middle at any screen height.
  body: {
    flex: 1,
    justifyContent: 'center',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandMark: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.35),
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandDot: {
    width: 9,
    height: 9,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
    color: colors.gold,
  },

  title: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 41,
    fontWeight: '800',
    letterSpacing: -1.3,
    color: colors.ink,
    marginTop: 26,
  },
  titleAccent: { color: colors.gold },

  subtitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15.5,
    lineHeight: 25,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 18,
    maxWidth: 320,
  },

  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 30,
  },
  seatText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textMuted,
  },
});

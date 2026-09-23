import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, goldButton, withAlpha } from '../../shared/theme';
import { GoldFill } from '../../shared/components/GoldButton';
import { updateSignupProgress } from '../../shared/store/signupProgress';
import { TOUR_ROUTES } from './featureTourContent';

/**
 * Chrome for the five feature-overview screens, the way SignupWizardShell is
 * chrome for the signup wizard — same structural contract (a progress rail,
 * a scrolling body, one gold pill CTA pinned at the bottom), tuned to the
 * design's tour layout:
 *
 *   • the rail has FIVE segments, not the wizard's eight, and each one is
 *     tappable — the design lets you jump between steps, which is what makes
 *     this read as an overview you can skim rather than a form you must fill.
 *   • `header` renders ABOVE the scroll area and stays put. The long steps
 *     (the day timeline, pricing) scroll their body under a fixed title, so
 *     you never lose track of which step you're on mid-scroll.
 *
 * Mounting a step also records it in signupProgress, so an in-session resume
 * (stepToRoute) reopens the step the user was on. Note this does NOT survive
 * a re-login: resolvePostAuthNavigation short-circuits on "user already has a
 * household = setup done" before it ever consults the saved step, so a
 * creator who kills the app mid-tour and signs back in lands on Home. That is
 * the pre-existing rule for returning users and it is the right one — the
 * tour is a welcome, not a gate.
 */
export default function FeatureTourShell({
  step,
  navigation,
  header,
  children,
  ctaLabel,
  ctaSubLabel,
  onContinue,
  scrollRef,
  footerDivider = false,
  contentPadding = 18,
}) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    updateSignupProgress({ step: `feature${step + 1}` }).catch(() => {
      /* Progress is a resume convenience, never a gate — a failed write must
         not block the tour. */
    });
  }, [step]);

  const goToStep = (i) => {
    if (i === step) return;
    navigation.navigate(TOUR_ROUTES[i]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgApp} />

      <View style={[styles.rail, { paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 14) }]}>
        {TOUR_ROUTES.map((route, i) => (
          <TouchableOpacity
            key={route}
            style={styles.railHit}
            onPress={() => goToStep(i)}
            hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={`Step ${i + 1} of ${TOUR_ROUTES.length}`}
            accessibilityState={i === step ? { selected: true } : {}}
          >
            <View
              style={[
                styles.seg,
                i === step && styles.segOn,
                i < step && styles.segDone,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {header ? <View style={styles.header}>{header}</View> : null}

      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: contentPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      <View
        style={[
          styles.footer,
          footerDivider && styles.footerDivider,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
        <TouchableOpacity style={styles.cta} onPress={onContinue} activeOpacity={0.85}>
          <GoldFill radius={27} />
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
        {ctaSubLabel ? <Text style={styles.ctaSub}>{ctaSubLabel}</Text> : null}
      </View>
    </View>
  );
}

/** The design's 17px line icons, as a reusable element for every step. */
export function TourIcon({ paths, size = 17, stroke = colors.gold, strokeWidth = 1.9 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {paths.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgApp },
  flex: { flex: 1 },

  rail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
    paddingBottom: 2,
  },
  // The touch target is taller than the 3px bar it draws, so the segments
  // stay tappable without making the rail itself a thick band.
  railHit: {
    flex: 1,
    paddingVertical: 8,
  },
  seg: {
    height: 3,
    borderRadius: 99,
    backgroundColor: withAlpha(colors.white, 0.08),
  },
  segOn: { backgroundColor: colors.gold },
  segDone: { backgroundColor: withAlpha(colors.gold, 0.35) },

  header: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 12,
  },

  scroll: {
    flexGrow: 1,
    paddingBottom: 12,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  footerDivider: {
    borderTopWidth: 1,
    borderTopColor: withAlpha(colors.white, 0.05),
  },

  cta: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldWarm,
    ...goldButton.glow,
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: -0.16,
    color: goldButton.onGold,
  },
  ctaSub: {
    textAlign: 'center',
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textFaint,
    marginTop: 12,
  },
});

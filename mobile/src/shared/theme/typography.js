/**
 * Rootaroo typography tokens — from 01-Design-System.html.
 * Display/brand: Plus Jakarta Sans · UI: Inter · Mono: JetBrains Mono.
 */
export const fonts = {
  display: 'PlusJakartaSans_800ExtraBold',
  displayBold: 'PlusJakartaSans_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: 'JetBrainsMono_400Regular',
};

/** Scale from the mockup: brand 34, screen-title 26-27, section 24, body 14. */
export const typeScale = {
  brand: { fontSize: 34, lineHeight: 34, letterSpacing: -0.02, fontWeight: '800' },
  display: { fontSize: 44, lineHeight: 48, letterSpacing: -0.02, fontWeight: '800' },
  titleLarge: { fontSize: 27, lineHeight: 34, letterSpacing: -0.01, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 31, fontWeight: '700' },
  heading: { fontSize: 21, lineHeight: 27, fontWeight: '700' },
  subheading: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  tagline: { fontSize: 14, lineHeight: 14, fontWeight: '400' },
};

/** Convenience: pre-bound text styles per role. */
export const textStyles = {
  brand: { fontFamily: fonts.display, ...typeScale.brand },
  display: { fontFamily: fonts.display, ...typeScale.display },
  titleLarge: { fontFamily: fonts.displayBold, ...typeScale.titleLarge },
  title: { fontFamily: fonts.displayBold, ...typeScale.title },
  heading: { fontFamily: fonts.displayBold, ...typeScale.heading },
  subheading: { fontFamily: fonts.bodySemiBold, ...typeScale.subheading },
  body: { fontFamily: fonts.body, ...typeScale.body },
  bodySmall: { fontFamily: fonts.body, ...typeScale.bodySmall },
  caption: { fontFamily: fonts.body, ...typeScale.caption },
  label: { fontFamily: fonts.bodySemiBold, ...typeScale.label },
  tagline: { fontFamily: fonts.body, ...typeScale.tagline },
};

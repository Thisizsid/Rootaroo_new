/**
 * Rootaroo typography tokens — the single source of truth for every font
 * used in the app. Three layers, each building on the one before:
 *
 *   fonts       → font-FAMILY tokens only (which face + weight file).
 *                 Named by ROLE ("body", "bodySemiBold"), never by the
 *                 underlying font's brand name — that's what makes swapping
 *                 the actual typeface later a one-file change instead of a
 *                 find-and-replace across the app. Live-consumed directly by
 *                 ~477 existing call sites across the app today (via
 *                 `fontFamily: fonts.xxx` in local StyleSheets), so these
 *                 key NAMES are effectively a public API — only the VALUES
 *                 they point to should ever change.
 *   typeScale   → semantic ROLES (title, body, caption, …), each a full
 *                 { fontSize, lineHeight, letterSpacing, fontWeight } shape,
 *                 independent of any specific font family.
 *   textStyles  → typeScale roles pre-merged with the right `fonts.*` family
 *                 — the actual thing a component renders. This is what
 *                 AppText (src/shared/components/AppText.jsx) consumes.
 *
 * Current mapping (Aug 2026 — Nunito Sans confirmed as the Rootaroo font):
 *   Nunito Sans      → fonts.body / bodyMedium / bodySemiBold / bodyBold
 *                       / display / displayBold — global font for both
 *                       UI/body text and display/heading text.
 *   Plus Jakarta Sans → not referenced by any `fonts.*` token anymore, but
 *                       its weights stay loaded in useAppFonts.js — a
 *                       handful of existing screens (DashboardScreen,
 *                       FeedScreen, CommentsScreen, CreatePostScreen)
 *                       reference its family-name strings directly rather
 *                       than through this token map; that unmigrated text
 *                       is a separate, later cleanup, not this change.
 *   JetBrains Mono    → fonts.mono (technical/monospace only)
 *
 * Swapping the primary font later: change these `fonts.*` values (and
 * register the new weights in useAppFonts.js) — nothing in typeScale,
 * textStyles, AppText, or any screen needs to change.
 */
export const fonts = {
  // Nunito Sans — the global Rootaroo font, body through display.
  body: 'NunitoSans_400Regular',
  bodyMedium: 'NunitoSans_500Medium',
  bodySemiBold: 'NunitoSans_600SemiBold',
  bodyBold: 'NunitoSans_700Bold',
  display: 'NunitoSans_800ExtraBold',
  displayBold: 'NunitoSans_700Bold',
  // JetBrains Mono — technical/monospace only.
  mono: 'JetBrainsMono_400Regular',
};

/**
 * Semantic type scale. Sizes/line-heights are conservative — carried over
 * from the app's existing mockup-derived scale, not a redesign — with four
 * roles added (button, stat, quote, mono) that the app already needed but
 * had no shared definition for (each was previously a local, one-off style
 * per screen).
 */
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
  // New roles — button/stat/quote/mono had no shared definition before.
  button: { fontSize: 15, lineHeight: 20, letterSpacing: 0.2, fontWeight: '600' },
  stat: { fontSize: 28, lineHeight: 32, letterSpacing: -0.01, fontWeight: '700' },
  quote: { fontSize: 15, lineHeight: 23, fontWeight: '400', fontStyle: 'italic' },
  mono: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
};

/**
 * Pre-composed text styles — typeScale roles merged with their font family.
 * Every role is Nunito Sans except `mono` (JetBrains Mono). Nothing in the
 * app consumes these yet (they're the foundation for AppText, not a live
 * dependency) — safe to compose freely without any existing-screen impact.
 */
export const textStyles = {
  brand: { fontFamily: fonts.display, ...typeScale.brand },
  display: { fontFamily: fonts.display, ...typeScale.display },
  titleLarge: { fontFamily: fonts.bodyBold, ...typeScale.titleLarge },
  title: { fontFamily: fonts.bodyBold, ...typeScale.title },
  heading: { fontFamily: fonts.bodyBold, ...typeScale.heading },
  subheading: { fontFamily: fonts.bodySemiBold, ...typeScale.subheading },
  body: { fontFamily: fonts.body, ...typeScale.body },
  bodySmall: { fontFamily: fonts.body, ...typeScale.bodySmall },
  caption: { fontFamily: fonts.body, ...typeScale.caption },
  label: { fontFamily: fonts.bodySemiBold, ...typeScale.label },
  tagline: { fontFamily: fonts.body, ...typeScale.tagline },
  button: { fontFamily: fonts.bodySemiBold, ...typeScale.button },
  // Tabular figures so stacked/changing numbers (streak, points, balances)
  // don't shift width digit to digit.
  stat: { fontFamily: fonts.bodyBold, fontVariant: ['tabular-nums'], ...typeScale.stat },
  quote: { fontFamily: fonts.body, ...typeScale.quote },
  mono: { fontFamily: fonts.mono, ...typeScale.mono },
};

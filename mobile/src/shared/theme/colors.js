/**
 * Rootaroo design tokens — Design System Dark.
 *
 * THE SINGLE SOURCE OF TRUTH. Every colour in the app resolves here; changing a
 * value in this file changes that colour everywhere.
 *
 * ── The language ────────────────────────────────────────────────────────────
 * A deep navy ambient field. Translucent glass surfaces float on it, defined by
 * thin specular rims rather than hard borders. One honey accent, used only
 * where it is earned. Typography carries the hierarchy, not chrome.
 *
 * ── Reading this file ───────────────────────────────────────────────────────
 * Token NAMES are historical (they were coined for the old cream/ink theme) but
 * their ROLES are stable and are what the app depends on:
 *
 *   canvas*  → the field a screen sits on          (darkest)
 *   surface* → a card/sheet floating on the field  (translucent glass)
 *   ink*     → PRIMARY TEXT (not a fill — see note)
 *   text*    → the secondary/tertiary text ramp
 *   border   → hairline rims and dividers
 *   gold*    → the honey accent
 *   onAccent → text/icons sitting ON an accent or dark fill (always light)
 *   shadow   → a fixed near-black; never inverts
 *
 * NOTE ON `ink`: in the light theme it meant "dark text on light". It is now
 * light text on dark. It is a TEXT token in both. Sites that used it as a dark
 * *fill* were migrated to `surfaceRaised`, and shadow sites to `shadow`, so the
 * role stayed pure through the flip.
 */
export const colors = {
  /* ---- Brand: the honey accent ---- */
  gold: '#E0B563',
  goldSoft: '#F0CB86',
  goldDeep: '#E0B563',
  goldLight: '#FFE7BC',

  /* ---- Ink ramp — PRIMARY TEXT on the dark field (bright → dim) ---- */
  ink: '#F2F5FA',
  inkSoft: '#EAEFF7',
  inkDeep: '#DCE4F0',
  inkMuted: '#93A2B8',

  /* ---- Canvas: the ambient navy field ---- */
  canvas: '#0B1220',
  canvasElevated: '#101A2E',
  /* Glass: translucent white over the field. Reads as a lit pane, not a slab. */
  surface: 'rgba(255, 255, 255, 0.062)',
  surfaceWarm: 'rgba(255, 255, 255, 0.05)',
  surfaceDark: 'rgba(255, 255, 255, 0.035)',
  /* Opaque raised surface — for fills that must stay solid (avatars, sheets). */
  surfaceRaised: '#16243F',

  /* ---- Neutrals: the secondary text ramp + rims ---- */
  textSecondary: '#8A99B0',
  textMuted: '#6C7A90',
  textFaint: '#5A6880',
  textMutedDark: '#7F8FA8',
  border: 'rgba(255, 255, 255, 0.14)',
  borderCool: 'rgba(255, 255, 255, 0.10)',
  divider: 'rgba(255, 255, 255, 0.10)',
  skeleton: 'rgba(255, 255, 255, 0.08)',

  /* ---- Semantic (tuned for legibility on navy) ---- */
  danger: '#E08876',
  dangerDark: '#C56A57',
  dangerSoft: 'rgba(224, 136, 118, 0.14)',
  success: '#7FB07A',
  successSoft: '#6F9C6A',
  info: '#93A2B8',
  infoSoft: '#7F8FA8',

  /* ---- Fixed absolutes — these never invert ---- */
  /* Text/icons sitting on an accent fill or a dark surface. */
  onAccent: '#FFFFFF',
  /* Shadow colour. Stays near-black so elevation reads on a dark field. */
  shadow: '#03070F',
  black: '#000000',
  white: '#FFFFFF',

  /* ---- Splash ---- */
  splashBg: '#06090F',
  splashMarkFill: '#33241A',
  splashMarkRim: '#F0C878',
  splashShadow: '#03070F',
  splashKangarooTail: '#333944',
  splashKangarooBody: '#3A3F48',
  splashDot: '#C79A4B',

  /* ---- Auth / signup surfaces ---- */
  bgApp: '#0B1220',
  textPrimary: '#F2F5FA',
  textSecondaryWarm: '#8A99B0',
  labelWarm: '#93A2B8',
  errorWarm: '#E08876',
  errorBg: 'rgba(224, 136, 118, 0.10)',
  fieldBorder: 'rgba(255, 255, 255, 0.14)',
  fieldFocus: '#E0B563',
  placeholderWarm: '#6C7A90',
  btnDisabledBg: 'rgba(255, 255, 255, 0.10)',
  btnDisabledText: '#6C7A90',
  goldWarm: '#E0B563',
  goldWarmDark: '#C98F3C',
  goldTint: 'rgba(224, 181, 99, 0.14)',

  /* ---- Legacy names, remapped onto the dark system ---- */
  legacyNavy: '#F2F5FA',
  legacyNavyTop: '#101A2E',
  legacyNavySoft: '#16243F',
  legacyGold: '#E0B563',
  legacyGoldDark: '#C98F3C',

  /* ---- Canvas variants (screen-specific fields) ---- */
  canvasSoft: '#0A1120',
  canvasDeep: '#070C17',
  canvasCool: '#0C1524',
  canvasPaper: '#0B1220',
  canvasGray: '#0E1727',
  canvasIvory: '#0B1220',
  canvasFlat: '#0A1120',
  canvasWarm: '#0C1422',
  canvasBright: '#101A2E',

  /* ---- Extra neutrals / grays ---- */
  grayMuted: '#8A99B0',
  grayCool: '#6C7A90',
  grayDeep: '#B6C2D4',
  inkCool: '#DCE4F0',
  taupeDeep: '#A7A090',
  taupeMid: '#8A8578',
  sandLight: 'rgba(255, 255, 255, 0.05)',
  sandPale: 'rgba(255, 255, 255, 0.06)',
  sandMuted: 'rgba(255, 255, 255, 0.08)',
  sandDim: 'rgba(255, 255, 255, 0.10)',
  avatarNavy: '#33507A',

  /* ---- Extra semantic variants ---- */
  dangerBright: '#E08876',
  dangerStrong: '#E08876',
  dangerVivid: '#E5806B',
  dangerDeep2: '#C56A57',
  dangerHeart: '#E08876',
  successDeep: '#7FB07A',
  successBright: '#8CC486',
  coralSoft: '#E8917F',
  blushPale: 'rgba(232, 145, 127, 0.14)',
  blushDeep: '#E8B0A2',
  sagePale: 'rgba(127, 176, 122, 0.14)',
  amberPale: 'rgba(224, 181, 99, 0.16)',
  goldPale: '#F0D9A8',
  tanPale: '#D9BFA6',
  rustDeep: '#C97A45',
  brownDeep: '#A08A63',

  /* ---- Avatar / initials pastels (legible on navy) ---- */
  avatarSage: '#A8C8A0',
  avatarSky: '#A0B8D4',
  avatarLilac: '#C4A0D4',
  avatarTan: '#D4B896',
  avatarGold2: '#E8C97A',
  avatarBlush: '#F4A0A0',
  avatarPeach: '#E8B4A0',
  avatarBronze: '#C4A574',
  avatarMoss: '#8FA88A',
  avatarSlate: '#7A93A8',
  avatarMauve: '#A888A0',

  /* ---- Overlay-only bases (used exclusively via withAlpha()) ---- */
  overlaySlate: '#03070F',
  overlayInk: '#03070F',
  overlayCream: '#EFE3D3',

  /* ═══ Night surfaces — the ambient field the glass floats on ═══ */
  navyDeep: '#0A1120',
  navyBase: '#0B1220',
  navyDark: '#070C17',
  navyMid: '#142748',
  navyLift: '#1B3159',
  navySurface: '#16243F',

  /* Text ramp for dark surfaces (bright → dim). */
  textOnDark: '#F2F5FA',
  textOnDarkSoft: '#EAEFF7',
  textOnDarkBody: '#DCE4F0',
  textOnDarkLabel: '#93A2B8',
  textOnDarkMuted: '#8A99B0',
  textOnDarkDim: '#6C7A90',
  textOnDarkFaint: '#7F8FA8',

  /* Brand gold tuned for dark backgrounds. */
  goldGlow: '#E0B563',
  goldGlowDeep: '#C98F3C',
  goldGlowSoft: '#F0CB86',
  goldGlowPale: '#FFE7BC',
  goldGlowDim: '#C8A46B',

  /* Semantic on dark. */
  successOnDark: '#7FB07A',
  dangerOnDark: '#E08876',
  offlineOnDark: '#5A6880',
};

/**
 * Apply an alpha channel to a `#RRGGBB` token, e.g. withAlpha(colors.shadow, 0.55).
 * Keeps every translucent overlay/scrim sourced from the same token as its opaque use.
 *
 * Tokens that are ALREADY `rgba(...)` (the glass fills) cannot be re-alpha'd —
 * pass the base you want tinted instead (e.g. colors.white).
 */
export function withAlpha(hex, alpha) {
  // Glass tokens are already rgba(); re-alpha'ing them would yield NaN and RN
  // would silently drop the colour. Return them untouched instead.
  if (typeof hex !== 'string' || !hex.startsWith('#')) return hex;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

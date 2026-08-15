/**
 * Rootaroo design tokens — extracted from design/screenshots/rootaroo-design/
 * 01-Design-System.html (warm family-first language).
 *
 * Palette roles:
 *  - Ink ramp: dark neutral text / deep surfaces (#1B1E24 .. #2A2E33)
 *  - Canvas: warm cream backgrounds (#F3F1EC)
 *  - Gold ramp: brand accent, action fills, highlights
 *  - Semantic: danger terracotta, success sage, info slate
 */
export const colors = {
  /* ---- Brand ---- */
  gold: '#B88A3E',
  goldSoft: '#D9B87A',
  goldDeep: '#96742F',
  goldLight: '#F5E6C8',

  /* ---- Ink (text + dark surfaces) ---- */
  ink: '#2A2E33',
  inkSoft: '#242830',
  inkDeep: '#1B1E24',
  inkMuted: '#45566B',

  /* ---- Canvas / surfaces ---- */
  canvas: '#F3F1EC',
  canvasElevated: '#ECEAE5',
  surface: '#FFFFFF',
  surfaceWarm: '#EFEAE1',
  surfaceDark: '#E3E1DB',

  /* ---- Neutrals ---- */
  textSecondary: '#757A80',
  textMuted: '#A6ABB0',
  textFaint: '#9CA3AC',
  /* Dark-theme (vault) muted text — from 05-Bills-Vault.html card meta */
  textMutedDark: '#7A828C',
  border: '#E3E1DB',
  borderCool: '#E1E6EA',
  divider: '#D8DADC',
  skeleton: '#E1E6EA',

  /* ---- Semantic ---- */
  danger: '#B54B3A',
  dangerDark: '#5C2B2E',
  dangerSoft: '#2A1215',
  success: '#6B8F5A',
  successSoft: '#7A8871',
  info: '#5A6B7D',
  infoSoft: '#4A5A6B',

  /* ---- Splash / dark surfaces (from 02-Auth-Onboarding SCREEN 01) ---- */
  splashBg: '#1B1E24',
  splashKangarooTail: '#333944',
  splashKangarooBody: '#3A3F48',
  splashTrack: '#242830',
  splashDot: '#C79A4B',

  /* ---- Warm UI (from design/auth-designs/rootaro_signup_*.html) ---- */
  bgApp: '#EDEAE2',
  textPrimary: '#1E1B16',
  textSecondaryWarm: '#7A756A',
  labelWarm: '#4A463D',
  errorWarm: '#B3402A',
  errorBg: '#FBF4F2',
  fieldBorder: '#D8D3C7',
  fieldFocus: '#A79E8A',
  placeholderWarm: '#B7B2A5',
  btnDisabledBg: '#DEDAD0',
  btnDisabledText: '#A6A196',
  /* Active/CTA gold from rootaro_signup_valid.html */
  goldWarm: '#B4812E',
  goldWarmDark: '#A3762A',
  goldTint: '#FBF3E6',

  /* ---- Legacy (pre-theme) ---- */
  legacyNavy: '#0D0D1A',
  legacyNavyTop: '#15152A',
  legacyNavySoft: '#1A1A2A',
  legacyGold: '#D4A017',
  legacyGoldDark: '#8A6A0A',

  /* ---- Absolutes ---- */
  black: '#000000',
  white: '#FFFFFF',

  /* ---- Canvas variants (screen-specific warm backgrounds) ---- */
  canvasSoft: '#F0EDE6',
  canvasDeep: '#E9E6E0',
  canvasCool: '#F7F7FA',
  canvasPaper: '#F5F2EB',
  canvasGray: '#F3F4F6',
  canvasIvory: '#F1EEE7',
  canvasFlat: '#F0F0F0',
  canvasWarm: '#F1EFEA',
  canvasBright: '#F9F8F5',

  /* ---- Extra neutrals / grays ---- */
  grayMuted: '#6B7280',
  grayCool: '#9CA3AF',
  grayDeep: '#374151',
  inkCool: '#2C313C',
  taupeDeep: '#6B6153',
  taupeMid: '#8A8578',
  sandLight: '#E5DECF',
  sandPale: '#EFE9DD',
  sandMuted: '#E4DFD2',
  sandDim: '#D8D4CA',
  avatarNavy: '#33507A',

  /* ---- Extra semantic (danger/success variants used in specific screens) ---- */
  dangerBright: '#DC3545',
  dangerStrong: '#DC2626',
  dangerVivid: '#D0342C',
  dangerDeep2: '#B91C1C',
  dangerHeart: '#C0392B',
  successDeep: '#5B8F6C',
  successBright: '#22C55E',
  coralSoft: '#E8917F',
  blushPale: '#F5E3DE',
  blushDeep: '#E8B0A2',
  sagePale: '#E8F0E4',
  amberPale: '#FEF3C7',
  goldPale: '#F0D9A8',
  tanPale: '#F0DCC8',
  rustDeep: '#B8632F',
  brownDeep: '#6B5738',

  /* ---- Avatar / initials pastel palette (used across member-list screens) ---- */
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
  overlaySlate: '#2B3547',
  overlayInk: '#0F172B',
  overlayCream: '#EFE3D3',

  /* ═══ Night surfaces — dark glass theme (Dashboard) ═══ */
  /* Deep navy field the frosted cards float on. */
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
 * Apply an alpha channel to a `#RRGGBB` token, e.g. withAlpha(colors.inkDeep, 0.55).
 * Keeps every translucent overlay/scrim sourced from the same token as its opaque use.
 */
export function withAlpha(hex, alpha) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

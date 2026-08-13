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

  /* ---- Legacy (pre-theme) — removed after full migration ---- */
  legacyNavy: '#0D0D1A',
  legacyNavyTop: '#15152A',
  legacyGold: '#D4A017',
};

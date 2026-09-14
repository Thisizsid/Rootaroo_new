/**
 * Chat-screen palette — transcribed verbatim from the provided Group Chat
 * mock. The mock specifies its own navy/bubble/gradient values rather than
 * reusing the app's general theme tokens (e.g. its background #0b1018 is
 * close to, but not, `colors.canvas`; its bubble gradients are their own
 * 2-stop recipes, distinct from the `goldButton` 4-stop CTA gradient used
 * everywhere else). Scoped to ChatScreen, MessageBubble, ChatInputBar,
 * TypingIndicator and AttachSheet only — not registered in the theme barrel, the same way
 * a mock-exact surface elsewhere in the app (e.g. the household invite QR's
 * light tile) stays a literal, standalone value rather than a themed token.
 */
export const chatTheme = {
  bg: '#0b1018',
  chip: '#141b27',
  chipBorder: 'rgba(255,255,255,0.06)',
  chipIcon: '#c6d0de',
  headerTitle: '#eef2f8',
  headerSub: '#6b7787',

  dividerLine: 'rgba(255,255,255,0.06)',
  dividerLabel: '#5d6877',

  bubbleOtherBg: '#1c2533',
  bubbleOtherBorder: 'rgba(255,255,255,0.07)',
  bubbleOtherText: '#e3e9f1',
  senderName: '#8b97ab',
  metaText: '#5d6877',
  checkColor: '#e3bb68',

  bubbleOwnGradient: ['#f0cd82', '#dbb05d'],
  bubbleOwnText: '#1a1408',
  bubbleOwnShadow: 'rgba(227,187,104,0.16)',

  inputBg: '#101724',
  inputBorder: 'rgba(255,255,255,0.07)',
  inputIcon: '#8b97ab',
  inputText: '#e8edf5',
  inputPlaceholder: '#5a6577',

  sendGradient: ['#f2d089', '#cfa03c'],
  sendIcon: '#1a1408',

  typingDotDim: '#5d6877',
  typingDotMid: '#8b97ab',

  eyebrowGold: '#e3bb68',
  sheetSubtext: '#8b97ab',
  rowIconTileBg: 'rgba(227,187,104,0.14)',
  rowIconColor: '#e3bb68',
  chevron: '#4c5768',
  cancelBorder: 'rgba(255,255,255,0.1)',
};

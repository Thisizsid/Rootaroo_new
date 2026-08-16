/**
 * WebCrypto polyfill — WEB build.
 *
 * Browsers ship a native WebCrypto implementation (`globalThis.crypto.subtle`),
 * so no polyfill is needed here. Importantly, this module does NOT import
 * react-native-quick-crypto — that native module must stay out of the web
 * bundle (its ESM deps break web bundling with `import.meta`).
 */
export {};

// Polyfill WebCrypto (crypto.subtle / getRandomValues) BEFORE any module that
// touches vault crypto is evaluated — Hermes has no WebCrypto by default.
import './src/shared/crypto/cryptoPolyfill';

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);

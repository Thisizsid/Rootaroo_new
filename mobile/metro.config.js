const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Zustand ships an ESM build (esm/*.mjs) that uses `import.meta` (devtools).
// Hermes rejects `import.meta` outside a module, so the WEB bundle breaks with
// "Cannot use 'import.meta' outside a module". Its CJS build has no import.meta,
// so force every `zustand` import to the CJS files below.
const ZUSTAND_ROOT = path.dirname(require.resolve('zustand/package.json'));

// lottie-react-native v7.3.8 has its `react-native` field pointing to
// `src/index.tsx` — Metro can't resolve `.tsx` files inside node_modules
// with an already-present extension. The compiled output is at
// `lib/commonjs/index.js` but Metro follows the `react-native` field.
// Override the resolution to point to the compiled output directly.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'lottie-react-native') {
    // Use the `main` field path which is the compiled commonjs output
    const filePath = require.resolve(
      'lottie-react-native/lib/commonjs/index.js',
    );
    return { type: 'sourceFile', filePath };
  }
  if (moduleName === 'zustand') {
    return { type: 'sourceFile', filePath: path.join(ZUSTAND_ROOT, 'index.js') };
  }
  if (moduleName.startsWith('zustand/')) {
    const sub = moduleName.slice('zustand/'.length);
    return { type: 'sourceFile', filePath: path.join(ZUSTAND_ROOT, `${sub}.js`) };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

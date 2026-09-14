import type { Expo as ExpoType, ExpoPushMessage } from 'expo-server-sdk';
import logger from './logger';

// expo-server-sdk ships ESM-only (no CJS build), while this project compiles
// to CommonJS. A plain `import()` here gets *compiled* to `require()` by
// TypeScript under `module: commonjs` (it downlevels dynamic import too),
// which fails at runtime since Node can't `require()` an ESM-only package.
// Wrapping it in `new Function(...)` hides it from TypeScript's static
// analysis, so it survives as a genuine runtime `import()` — Node's
// supported way to load ESM from CJS.
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string,
) => Promise<{ Expo: typeof ExpoType }>;

let modulePromise: Promise<{ Expo: typeof ExpoType }> | null = null;
let clientPromise: Promise<ExpoType> | null = null;

function loadExpoModule() {
  if (!modulePromise) modulePromise = dynamicImport('expo-server-sdk');
  return modulePromise;
}

async function getExpoClient(): Promise<ExpoType> {
  if (!clientPromise) {
    clientPromise = loadExpoModule().then(({ Expo }) => new Expo());
  }
  return clientPromise;
}

export async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  try {
    const { Expo } = await loadExpoModule();

    // Old device rows may still hold pre-migration raw FCM/APNs tokens —
    // Expo's API rejects those outright, so filter rather than let one bad
    // token fail an entire chunk. These age out naturally as each user's
    // token is re-registered (upserted) on next app launch.
    const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
    if (validTokens.length === 0) return;

    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      title,
      body,
      data: data || {},
    }));

    const expo = await getExpoClient();
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      const errors = receipts
        .filter((r) => r.status === 'error')
        .map((r) => (r.status === 'error' ? r.message : ''))
        .join('; ');
      if (errors) {
        logger.warn(`[ExpoPush] ${errors}`);
      }
    }
  } catch (error) {
    logger.error('[ExpoPush] Send failed:', (error as Error).message);
    // Don't throw - push is best-effort
  }
}

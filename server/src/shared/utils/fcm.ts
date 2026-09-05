import { env } from '../../config/env';
import { initializeApp, cert, App, getApps } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let firebaseApp: App | null = null;

function getFirebaseApp(): App {
  if (!firebaseApp) {
    if (!env.fcm.serviceAccountBase64 || !env.fcm.projectId) {
      throw new Error('FCM credentials not configured');
    }

    // Check if already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
    } else {
      // Load the real service-account JSON rather than fabricating one —
      // a synthesized clientEmail (previous approach) can never match a
      // real Firebase service account, which always has a random key-id
      // suffix (e.g. firebase-adminsdk-abc12@project.iam.gserviceaccount.com).
      const serviceAccount = JSON.parse(
        Buffer.from(env.fcm.serviceAccountBase64, 'base64').toString('utf8'),
      );
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });
    }
  }
  return firebaseApp;
}

export async function sendFCM(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  if (!env.fcm.enabled || tokens.length === 0) return;

  try {
    const app = getFirebaseApp();
    const messaging: Messaging = getMessaging(app);

    const messages = tokens.map((token) => ({
      token,
      notification: { title, body },
      data: data || {},
    }));

    const response = await messaging.sendEach(messages);
    if (response.failureCount > 0) {
      const errors = response.responses
        .filter((r: { success: boolean; error?: { message: string } }) => !r.success)
        .map((r) => r.error?.message)
        .join('; ');
      console.warn(`[FCM] ${response.failureCount} failures: ${errors}`);
    }
  } catch (error) {
    console.error('[FCM] Send failed:', error);
    // Don't throw - push is best-effort
  }
}
import { env } from '../../config/env';
import { initializeApp, cert, App, getApps } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let firebaseApp: App | null = null;

function getFirebaseApp(): App {
  if (!firebaseApp) {
    if (!env.fcm.serverKey || !env.fcm.projectId) {
      throw new Error('FCM credentials not configured');
    }
    
    // Check if already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
    } else {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: env.fcm.projectId,
          privateKey: env.fcm.serverKey.replace(/\\n/g, '\n'),
          clientEmail: `firebase-adminsdk@${env.fcm.projectId}.iam.gserviceaccount.com`,
        }),
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
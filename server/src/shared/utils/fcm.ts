import fs from 'fs';
import os from 'os';
import path from 'path';
import { env } from '../../config/env';
import { initializeApp, applicationDefault, App, getApps } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let firebaseApp: App | null = null;

function getFirebaseApp(): App {
  if (!firebaseApp) {
    if (!env.fcm.credentialsBase64 || !env.fcm.projectId) {
      throw new Error('FCM credentials not configured');
    }

    // Check if already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
    } else {
      // FCM_CREDENTIALS_BASE64 holds a base64-encoded credentials JSON —
      // applicationDefault() auto-detects its "type" field, so this
      // transparently accepts either:
      //   - a real Firebase service-account key ("service_account"), or
      //   - impersonated Application Default Credentials
      //     ("impersonated_service_account", from `gcloud auth
      //     application-default login --impersonate-service-account=...`),
      //     used as an interim credential while a real key is blocked by
      //     an org policy on service-account key creation.
      // Swapping between the two later needs no code change — only a new
      // base64 value in this same env var. Written to a temp file each
      // boot since GOOGLE_APPLICATION_CREDENTIALS must point at a real
      // file path; safe on ephemeral hosts (e.g. Railway) since it's
      // regenerated fresh every start, never persisted.
      const credentialsJson = Buffer.from(env.fcm.credentialsBase64, 'base64').toString('utf8');
      const credPath = path.join(os.tmpdir(), 'fcm-credentials.json');
      fs.writeFileSync(credPath, credentialsJson, { mode: 0o600 });
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;

      firebaseApp = initializeApp({
        credential: applicationDefault(),
        projectId: env.fcm.projectId,
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
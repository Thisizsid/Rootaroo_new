"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFCM = sendFCM;
const env_1 = require("../../config/env");
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
let firebaseApp = null;
function getFirebaseApp() {
    if (!firebaseApp) {
        if (!env_1.env.fcm.serverKey || !env_1.env.fcm.projectId) {
            throw new Error('FCM credentials not configured');
        }
        // Check if already initialized
        const existingApps = (0, app_1.getApps)();
        if (existingApps.length > 0) {
            firebaseApp = existingApps[0];
        }
        else {
            firebaseApp = (0, app_1.initializeApp)({
                credential: (0, app_1.cert)({
                    projectId: env_1.env.fcm.projectId,
                    privateKey: env_1.env.fcm.serverKey.replace(/\\n/g, '\n'),
                    clientEmail: `firebase-adminsdk@${env_1.env.fcm.projectId}.iam.gserviceaccount.com`,
                }),
            });
        }
    }
    return firebaseApp;
}
async function sendFCM(tokens, title, body, data) {
    if (!env_1.env.fcm.enabled || tokens.length === 0)
        return;
    try {
        const app = getFirebaseApp();
        const messaging = (0, messaging_1.getMessaging)(app);
        const messages = tokens.map((token) => ({
            token,
            notification: { title, body },
            data: data || {},
        }));
        const response = await messaging.sendEach(messages);
        if (response.failureCount > 0) {
            const errors = response.responses
                .filter((r) => !r.success)
                .map((r) => r.error?.message)
                .join('; ');
            console.warn(`[FCM] ${response.failureCount} failures: ${errors}`);
        }
    }
    catch (error) {
        console.error('[FCM] Send failed:', error);
        // Don't throw - push is best-effort
    }
}
//# sourceMappingURL=fcm.js.map
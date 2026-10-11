/**
 * Logging when someone accepts the Terms of Service and Privacy Policy (issue #15).
 *
 * The acceptance happens before an account exists (the sign-up checkbox, or a tap under the
 * Sign In notice), so it is saved on the phone first and sent once the person is signed in.
 * It stays saved until the server has it, so a failed send is retried on the next launch.
 */
import * as SecureStore from 'expo-secure-store';

const KEY = 'rootaroo_pending_legal_agreement';
export const METHODS = { SIGNUP_CHECKBOX: 'signup_checkbox', SIGNIN_NOTICE: 'signin_notice' };

// Required lazily so this module stays importable from the auth store without a cycle.
const defaultApi = () => require('../api/auth').authApi;

export async function savePendingAgreement(method, agreedAt = new Date()) {
  await SecureStore.setItemAsync(KEY, JSON.stringify({ method, agreedAt: agreedAt.toISOString() }));
}

export async function clearPendingAgreement() {
  await SecureStore.deleteItemAsync(KEY).catch(() => {});
}

async function readPending() {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

let inFlight = null;

/** Sends a saved acceptance, if there is one. Resolves true once the server has recorded it. */
export function sendPendingAgreement(api = defaultApi()) {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const pending = await readPending();
    if (!pending) return false;
    try {
      await api.acceptLegal(pending);
      await clearPendingAgreement();
      return true;
    } catch (e) {
      // The server refused it for good (too old, malformed): retrying can't help.
      const status = e?.response?.status;
      if (status === 400 || status === 422) await clearPendingAgreement();
      return false;
    }
  })().finally(() => { inFlight = null; });
  return inFlight;
}

import { useState } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { showAlert } from '../services/themedAlert';
import { authApi } from '../api/auth';

// The Web Client ID is what matters here even on native platforms: it's the
// audience the ID token is issued for, which is what the backend verifies
// against (see server's googleAuth()). iosClientId is only needed so the
// native iOS picker knows which client to use for the on-device prompt.
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

export function useGoogleSignIn(onSuccess) {
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    if (!WEB_CLIENT_ID) {
      showAlert(
        'Not Configured',
        'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file.',
      );
      return;
    }
    // Configured fresh right before use rather than once-and-cached — this
    // flow's config (offlineAccess: false, no extra scopes) differs from
    // the calendar-connect flow's, so whichever hook runs must always
    // assert its own config immediately beforehand instead of trusting a
    // stale one left behind by whichever hook happened to run first.
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID || undefined,
      offlineAccess: false,
    });
    setBusy(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Google Play Services caches the last-used account and silently
      // re-signs-in with it on subsequent calls, skipping the account
      // picker entirely — which breaks switching accounts or signing up
      // with a different Google account than last time. Signing out first
      // clears that cache so the picker always shows, letting the user
      // pick any account on the device every time.
      await GoogleSignin.signOut().catch(() => {});
      const result = await GoogleSignin.signIn();
      if (result.type === 'cancelled') return;

      const idToken = result.data?.idToken;
      if (!idToken) {
        throw new Error('Google did not return an ID token.');
      }

      const resp = await authApi.googleAuth({ idToken });
      await onSuccess(resp);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Google sign-in failed.';
      showAlert('Error', msg);
    } finally {
      setBusy(false);
    }
  };

  return { signIn, isLoading: busy };
}

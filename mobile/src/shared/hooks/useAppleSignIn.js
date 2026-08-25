import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { Platform } from 'react-native';
import { showAlert } from '../services/themedAlert';
import { authApi } from '../api/auth';

export function useAppleSignIn(onSuccess) {
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    if (Platform.OS !== 'ios') return; // button is hidden on Android, this is just a safety net
    setBusy(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      // fullName is only ever populated on the user's very first Apple
      // sign-in for this app — pass it through so the server can use it as
      // the initial displayName; on every later sign-in it'll be null and
      // the server falls back to deriving a name from the email.
      const displayName = credential.fullName?.givenName
        ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
        : undefined;

      const resp = await authApi.appleAuth({ idToken: credential.identityToken, displayName });
      await onSuccess(resp);
    } catch (e) {
      if (e.code === 'ERR_REQUEST_CANCELED') return;
      showAlert('Error', e?.response?.data?.error || e?.message || 'Apple sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return { signIn, isLoading: busy };
}

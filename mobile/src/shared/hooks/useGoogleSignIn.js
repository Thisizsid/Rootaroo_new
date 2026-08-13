import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useMemo, useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import { authApi } from '../api/auth';

WebBrowser.maybeCompleteAuthSession();

const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export function useGoogleSignIn(onSuccess) {
  const [busy, setBusy] = useState(false);

  const config = useMemo(() => {
    if (Platform.OS === 'android' && ANDROID_CLIENT_ID) {
      return { androidClientId: ANDROID_CLIENT_ID };
    }
    if (Platform.OS === 'ios' && IOS_CLIENT_ID) {
      return { iosClientId: IOS_CLIENT_ID };
    }
    if (WEB_CLIENT_ID) {
      return { webClientId: WEB_CLIENT_ID };
    }
    return null;
  }, []);

  const fallbackConfig = useMemo(() => {
    if (config) return config;
    if (Platform.OS === 'android') return { androidClientId: '' };
    if (Platform.OS === 'ios') return { iosClientId: '' };
    return {};
  }, [config]);

  const [request, response, promptAsync] = Google.useAuthRequest(fallbackConfig);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      const redirectUri = request?.redirectUri;
      if (code && redirectUri) {
        setBusy(true);
        authApi
          .googleAuth({ code, redirectUri })
          .then(async (resp) => {
            await onSuccess(resp);
          })
          .catch((e) => {
            const msg = e?.response?.data?.error || 'Google sign-in failed.';
            Alert.alert('Error', msg);
          })
          .finally(() => setBusy(false));
      }
    }
  }, [response]);

  const signIn = async () => {
    const hasClientId = config && Object.values(config).some((v) => typeof v === 'string' && v.length > 0);
    if (!hasClientId) {
      Alert.alert(
        'Not Configured',
        'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_*_CLIENT_ID in your .env file.',
      );
      return;
    }
    await promptAsync();
  };

  return { signIn, isLoading: !request || busy };
}

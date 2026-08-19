import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { showAlert } from '../services/themedAlert';
import { eventApi } from '../api/event';

WebBrowser.maybeCompleteAuthSession();

const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

// Same OAuth client as login, but with an incremental Calendar scope and
// `access_type=offline` + `prompt=consent` so Google actually issues a
// refresh token — required for the backend to sync in the background.
const CALENDAR_SCOPES = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar'];

export function useGoogleCalendarConnect(onConnected) {
  const [busy, setBusy] = useState(false);

  const config = useMemo(() => {
    const base = { scopes: CALENDAR_SCOPES, extraParams: { access_type: 'offline', prompt: 'consent' } };
    if (Platform.OS === 'android' && ANDROID_CLIENT_ID) return { ...base, androidClientId: ANDROID_CLIENT_ID };
    if (Platform.OS === 'ios' && IOS_CLIENT_ID) return { ...base, iosClientId: IOS_CLIENT_ID };
    if (WEB_CLIENT_ID) return { ...base, webClientId: WEB_CLIENT_ID };
    return null;
  }, []);

  const fallbackConfig = useMemo(() => {
    if (config) return config;
    const base = { scopes: CALENDAR_SCOPES, extraParams: { access_type: 'offline', prompt: 'consent' } };
    if (Platform.OS === 'android') return { ...base, androidClientId: '' };
    if (Platform.OS === 'ios') return { ...base, iosClientId: '' };
    return base;
  }, [config]);

  const [request, response, promptAsync] = Google.useAuthRequest(fallbackConfig);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      const redirectUri = request?.redirectUri;
      if (code && redirectUri) {
        setBusy(true);
        eventApi
          .connectGoogleCalendar({ code, redirectUri })
          .then(async (status) => {
            await onConnected(status);
          })
          .catch((e) => {
            const msg = e?.response?.data?.error || 'Could not connect Google Calendar.';
            showAlert('Error', msg);
          })
          .finally(() => setBusy(false));
      }
    }
  }, [response]);

  const connect = async () => {
    const hasClientId = config && Object.values(config).some((v) => typeof v === 'string' && v.length > 0);
    if (!hasClientId) {
      showAlert(
        'Not Configured',
        'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_*_CLIENT_ID in your .env file.',
      );
      return;
    }
    await promptAsync();
  };

  return { connect, isLoading: !request || busy };
}

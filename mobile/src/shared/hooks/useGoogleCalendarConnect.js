import { useState } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { showAlert } from '../services/themedAlert';
import { eventApi } from '../api/event';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

// Narrowest scopes that cover what the backend actually does: read/write
// events (create/update/delete + two-way sync) and read-only access to the
// calendar list (to resolve the user's primary calendar id on connect).
// Both are "sensitive" scopes, not "restricted" like the full `calendar`
// scope — restricted scopes are what force a paid CASA security assessment
// during Google's app verification, so staying inside the sensitive tier
// keeps publishing to production dramatically simpler.
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
];

export function useGoogleCalendarConnect(onConnected) {
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    if (!WEB_CLIENT_ID) {
      showAlert(
        'Not Configured',
        'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file.',
      );
      return;
    }
    setBusy(true);
    try {
      // Configured fresh right before use (not a one-time guard like the
      // plain sign-in hook used to have) — this flow needs offlineAccess
      // and the calendar scope, a different config than login's, so it
      // can't rely on whichever hook happened to configure first.
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        iosClientId: IOS_CLIENT_ID || undefined,
        offlineAccess: true,
        scopes: CALENDAR_SCOPES,
        // Android only: without this, Google skips issuing a refresh token
        // on any authorization after the very first one for this Google
        // account (it assumes the app already stored one from before) —
        // that's exactly what produces "Google did not grant offline
        // access" on reconnect/re-auth. Forces the consent screen + a fresh
        // code every time so the backend always gets a refresh token.
        forceCodeForRefreshToken: true,
      });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Same reasoning as useGoogleSignIn — without this, Play Services
      // silently reuses whichever Google account was last used instead of
      // showing the account picker.
      await GoogleSignin.signOut().catch(() => {});
      const result = await GoogleSignin.signIn();
      if (result.type === 'cancelled') return;

      const serverAuthCode = result.data?.serverAuthCode;
      if (!serverAuthCode) {
        throw new Error('Google did not return a server auth code.');
      }

      const status = await eventApi.connectGoogleCalendar({ code: serverAuthCode });
      await onConnected(status);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Could not connect Google Calendar.';
      showAlert('Error', msg);
    } finally {
      setBusy(false);
    }
  };

  return { connect, isLoading: busy };
}

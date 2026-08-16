import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notificationApi } from './api/notification';

/**
 * Registers this device for push notifications and hands the raw FCM/APNs
 * device token to the server (`DeviceToken`, sent via firebase-admin
 * directly — NOT Expo's push relay, so we deliberately use
 * `getDevicePushTokenAsync()` here rather than `getExpoPushTokenAsync()`).
 *
 * Requires a native rebuild (expo-notifications is declared as a config
 * plugin but not yet compiled into the installed build) and, on Android,
 * `google-services.json` + the Google Services Gradle plugin for
 * `getDevicePushTokenAsync()` to resolve a real FCM token.
 */
export async function registerForPushNotificationsAsync() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;

    const { data: token } = await Notifications.getDevicePushTokenAsync();
    if (!token) return;

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    await notificationApi.registerToken(token, platform);
  } catch {
    // Best-effort — push is a delivery enhancement, never block the app on it.
  }
}

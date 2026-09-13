import { AppState, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { showPermissionSheet } from '../services/permissionGate';

/**
 * The one place the app asks for a runtime permission.
 *
 * Before this module every call site rolled its own denial handling and they
 * had drifted into four different experiences: a native `alert()` in
 * CreatePostScreen, the themed showAlert sheet in most screens, a bespoke
 * full-screen panel inside QrScannerModal, and a silent no-op on all six of
 * CheckInScreen's location requests. None of them checked `canAskAgain`, so
 * a permanently blocked permission showed the same "Allow camera access"
 * message forever with no way to actually reach Settings.
 *
 * `ensurePermission` collapses that into one flow and one surface:
 *
 *   granted                → true, no UI at all
 *   not yet asked          → primer sheet, THEN the OS dialog if they agree
 *   primer dismissed       → false, and the OS prompt is left unspent
 *   refused (can ask)      → sheet offers another go at the OS dialog
 *   blocked (can't ask)    → sheet offers Open Settings
 *   silent                 → no sheet at any stage; OS behaviour only
 *
 * Callers get a plain boolean and must not show their own error afterwards —
 * the sheet IS the error state. That's what keeps a user from seeing the OS
 * refusal and an app dialog for the same tap.
 */

const BLOCKED_HINT = 'Open Settings to switch it back on.';

const PERMISSIONS = {
  camera: {
    icon: 'camera',
    title: 'Let the camera in',
    body: 'We only open it when you tap the shutter — nothing is captured in the background.',
    deniedBody: 'Rootaroo needs the camera to capture this. Nothing is recorded until you tap the shutter.',
    blockedBody: `Camera access is turned off for Rootaroo. ${BLOCKED_HINT}`,
    allowLabel: 'Allow camera',
    get: () => ImagePicker.getCameraPermissionsAsync(),
    request: () => ImagePicker.requestCameraPermissionsAsync(),
  },
  /**
   * NOT needed to pick photos. `launchImageLibraryAsync` goes through the
   * system photo picker on both platforms — Android's PickVisualMedia and
   * iOS's PHPickerViewController — neither of which requires a runtime
   * permission, so gating a picker on this only invents a refusal the OS
   * would never have produced. Kept for the one case that does need it:
   * WRITING to the library (saving an image out of the app), which nothing
   * does today. Do not reintroduce it in front of a picker.
   */
  mediaLibrary: {
    icon: 'images',
    title: 'Reach your photos',
    body: 'We only read the photos you pick — the rest of your library stays untouched.',
    deniedBody: 'Rootaroo needs library access to save this photo to your device.',
    blockedBody: `Photo access is turned off for Rootaroo. ${BLOCKED_HINT}`,
    allowLabel: 'Allow photos',
    get: () => ImagePicker.getMediaLibraryPermissionsAsync(),
    request: () => ImagePicker.requestMediaLibraryPermissionsAsync(),
  },
  microphone: {
    icon: 'mic',
    title: 'Let the mic in',
    body: 'We only record while you hold the mic button — nothing is picked up in the background.',
    deniedBody: 'Rootaroo needs the mic to record a voice message. Nothing is picked up until you hold the button.',
    blockedBody: `Microphone access is turned off for Rootaroo. ${BLOCKED_HINT}`,
    allowLabel: 'Allow microphone',
    get: () => Audio.getPermissionsAsync(),
    request: () => Audio.requestPermissionsAsync(),
  },
  location: {
    icon: 'location',
    title: 'Share where you are',
    body: 'We only read your location when you check in or answer a ping — never in the background.',
    deniedBody: 'Rootaroo needs your location for this. It is read once, not tracked.',
    blockedBody: `Location access is turned off for Rootaroo. ${BLOCKED_HINT}`,
    allowLabel: 'Allow location',
    get: () => Location.getForegroundPermissionsAsync(),
    request: () => Location.requestForegroundPermissionsAsync(),
  },
  notifications: {
    icon: 'notifications',
    title: 'Stay in the loop',
    body: 'We only notify you about your household — chores, expenses, and messages that need you.',
    deniedBody: 'Without notifications you will miss chores, expenses, and messages that need you.',
    blockedBody: `Notifications are turned off for Rootaroo. ${BLOCKED_HINT}`,
    allowLabel: 'Allow notifications',
    get: () => Notifications.getPermissionsAsync(),
    request: () => Notifications.requestPermissionsAsync(),
  },
};

/**
 * `granted` is not on every Expo permission response (some older shapes only
 * carry `status`), so derive it rather than trusting the field to exist.
 */
function isGranted(result) {
  return result?.granted === true || result?.status === 'granted';
}

/**
 * Expo reports `canAskAgain: false` once the OS will no longer surface its
 * dialog — Android's "Don't ask again", and iOS after the first refusal.
 * Treat a missing field as "we can still ask", which is the safe default.
 */
function canAskAgain(result) {
  return result?.canAskAgain !== false;
}

/**
 * Resolves once the app has been away and come back to the foreground.
 *
 * Only used after a Settings hand-off. Without it the user toggles the
 * permission, returns, and finds nothing happened — they have to tap the
 * original button again. Waiting here lets the caller re-check and just
 * carry on, which is the closest we can legitimately get to "allow flips
 * the setting", since no app may grant itself a permission.
 *
 * Requires an actual away-and-back trip, not just any 'active' event, so a
 * platform where openSettings() silently no-ops falls through to the timeout
 * instead of resolving immediately on a stray foreground notification.
 */
function waitForReturnToForeground(timeoutMs = 120000) {
  return new Promise((resolve) => {
    let wentAway = AppState.currentState !== 'active';
    let timer;
    let sub;
    const finish = (value) => {
      sub?.remove();
      clearTimeout(timer);
      resolve(value);
    };
    sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        wentAway = true;
        return;
      }
      if (wentAway) finish(true);
    });
    // They may never come back. Give up rather than leave the caller hanging.
    timer = setTimeout(() => finish(false), timeoutMs);
  });
}

/**
 * The same sheet in each of its three states. Only the body, the primary
 * label, and the dismiss wording change — layout, type, and spacing are the
 * component's, never the caller's.
 *
 *   primer  → shown BEFORE the OS dialog, to earn the yes
 *   denied  → refused, but the OS will still let us ask
 *   blocked → "Don't ask again" / iOS refusal; Settings is the only route
 */
function sheetContent(spec, state) {
  const base = { icon: spec.icon, eyebrow: 'Permission needed', title: spec.title };
  if (state === 'blocked') {
    return { ...base, body: spec.blockedBody, allowLabel: 'Open Settings', dismissLabel: 'Maybe later' };
  }
  if (state === 'denied') {
    return { ...base, body: spec.deniedBody, allowLabel: spec.allowLabel, dismissLabel: 'Maybe later' };
  }
  return { ...base, body: spec.body, allowLabel: spec.allowLabel, dismissLabel: 'Not now' };
}

/**
 * Ensures `kind` is granted, explaining the ask before the OS dialog and
 * handling every refusal state through the one shared sheet.
 *
 * The order matters. The OS dialog is a single-use resource: on Android a
 * second refusal sets "Don't ask again", and on iOS the very first one is
 * final. Once that happens the only route back is Settings, which no app can
 * automate. So the primer goes FIRST — we spend our own sheet, which costs
 * nothing and can be shown again tomorrow, to earn the yes before spending
 * the OS prompt, which cannot. Dismissing the primer deliberately returns
 * without calling `request()` at all, leaving the prompt unspent.
 *
 * @param {'camera'|'mediaLibrary'|'microphone'|'location'|'notifications'} kind
 * @param {{ silent?: boolean }} [options] `silent` skips the primer and every
 *   sheet, deferring entirely to the OS — for background/opportunistic asks
 *   (push registration at launch, a location tick while the user is
 *   elsewhere) where interrupting would be worse than going without.
 * @returns {Promise<boolean>} whether the permission is granted now.
 */
export async function ensurePermission(kind, options = {}) {
  const spec = PERMISSIONS[kind];
  if (!spec) {
    if (__DEV__) console.warn(`ensurePermission: unknown permission "${kind}"`);
    return false;
  }

  let result;
  try {
    result = await spec.get();
  } catch {
    // A permissions module that throws (unsupported platform, missing native
    // module) should degrade to "not granted", never crash the caller.
    return false;
  }
  if (isGranted(result)) return true;

  // Primer — say why before the OS asks. Backing out here is a soft no: the
  // system prompt is never shown, so nothing is burned and the next attempt
  // starts from exactly the same place.
  if (canAskAgain(result) && !options.silent) {
    const intent = await showPermissionSheet(sheetContent(spec, 'primer'));
    if (intent !== 'retry') return false;
  }

  // Now the OS dialog. Dismissing it reads as a denial, which is what we
  // want — it falls through to the sheet rather than silently doing nothing.
  if (canAskAgain(result)) {
    try {
      result = await spec.request();
    } catch {
      return false;
    }
    if (isGranted(result)) return true;
  }

  if (options.silent) return false;

  // Refused. Re-read `canAskAgain` from the request's own result, not the
  // status we started with — this is the call that may have just flipped it.
  const blocked = !canAskAgain(result);
  const action = await showPermissionSheet(sheetContent(spec, blocked ? 'blocked' : 'denied'));

  if (action !== 'retry') return false;

  if (blocked) {
    try {
      await Linking.openSettings();
    } catch {
      return false; // nothing sensible to fall back to
    }
    // Pick the action back up when they return, so toggling the permission in
    // Settings is the last thing they have to do — no second trip through the
    // button that sent them there.
    if (!(await waitForReturnToForeground())) return false;
    try {
      return isGranted(await spec.get());
    } catch {
      return false;
    }
  }

  // They've already read the explanation, so go straight back to the OS.
  try {
    return isGranted(await spec.request());
  } catch {
    return false;
  }
}

/**
 * Read-only status check — never prompts, never shows a sheet.
 *
 * For surfaces that need to know where they stand without asking, e.g. a
 * screen already inside its own Modal: PermissionSheet is a Modal too, and
 * presenting one over an open one is unreliable on Android, so those callers
 * must be gated with `ensurePermission` BEFORE they open, and use this only
 * to fail closed if they weren't.
 */
export async function hasPermission(kind) {
  const spec = PERMISSIONS[kind];
  if (!spec) return false;
  try {
    return isGranted(await spec.get());
  } catch {
    return false;
  }
}

export const ensureCamera = (options) => ensurePermission('camera', options);
export const ensureMediaLibrary = (options) => ensurePermission('mediaLibrary', options);
export const ensureMicrophone = (options) => ensurePermission('microphone', options);
export const ensureLocation = (options) => ensurePermission('location', options);
export const ensureNotifications = (options) => ensurePermission('notifications', options);

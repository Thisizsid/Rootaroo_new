let _handler = null;

/** Called once by PermissionHost on mount. */
export function registerPermissionHandler(fn) {
  _handler = fn;
}

/**
 * Shows the app's one permission-denied sheet and resolves with what the
 * user did: 'retry' (tapped the primary Allow/Open Settings button) or
 * 'dismiss' (Maybe later, the backdrop, or hardware back).
 *
 * Deliberately mirrors themedAlert/showAlert — an imperative service backed
 * by a host mounted at the app root — so non-React callers (notably
 * shared/pushNotifications.js) reach the same UI as screens do, and no
 * screen has to thread a modal through its own state.
 *
 * Callers should not use this directly; go through shared/permissions,
 * which owns the copy and the request/blocked state machine.
 */
export function showPermissionSheet(content) {
  if (!_handler) {
    if (__DEV__) console.warn('showPermissionSheet called before PermissionHost mounted');
    return Promise.resolve('dismiss');
  }
  return new Promise((resolve) => _handler(content, resolve));
}

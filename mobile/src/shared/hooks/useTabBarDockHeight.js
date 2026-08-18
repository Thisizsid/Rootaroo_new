/**
 * The tab bar (GlassTabBar, src/navigation/RootNavigator.js) is docked in the
 * normal layout flow — it occupies real space, so the screen area above it ends
 * exactly where the bar begins and no content can render behind it. Screens
 * therefore need to reserve nothing, and this returns 0.
 *
 * The hook is kept (rather than removed from ~13 screens) so that screens still
 * have a single place to read the dock's footprint from, should the bar ever go
 * back to floating over content.
 */
export function useTabBarDockHeight() {
  return 0;
}

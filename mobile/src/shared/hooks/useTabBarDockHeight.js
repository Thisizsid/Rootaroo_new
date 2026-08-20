/**
 * The tab bar (GlassTabBar, src/navigation/RootNavigator.js) is docked in
 * normal document flow, not floating over content: React Navigation's
 * BottomTabView stacks the active screen (flex: 1) and the tab bar as plain
 * flex siblings in a column, so the screen's own layout already ends
 * exactly where the dock begins — verified against the installed
 * @react-navigation/bottom-tabs source, not assumed. No screen needs to
 * reserve space to avoid being hidden behind it, because nothing renders
 * behind it.
 *
 * This is genuinely 0, not a stand-in for "the dock's rendered height."
 * Those are different numbers: the dock is very much taller than 0px on
 * screen — but since flex layout already keeps content from running under
 * it, the *extra compensation* a screen must add is 0. Every call site
 * (`paddingBottom: dockHeight + 16`, `bottom: dockHeight + 12`) already
 * assumes exactly that: dockHeight contributes nothing, and the `+ N` is
 * the actual, intentional gap above the dock's top edge.
 *
 * The hook stays (rather than being deleted from ~15 screens) so there is
 * one shared place to change this from, should the dock ever go back to
 * floating (`position: 'absolute'`) — at which point this must start
 * returning the dock's real measured height instead.
 */
export function useTabBarDockHeight() {
  return 0;
}

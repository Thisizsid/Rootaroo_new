const SCROLL_MARGIN = 90;
const SCROLL_SETTLE_MS = 80;

// Jumps `targetRef`'s element into view within `scrollRef`'s viewport, if it
// isn't already. Resolves once the jump has had a moment to settle, so
// callers (the tour's `before` step hook) can safely measure afterward —
// AttachStep re-measures its own spot as soon as the step becomes current.
export function scrollToStep(scrollRef, scrollOffsetY, targetRef) {
  return new Promise((resolve) => {
    const target = targetRef?.current;
    const scrollNode = scrollRef?.current;
    if (!target || !scrollNode || typeof target.measureInWindow !== 'function') {
      resolve();
      return;
    }
    target.measureInWindow((tx, ty, tw, th) => {
      if (!tw || !th || typeof scrollNode.measureInWindow !== 'function') {
        resolve();
        return;
      }
      scrollNode.measureInWindow((cx, cy, cw, ch) => {
        const viewportTop = cy;
        const viewportBottom = cy + ch;
        let delta = 0;
        if (ty < viewportTop + SCROLL_MARGIN) {
          delta = ty - (viewportTop + SCROLL_MARGIN);
        } else if (ty + th > viewportBottom - SCROLL_MARGIN) {
          delta = ty + th - (viewportBottom - SCROLL_MARGIN);
        }
        if (delta === 0) {
          resolve();
          return;
        }
        const newY = Math.max((scrollOffsetY?.current || 0) + delta, 0);
        // Instant jump, not an animated scroll — the spotlight overlay is
        // drawn in a separate Modal with fixed screen coordinates, so it has
        // no idea the page is scrolling underneath it. An animated scroll
        // left the highlight floating at its old position while content
        // scrolled past, then snapping into place once the scroll finished.
        // Jumping instantly collapses that into one clean fade + glide.
        scrollNode.scrollTo({ y: newY, animated: false });
        setTimeout(resolve, SCROLL_SETTLE_MS);
      });
    });
  });
}

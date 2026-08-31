import { useEffect, useRef, useState } from 'react';
import {
  getLastWelcomeDate,
  setLastWelcomeDate,
  todayLocalDate,
} from '../store/dailyWelcomePersist';

// Simple deterministic string hash (FNV-1a-ish) — good enough here since we
// only need a stable, well-distributed index, not cryptographic properties.
function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

/** Same member + same local day always lands on the same quote. */
export function getDailyQuoteIndex(memberId, localDate, quoteCount) {
  if (!quoteCount) return 0;
  return hashString(`${memberId}:${localDate}`) % quoteCount;
}

/**
 * Decides whether the Daily Welcome should appear for the given member, on
 * "first Dashboard visit of each local calendar day" — independent of
 * onboarding/celebration state (see authStore's `celebrate`).
 *
 * The shown date is persisted as soon as this hook decides to show it (not
 * when the user dismisses it), so a force-close mid-welcome doesn't cause it
 * to reappear later the same day.
 */
export function useDailyWelcome(memberId, quoteCount) {
  const [visible, setVisible] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const checkedForRef = useRef(null);

  useEffect(() => {
    if (!memberId || !quoteCount) {
      // eslint-disable-next-line no-console
      console.log(
        '[DailyWelcome] effect bailed early — memberId =',
        memberId,
        ', quoteCount =',
        quoteCount,
      );
      return;
    }
    if (checkedForRef.current === memberId) {
      // eslint-disable-next-line no-console
      console.log('[DailyWelcome] already checked this member this mount, skipping:', memberId);
      return; // one check per member per mount
    }
    checkedForRef.current = memberId;

    let cancelled = false;
    (async () => {
      const today = todayLocalDate();
      const lastShown = await getLastWelcomeDate(memberId);
      // eslint-disable-next-line no-console
      console.log('[DailyWelcome] memberId =', memberId);
      // eslint-disable-next-line no-console
      console.log('[DailyWelcome] today (local) =', today);
      // eslint-disable-next-line no-console
      console.log('[DailyWelcome] getLastWelcomeDate() =', lastShown);

      if (cancelled) {
        // eslint-disable-next-line no-console
        console.log('[DailyWelcome] effect cancelled before decision (unmounted/re-ran)');
        return;
      }
      const shouldShow = lastShown !== today;
      // eslint-disable-next-line no-console
      console.log('[DailyWelcome] shouldShow (lastShown !== today) =', shouldShow);
      if (!shouldShow) return;

      const idx = getDailyQuoteIndex(memberId, today, quoteCount);
      // eslint-disable-next-line no-console
      console.log('[DailyWelcome] quoteIndex =', idx, '/ quoteCount =', quoteCount);

      setQuoteIndex(idx);
      setVisible(true);
      // eslint-disable-next-line no-console
      console.log('[DailyWelcome] setVisible(true) called — hook.visible should flip true');

      // Marked as presented now — before the user has closed it — per spec.
      // eslint-disable-next-line no-console
      console.log('[DailyWelcome] calling setLastWelcomeDate(', memberId, ',', today, ')');
      setLastWelcomeDate(memberId, today)
        .then(() => {
          // eslint-disable-next-line no-console
          console.log('[DailyWelcome] setLastWelcomeDate() resolved OK');
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.log('[DailyWelcome] setLastWelcomeDate() FAILED:', err?.message || err);
        });
    })();

    return () => {
      cancelled = true;
    };
  }, [memberId, quoteCount]);

  const dismiss = () => setVisible(false);

  return { visible, quoteIndex, dismiss };
}

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../shared/store/authStore';
import { householdApi } from '../../shared/api/household';

/**
 * The real household behind the tour's demo — its name and its members'
 * names — so the introduction greets "the Mendez House" rather than the
 * mock's "Bhattas".
 *
 * Every field falls back to the design's own copy, and a failed request is
 * swallowed: the tour is a narrative, and it must render the same whether or
 * not the network cooperates.
 */
export function useTourHousehold() {
  const householdId = useAuthStore((s) => s.householdId);
  const [name, setName] = useState(null);
  const [memberNames, setMemberNames] = useState([]);

  useEffect(() => {
    if (!householdId) return undefined;
    let alive = true;

    Promise.all([
      householdApi.getHousehold(householdId).catch(() => null),
      householdApi.getMembers(householdId).catch(() => []),
    ]).then(([hh, members]) => {
      if (!alive) return;
      if (hh?.name) setName(hh.name);
      if (Array.isArray(members) && members.length) {
        setMemberNames(members.map((m) => m.displayName || m.name || '?'));
      }
    });

    return () => {
      alive = false;
    };
  }, [householdId]);

  return { name, memberNames };
}

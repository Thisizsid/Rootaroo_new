import { HouseholdMember } from '../../database/models';

/**
 * Re-checks a user's current household admin status directly against the
 * database, instead of trusting the `role` claim baked into their JWT at
 * issuance time. JWT role goes stale the moment a user is promoted or
 * demoted (transferAdmin, changeMemberRole) since access tokens aren't
 * reissued on role change — destructive or admin-gated actions must not
 * rely on it alone (F-06).
 */
export async function isCurrentHouseholdAdmin(userId: string, householdId: string): Promise<boolean> {
  const membership = await HouseholdMember.findOne({ where: { userId, householdId } });
  return membership?.role === 'admin';
}

import { HouseholdMember } from '../../database/models';
import { ForbiddenError } from './errors';

/**
 * Resolves the household a user currently belongs to. This exact
 * find-and-throw was previously copy-pasted (as getUserHousehold,
 * ensureHouseholdMember, or getUserHouseholdId) into 13 separate service
 * files, each only differing in the error message — a single source of
 * truth here means any future change to how tenant resolution works only
 * has to happen once (F-13). `errorMessage` preserves each call site's
 * original, feature-specific wording.
 */
export async function getUserHousehold(
  userId: string,
  errorMessage = 'You must belong to a household to do this',
): Promise<string> {
  const membership = await HouseholdMember.findOne({ where: { userId } });
  if (!membership) {
    throw new ForbiddenError(errorMessage);
  }
  return membership.householdId;
}

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

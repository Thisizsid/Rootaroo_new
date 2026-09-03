import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { ForbiddenError } from '../utils/errors';

type Role = 'admin' | 'member' | 'child';

const roleHierarchy: Record<Role, number> = {
  admin: 3,
  member: 2,
  child: 1,
};

export function requireRole(minRole: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      throw new ForbiddenError('Authentication required');
    }

    const userLevel = roleHierarchy[authReq.user.role as Role] || 0;
    const requiredLevel = roleHierarchy[minRole];

    if (userLevel < requiredLevel) {
      throw new ForbiddenError(
        `Requires ${minRole} role or higher. Current role: ${authReq.user.role}`
      );
    }

    next();
  };
}

// requireHouseholdMembership was previously defined here but never wired
// into any route — JwtPayload.householdId is never actually signed into
// the token (generateAccessToken only signs userId/email/role), so it
// would always 403 if it were ever mounted. Enforcement lives entirely in
// the DB-backed checks (getUserHousehold, isCurrentHouseholdAdmin) that
// every module's service layer already calls (F-06).

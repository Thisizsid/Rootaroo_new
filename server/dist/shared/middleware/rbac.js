"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
exports.requireHouseholdMembership = requireHouseholdMembership;
const errors_1 = require("../utils/errors");
const roleHierarchy = {
    admin: 3,
    member: 2,
    child: 1,
};
function requireRole(minRole) {
    return (req, _res, next) => {
        const authReq = req;
        if (!authReq.user) {
            throw new errors_1.ForbiddenError('Authentication required');
        }
        const userLevel = roleHierarchy[authReq.user.role] || 0;
        const requiredLevel = roleHierarchy[minRole];
        if (userLevel < requiredLevel) {
            throw new errors_1.ForbiddenError(`Requires ${minRole} role or higher. Current role: ${authReq.user.role}`);
        }
        next();
    };
}
function requireHouseholdMembership(req, _res, next) {
    const authReq = req;
    if (!authReq.user) {
        throw new errors_1.ForbiddenError('Authentication required');
    }
    if (!authReq.user.householdId) {
        throw new errors_1.ForbiddenError('User must belong to a household');
    }
    next();
}
//# sourceMappingURL=rbac.js.map
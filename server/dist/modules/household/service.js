"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHousehold = createHousehold;
exports.getHousehold = getHousehold;
exports.listUserHouseholds = listUserHouseholds;
exports.generateInvitation = generateInvitation;
exports.joinViaCode = joinViaCode;
exports.removeMember = removeMember;
exports.leaveHousehold = leaveHousehold;
exports.transferAdmin = transferAdmin;
exports.changeMemberRole = changeMemberRole;
exports.listMembers = listMembers;
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../../database/models");
const errors_1 = require("../../shared/utils/errors");
function generateCode() {
    return crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
}
function toHouseholdResponse(household, role, memberCount) {
    return {
        id: household.id,
        name: household.name,
        inviteCode: household.inviteCode,
        memberCount,
        role,
        createdAt: household.createdAt.toISOString(),
    };
}
async function createHousehold(userId, body) {
    const { name } = body;
    const existing = await models_1.HouseholdMember.findOne({ where: { userId } });
    if (existing) {
        throw new errors_1.ConflictError('You already belong to a household. Leave it first to create a new one.');
    }
    const inviteCode = generateCode();
    const household = await models_1.Household.create({ id: (0, uuid_1.v4)(), name, inviteCode });
    await models_1.HouseholdMember.create({
        id: (0, uuid_1.v4)(), householdId: household.id, userId, role: 'admin', joinedAt: new Date(),
    });
    await models_1.User.update({ role: 'admin' }, { where: { id: userId } });
    return toHouseholdResponse(household, 'admin', 1);
}
async function getHousehold(householdId, userId) {
    const household = await models_1.Household.findByPk(householdId);
    if (!household)
        throw new errors_1.NotFoundError('Household');
    const membership = await models_1.HouseholdMember.findOne({ where: { householdId, userId } });
    if (!membership)
        throw new errors_1.NotFoundError('Household');
    const memberCount = await models_1.HouseholdMember.count({ where: { householdId } });
    return toHouseholdResponse(household, membership.role, memberCount);
}
async function listUserHouseholds(userId) {
    const memberships = await models_1.HouseholdMember.findAll({
        where: { userId },
        include: [{ model: models_1.Household, as: 'household' }],
    });
    return Promise.all(memberships.map(async (m) => {
        const count = await models_1.HouseholdMember.count({ where: { householdId: m.householdId } });
        return toHouseholdResponse(m.household, m.role, count);
    }));
}
async function generateInvitation(userId, householdId) {
    // Verify membership + role
    const membership = await models_1.HouseholdMember.findOne({ where: { householdId, userId } });
    if (!membership)
        throw new errors_1.NotFoundError('Household');
    if (membership.role === 'child') {
        throw new errors_1.ForbiddenError('Children cannot generate invitations');
    }
    // Generate unique code
    let code;
    let attempts = 0;
    do {
        code = generateCode();
        attempts++;
    } while (await models_1.Invitation.findOne({ where: { code } }) && attempts < 5);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invitation = await models_1.Invitation.create({
        id: (0, uuid_1.v4)(),
        householdId,
        invitedBy: userId,
        code,
        expiresAt,
    });
    return {
        id: invitation.id,
        code,
        expiresAt: expiresAt.toISOString(),
        shareLink: `rootaroo://join?code=${code}`,
    };
}
async function joinViaCode(userId, body) {
    const { code } = body;
    // Check user doesn't already belong to a household
    const existing = await models_1.HouseholdMember.findOne({ where: { userId } });
    if (existing) {
        throw new errors_1.ConflictError('You already belong to a household. Leave it first to join another.');
    }
    // First: look up an Invitation record by code
    const invitation = await models_1.Invitation.findOne({
        where: { code },
        include: [{ model: models_1.Household, as: 'household' }],
    });
    let household;
    if (invitation) {
        if (!invitation.household) {
            throw new errors_1.AppError(500, 'Invitation references a deleted household');
        }
        if (invitation.expiresAt < new Date()) {
            throw new errors_1.AppError(410, 'Invitation has expired. Ask the household admin for a new one.');
        }
        if (invitation.acceptedAt) {
            throw new errors_1.ConflictError('This invitation has already been used.');
        }
        household = invitation.household;
    }
    else {
        // Fallback: check the household's permanent invite code
        const h = await models_1.Household.findOne({ where: { inviteCode: code } });
        if (!h) {
            throw new errors_1.NotFoundError('Invitation');
        }
        household = h;
    }
    // Check that the user isn't already a member (double-check)
    const alreadyMember = await models_1.HouseholdMember.findOne({ where: { householdId: household.id, userId } });
    if (alreadyMember) {
        throw new errors_1.ConflictError('You are already a member of this household.');
    }
    // Join
    await models_1.HouseholdMember.create({
        id: (0, uuid_1.v4)(),
        householdId: household.id,
        userId,
        role: 'member',
        joinedAt: new Date(),
    });
    await models_1.User.update({ role: 'member' }, { where: { id: userId } });
    // Mark invitation as accepted if using an invitation record
    if (invitation && !invitation.acceptedAt) {
        await invitation.update({ acceptedAt: new Date() });
    }
    const memberCount = await models_1.HouseholdMember.count({
        where: { householdId: household.id },
    });
    return toHouseholdResponse(household, 'member', memberCount);
}
// ── Member Management ──
async function getMembership(householdId, userId) {
    const membership = await models_1.HouseholdMember.findOne({ where: { householdId, userId } });
    if (!membership)
        throw new errors_1.NotFoundError('Household');
    return membership;
}
async function removeMember(adminUserId, householdId, targetUserId) {
    const membership = await getMembership(householdId, adminUserId);
    if (membership.role !== 'admin') {
        throw new errors_1.ForbiddenError('Only admins can remove members');
    }
    if (targetUserId === adminUserId) {
        throw new errors_1.AppError(400, 'Use the leave endpoint to remove yourself');
    }
    const target = await models_1.HouseholdMember.findOne({ where: { householdId, userId: targetUserId } });
    if (!target)
        throw new errors_1.NotFoundError('Member');
    if (target.role === 'admin') {
        throw new errors_1.ForbiddenError('Cannot remove another admin. Transfer their role first.');
    }
    await target.destroy();
}
async function leaveHousehold(userId, householdId) {
    const membership = await getMembership(householdId, userId);
    if (membership.role === 'admin') {
        throw new errors_1.ForbiddenError('Transfer admin role to another member before leaving the household.');
    }
    await membership.destroy();
    await models_1.User.update({ role: 'member' }, { where: { id: userId } });
}
async function transferAdmin(userId, householdId, newAdminId) {
    const membership = await getMembership(householdId, userId);
    if (membership.role !== 'admin') {
        throw new errors_1.ForbiddenError('Only admins can transfer the admin role');
    }
    if (newAdminId === userId) {
        throw new errors_1.AppError(400, 'You are already the admin');
    }
    const newAdmin = await models_1.HouseholdMember.findOne({ where: { householdId, userId: newAdminId } });
    if (!newAdmin)
        throw new errors_1.NotFoundError('Member');
    await membership.update({ role: 'member' });
    await newAdmin.update({ role: 'admin' });
    await models_1.User.update({ role: 'member' }, { where: { id: userId } });
    await models_1.User.update({ role: 'admin' }, { where: { id: newAdminId } });
    const memberCount = await models_1.HouseholdMember.count({ where: { householdId } });
    const household = await models_1.Household.findByPk(householdId);
    if (!household)
        throw new errors_1.AppError(500, 'Household no longer exists');
    return toHouseholdResponse(household, 'member', memberCount);
}
async function changeMemberRole(adminUserId, householdId, targetUserId, body) {
    const membership = await getMembership(householdId, adminUserId);
    if (membership.role !== 'admin') {
        throw new errors_1.ForbiddenError('Only admins can change roles');
    }
    if (targetUserId === adminUserId) {
        throw new errors_1.AppError(400, 'Use the transfer endpoint to change your own role');
    }
    const target = await models_1.HouseholdMember.findOne({
        where: { householdId, userId: targetUserId },
        include: [{ model: models_1.User, as: 'user' }],
    });
    if (!target)
        throw new errors_1.NotFoundError('Member');
    if (!target.user)
        throw new errors_1.AppError(500, 'Member record references a deleted user');
    await target.update({ role: body.role });
    await models_1.User.update({ role: body.role }, { where: { id: targetUserId } });
    return {
        userId: target.userId,
        displayName: target.user.displayName,
        email: target.user.email,
        avatarUrl: target.user.avatarUrl,
        avatarEmoji: target.user.avatarEmoji,
        role: body.role,
        joinedAt: target.joinedAt.toISOString(),
    };
}
async function listMembers(householdId, userId) {
    await getMembership(householdId, userId);
    const members = await models_1.HouseholdMember.findAll({
        where: { householdId },
        include: [{ model: models_1.User, as: 'user' }],
        order: [['joinedAt', 'ASC']],
    });
    return members.map((m) => ({
        userId: m.userId,
        displayName: m.user.displayName,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        avatarEmoji: m.user.avatarEmoji,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
    }));
}
//# sourceMappingURL=service.js.map
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = require("../service");
const models = __importStar(require("../../../database/models"));
jest.mock('../../../database/models', () => {
    return {
        Household: { create: jest.fn(), findByPk: jest.fn(), findOne: jest.fn() },
        HouseholdMember: { create: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), count: jest.fn() },
        Invitation: { create: jest.fn(), findOne: jest.fn(), count: jest.fn() },
        User: { update: jest.fn() },
    };
});
const userId = '550e8400-e29b-41d4-a716-446655440001';
const otherUserId = '660e8400-e29b-41d4-a716-446655440002';
const householdId = '550e8400-e29b-41d4-a716-446655440003';
function fakeHousehold(overrides = {}) {
    return {
        id: householdId,
        name: 'Test Family',
        inviteCode: 'A1B2C3D4',
        createdAt: new Date('2026-07-04'),
        ...overrides,
    };
}
function fakeMembership(overrides = {}) {
    return {
        householdId,
        userId,
        role: 'admin',
        joinedAt: new Date(),
        household: fakeHousehold(),
        ...overrides,
    };
}
function fakeInvitation(overrides = {}) {
    return {
        id: 'inv-001',
        householdId,
        invitedBy: userId,
        code: 'INVITE99',
        email: null,
        expiresAt: new Date(Date.now() + 7 * 86400000),
        acceptedAt: null,
        household: fakeHousehold(),
        update: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}
describe('Household Service — Invitations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('generateInvitation', () => {
        it('should return invitation code and share link for an admin', async () => {
            models.HouseholdMember.findOne.mockResolvedValue(fakeMembership());
            models.Invitation.findOne.mockResolvedValue(null); // code not taken
            models.Invitation.create.mockResolvedValue(fakeInvitation());
            const result = await (0, service_1.generateInvitation)(userId, householdId);
            expect(result.code).toBeTruthy();
            expect(result.code.length).toBe(8);
            expect(result.shareLink).toContain('rootaroo://join?code=');
            expect(result.expiresAt).toBeTruthy();
            expect(models.Invitation.create).toHaveBeenCalledWith(expect.objectContaining({ householdId, invitedBy: userId }));
        });
        it('should throw ForbiddenError for child role', async () => {
            models.HouseholdMember.findOne.mockResolvedValue(fakeMembership({ role: 'child' }));
            await expect((0, service_1.generateInvitation)(userId, householdId))
                .rejects.toThrow('Children cannot generate invitations');
        });
        it('should throw NotFoundError if user is not a member', async () => {
            models.HouseholdMember.findOne.mockResolvedValue(null);
            await expect((0, service_1.generateInvitation)(userId, householdId))
                .rejects.toThrow('Household not found');
        });
    });
    describe('joinViaCode', () => {
        it('should add user as member and mark invitation accepted', async () => {
            const inv = fakeInvitation();
            models.HouseholdMember.findOne
                .mockResolvedValueOnce(null); // user not in any household
            models.Invitation.findOne.mockResolvedValue(inv);
            models.HouseholdMember.count.mockResolvedValue(2);
            models.HouseholdMember.create.mockResolvedValue({});
            const result = await (0, service_1.joinViaCode)(otherUserId, { code: 'INVITE99' });
            expect(result).toMatchObject({
                name: 'Test Family',
                role: 'member',
                memberCount: 2,
            });
            expect(inv.update).toHaveBeenCalledWith(expect.objectContaining({ acceptedAt: expect.any(Date) }));
        });
        it('should throw ConflictError if user already in a household', async () => {
            models.HouseholdMember.findOne.mockResolvedValue(fakeMembership());
            await expect((0, service_1.joinViaCode)(userId, { code: 'INVITE99' }))
                .rejects.toThrow('You already belong to a household');
        });
        it('should throw NotFoundError for invalid code', async () => {
            models.HouseholdMember.findOne.mockResolvedValue(null);
            models.Invitation.findOne.mockResolvedValue(null);
            models.Household.findOne.mockResolvedValue(null);
            await expect((0, service_1.joinViaCode)(otherUserId, { code: 'BADCODE' }))
                .rejects.toThrow('Invitation not found');
        });
        it('should throw 410 for expired invitation', async () => {
            models.HouseholdMember.findOne.mockResolvedValue(null);
            models.Invitation.findOne.mockResolvedValue(fakeInvitation({ expiresAt: new Date('2024-01-01') }));
            await expect((0, service_1.joinViaCode)(otherUserId, { code: 'EXPIRED' }))
                .rejects.toThrow('Invitation has expired');
        });
        it('should throw ConflictError for already used invitation', async () => {
            models.HouseholdMember.findOne.mockResolvedValue(null);
            models.Invitation.findOne.mockResolvedValue(fakeInvitation({ acceptedAt: new Date('2026-07-03') }));
            await expect((0, service_1.joinViaCode)(otherUserId, { code: 'USED' }))
                .rejects.toThrow('This invitation has already been used');
        });
    });
});
describe('Household Service — Member Management', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('removeMember', () => {
        it('should allow admin to remove a member', async () => {
            models.HouseholdMember.findOne
                .mockResolvedValueOnce({ role: 'admin' }) // admin membership
                .mockResolvedValueOnce({ role: 'member', destroy: jest.fn().mockResolvedValue(undefined) }); // target membership
            await expect((0, service_1.removeMember)(userId, householdId, otherUserId)).resolves.toBeUndefined();
        });
        it('should throw ForbiddenError if requester is not an admin', async () => {
            models.HouseholdMember.findOne.mockResolvedValue({ role: 'member' });
            await expect((0, service_1.removeMember)(userId, householdId, otherUserId))
                .rejects.toThrow('Only admins can remove members');
        });
        it('should throw error if admin tries to remove self', async () => {
            models.HouseholdMember.findOne.mockResolvedValue({ role: 'admin' });
            await expect((0, service_1.removeMember)(userId, householdId, userId))
                .rejects.toThrow('Use the leave endpoint to remove yourself');
        });
        it('should throw NotFoundError if target is not a member', async () => {
            models.HouseholdMember.findOne
                .mockResolvedValueOnce({ role: 'admin' })
                .mockResolvedValueOnce(null);
            await expect((0, service_1.removeMember)(userId, householdId, otherUserId))
                .rejects.toThrow('Member not found');
        });
        it('should throw ForbiddenError if target is another admin', async () => {
            models.HouseholdMember.findOne
                .mockResolvedValueOnce({ role: 'admin' })
                .mockResolvedValueOnce({ role: 'admin' });
            await expect((0, service_1.removeMember)(userId, householdId, otherUserId))
                .rejects.toThrow('Cannot remove another admin');
        });
    });
    describe('leaveHousehold', () => {
        it('should allow a member to leave', async () => {
            const destroy = jest.fn().mockResolvedValue(undefined);
            models.HouseholdMember.findOne.mockResolvedValue({ role: 'member', destroy });
            await expect((0, service_1.leaveHousehold)(userId, householdId)).resolves.toBeUndefined();
            expect(destroy).toHaveBeenCalled();
        });
        it('should throw ForbiddenError if admin tries to leave without transferring', async () => {
            models.HouseholdMember.findOne.mockResolvedValue({ role: 'admin' });
            await expect((0, service_1.leaveHousehold)(userId, householdId))
                .rejects.toThrow('Transfer admin role to another member before leaving');
        });
        it('should throw NotFoundError if not a member', async () => {
            models.HouseholdMember.findOne.mockResolvedValue(null);
            await expect((0, service_1.leaveHousehold)(userId, householdId))
                .rejects.toThrow('Household not found');
        });
    });
    describe('transferAdmin', () => {
        it('should transfer admin role to another member', async () => {
            const adminMembership = { role: 'admin', update: jest.fn() };
            const targetMembership = { role: 'member', userId: otherUserId, update: jest.fn() };
            models.HouseholdMember.findOne
                .mockResolvedValueOnce(adminMembership)
                .mockResolvedValueOnce(targetMembership);
            models.HouseholdMember.count.mockResolvedValue(3);
            models.Household.findByPk.mockResolvedValue(fakeHousehold());
            const result = await (0, service_1.transferAdmin)(userId, householdId, otherUserId);
            expect(adminMembership.update).toHaveBeenCalledWith({ role: 'member' });
            expect(targetMembership.update).toHaveBeenCalledWith({ role: 'admin' });
            expect(result.role).toBe('member');
        });
        it('should throw ForbiddenError if requester is not admin', async () => {
            models.HouseholdMember.findOne.mockResolvedValue({ role: 'member' });
            await expect((0, service_1.transferAdmin)(userId, householdId, otherUserId))
                .rejects.toThrow('Only admins can transfer the admin role');
        });
        it('should throw error if transferring to self', async () => {
            models.HouseholdMember.findOne.mockResolvedValue({ role: 'admin' });
            await expect((0, service_1.transferAdmin)(userId, householdId, userId))
                .rejects.toThrow('You are already the admin');
        });
        it('should throw NotFoundError if target is not a member', async () => {
            models.HouseholdMember.findOne
                .mockResolvedValueOnce({ role: 'admin' })
                .mockResolvedValueOnce(null);
            await expect((0, service_1.transferAdmin)(userId, householdId, otherUserId))
                .rejects.toThrow('Member not found');
        });
    });
    describe('changeMemberRole', () => {
        const body = { role: 'member' };
        it('should change a member role and return updated member', async () => {
            const update = jest.fn();
            models.HouseholdMember.findOne
                .mockResolvedValueOnce({ role: 'admin' }) // admin membership
                .mockResolvedValueOnce({
                userId: otherUserId,
                role: 'child',
                joinedAt: new Date(),
                update,
                user: { displayName: 'Other User', email: 'other@test.com', avatarUrl: null, avatarEmoji: null },
            });
            const result = await (0, service_1.changeMemberRole)(userId, householdId, otherUserId, body);
            expect(update).toHaveBeenCalledWith({ role: 'member' });
            expect(result.role).toBe('member');
            expect(result.userId).toBe(otherUserId);
        });
        it('should throw ForbiddenError if requester is not admin', async () => {
            models.HouseholdMember.findOne.mockResolvedValue({ role: 'member' });
            await expect((0, service_1.changeMemberRole)(userId, householdId, otherUserId, body))
                .rejects.toThrow('Only admins can change roles');
        });
        it('should throw error if changing own role', async () => {
            models.HouseholdMember.findOne.mockResolvedValue({ role: 'admin' });
            await expect((0, service_1.changeMemberRole)(userId, householdId, userId, body))
                .rejects.toThrow('Use the transfer endpoint to change your own role');
        });
    });
    describe('listMembers', () => {
        it('should return sorted member list with user info', async () => {
            models.HouseholdMember.findOne.mockResolvedValue({ role: 'admin' });
            models.HouseholdMember.findAll.mockResolvedValue([
                {
                    userId: userId,
                    role: 'admin',
                    joinedAt: new Date('2026-07-01'),
                    user: { displayName: 'Admin User', email: 'admin@test.com', avatarUrl: null, avatarEmoji: null },
                },
                {
                    userId: otherUserId,
                    role: 'member',
                    joinedAt: new Date('2026-07-02'),
                    user: { displayName: 'Other User', email: 'other@test.com', avatarUrl: null, avatarEmoji: null },
                },
            ]);
            const result = await (0, service_1.listMembers)(householdId, userId);
            expect(result).toHaveLength(2);
            expect(result[0].role).toBe('admin');
            expect(result[1].role).toBe('member');
            expect(result[0].displayName).toBe('Admin User');
        });
        it('should throw NotFoundError if user is not a member', async () => {
            models.HouseholdMember.findOne.mockResolvedValue(null);
            await expect((0, service_1.listMembers)(householdId, userId))
                .rejects.toThrow('Household not found');
        });
    });
});
//# sourceMappingURL=household.service.test.js.map
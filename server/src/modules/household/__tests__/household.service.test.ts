import {
  generateInvitation, joinViaCode, removeMember, leaveHousehold, transferAdmin, changeMemberRole, listMembers,
  scheduleHouseholdDeletion, cancelHouseholdDeletion, confirmHouseholdDeletion,
} from '../service';
import * as models from '../../../database/models';

jest.mock('../../../database/models', () => {
  return {
    Household: { create: jest.fn(), findByPk: jest.fn(), findOne: jest.fn() },
    HouseholdMember: { create: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), count: jest.fn(), destroy: jest.fn() },
    Invitation: { create: jest.fn(), findOne: jest.fn(), count: jest.fn() },
    User: { update: jest.fn(), findByPk: jest.fn() },
  };
});

jest.mock('../../../shared/services/notifications', () => ({
  notifyHousehold: jest.fn().mockResolvedValue(undefined),
}));

const userId = '550e8400-e29b-41d4-a716-446655440001';
const otherUserId = '660e8400-e29b-41d4-a716-446655440002';
const householdId = '550e8400-e29b-41d4-a716-446655440003';

function fakeHousehold(overrides: any = {}) {
  return {
    id: householdId,
    name: 'Test Family',
    inviteCode: 'A1B2C3D4',
    createdAt: new Date('2026-07-04'),
    ...overrides,
  };
}

function fakeMembership(overrides: any = {}) {
  return {
    householdId,
    userId,
    role: 'admin',
    joinedAt: new Date(),
    household: fakeHousehold(),
    ...overrides,
  };
}

function fakeInvitation(overrides: any = {}) {
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
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(fakeMembership());
      (models.Invitation.findOne as jest.Mock).mockResolvedValue(null); // code not taken
      (models.Invitation.create as jest.Mock).mockResolvedValue(fakeInvitation());

      const result = await generateInvitation(userId, householdId);

      expect(result.code).toBeTruthy();
      expect(result.code.length).toBe(8);
      expect(result.shareLink).toContain('rootaru://join?code=');
      expect(result.expiresAt).toBeTruthy();
      expect(models.Invitation.create).toHaveBeenCalledWith(
        expect.objectContaining({ householdId, invitedBy: userId }),
      );
    });

    it('should throw ForbiddenError for child role', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(
        fakeMembership({ role: 'child' }),
      );

      await expect(generateInvitation(userId, householdId))
        .rejects.toThrow('Children cannot generate invitations');
    });

    it('should throw NotFoundError if user is not a member', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(null);

      await expect(generateInvitation(userId, householdId))
        .rejects.toThrow('Household not found');
    });
  });

  describe('joinViaCode', () => {
    it('should add user as member and mark invitation accepted', async () => {
      const inv = fakeInvitation();
      (models.HouseholdMember.findOne as jest.Mock)
        .mockResolvedValueOnce(null);  // user not in any household
      (models.Invitation.findOne as jest.Mock).mockResolvedValue(inv);
      (models.HouseholdMember.count as jest.Mock).mockResolvedValue(2);
      (models.HouseholdMember.create as jest.Mock).mockResolvedValue({});

      const result = await joinViaCode(otherUserId, { code: 'INVITE99' });

      expect(result).toMatchObject({
        name: 'Test Family',
        role: 'member',
        memberCount: 2,
      });
      expect(inv.update).toHaveBeenCalledWith(
        expect.objectContaining({ acceptedAt: expect.any(Date) }),
      );
    });

    it('should throw ConflictError if user already in a household', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(fakeMembership());

      await expect(joinViaCode(userId, { code: 'INVITE99' }))
        .rejects.toThrow('You already belong to a household');
    });

    it('should throw NotFoundError for invalid code', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(null);
      (models.Invitation.findOne as jest.Mock).mockResolvedValue(null);
      (models.Household.findOne as jest.Mock).mockResolvedValue(null);

      await expect(joinViaCode(otherUserId, { code: 'BADCODE' }))
        .rejects.toThrow('Invitation not found');
    });

    it('should throw 410 for expired invitation', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(null);
      (models.Invitation.findOne as jest.Mock).mockResolvedValue(
        fakeInvitation({ expiresAt: new Date('2024-01-01') }),
      );

      await expect(joinViaCode(otherUserId, { code: 'EXPIRED' }))
        .rejects.toThrow('Invitation has expired');
    });

    it('should throw ConflictError for already used invitation', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(null);
      (models.Invitation.findOne as jest.Mock).mockResolvedValue(
        fakeInvitation({ acceptedAt: new Date('2026-07-03') }),
      );

      await expect(joinViaCode(otherUserId, { code: 'USED' }))
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
      (models.HouseholdMember.findOne as jest.Mock)
        .mockResolvedValueOnce({ role: 'admin' }) // admin membership
        .mockResolvedValueOnce({ role: 'member', destroy: jest.fn().mockResolvedValue(undefined) }); // target membership

      await expect(removeMember(userId, householdId, otherUserId)).resolves.toBeUndefined();
    });

    it('should throw ForbiddenError if requester is not an admin', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ role: 'member' });

      await expect(removeMember(userId, householdId, otherUserId))
        .rejects.toThrow('Only admins can remove members');
    });

    it('should throw error if admin tries to remove self', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ role: 'admin' });

      await expect(removeMember(userId, householdId, userId))
        .rejects.toThrow('Use the leave endpoint to remove yourself');
    });

    it('should throw NotFoundError if target is not a member', async () => {
      (models.HouseholdMember.findOne as jest.Mock)
        .mockResolvedValueOnce({ role: 'admin' })
        .mockResolvedValueOnce(null);

      await expect(removeMember(userId, householdId, otherUserId))
        .rejects.toThrow('Member not found');
    });

    it('should throw ForbiddenError if target is another admin', async () => {
      (models.HouseholdMember.findOne as jest.Mock)
        .mockResolvedValueOnce({ role: 'admin' })
        .mockResolvedValueOnce({ role: 'admin' });

      await expect(removeMember(userId, householdId, otherUserId))
        .rejects.toThrow('Cannot remove another admin');
    });
  });

  describe('leaveHousehold', () => {
    it('should allow a member to leave', async () => {
      const destroy = jest.fn().mockResolvedValue(undefined);
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ role: 'member', destroy });

      await expect(leaveHousehold(userId, householdId)).resolves.toBeUndefined();
      expect(destroy).toHaveBeenCalled();
    });

    it('should throw ForbiddenError if admin tries to leave without transferring', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ role: 'admin' });

      await expect(leaveHousehold(userId, householdId))
        .rejects.toThrow('Transfer admin role to another member before leaving');
    });

    it('should throw NotFoundError if not a member', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(null);

      await expect(leaveHousehold(userId, householdId))
        .rejects.toThrow('Household not found');
    });
  });

  describe('transferAdmin', () => {
    it('should transfer admin role to another member', async () => {
      const adminMembership = { role: 'admin', update: jest.fn() };
      const targetMembership = { role: 'member', userId: otherUserId, update: jest.fn() };
      (models.HouseholdMember.findOne as jest.Mock)
        .mockResolvedValueOnce(adminMembership)
        .mockResolvedValueOnce(targetMembership);
      (models.HouseholdMember.count as jest.Mock).mockResolvedValue(3);
      (models.Household.findByPk as jest.Mock).mockResolvedValue(fakeHousehold());

      const result = await transferAdmin(userId, householdId, otherUserId);

      expect(adminMembership.update).toHaveBeenCalledWith({ role: 'member' });
      expect(targetMembership.update).toHaveBeenCalledWith({ role: 'admin' });
      expect(result.role).toBe('member');
    });

    it('should throw ForbiddenError if requester is not admin', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ role: 'member' });

      await expect(transferAdmin(userId, householdId, otherUserId))
        .rejects.toThrow('Only admins can transfer the admin role');
    });

    it('should throw error if transferring to self', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ role: 'admin' });

      await expect(transferAdmin(userId, householdId, userId))
        .rejects.toThrow('You are already the admin');
    });

    it('should throw NotFoundError if target is not a member', async () => {
      (models.HouseholdMember.findOne as jest.Mock)
        .mockResolvedValueOnce({ role: 'admin' })
        .mockResolvedValueOnce(null);

      await expect(transferAdmin(userId, householdId, otherUserId))
        .rejects.toThrow('Member not found');
    });
  });

  describe('changeMemberRole', () => {
    const body = { role: 'member' as const };

    it('should change a member role and return updated member', async () => {
      const update = jest.fn();
      (models.HouseholdMember.findOne as jest.Mock)
        .mockResolvedValueOnce({ role: 'admin' }) // admin membership
        .mockResolvedValueOnce({ // target membership with user included
          userId: otherUserId,
          role: 'child',
          joinedAt: new Date(),
          update,
          user: { displayName: 'Other User', email: 'other@test.com', avatarUrl: null, avatarEmoji: null },
        });

      const result = await changeMemberRole(userId, householdId, otherUserId, body);

      expect(update).toHaveBeenCalledWith({ role: 'member' });
      expect(result.role).toBe('member');
      expect(result.userId).toBe(otherUserId);
    });

    it('should throw ForbiddenError if requester is not admin', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ role: 'member' });

      await expect(changeMemberRole(userId, householdId, otherUserId, body))
        .rejects.toThrow('Only admins can change roles');
    });

    it('should throw error if changing own role', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ role: 'admin' });

      await expect(changeMemberRole(userId, householdId, userId, body))
        .rejects.toThrow('Use the transfer endpoint to change your own role');
    });
  });

  describe('listMembers', () => {
    it('should return sorted member list with user info', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ role: 'admin' });
      (models.HouseholdMember.findAll as jest.Mock).mockResolvedValue([
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

      const result = await listMembers(householdId, userId);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('admin');
      expect(result[1].role).toBe('member');
      expect(result[0].displayName).toBe('Admin User');
    });

    it('should throw NotFoundError if user is not a member', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(null);

      await expect(listMembers(householdId, userId))
        .rejects.toThrow('Household not found');
    });
  });

  describe('scheduleHouseholdDeletion', () => {
    const hash = '$2b$04$bUCIhz76H.vDDixGSaXRt.vmZy8izCpNSiK4ZVGtmhtY1twdLD31W';

    it('should set scheduledDeletionAt to 30 days from now for an admin', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(fakeMembership({ role: 'admin' }));
      (models.User.findByPk as jest.Mock).mockResolvedValue({ id: userId, passwordHash: hash });
      const household = fakeHousehold({ scheduledDeletionAt: null, save: jest.fn() });
      (models.Household.findByPk as jest.Mock).mockResolvedValue(household);

      await scheduleHouseholdDeletion(userId, householdId, { password: 'password123' });

      expect(household.scheduledDeletionAt).toBeInstanceOf(Date);
      expect(household.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for a non-admin', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(fakeMembership({ role: 'member' }));

      await expect(scheduleHouseholdDeletion(userId, householdId, { password: 'x' }))
        .rejects.toThrow('Only the household admin can delete the household');
    });

    it('should throw for wrong password', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(fakeMembership({ role: 'admin' }));
      (models.User.findByPk as jest.Mock).mockResolvedValue({ id: userId, passwordHash: hash });

      await expect(scheduleHouseholdDeletion(userId, householdId, { password: 'wrong' }))
        .rejects.toThrow('Invalid password');
    });
  });

  describe('cancelHouseholdDeletion', () => {
    it('should clear scheduledDeletionAt for an admin', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(fakeMembership({ role: 'admin' }));
      const household = fakeHousehold({ scheduledDeletionAt: new Date(), save: jest.fn() });
      (models.Household.findByPk as jest.Mock).mockResolvedValue(household);

      await cancelHouseholdDeletion(userId, householdId);

      expect(household.scheduledDeletionAt).toBeNull();
      expect(household.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for a non-admin', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(fakeMembership({ role: 'member' }));

      await expect(cancelHouseholdDeletion(userId, householdId))
        .rejects.toThrow('Only the household admin can cancel a scheduled deletion');
    });
  });

  describe('confirmHouseholdDeletion', () => {
    const hash = '$2b$04$bUCIhz76H.vDDixGSaXRt.vmZy8izCpNSiK4ZVGtmhtY1twdLD31W';

    it('should remove all members and soft-delete the household', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(fakeMembership({ role: 'admin' }));
      (models.User.findByPk as jest.Mock).mockResolvedValue({ id: userId, passwordHash: hash });
      const household = fakeHousehold({ destroy: jest.fn().mockResolvedValue(undefined) });
      (models.Household.findByPk as jest.Mock).mockResolvedValue(household);

      await confirmHouseholdDeletion(userId, householdId, { password: 'password123' });

      expect(models.HouseholdMember.destroy).toHaveBeenCalledWith({ where: { householdId } });
      expect(household.destroy).toHaveBeenCalled();
    });

    it('should throw ForbiddenError for a non-admin', async () => {
      (models.HouseholdMember.findOne as jest.Mock).mockResolvedValue(fakeMembership({ role: 'member' }));

      await expect(confirmHouseholdDeletion(userId, householdId, { password: 'x' }))
        .rejects.toThrow('Only the household admin can delete the household');
    });
  });
});

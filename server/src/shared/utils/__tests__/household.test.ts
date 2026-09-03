import { getUserHousehold, isCurrentHouseholdAdmin } from '../household';

jest.mock('../../../database/models', () => ({
  HouseholdMember: { findOne: jest.fn() },
}));

import { HouseholdMember } from '../../../database/models';

describe('shared/utils/household (F-13 single source of truth)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('getUserHousehold', () => {
    it('should return the householdId for an existing membership', async () => {
      (HouseholdMember.findOne as jest.Mock).mockResolvedValue({ householdId: 'hh-1' });

      const result = await getUserHousehold('user-1');

      expect(result).toBe('hh-1');
      expect(HouseholdMember.findOne).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });

    it('should throw the default message when no membership exists', async () => {
      (HouseholdMember.findOne as jest.Mock).mockResolvedValue(null);

      await expect(getUserHousehold('user-1')).rejects.toThrow('You must belong to a household to do this');
    });

    it('should throw the caller-supplied message when provided', async () => {
      (HouseholdMember.findOne as jest.Mock).mockResolvedValue(null);

      await expect(getUserHousehold('user-1', 'You must belong to a household to use the vault'))
        .rejects.toThrow('You must belong to a household to use the vault');
    });
  });

  describe('isCurrentHouseholdAdmin', () => {
    it('should return true for an admin membership', async () => {
      (HouseholdMember.findOne as jest.Mock).mockResolvedValue({ role: 'admin' });

      await expect(isCurrentHouseholdAdmin('user-1', 'hh-1')).resolves.toBe(true);
    });

    it('should return false for a non-admin membership', async () => {
      (HouseholdMember.findOne as jest.Mock).mockResolvedValue({ role: 'member' });

      await expect(isCurrentHouseholdAdmin('user-1', 'hh-1')).resolves.toBe(false);
    });

    it('should return false when no membership exists', async () => {
      (HouseholdMember.findOne as jest.Mock).mockResolvedValue(null);

      await expect(isCurrentHouseholdAdmin('user-1', 'hh-1')).resolves.toBe(false);
    });
  });
});

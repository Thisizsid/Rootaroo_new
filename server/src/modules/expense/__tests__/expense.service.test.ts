import {
  createExpense,
  listExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  markExpenseSettled,
  getExpenseSummary,
  recordSettlement,
  getSettlements,
  getLedger,
} from '../service';
import * as models from '../../../database/models';
import { Op } from 'sequelize';

const userId = '550e8400-e29b-41d4-a716-446655440001';
const otherUserId = '660e8400-e29b-41d4-a716-446655440002';
const adminUserId = '770e8400-e29b-41d4-a716-446655440003';
const householdId = '880e8400-e29b-41d4-a716-446655440004';
const expenseId = '990e8400-e29b-41d4-a716-446655440005';

// ── Model Mocks ──

jest.mock('../../../database/models', () => {
  const mockModel = (name: string) => {
    const cls: any = jest.fn().mockName(name);
    cls.create = jest.fn();
    cls.findAll = jest.fn();
    cls.findOne = jest.fn();
    cls.findByPk = jest.fn();
    cls.bulkCreate = jest.fn();
    cls.destroy = jest.fn();
    cls.update = jest.fn();
    return cls;
  };
  return {
    sequelize: {
      transaction: jest.fn(async (cb: any) => cb({})),
    },
    Expense: mockModel('Expense'),
    ExpenseParticipant: mockModel('ExpenseParticipant'),
    Settlement: mockModel('Settlement'),
    User: mockModel('User'),
    HouseholdMember: mockModel('HouseholdMember'),
  };
});

jest.mock('../../../shared/utils/logger');

jest.mock('../../../shared/services/notifications', () => ({
  notifyUser: jest.fn(),
  notifyHousehold: jest.fn(),
}));

const modelsMock = models as any;

// ── Factory Helpers ──

function userDisplay(userIdParam: string, name: string) {
  return { id: userIdParam, displayName: name, avatarUrl: null, avatarEmoji: null };
}

function memberWithUser(userIdParam: string, displayName: string) {
  return {
    userId: userIdParam,
    householdId,
    user: userDisplay(userIdParam, displayName),
  };
}

function mockExpense(overrides: any = {}) {
  const expense: any = {
    id: expenseId,
    householdId,
    title: 'Groceries',
    amount: 3200,
    paidBy: userId,
    splitType: 'equal',
    createdAt: new Date('2026-07-10T10:00:00Z'),
    updatedAt: new Date('2026-07-10T10:00:00Z'),
    get: jest.fn(),
    destroy: jest.fn(),
    save: jest.fn(),
    ...overrides,
  };
  return expense;
}

function mockExpenseWithParticipants(participants: any[] = [], overrides: any = {}) {
  const exp = mockExpense(overrides);
  exp.get.mockReturnValue(
    participants.map((p: any) => ({
      id: 'part-1',
      expenseId,
      userId: p.userId || userId,
      shareAmount: p.shareAmount || 800,
      isSettled: p.isSettled || false,
      createdAt: new Date('2026-07-10T10:00:00Z'),
      get: jest.fn().mockReturnValue(userDisplay(p.userId || userId, 'Test User')),
    }))
  );
  return exp;
}

function mockSettlement(overrides: any = {}) {
  const s: any = {
    id: 'aa0e8400-e29b-41d4-a716-446655440006',
    householdId,
    fromUserId: otherUserId,
    toUserId: userId,
    amount: 500,
    createdAt: new Date('2026-07-11T10:00:00Z'),
    get: jest.fn((key: string) => {
      if (key === 'fromUser') return userDisplay(otherUserId, 'Other User');
      if (key === 'toUser') return userDisplay(userId, 'Test User');
      return undefined;
    }),
    ...overrides,
  };
  return s;
}

beforeEach(() => {
  jest.clearAllMocks();

  // findOne: return default member (used by getUserHousehold, payer check)
  modelsMock.HouseholdMember.findOne.mockResolvedValue(
    memberWithUser(userId, 'Test User')
  );

  // No recorded settlements by default — tests that care about the
  // settlement/balance offset mock this explicitly.
  modelsMock.Settlement.findAll.mockResolvedValue([]);

  // findAll: only the *active* members in each test scope
  // Each test that calls findAll should mock it explicitly with the expected count
});

// ── Tests ──

describe('Expense Service', () => {
  // ── createExpense (FR-100, FR-101, FR-102) ──
  describe('createExpense', () => {
    const validBody = {
      title: 'Groceries',
      amount: 3200,
      paidBy: userId,
      splitType: 'equal' as const,
      participants: [{ userId }, { userId: otherUserId }],
    };

    beforeEach(() => {
      // findAll used for participant verification — must match participant count
      modelsMock.HouseholdMember.findAll.mockResolvedValue([
        memberWithUser(userId, 'Me'),
        memberWithUser(otherUserId, 'Other'),
      ]);
    });

    it('should create an expense with equal split (FR-100, FR-101)', async () => {
      const expense = mockExpense();
      modelsMock.Expense.create.mockResolvedValue(expense);
      modelsMock.ExpenseParticipant.bulkCreate.mockResolvedValue([]);
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      const result = await createExpense(userId, validBody);

      expect(modelsMock.Expense.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Groceries', amount: 3200, paidBy: userId })
      );
      expect(modelsMock.ExpenseParticipant.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId, shareAmount: 1600 }),
          expect.objectContaining({ userId: otherUserId, shareAmount: 1600 }),
        ])
      );
      expect(result.title).toBe('Groceries');
    });

    it('should create an expense with custom split (FR-102)', async () => {
      const body = {
        ...validBody,
        splitType: 'custom' as const,
        participants: [
          { userId, shareAmount: 2000 },
          { userId: otherUserId, shareAmount: 1200 },
        ],
      };
      const expense = mockExpense({ splitType: 'custom' });
      modelsMock.Expense.create.mockResolvedValue(expense);
      modelsMock.ExpenseParticipant.bulkCreate.mockResolvedValue([]);
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      const result = await createExpense(userId, body);

      expect(modelsMock.ExpenseParticipant.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId, shareAmount: 2000 }),
          expect.objectContaining({ userId: otherUserId, shareAmount: 1200 }),
        ])
      );
      expect(result.splitType).toBe('custom');
    });

    it('should throw if payer is not a household member', async () => {
      // First findOne resolves the caller's household; the payer lookup then fails
      modelsMock.HouseholdMember.findOne
        .mockResolvedValueOnce(memberWithUser(userId, 'Me'))
        .mockResolvedValueOnce(null);

      await expect(createExpense(userId, validBody)).rejects.toThrow(
        'Payer must be a household member'
      );
    });

    it('should throw if any participant is not a household member', async () => {
      modelsMock.HouseholdMember.findOne.mockResolvedValue(memberWithUser(userId, 'Me'));
      // Return only 1 member when 2 are expected
      modelsMock.HouseholdMember.findAll.mockResolvedValue([memberWithUser(userId, 'Me')]);

      await expect(createExpense(userId, validBody)).rejects.toThrow(
        'All participants must be household members'
      );
    });

    it('should distribute the rounding remainder to the payer on an uneven equal split', async () => {
      const body = {
        ...validBody,
        amount: 10,
        participants: [{ userId }, { userId: otherUserId }, { userId: adminUserId }],
      };
      modelsMock.HouseholdMember.findAll.mockResolvedValue([
        memberWithUser(userId, 'Me'),
        memberWithUser(otherUserId, 'Other'),
        memberWithUser(adminUserId, 'Admin'),
      ]);
      const expense = mockExpense({ amount: 10 });
      modelsMock.Expense.create.mockResolvedValue(expense);
      modelsMock.ExpenseParticipant.bulkCreate.mockResolvedValue([]);
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      await createExpense(userId, body);

      const shares = modelsMock.ExpenseParticipant.bulkCreate.mock.calls[0][0];
      const total = shares.reduce((sum: number, s: any) => sum + s.shareAmount, 0);
      expect(Math.round(total * 100) / 100).toBe(10);
      // 10 / 3 = 3.33..., payer (userId) absorbs the extra cent
      expect(shares.find((s: any) => s.userId === userId).shareAmount).toBe(3.34);
    });

    it('should throw if custom shares do not sum to the expense amount', async () => {
      const body = {
        ...validBody,
        splitType: 'custom' as const,
        participants: [
          { userId, shareAmount: 1000 },
          { userId: otherUserId, shareAmount: 1000 },
        ],
      };

      await expect(createExpense(userId, body)).rejects.toThrow(
        'Custom shares total'
      );
    });

    it('should throw if a custom share is zero or negative', async () => {
      const body = {
        ...validBody,
        splitType: 'custom' as const,
        participants: [
          { userId, shareAmount: 3200 },
          { userId: otherUserId, shareAmount: 0 },
        ],
      };

      await expect(createExpense(userId, body)).rejects.toThrow(
        'Each participant share must be a positive amount'
      );
    });
  });

  // ── listExpenses (FR-106) ──
  describe('listExpenses', () => {
    it('should return paginated expenses', async () => {
      const expense = mockExpenseWithParticipants([
        { userId, shareAmount: 1600 },
        { userId: otherUserId, shareAmount: 1600 },
      ]);
      modelsMock.Expense.findAll.mockResolvedValue([expense]);

      const result = await listExpenses(userId, { limit: 20 });

      expect(result.expenses).toHaveLength(1);
      expect(result.expenses[0].title).toBe('Groceries');
      expect(modelsMock.Expense.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { householdId },
          order: [['createdAt', 'DESC']],
        })
      );
    });

    it('should apply cursor-based pagination', async () => {
      modelsMock.Expense.findAll.mockResolvedValue([]);
      await listExpenses(userId, {
        cursor: '2026-07-10T10:00:00.000Z',
        limit: 10,
      });

      const args = modelsMock.Expense.findAll.mock.calls[0][0];
      expect(args.where.createdAt[Op.lt]).toBeDefined();
    });
  });

  // ── getExpenseById ──
  describe('getExpenseById', () => {
    it('should return expense by id', async () => {
      const expense = mockExpenseWithParticipants([
        { userId, shareAmount: 1600 },
        { userId: otherUserId, shareAmount: 1600 },
      ]);
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      const result = await getExpenseById(expenseId, userId);
      expect(result.id).toBe(expenseId);
    });

    it('should throw NotFoundError for non-existent expense', async () => {
      modelsMock.Expense.findByPk.mockResolvedValue(null);
      await expect(getExpenseById(expenseId, userId)).rejects.toThrow('Expense');
    });

    it('should throw ForbiddenError if expense belongs to different household', async () => {
      const expense = mockExpenseWithParticipants([], { householdId: 'other-household' });
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      await expect(getExpenseById(expenseId, userId)).rejects.toThrow('Access denied');
    });
  });

  // ── updateExpense (FR-107, FR-108) ──
  describe('updateExpense', () => {
    beforeEach(() => {
      modelsMock.HouseholdMember.findAll.mockResolvedValue([
        memberWithUser(userId, 'Me'),
        memberWithUser(otherUserId, 'Other'),
        memberWithUser(adminUserId, 'Admin'),
      ]);
    });

    it('should allow creator to update expense', async () => {
      const expense = mockExpenseWithParticipants([
        { userId, shareAmount: 1600 },
        { userId: otherUserId, shareAmount: 1600 },
      ]);
      expense.paidBy = userId;
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      await updateExpense(expenseId, userId, 'member', { title: 'New Title' });
      expect(expense.save).toHaveBeenCalled();
    });

    it('should allow admin to update any expense (FR-108)', async () => {
      const expense = mockExpenseWithParticipants([
        { userId, shareAmount: 1600 },
        { userId: otherUserId, shareAmount: 1600 },
      ]);
      expense.paidBy = otherUserId;
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      await updateExpense(expenseId, adminUserId, 'admin', { title: 'Admin Edit' });
      expect(expense.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when non-creator, non-admin tries to update', async () => {
      const expense = mockExpenseWithParticipants([
        { userId, shareAmount: 1600 },
        { userId: otherUserId, shareAmount: 1600 },
      ]);
      expense.paidBy = userId;
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      await expect(
        updateExpense(expenseId, otherUserId, 'member', { title: 'Hijack' })
      ).rejects.toThrow('Only the creator or an admin');
    });
  });

  // ── deleteExpense (FR-107, FR-108) ──
  describe('deleteExpense', () => {
    it('should allow creator to delete own expense', async () => {
      const expense = mockExpense();
      expense.paidBy = userId;
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      await deleteExpense(expenseId, userId, 'member');
      expect(expense.destroy).toHaveBeenCalled();
    });

    it('should allow admin to delete any expense (FR-108)', async () => {
      const expense = mockExpense();
      expense.paidBy = otherUserId;
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      await deleteExpense(expenseId, adminUserId, 'admin');
      expect(expense.destroy).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when non-creator, non-admin tries to delete', async () => {
      const expense = mockExpense();
      expense.paidBy = userId;
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      await expect(
        deleteExpense(expenseId, otherUserId, 'member')
      ).rejects.toThrow('Only the creator or an admin');
    });
  });

  // ── markExpenseSettled ──
  describe('markExpenseSettled', () => {
    it('should allow creator to mark expense settled', async () => {
      const expense = mockExpenseWithParticipants([
        { userId, shareAmount: 1600 },
        { userId: otherUserId, shareAmount: 1600 },
      ]);
      expense.paidBy = userId;
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      await markExpenseSettled(expenseId, userId, 'member');

      expect(modelsMock.ExpenseParticipant.update).toHaveBeenCalledWith(
        { isSettled: true },
        { where: { expenseId }, transaction: {} }
      );
    });

    it('should allow admin to settle any expense (FR-108)', async () => {
      const expense = mockExpenseWithParticipants([
        { userId: otherUserId, shareAmount: 1600 },
      ]);
      expense.paidBy = otherUserId;
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      await markExpenseSettled(expenseId, adminUserId, 'admin');

      expect(modelsMock.ExpenseParticipant.update).toHaveBeenCalledWith(
        { isSettled: true },
        { where: { expenseId }, transaction: {} }
      );
    });

    it('should record a settlement for each unsettled non-payer participant (not the payer)', async () => {
      const expense = mockExpenseWithParticipants([
        { userId, shareAmount: 1600 },
        { userId: otherUserId, shareAmount: 1600 },
      ]);
      expense.paidBy = userId;
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      await markExpenseSettled(expenseId, userId, 'member');

      expect(modelsMock.Settlement.bulkCreate).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            householdId,
            fromUserId: otherUserId,
            toUserId: userId,
            amount: 1600,
          }),
        ],
        { transaction: {} }
      );
    });

    it('should not record a settlement for an already-settled participant', async () => {
      const expense = mockExpenseWithParticipants([
        { userId: otherUserId, shareAmount: 1600, isSettled: true },
      ]);
      expense.paidBy = userId;
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      await markExpenseSettled(expenseId, userId, 'member');

      expect(modelsMock.Settlement.bulkCreate).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when non-creator, non-admin tries to settle', async () => {
      const expense = mockExpense();
      expense.paidBy = userId;
      modelsMock.Expense.findByPk.mockResolvedValue(expense);

      await expect(
        markExpenseSettled(expenseId, otherUserId, 'member')
      ).rejects.toThrow('Only the creator or an admin can settle this expense');
    });

    it('should throw NotFoundError for non-existent expense', async () => {
      modelsMock.Expense.findByPk.mockResolvedValue(null);

      await expect(
        markExpenseSettled(expenseId, userId, 'member')
      ).rejects.toThrow('Expense');
    });
  });

  // ── recordSettlement (FR-105) ──
  describe('recordSettlement', () => {
    it('should record a settlement between two members', async () => {
      const settlement = mockSettlement();
      modelsMock.Settlement.create.mockResolvedValue(settlement);
      modelsMock.Settlement.findByPk.mockResolvedValue(settlement);

      // fromUserId must match the caller
      const result = await recordSettlement(otherUserId, {
        fromUserId: otherUserId,
        toUserId: userId,
        amount: 500,
      });

      expect(modelsMock.Settlement.create).toHaveBeenCalledWith(
        expect.objectContaining({ fromUserId: otherUserId, toUserId: userId, amount: 500 })
      );
      expect(result.amount).toBe(500);
    });

    it('should throw if someone else tries to record settlement', async () => {
      await expect(
        recordSettlement(userId, {
          fromUserId: otherUserId,
          toUserId: userId,
          amount: 500,
        })
      ).rejects.toThrow('Only the payer can record this settlement');
    });
  });

  // ── getSettlements (FR-106) ──
  describe('getSettlements', () => {
    it('should return paginated settlements', async () => {
      const settlement = mockSettlement();
      modelsMock.Settlement.findAll.mockResolvedValue([settlement]);

      const result = await getSettlements(userId, { limit: 20 });

      expect(result.settlements).toHaveLength(1);
      expect(result.settlements[0].amount).toBe(500);
    });
  });

  // ── getExpenseSummary (FR-103, FR-104, FR-109) ──
  describe('getExpenseSummary', () => {
    it('should calculate net balances and simplified ledger', async () => {
      // Members must include .user with displayName
      modelsMock.HouseholdMember.findAll.mockResolvedValue([
        memberWithUser(userId, 'Test User'),
        memberWithUser(otherUserId, 'Other User'),
      ]);

      const expense = mockExpenseWithParticipants([
        { userId, shareAmount: 100 },
        { userId: otherUserId, shareAmount: 100 },
      ]);
      expense.amount = 200;
      expense.paidBy = userId;
      modelsMock.Expense.findAll.mockResolvedValue([expense]);

      const summary = await getExpenseSummary(userId);

      expect(summary.netBalances).toHaveLength(2);

      const userNet = summary.netBalances.find((nb: any) => nb.userId === userId);
      expect(userNet).toBeDefined();
      expect(userNet!.netBalance).toBe(100); // paid 200, owes 100

      const otherNet = summary.netBalances.find((nb: any) => nb.userId === otherUserId);
      expect(otherNet).toBeDefined();
      expect(otherNet!.netBalance).toBe(-100); // paid 0, owes 100

      expect(summary.ledger).toHaveLength(1);
      expect(summary.ledger[0].fromUserId).toBe(otherUserId);
      expect(summary.ledger[0].toUserId).toBe(userId);
      expect(summary.ledger[0].amount).toBe(100);
      expect(summary.totalExpenses).toBe(1);
      expect(summary.totalAmount).toBe(200);
    });

    it('should offset net balances by recorded settlements', async () => {
      modelsMock.HouseholdMember.findAll.mockResolvedValue([
        memberWithUser(userId, 'Test User'),
        memberWithUser(otherUserId, 'Other User'),
      ]);

      const expense = mockExpenseWithParticipants([
        { userId, shareAmount: 100 },
        { userId: otherUserId, shareAmount: 100 },
      ]);
      expense.amount = 200;
      expense.paidBy = userId;
      modelsMock.Expense.findAll.mockResolvedValue([expense]);

      // otherUser already paid back their full $100 debt
      modelsMock.Settlement.findAll.mockResolvedValue([
        mockSettlement({ fromUserId: otherUserId, toUserId: userId, amount: 100 }),
      ]);

      const summary = await getExpenseSummary(userId);

      const userNet = summary.netBalances.find((nb: any) => nb.userId === userId);
      const otherNet = summary.netBalances.find((nb: any) => nb.userId === otherUserId);
      expect(userNet!.netBalance).toBe(0); // was owed 100, settlement paid it off
      expect(otherNet!.netBalance).toBe(0); // owed 100, settlement cleared it
      expect(summary.ledger).toHaveLength(0); // nothing outstanding left to net
    });

    it('should return empty summary when no expenses exist', async () => {
      modelsMock.HouseholdMember.findAll.mockResolvedValue([
        memberWithUser(userId, 'Test User'),
      ]);
      modelsMock.Expense.findAll.mockResolvedValue([]);

      const summary = await getExpenseSummary(userId);

      expect(summary.netBalances).toHaveLength(1);
      expect(summary.netBalances[0].netBalance).toBe(0);
      expect(summary.ledger).toHaveLength(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.totalAmount).toBe(0);
    });
  });

  // ── getLedger (FR-104) ──
  describe('getLedger', () => {
    it('should return ledger unwrapped from summary', async () => {
      modelsMock.HouseholdMember.findAll.mockResolvedValue([
        memberWithUser(userId, 'Test User'),
        memberWithUser(otherUserId, 'Other User'),
      ]);

      const expense = mockExpenseWithParticipants([
        { userId, shareAmount: 100 },
        { userId: otherUserId, shareAmount: 100 },
      ]);
      expense.amount = 200;
      expense.paidBy = userId;
      modelsMock.Expense.findAll.mockResolvedValue([expense]);

      const ledger = await getLedger(userId);

      expect(ledger).toHaveLength(1);
      expect(ledger[0].fromUserId).toBe(otherUserId);
      expect(ledger[0].amount).toBe(100);
    });
  });
});

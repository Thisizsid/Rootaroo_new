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
const sequelize_1 = require("sequelize");
const userId = '550e8400-e29b-41d4-a716-446655440001';
const otherUserId = '660e8400-e29b-41d4-a716-446655440002';
const adminUserId = '770e8400-e29b-41d4-a716-446655440003';
const householdId = '880e8400-e29b-41d4-a716-446655440004';
const expenseId = '990e8400-e29b-41d4-a716-446655440005';
// ── Model Mocks ──
jest.mock('../../../database/models', () => {
    const mockModel = (name) => {
        const cls = jest.fn().mockName(name);
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
        Expense: mockModel('Expense'),
        ExpenseParticipant: mockModel('ExpenseParticipant'),
        Settlement: mockModel('Settlement'),
        User: mockModel('User'),
        HouseholdMember: mockModel('HouseholdMember'),
    };
});
jest.mock('../../../shared/utils/logger');
const modelsMock = models;
// ── Factory Helpers ──
function userDisplay(userIdParam, name) {
    return { id: userIdParam, displayName: name, avatarUrl: null, avatarEmoji: null };
}
function memberWithUser(userIdParam, displayName) {
    return {
        userId: userIdParam,
        householdId,
        user: userDisplay(userIdParam, displayName),
    };
}
function mockExpense(overrides = {}) {
    const expense = {
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
function mockExpenseWithParticipants(participants = [], overrides = {}) {
    const exp = mockExpense(overrides);
    exp.get.mockReturnValue(participants.map((p) => ({
        id: 'part-1',
        expenseId,
        userId: p.userId || userId,
        shareAmount: p.shareAmount || 800,
        isSettled: false,
        createdAt: new Date('2026-07-10T10:00:00Z'),
        get: jest.fn().mockReturnValue(userDisplay(p.userId || userId, 'Test User')),
    })));
    return exp;
}
function mockSettlement(overrides = {}) {
    const s = {
        id: 'aa0e8400-e29b-41d4-a716-446655440006',
        householdId,
        fromUserId: otherUserId,
        toUserId: userId,
        amount: 500,
        createdAt: new Date('2026-07-11T10:00:00Z'),
        get: jest.fn((key) => {
            if (key === 'fromUser')
                return userDisplay(otherUserId, 'Other User');
            if (key === 'toUser')
                return userDisplay(userId, 'Test User');
            return undefined;
        }),
        ...overrides,
    };
    return s;
}
beforeEach(() => {
    jest.clearAllMocks();
    // findOne: return default member (used by getUserHousehold, payer check)
    modelsMock.HouseholdMember.findOne.mockResolvedValue(memberWithUser(userId, 'Test User'));
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
            splitType: 'equal',
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
            const result = await (0, service_1.createExpense)(userId, householdId, validBody);
            expect(modelsMock.Expense.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Groceries', amount: 3200, paidBy: userId }));
            expect(modelsMock.ExpenseParticipant.bulkCreate).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({ userId, shareAmount: 1600 }),
                expect.objectContaining({ userId: otherUserId, shareAmount: 1600 }),
            ]));
            expect(result.title).toBe('Groceries');
        });
        it('should create an expense with custom split (FR-102)', async () => {
            const body = {
                ...validBody,
                splitType: 'custom',
                participants: [
                    { userId, shareAmount: 2000 },
                    { userId: otherUserId, shareAmount: 1200 },
                ],
            };
            const expense = mockExpense({ splitType: 'custom' });
            modelsMock.Expense.create.mockResolvedValue(expense);
            modelsMock.ExpenseParticipant.bulkCreate.mockResolvedValue([]);
            modelsMock.Expense.findByPk.mockResolvedValue(expense);
            const result = await (0, service_1.createExpense)(userId, householdId, body);
            expect(modelsMock.ExpenseParticipant.bulkCreate).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({ userId, shareAmount: 2000 }),
                expect.objectContaining({ userId: otherUserId, shareAmount: 1200 }),
            ]));
            expect(result.splitType).toBe('custom');
        });
        it('should throw if payer is not a household member', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValueOnce(null);
            await expect((0, service_1.createExpense)(userId, householdId, validBody)).rejects.toThrow('Payer must be a household member');
        });
        it('should throw if any participant is not a household member', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue(memberWithUser(userId, 'Me'));
            // Return only 1 member when 2 are expected
            modelsMock.HouseholdMember.findAll.mockResolvedValue([memberWithUser(userId, 'Me')]);
            await expect((0, service_1.createExpense)(userId, householdId, validBody)).rejects.toThrow('All participants must be household members');
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
            const result = await (0, service_1.listExpenses)(householdId, userId, { limit: 20 });
            expect(result.expenses).toHaveLength(1);
            expect(result.expenses[0].title).toBe('Groceries');
            expect(modelsMock.Expense.findAll).toHaveBeenCalledWith(expect.objectContaining({
                where: { householdId },
                order: [['createdAt', 'DESC']],
            }));
        });
        it('should apply cursor-based pagination', async () => {
            modelsMock.Expense.findAll.mockResolvedValue([]);
            await (0, service_1.listExpenses)(householdId, userId, {
                cursor: '2026-07-10T10:00:00.000Z',
                limit: 10,
            });
            const args = modelsMock.Expense.findAll.mock.calls[0][0];
            expect(args.where.createdAt[sequelize_1.Op.lt]).toBeDefined();
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
            const result = await (0, service_1.getExpenseById)(expenseId, userId);
            expect(result.id).toBe(expenseId);
        });
        it('should throw NotFoundError for non-existent expense', async () => {
            modelsMock.Expense.findByPk.mockResolvedValue(null);
            await expect((0, service_1.getExpenseById)(expenseId, userId)).rejects.toThrow('Expense');
        });
        it('should throw ForbiddenError if expense belongs to different household', async () => {
            const expense = mockExpenseWithParticipants([], { householdId: 'other-household' });
            modelsMock.Expense.findByPk.mockResolvedValue(expense);
            await expect((0, service_1.getExpenseById)(expenseId, userId)).rejects.toThrow('Access denied');
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
            await (0, service_1.updateExpense)(expenseId, userId, 'member', { title: 'New Title' });
            expect(expense.save).toHaveBeenCalled();
        });
        it('should allow admin to update any expense (FR-108)', async () => {
            const expense = mockExpenseWithParticipants([
                { userId, shareAmount: 1600 },
                { userId: otherUserId, shareAmount: 1600 },
            ]);
            expense.paidBy = otherUserId;
            modelsMock.Expense.findByPk.mockResolvedValue(expense);
            await (0, service_1.updateExpense)(expenseId, adminUserId, 'admin', { title: 'Admin Edit' });
            expect(expense.save).toHaveBeenCalled();
        });
        it('should throw ForbiddenError when non-creator, non-admin tries to update', async () => {
            const expense = mockExpenseWithParticipants([
                { userId, shareAmount: 1600 },
                { userId: otherUserId, shareAmount: 1600 },
            ]);
            expense.paidBy = userId;
            modelsMock.Expense.findByPk.mockResolvedValue(expense);
            await expect((0, service_1.updateExpense)(expenseId, otherUserId, 'member', { title: 'Hijack' })).rejects.toThrow('Only the creator or an admin');
        });
    });
    // ── deleteExpense (FR-107, FR-108) ──
    describe('deleteExpense', () => {
        it('should allow creator to delete own expense', async () => {
            const expense = mockExpense();
            expense.paidBy = userId;
            modelsMock.Expense.findByPk.mockResolvedValue(expense);
            await (0, service_1.deleteExpense)(expenseId, userId, 'member');
            expect(expense.destroy).toHaveBeenCalled();
        });
        it('should allow admin to delete any expense (FR-108)', async () => {
            const expense = mockExpense();
            expense.paidBy = otherUserId;
            modelsMock.Expense.findByPk.mockResolvedValue(expense);
            await (0, service_1.deleteExpense)(expenseId, adminUserId, 'admin');
            expect(expense.destroy).toHaveBeenCalled();
        });
        it('should throw ForbiddenError when non-creator, non-admin tries to delete', async () => {
            const expense = mockExpense();
            expense.paidBy = userId;
            modelsMock.Expense.findByPk.mockResolvedValue(expense);
            await expect((0, service_1.deleteExpense)(expenseId, otherUserId, 'member')).rejects.toThrow('Only the creator or an admin');
        });
    });
    // ── recordSettlement (FR-105) ──
    describe('recordSettlement', () => {
        it('should record a settlement between two members', async () => {
            const settlement = mockSettlement();
            modelsMock.Settlement.create.mockResolvedValue(settlement);
            modelsMock.Settlement.findByPk.mockResolvedValue(settlement);
            // fromUserId must match the caller
            const result = await (0, service_1.recordSettlement)(otherUserId, {
                fromUserId: otherUserId,
                toUserId: userId,
                amount: 500,
            });
            expect(modelsMock.Settlement.create).toHaveBeenCalledWith(expect.objectContaining({ fromUserId: otherUserId, toUserId: userId, amount: 500 }));
            expect(result.amount).toBe(500);
        });
        it('should throw if someone else tries to record settlement', async () => {
            await expect((0, service_1.recordSettlement)(userId, {
                fromUserId: otherUserId,
                toUserId: userId,
                amount: 500,
            })).rejects.toThrow('Only the payer can record this settlement');
        });
    });
    // ── getSettlements (FR-106) ──
    describe('getSettlements', () => {
        it('should return paginated settlements', async () => {
            const settlement = mockSettlement();
            modelsMock.Settlement.findAll.mockResolvedValue([settlement]);
            const result = await (0, service_1.getSettlements)(userId, { limit: 20 });
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
            const summary = await (0, service_1.getExpenseSummary)(userId);
            expect(summary.netBalances).toHaveLength(2);
            const userNet = summary.netBalances.find((nb) => nb.userId === userId);
            expect(userNet).toBeDefined();
            expect(userNet.netBalance).toBe(100); // paid 200, owes 100
            const otherNet = summary.netBalances.find((nb) => nb.userId === otherUserId);
            expect(otherNet).toBeDefined();
            expect(otherNet.netBalance).toBe(-100); // paid 0, owes 100
            expect(summary.ledger).toHaveLength(1);
            expect(summary.ledger[0].fromUserId).toBe(otherUserId);
            expect(summary.ledger[0].toUserId).toBe(userId);
            expect(summary.ledger[0].amount).toBe(100);
            expect(summary.totalExpenses).toBe(1);
            expect(summary.totalAmount).toBe(200);
        });
        it('should return empty summary when no expenses exist', async () => {
            modelsMock.HouseholdMember.findAll.mockResolvedValue([
                memberWithUser(userId, 'Test User'),
            ]);
            modelsMock.Expense.findAll.mockResolvedValue([]);
            const summary = await (0, service_1.getExpenseSummary)(userId);
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
            const ledger = await (0, service_1.getLedger)(userId);
            expect(ledger).toHaveLength(1);
            expect(ledger[0].fromUserId).toBe(otherUserId);
            expect(ledger[0].amount).toBe(100);
        });
    });
});
//# sourceMappingURL=expense.service.test.js.map
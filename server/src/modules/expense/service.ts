import { Op } from 'sequelize';
import {
  Expense,
  ExpenseParticipant,
  Settlement,
  User,
  HouseholdMember,
} from '../../database/models';
import { NotFoundError, ForbiddenError } from '../../shared/utils/errors';
import type {
  ExpenseResponse,
  ExpenseSummaryResponse,
  LedgerEntryResponse,
  SettlementResponse,
  PaginatedSettlements,
  PaginatedExpenses,
  NetBalanceResponse,
} from './types';

async function getUserHousehold(userId: string): Promise<string> {
  const membership = await HouseholdMember.findOne({ where: { userId } });
  if (!membership) {
    throw new ForbiddenError('You must belong to a household to manage expenses');
  }
  return membership.householdId;
}

function toExpenseResponse(expense: Expense): ExpenseResponse {
  const participants = expense.get('participants') as ExpenseParticipant[] || [];
  return {
    id: expense.id,
    householdId: expense.householdId,
    title: expense.title,
    amount: parseFloat(expense.amount.toString()),
    paidBy: expense.paidBy,
    splitType: expense.splitType,
    date: expense.createdAt.toISOString().split('T')[0],
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
    participants: participants.map((p) => ({
      id: p.id,
      expenseId: p.expenseId,
      userId: p.userId,
      shareAmount: parseFloat(p.shareAmount.toString()),
      isSettled: p.isSettled,
      createdAt: p.createdAt.toISOString(),
      user: p.get('user')
        ? {
            id: (p.get('user') as User).id,
            displayName: (p.get('user') as User).displayName,
            avatarUrl: (p.get('user') as User).avatarUrl,
            avatarEmoji: (p.get('user') as User).avatarEmoji,
          }
        : undefined,
    })),
  };
}

function toSettlementResponse(settlement: Settlement): SettlementResponse {
  const fromUser = settlement.get('fromUser') as User | undefined;
  const toUser = settlement.get('toUser') as User | undefined;
  return {
    id: settlement.id,
    householdId: settlement.householdId,
    fromUserId: settlement.fromUserId,
    toUserId: settlement.toUserId,
    amount: parseFloat(settlement.amount.toString()),
    settledAt: settlement.createdAt.toISOString(),
    fromUser: fromUser
      ? {
          id: fromUser.id,
          displayName: fromUser.displayName,
          avatarUrl: fromUser.avatarUrl,
          avatarEmoji: fromUser.avatarEmoji,
        }
      : undefined,
    toUser: toUser
      ? {
          id: toUser.id,
          displayName: toUser.displayName,
          avatarUrl: toUser.avatarUrl,
          avatarEmoji: toUser.avatarEmoji,
        }
      : undefined,
  };
}

/** FR-100: Create expense with equal or custom split */
export async function createExpense(
  userId: string,
  body: {
    title: string;
    amount: number;
    paidBy: string;
    date?: string;
    splitType: 'equal' | 'custom';
    participants: { userId: string; shareAmount?: number }[];
  }
): Promise<ExpenseResponse> {
  const { title, amount, paidBy, splitType, participants } = body;
  const householdId = await getUserHousehold(userId);

  // Verify payer is in household
  const payerMember = await HouseholdMember.findOne({ where: { userId: paidBy, householdId } });
  if (!payerMember) {
    throw new ForbiddenError('Payer must be a household member');
  }

  // Verify all participants are in household
  const participantIds = participants.map((p) => p.userId);
  const members = await HouseholdMember.findAll({
    where: { userId: { [Op.in]: participantIds }, householdId },
  });
  if (members.length !== participantIds.length) {
    throw new ForbiddenError('All participants must be household members');
  }

  // Calculate share amounts
  let shareAmounts: { userId: string; shareAmount: number }[];
  if (splitType === 'equal') {
    const share = amount / participants.length;
    shareAmounts = participants.map((p) => ({ userId: p.userId, shareAmount: share }));
  } else {
    shareAmounts = participants.map((p) => ({ userId: p.userId, shareAmount: p.shareAmount! }));
  }

  const expense = await Expense.create({
    title,
    amount,
    paidBy,
    splitType,
    householdId,
  });

  // Create participants
  await ExpenseParticipant.bulkCreate(
    shareAmounts.map((p) => ({
      expenseId: expense.id,
      userId: p.userId,
      shareAmount: p.shareAmount,
    }))
  );

  // Load full expense with participants
  const fullExpense = await Expense.findByPk(expense.id, {
    include: [
      { model: ExpenseParticipant, as: 'participants', include: [{ model: User, as: 'user' }] },
    ],
  });

  if (!fullExpense) {
    throw new Error('Failed to load created expense');
  }

  return toExpenseResponse(fullExpense);
}

/** FR-106: List expenses with cursor pagination */
export async function listExpenses(
  userId: string,
  options: { cursor?: string; limit?: number }
): Promise<PaginatedExpenses> {
  const householdId = await getUserHousehold(userId);
  const limit = Math.min(options.limit || 20, 50);
  const where: any = { householdId };
  if (options.cursor) {
    where.createdAt = { [Op.lt]: new Date(options.cursor) };
  }

  const expenses = await Expense.findAll({
    where,
    include: [
      { model: ExpenseParticipant, as: 'participants', include: [{ model: User, as: 'user' }] },
    ],
    order: [['createdAt', 'DESC']],
    limit: limit + 1,
  });

  const hasMore = expenses.length > limit;
  const pageExpenses = hasMore ? expenses.slice(0, limit) : expenses;
  const nextCursor = hasMore
    ? pageExpenses[pageExpenses.length - 1].createdAt.toISOString()
    : null;

  return {
    expenses: pageExpenses.map(toExpenseResponse),
    nextCursor,
    hasMore,
  };
}

export async function getExpenseById(
  expenseId: string,
  userId: string
): Promise<ExpenseResponse> {
  const expense = await Expense.findByPk(expenseId, {
    include: [
      { model: ExpenseParticipant, as: 'participants', include: [{ model: User, as: 'user' }] },
    ],
  });

  if (!expense) {
    throw new NotFoundError('Expense');
  }

  const householdId = await getUserHousehold(userId);
  if (expense.householdId !== householdId) {
    throw new ForbiddenError('Access denied');
  }

  return toExpenseResponse(expense);
}

/** FR-107, FR-108: Update expense (creator or admin only) */
export async function updateExpense(
  expenseId: string,
  userId: string,
  userRole: string,
  body: {
    title?: string;
    amount?: number;
    paidBy?: string;
    splitType?: 'equal' | 'custom';
    participants?: { userId: string; shareAmount?: number }[];
  }
): Promise<ExpenseResponse> {
  const expense = await Expense.findByPk(expenseId, {
    include: [{ model: ExpenseParticipant, as: 'participants' }],
  });

  if (!expense) {
    throw new NotFoundError('Expense');
  }

  const householdId = await getUserHousehold(userId);
  if (expense.householdId !== householdId) {
    throw new ForbiddenError('Access denied');
  }

  // Check permission: creator or admin
  if (expense.paidBy !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Only the creator or an admin can edit this expense');
  }

  // If updating amount or participants, recalculate shares
  if (body.amount !== undefined || body.splitType !== undefined || body.participants !== undefined) {
    const existingParticipants = expense.get('participants') as { userId: string; shareAmount: number }[];
    const participants = body.participants || existingParticipants.map((p) => ({ userId: p.userId, shareAmount: p.shareAmount }));
    const splitType = body.splitType || expense.splitType;
    const amount = body.amount !== undefined ? body.amount : parseFloat(expense.amount.toString());

    let shareAmounts: { userId: string; shareAmount: number }[];
    if (splitType === 'equal') {
      const share = amount / participants.length;
      shareAmounts = participants.map((p) => ({ userId: p.userId, shareAmount: share }));
    } else {
      shareAmounts = participants.map((p) => ({
        userId: p.userId,
        shareAmount: p.shareAmount!,
      }));
    }

    // Verify all participants are household members
    const participantIds = participants.map((p) => p.userId);
    const members = await HouseholdMember.findAll({
      where: { userId: { [Op.in]: participantIds }, householdId },
    });
    if (members.length !== participantIds.length) {
      throw new ForbiddenError('All participants must be household members');
    }

    // Delete old participants and create new ones
    await ExpenseParticipant.destroy({ where: { expenseId } });
    await ExpenseParticipant.bulkCreate(
      shareAmounts.map((p) => ({
        expenseId,
        userId: p.userId,
        shareAmount: p.shareAmount,
      }))
    );
  }

  // Update expense fields
  if (body.title !== undefined) expense.title = body.title;
  if (body.amount !== undefined) expense.amount = body.amount;
  if (body.paidBy !== undefined) expense.paidBy = body.paidBy;
  if (body.splitType !== undefined) expense.splitType = body.splitType;

  await expense.save();

  // Reload with participants
  const updated = await Expense.findByPk(expenseId, {
    include: [
      { model: ExpenseParticipant, as: 'participants', include: [{ model: User, as: 'user' }] },
    ],
  });

  if (!updated) {
    throw new Error('Failed to load updated expense');
  }

  return toExpenseResponse(updated);
}

/** FR-107, FR-108: Delete expense (creator or admin only) */
export async function deleteExpense(
  expenseId: string,
  userId: string,
  userRole: string
): Promise<void> {
  const expense = await Expense.findByPk(expenseId);

  if (!expense) {
    throw new NotFoundError('Expense');
  }

  const householdId = await getUserHousehold(userId);
  if (expense.householdId !== householdId) {
    throw new ForbiddenError('Access denied');
  }

  if (expense.paidBy !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Only the creator or an admin can delete this expense');
  }

  // Cascade will delete participants
  await expense.destroy();
}

/** FR-107/108: Mark all participants of an expense as settled (creator or admin only) */
export async function markExpenseSettled(
  expenseId: string,
  userId: string,
  userRole: string
): Promise<ExpenseResponse> {
  const expense = await Expense.findByPk(expenseId);

  if (!expense) {
    throw new NotFoundError('Expense');
  }

  const householdId = await getUserHousehold(userId);
  if (expense.householdId !== householdId) {
    throw new ForbiddenError('Access denied');
  }

  if (expense.paidBy !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Only the creator or an admin can settle this expense');
  }

  await ExpenseParticipant.update({ isSettled: true }, { where: { expenseId } });

  const updated = await Expense.findByPk(expenseId, {
    include: [
      { model: ExpenseParticipant, as: 'participants', include: [{ model: User, as: 'user' }] },
    ],
  });

  if (!updated) {
    throw new Error('Failed to load updated expense');
  }

  return toExpenseResponse(updated);
}

/** FR-103, FR-104, FR-109: Get expense summary with net balances and ledger */
export async function getExpenseSummary(userId: string): Promise<ExpenseSummaryResponse> {
  const householdId = await getUserHousehold(userId);

  // Get all household members
  const members = await HouseholdMember.findAll({
    where: { householdId },
    include: [{ model: User, as: 'user' }],
  });

  // Get all expenses for household
  const expenses = await Expense.findAll({
    where: { householdId },
    include: [{ model: ExpenseParticipant, as: 'participants' }],
  });

  // Calculate paid total and share total per user
  const userBalances = new Map<string, { paid: number; share: number }>();
  members.forEach((m) => userBalances.set(m.userId, { paid: 0, share: 0 }));

  expenses.forEach((expense) => {
    const amount = parseFloat(expense.amount.toString());
    const paidBy = expense.paidBy;
    const current = userBalances.get(paidBy) || { paid: 0, share: 0 };
    current.paid += amount;
    userBalances.set(paidBy, current);

    const participants = expense.get('participants') as { userId: string; shareAmount: number | string }[] || [];
    participants.forEach((p) => {
      const share = parseFloat(p.shareAmount.toString());
      const current = userBalances.get(p.userId) || { paid: 0, share: 0 };
      current.share += share;
      userBalances.set(p.userId, current);
    });
  });

  // Build net balances
  const netBalances: NetBalanceResponse[] = members.map((m) => {
    const bal = userBalances.get(m.userId)!;
    const netBalance = bal.paid - bal.share;
    return {
      userId: m.userId,
      displayName: m.user!.displayName,
      avatarUrl: m.user!.avatarUrl,
      avatarEmoji: m.user!.avatarEmoji,
      paidTotal: bal.paid,
      shareTotal: bal.share,
      netBalance: Math.round(netBalance * 100) / 100,
    };
  });

  // FR-104: Simplified ledger - netting algorithm
  // Clone netBalances to prevent mutation by the ledger algorithm
  const ledger = computeSimplifiedLedger(netBalances.map((nb) => ({ ...nb })));

  return {
    netBalances,
    totalExpenses: expenses.length,
    totalAmount: expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0),
    ledger,
  };
}

/** FR-104: Get simplified ledger (standalone endpoint, unwraps from summary) */
export async function getLedger(
  userId: string
): Promise<LedgerEntryResponse[]> {
  const summary = await getExpenseSummary(userId);
  return summary.ledger;
}

function computeSimplifiedLedger(
  balances: { userId: string; displayName: string; netBalance: number }[]
): LedgerEntryResponse[] {
  const creditors = balances
    .filter((b) => b.netBalance > 0.01)
    .sort((a, b) => b.netBalance - a.netBalance);
  const debtors = balances
    .filter((b) => b.netBalance < -0.01)
    .sort((a, b) => a.netBalance - b.netBalance);

  const ledger: LedgerEntryResponse[] = [];
  let i = 0,
    j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amount = Math.min(creditor.netBalance, -debtor.netBalance);

    ledger.push({
      fromUserId: debtor.userId,
      fromUserName: debtor.displayName,
      toUserId: creditor.userId,
      toUserName: creditor.displayName,
      amount: Math.round(amount * 100) / 100,
    });

    creditor.netBalance -= amount;
    debtor.netBalance += amount;

    if (creditor.netBalance < 0.01) i++;
    if (debtor.netBalance > -0.01) j++;
  }

  return ledger;
}

/** FR-105: Record a settlement between two users */
export async function recordSettlement(
  userId: string,
  body: { fromUserId: string; toUserId: string; amount: number }
): Promise<SettlementResponse> {
  const householdId = await getUserHousehold(userId);

  // Verify both users are in household
  const [fromMember, toMember] = await Promise.all([
    HouseholdMember.findOne({ where: { userId: body.fromUserId, householdId } }),
    HouseholdMember.findOne({ where: { userId: body.toUserId, householdId } }),
  ]);

  if (!fromMember || !toMember) {
    throw new ForbiddenError('Both users must be household members');
  }

  // Only the fromUser or admin can record settlement
  if (userId !== body.fromUserId) {
    throw new ForbiddenError('Only the payer can record this settlement');
  }

  const settlement = await Settlement.create({
    householdId,
    fromUserId: body.fromUserId,
    toUserId: body.toUserId,
    amount: body.amount,
  });

  const fullSettlement = await Settlement.findByPk(settlement.id, {
    include: [
      { model: User, as: 'fromUser' },
      { model: User, as: 'toUser' },
    ],
  });

  if (!fullSettlement) {
    throw new Error('Failed to load created settlement');
  }

  return toSettlementResponse(fullSettlement);
}

/** FR-106: Get settlement history */
export async function getSettlements(
  userId: string,
  options: { cursor?: string; limit?: number }
): Promise<PaginatedSettlements> {
  const householdId = await getUserHousehold(userId);
  const limit = Math.min(options.limit || 20, 50);

  const where: any = { householdId };
  if (options.cursor) {
    where.createdAt = { [Op.lt]: new Date(options.cursor) };
  }

  const settlements = await Settlement.findAll({
    where,
    include: [
      { model: User, as: 'fromUser' },
      { model: User, as: 'toUser' },
    ],
    order: [['createdAt', 'DESC']],
    limit: limit + 1,
  });

  const hasMore = settlements.length > limit;
  const page = hasMore ? settlements.slice(0, limit) : settlements;
  const nextCursor = hasMore
    ? page[page.length - 1].createdAt.toISOString()
    : null;

  return {
    settlements: page.map(toSettlementResponse),
    nextCursor,
    hasMore,
  };
}
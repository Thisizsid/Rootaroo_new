"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpense = createExpense;
exports.listExpenses = listExpenses;
exports.getExpenseById = getExpenseById;
exports.updateExpense = updateExpense;
exports.deleteExpense = deleteExpense;
exports.getExpenseSummary = getExpenseSummary;
exports.getLedger = getLedger;
exports.recordSettlement = recordSettlement;
exports.getSettlements = getSettlements;
const sequelize_1 = require("sequelize");
const models_1 = require("../../database/models");
const errors_1 = require("../../shared/utils/errors");
async function getUserHousehold(userId) {
    const membership = await models_1.HouseholdMember.findOne({ where: { userId } });
    if (!membership) {
        throw new errors_1.ForbiddenError('You must belong to a household to manage expenses');
    }
    return membership.householdId;
}
function toExpenseResponse(expense) {
    const participants = expense.get('participants') || [];
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
                    id: p.get('user').id,
                    displayName: p.get('user').displayName,
                    avatarUrl: p.get('user').avatarUrl,
                    avatarEmoji: p.get('user').avatarEmoji,
                }
                : undefined,
        })),
    };
}
function toSettlementResponse(settlement) {
    const fromUser = settlement.get('fromUser');
    const toUser = settlement.get('toUser');
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
async function createExpense(_userId, householdId, body) {
    const { title, amount, paidBy, splitType, participants } = body;
    // Verify payer is in household
    const payerMember = await models_1.HouseholdMember.findOne({ where: { userId: paidBy, householdId } });
    if (!payerMember) {
        throw new errors_1.ForbiddenError('Payer must be a household member');
    }
    // Verify all participants are in household
    const participantIds = participants.map((p) => p.userId);
    const members = await models_1.HouseholdMember.findAll({
        where: { userId: { [sequelize_1.Op.in]: participantIds }, householdId },
    });
    if (members.length !== participantIds.length) {
        throw new errors_1.ForbiddenError('All participants must be household members');
    }
    // Calculate share amounts
    let shareAmounts;
    if (splitType === 'equal') {
        const share = amount / participants.length;
        shareAmounts = participants.map((p) => ({ userId: p.userId, shareAmount: share }));
    }
    else {
        shareAmounts = participants.map((p) => ({ userId: p.userId, shareAmount: p.shareAmount }));
    }
    const expense = await models_1.Expense.create({
        title,
        amount,
        paidBy,
        splitType,
        householdId,
    });
    // Create participants
    await models_1.ExpenseParticipant.bulkCreate(shareAmounts.map((p) => ({
        expenseId: expense.id,
        userId: p.userId,
        shareAmount: p.shareAmount,
    })));
    // Load full expense with participants
    const fullExpense = await models_1.Expense.findByPk(expense.id, {
        include: [
            { model: models_1.ExpenseParticipant, as: 'participants', include: [{ model: models_1.User, as: 'user' }] },
        ],
    });
    if (!fullExpense) {
        throw new Error('Failed to load created expense');
    }
    return toExpenseResponse(fullExpense);
}
/** FR-106: List expenses with cursor pagination */
async function listExpenses(householdId, _userId, options) {
    const limit = Math.min(options.limit || 20, 50);
    const where = { householdId };
    if (options.cursor) {
        where.createdAt = { [sequelize_1.Op.lt]: new Date(options.cursor) };
    }
    const expenses = await models_1.Expense.findAll({
        where,
        include: [
            { model: models_1.ExpenseParticipant, as: 'participants', include: [{ model: models_1.User, as: 'user' }] },
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
async function getExpenseById(expenseId, userId) {
    const expense = await models_1.Expense.findByPk(expenseId, {
        include: [
            { model: models_1.ExpenseParticipant, as: 'participants', include: [{ model: models_1.User, as: 'user' }] },
        ],
    });
    if (!expense) {
        throw new errors_1.NotFoundError('Expense');
    }
    const householdId = await getUserHousehold(userId);
    if (expense.householdId !== householdId) {
        throw new errors_1.ForbiddenError('Access denied');
    }
    return toExpenseResponse(expense);
}
/** FR-107, FR-108: Update expense (creator or admin only) */
async function updateExpense(expenseId, userId, userRole, body) {
    const expense = await models_1.Expense.findByPk(expenseId, {
        include: [{ model: models_1.ExpenseParticipant, as: 'participants' }],
    });
    if (!expense) {
        throw new errors_1.NotFoundError('Expense');
    }
    const householdId = await getUserHousehold(userId);
    if (expense.householdId !== householdId) {
        throw new errors_1.ForbiddenError('Access denied');
    }
    // Check permission: creator or admin
    if (expense.paidBy !== userId && userRole !== 'admin') {
        throw new errors_1.ForbiddenError('Only the creator or an admin can edit this expense');
    }
    // If updating amount or participants, recalculate shares
    if (body.amount !== undefined || body.splitType !== undefined || body.participants !== undefined) {
        const existingParticipants = expense.get('participants');
        const participants = body.participants || existingParticipants.map((p) => ({ userId: p.userId, shareAmount: p.shareAmount }));
        const splitType = body.splitType || expense.splitType;
        const amount = body.amount !== undefined ? body.amount : parseFloat(expense.amount.toString());
        let shareAmounts;
        if (splitType === 'equal') {
            const share = amount / participants.length;
            shareAmounts = participants.map((p) => ({ userId: p.userId, shareAmount: share }));
        }
        else {
            shareAmounts = participants.map((p) => ({
                userId: p.userId,
                shareAmount: p.shareAmount,
            }));
        }
        // Verify all participants are household members
        const participantIds = participants.map((p) => p.userId);
        const members = await models_1.HouseholdMember.findAll({
            where: { userId: { [sequelize_1.Op.in]: participantIds }, householdId },
        });
        if (members.length !== participantIds.length) {
            throw new errors_1.ForbiddenError('All participants must be household members');
        }
        // Delete old participants and create new ones
        await models_1.ExpenseParticipant.destroy({ where: { expenseId } });
        await models_1.ExpenseParticipant.bulkCreate(shareAmounts.map((p) => ({
            expenseId,
            userId: p.userId,
            shareAmount: p.shareAmount,
        })));
    }
    // Update expense fields
    if (body.title !== undefined)
        expense.title = body.title;
    if (body.amount !== undefined)
        expense.amount = body.amount;
    if (body.paidBy !== undefined)
        expense.paidBy = body.paidBy;
    if (body.splitType !== undefined)
        expense.splitType = body.splitType;
    await expense.save();
    // Reload with participants
    const updated = await models_1.Expense.findByPk(expenseId, {
        include: [
            { model: models_1.ExpenseParticipant, as: 'participants', include: [{ model: models_1.User, as: 'user' }] },
        ],
    });
    if (!updated) {
        throw new Error('Failed to load updated expense');
    }
    return toExpenseResponse(updated);
}
/** FR-107, FR-108: Delete expense (creator or admin only) */
async function deleteExpense(expenseId, userId, userRole) {
    const expense = await models_1.Expense.findByPk(expenseId);
    if (!expense) {
        throw new errors_1.NotFoundError('Expense');
    }
    const householdId = await getUserHousehold(userId);
    if (expense.householdId !== householdId) {
        throw new errors_1.ForbiddenError('Access denied');
    }
    if (expense.paidBy !== userId && userRole !== 'admin') {
        throw new errors_1.ForbiddenError('Only the creator or an admin can delete this expense');
    }
    // Cascade will delete participants
    await expense.destroy();
}
/** FR-103, FR-104, FR-109: Get expense summary with net balances and ledger */
async function getExpenseSummary(userId) {
    const householdId = await getUserHousehold(userId);
    // Get all household members
    const members = await models_1.HouseholdMember.findAll({
        where: { householdId },
        include: [{ model: models_1.User, as: 'user' }],
    });
    // Get all expenses for household
    const expenses = await models_1.Expense.findAll({
        where: { householdId },
        include: [{ model: models_1.ExpenseParticipant, as: 'participants' }],
    });
    // Calculate paid total and share total per user
    const userBalances = new Map();
    members.forEach((m) => userBalances.set(m.userId, { paid: 0, share: 0 }));
    expenses.forEach((expense) => {
        const amount = parseFloat(expense.amount.toString());
        const paidBy = expense.paidBy;
        const current = userBalances.get(paidBy) || { paid: 0, share: 0 };
        current.paid += amount;
        userBalances.set(paidBy, current);
        const participants = expense.get('participants') || [];
        participants.forEach((p) => {
            const share = parseFloat(p.shareAmount.toString());
            const current = userBalances.get(p.userId) || { paid: 0, share: 0 };
            current.share += share;
            userBalances.set(p.userId, current);
        });
    });
    // Build net balances
    const netBalances = members.map((m) => {
        const bal = userBalances.get(m.userId);
        const netBalance = bal.paid - bal.share;
        return {
            userId: m.userId,
            displayName: m.user.displayName,
            avatarUrl: m.user.avatarUrl,
            avatarEmoji: m.user.avatarEmoji,
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
async function getLedger(userId) {
    const summary = await getExpenseSummary(userId);
    return summary.ledger;
}
function computeSimplifiedLedger(balances) {
    const creditors = balances
        .filter((b) => b.netBalance > 0.01)
        .sort((a, b) => b.netBalance - a.netBalance);
    const debtors = balances
        .filter((b) => b.netBalance < -0.01)
        .sort((a, b) => a.netBalance - b.netBalance);
    const ledger = [];
    let i = 0, j = 0;
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
        if (creditor.netBalance < 0.01)
            i++;
        if (debtor.netBalance > -0.01)
            j++;
    }
    return ledger;
}
/** FR-105: Record a settlement between two users */
async function recordSettlement(userId, body) {
    const householdId = await getUserHousehold(userId);
    // Verify both users are in household
    const [fromMember, toMember] = await Promise.all([
        models_1.HouseholdMember.findOne({ where: { userId: body.fromUserId, householdId } }),
        models_1.HouseholdMember.findOne({ where: { userId: body.toUserId, householdId } }),
    ]);
    if (!fromMember || !toMember) {
        throw new errors_1.ForbiddenError('Both users must be household members');
    }
    // Only the fromUser or admin can record settlement
    if (userId !== body.fromUserId) {
        throw new errors_1.ForbiddenError('Only the payer can record this settlement');
    }
    const settlement = await models_1.Settlement.create({
        householdId,
        fromUserId: body.fromUserId,
        toUserId: body.toUserId,
        amount: body.amount,
    });
    const fullSettlement = await models_1.Settlement.findByPk(settlement.id, {
        include: [
            { model: models_1.User, as: 'fromUser' },
            { model: models_1.User, as: 'toUser' },
        ],
    });
    if (!fullSettlement) {
        throw new Error('Failed to load created settlement');
    }
    return toSettlementResponse(fullSettlement);
}
/** FR-106: Get settlement history */
async function getSettlements(userId, options) {
    const householdId = await getUserHousehold(userId);
    const limit = Math.min(options.limit || 20, 50);
    const where = { householdId };
    if (options.cursor) {
        where.createdAt = { [sequelize_1.Op.lt]: new Date(options.cursor) };
    }
    const settlements = await models_1.Settlement.findAll({
        where,
        include: [
            { model: models_1.User, as: 'fromUser' },
            { model: models_1.User, as: 'toUser' },
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
//# sourceMappingURL=service.js.map
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
exports.quickNotify = quickNotify;
const sequelize_1 = require("sequelize");
const models_1 = require("../../database/models");
const errors_1 = require("../../shared/utils/errors");
const taskService = __importStar(require("../task/service"));
const groceryService = __importStar(require("../grocery/service"));
const todoService = __importStar(require("../todo/service"));
const expenseService = __importStar(require("../expense/service"));
const notificationService = __importStar(require("../notification/service"));
const logger_1 = __importDefault(require("../../shared/utils/logger"));
async function getUserHousehold(userId) {
    const membership = await models_1.HouseholdMember.findOne({ where: { userId } });
    if (!membership)
        throw new errors_1.ForbiddenError('You must belong to a household');
    return membership.householdId;
}
async function getDashboard(userId) {
    await getUserHousehold(userId);
    const [taskSummary, grocerySummary, todoSummary, expenseSummary, unreadCount] = await Promise.all([
        taskService.getTaskSummary(userId),
        groceryService.getSummary(userId),
        todoService.getSummary(userId),
        expenseService.getExpenseSummary(userId).catch(() => null),
        notificationService.getUnreadCount(userId),
    ]);
    const myBalance = expenseSummary
        ? expenseSummary.netBalances.find((nb) => nb.userId === userId)?.netBalance || 0
        : 0;
    return {
        tasks: {
            pending: taskSummary.pending,
            overdue: taskSummary.overdue,
            completedToday: taskSummary.completedToday,
        },
        groceries: {
            pending: grocerySummary.pending,
        },
        todos: {
            pending: todoSummary.pending,
            completedToday: todoSummary.completedToday,
        },
        expenses: {
            totalExpenses: expenseSummary?.totalExpenses || 0,
            totalAmount: expenseSummary?.totalAmount || 0,
            myBalance,
        },
        notifications: {
            unreadCount,
        },
        activity: getActivity(),
    };
}
function getActivity() {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const dateStr = day.toISOString().split('T')[0];
        days.push({
            date: dateStr,
            tasksCompleted: 0,
            todosCompleted: 0,
            groceriesBought: 0,
        });
    }
    return days;
}
/**
 * Quick-notify selected household members with a status action.
 */
async function quickNotify(userId, action, memberIds) {
    const householdId = await getUserHousehold(userId);
    // Verify all target members belong to the same household
    const valid = await models_1.HouseholdMember.count({
        where: { householdId, userId: { [sequelize_1.Op.in]: memberIds } },
    });
    if (valid !== memberIds.length) {
        throw new errors_1.ForbiddenError('Invalid member selection');
    }
    // Look up sender's name
    const sender = await models_1.User.findByPk(userId);
    const senderName = sender?.displayName || 'Someone';
    // Send notification to each selected member
    const notify = memberIds.map((id) => notificationService.sendToUser(id, 'check_in', `${senderName} ${action.toLowerCase()}`, `Quick update from ${senderName}`, { type: 'check_in' }).catch((e) => logger_1.default.warn('[QuickNotify] Push failed:', e.message)));
    await Promise.all(notify);
}
//# sourceMappingURL=service.js.map
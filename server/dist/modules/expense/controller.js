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
exports.createExpenseCtrl = createExpenseCtrl;
exports.listExpensesCtrl = listExpensesCtrl;
exports.getExpenseByIdCtrl = getExpenseByIdCtrl;
exports.updateExpenseCtrl = updateExpenseCtrl;
exports.deleteExpenseCtrl = deleteExpenseCtrl;
exports.getExpenseSummaryCtrl = getExpenseSummaryCtrl;
exports.recordSettlementCtrl = recordSettlementCtrl;
exports.listSettlementsCtrl = listSettlementsCtrl;
exports.getLedgerCtrl = getLedgerCtrl;
const expenseService = __importStar(require("./service"));
function getUserId(req) {
    return req.user.userId;
}
function getUserRole(req) {
    return req.user.role;
}
function getHouseholdId(req) {
    return req.user.householdId;
}
async function createExpenseCtrl(req, res, next) {
    try {
        const householdId = getHouseholdId(req);
        const expense = await expenseService.createExpense(getUserId(req), householdId, req.body);
        res.status(201).json({ success: true, data: expense });
    }
    catch (error) {
        next(error);
    }
}
async function listExpensesCtrl(req, res, next) {
    try {
        const householdId = getHouseholdId(req);
        const result = await expenseService.listExpenses(householdId, getUserId(req), req.query);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
}
async function getExpenseByIdCtrl(req, res, next) {
    try {
        const expense = await expenseService.getExpenseById(req.params.id, getUserId(req));
        res.json({ success: true, data: expense });
    }
    catch (error) {
        next(error);
    }
}
async function updateExpenseCtrl(req, res, next) {
    try {
        const expense = await expenseService.updateExpense(req.params.id, getUserId(req), getUserRole(req), req.body);
        res.json({ success: true, data: expense });
    }
    catch (error) {
        next(error);
    }
}
async function deleteExpenseCtrl(req, res, next) {
    try {
        await expenseService.deleteExpense(req.params.id, getUserId(req), getUserRole(req));
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
async function getExpenseSummaryCtrl(req, res, next) {
    try {
        const summary = await expenseService.getExpenseSummary(getUserId(req));
        res.json({ success: true, data: summary });
    }
    catch (error) {
        next(error);
    }
}
async function recordSettlementCtrl(req, res, next) {
    try {
        const settlement = await expenseService.recordSettlement(getUserId(req), req.body);
        res.status(201).json({ success: true, data: settlement });
    }
    catch (error) {
        next(error);
    }
}
async function listSettlementsCtrl(req, res, next) {
    try {
        const result = await expenseService.getSettlements(getUserId(req), req.query);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
}
async function getLedgerCtrl(req, res, next) {
    try {
        const ledger = await expenseService.getLedger(getUserId(req));
        res.json({ success: true, data: ledger });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=controller.js.map
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
const express_1 = require("express");
const auth_1 = require("../../shared/middleware/auth");
const validate_1 = require("../../shared/middleware/validate");
const ctrl = __importStar(require("./controller"));
const validation_1 = require("./validation");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Expense CRUD
router.post('/', (0, validate_1.validate)(validation_1.createExpenseSchema), ctrl.createExpenseCtrl); // FR-100
router.get('/', (0, validate_1.validate)(validation_1.expenseQuerySchema), ctrl.listExpensesCtrl); // FR-106
router.get('/summary', ctrl.getExpenseSummaryCtrl); // FR-103/104/109
router.get('/ledger', ctrl.getLedgerCtrl); // FR-104
router.get('/settlements', (0, validate_1.validate)(validation_1.expenseQuerySchema), ctrl.listSettlementsCtrl); // FR-106
router.post('/settle', (0, validate_1.validate)(validation_1.settlementSchema), ctrl.recordSettlementCtrl); // FR-105
router.get('/:id', ctrl.getExpenseByIdCtrl);
router.patch('/:id', (0, validate_1.validate)(validation_1.updateExpenseSchema), ctrl.updateExpenseCtrl); // FR-107/108
router.delete('/:id', ctrl.deleteExpenseCtrl); // FR-107/108
exports.default = router;
//# sourceMappingURL=routes.js.map
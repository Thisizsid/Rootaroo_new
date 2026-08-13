"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settlementSchema = exports.expenseQuerySchema = exports.updateExpenseSchema = exports.createExpenseSchema = void 0;
const zod_1 = require("zod");
exports.createExpenseSchema = {
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).max(200),
        amount: zod_1.z.number().positive().multipleOf(0.01),
        paidBy: zod_1.z.string().uuid(),
        date: zod_1.z.string().date().optional(),
        splitType: zod_1.z.enum(['equal', 'custom']),
        participants: zod_1.z
            .array(zod_1.z.object({
            userId: zod_1.z.string().uuid(),
            shareAmount: zod_1.z.number().multipleOf(0.01).optional(),
        }))
            .min(1),
    }),
};
exports.updateExpenseSchema = {
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).max(200).optional(),
        amount: zod_1.z.number().positive().multipleOf(0.01).optional(),
        paidBy: zod_1.z.string().uuid().optional(),
        date: zod_1.z.string().date().optional(),
        splitType: zod_1.z.enum(['equal', 'custom']).optional(),
        participants: zod_1.z
            .array(zod_1.z.object({
            userId: zod_1.z.string().uuid(),
            shareAmount: zod_1.z.number().multipleOf(0.01).optional(),
        }))
            .min(1)
            .optional(),
    }),
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
};
exports.expenseQuerySchema = {
    query: zod_1.z.object({
        cursor: zod_1.z.string().datetime().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).optional(),
    }),
};
exports.settlementSchema = {
    body: zod_1.z.object({
        fromUserId: zod_1.z.string().uuid(),
        toUserId: zod_1.z.string().uuid(),
        amount: zod_1.z.number().positive().multipleOf(0.01),
    }),
};
//# sourceMappingURL=validation.js.map
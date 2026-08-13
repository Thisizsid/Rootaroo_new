"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskQuerySchema = exports.updateTaskSchema = exports.createTaskSchema = void 0;
const zod_1 = require("zod");
exports.createTaskSchema = {
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long'),
        description: zod_1.z.string().max(5000).optional(),
        dueDate: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD')
            .optional(),
        assigneeIds: zod_1.z.array(zod_1.z.string().uuid()).max(20, 'Max 20 assignees').optional(),
        recurrence: zod_1.z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
        recurrenceEndDate: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
    }),
};
exports.updateTaskSchema = {
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).max(200).optional(),
        description: zod_1.z.string().max(5000).optional(),
        dueDate: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .nullable()
            .optional(),
        recurrence: zod_1.z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
        recurrenceEndDate: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .nullable()
            .optional(),
    }),
};
exports.taskQuerySchema = {
    query: zod_1.z.object({
        group: zod_1.z.enum(['status']).optional(),
        status: zod_1.z.enum(['pending', 'completed', 'reopened']).optional(),
    }),
};
//# sourceMappingURL=validation.js.map
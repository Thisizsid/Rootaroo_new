"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTodoSchema = exports.createTodoSchema = void 0;
const zod_1 = require("zod");
exports.createTodoSchema = {
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long'),
        dueDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        assignedTo: zod_1.z.string().uuid().optional(),
    }),
};
exports.updateTodoSchema = {
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).max(200).optional(),
        dueDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
        assignedTo: zod_1.z.string().uuid().nullable().optional(),
    }),
};
//# sourceMappingURL=validation.js.map
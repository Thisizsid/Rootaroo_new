"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGrocerySchema = exports.createGrocerySchema = void 0;
const zod_1 = require("zod");
exports.createGrocerySchema = {
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required').max(200, 'Name too long'),
        quantity: zod_1.z.string().max(100).nullable().optional(),
        note: zod_1.z.string().max(500).nullable().optional(),
        assignedTo: zod_1.z.string().uuid().nullable().optional(),
    }),
};
exports.updateGrocerySchema = {
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(200).optional(),
        quantity: zod_1.z.string().max(100).nullable().optional(),
        note: zod_1.z.string().max(500).nullable().optional(),
        assignedTo: zod_1.z.string().uuid().nullable().optional(),
    }),
};
//# sourceMappingURL=validation.js.map
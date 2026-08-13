"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeMemberRoleSchema = exports.transferAdminSchema = exports.joinHouseholdSchema = exports.createHouseholdSchema = void 0;
const zod_1 = require("zod");
exports.createHouseholdSchema = {
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(1, 'Household name is required')
            .max(100, 'Household name too long'),
    }),
};
exports.joinHouseholdSchema = {
    body: zod_1.z.object({
        code: zod_1.z
            .string()
            .min(1, 'Invitation code is required')
            .max(20, 'Invalid code format'),
    }),
};
exports.transferAdminSchema = {
    body: zod_1.z.object({
        newAdminId: zod_1.z.string().uuid('Invalid user ID format'),
    }),
};
exports.changeMemberRoleSchema = {
    body: zod_1.z.object({
        role: zod_1.z.enum(['admin', 'member', 'child'], {
            errorMap: () => ({ message: 'Role must be admin, member, or child' }),
        }),
    }),
};
//# sourceMappingURL=validation.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePreferencesSchema = exports.deviceTokenSchema = void 0;
const zod_1 = require("zod");
exports.deviceTokenSchema = {
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, 'Token is required'),
        platform: zod_1.z.enum(['ios', 'android', 'web']),
    }),
};
exports.updatePreferencesSchema = {
    body: zod_1.z.object({
        newPost: zod_1.z.boolean().optional(),
        taskAssigned: zod_1.z.boolean().optional(),
        taskCompleted: zod_1.z.boolean().optional(),
        checkIn: zod_1.z.boolean().optional(),
        newExpense: zod_1.z.boolean().optional(),
        chatMessage: zod_1.z.boolean().optional(),
        calendarEvent: zod_1.z.boolean().optional(),
        memberJoined: zod_1.z.boolean().optional(),
    }),
};
//# sourceMappingURL=validation.js.map
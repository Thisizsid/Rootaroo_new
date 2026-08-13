"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPhoneSchema = exports.verifyPhoneOtpSchema = exports.sendPhoneOtpSchema = exports.scheduleDeletionSchema = exports.logoutSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.verifyEmailSchema = exports.googleAuthSchema = exports.updateProfileSchema = exports.refreshSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = {
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(128, 'Password too long'),
        // Optional — name is collected in signup step 1; empty/null treated as omitted
        displayName: zod_1.z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : v), zod_1.z.string().min(1).max(100).optional()),
    }),
};
exports.loginSchema = {
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
};
exports.refreshSchema = {
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token required'),
    }),
};
exports.updateProfileSchema = {
    body: zod_1.z.object({
        displayName: zod_1.z.string().min(1).max(100).optional(),
        avatarUrl: zod_1.z.string().max(500).nullable().optional(),
        avatarEmoji: zod_1.z.string().max(10).nullable().optional(),
        avatarPresetId: zod_1.z.string().max(50).nullable().optional(),
        dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').nullable().optional(),
        homeAddress: zod_1.z.string().max(500).nullable().optional(),
        phone: zod_1.z.string().min(7).max(32).nullable().optional(),
        addToCalendar: zod_1.z.boolean().optional(),
        notifyHousehold: zod_1.z.boolean().optional(),
    }),
};
exports.googleAuthSchema = {
    body: zod_1.z.object({
        code: zod_1.z.string().min(1, 'Authorization code is required'),
        redirectUri: zod_1.z.string().url('Invalid redirect URI'),
    }),
};
exports.verifyEmailSchema = {
    body: zod_1.z.object({
        code: zod_1.z.string().length(6, 'Verification code must be 6 characters'),
    }),
};
exports.forgotPasswordSchema = {
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
    }),
};
exports.resetPasswordSchema = {
    body: zod_1.z.object({
        code: zod_1.z.string().length(6, 'Reset code must be 6 characters'),
        password: zod_1.z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
    }),
};
exports.logoutSchema = {
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    }),
};
exports.scheduleDeletionSchema = {
    body: zod_1.z.object({
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
};
exports.sendPhoneOtpSchema = {
    body: zod_1.z.object({
        phone: zod_1.z.string().min(7, 'Invalid phone number').max(32),
    }),
};
exports.verifyPhoneOtpSchema = {
    body: zod_1.z.object({
        phone: zod_1.z.string().min(7).max(32),
        code: zod_1.z.string().length(6, 'OTP must be 6 digits'),
    }),
};
exports.registerPhoneSchema = {
    body: zod_1.z.object({
        phone: zod_1.z.string().min(7).max(32),
        displayName: zod_1.z.string().min(1).max(100),
        dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        homeAddress: zod_1.z.string().max(500).optional(),
        addToCalendar: zod_1.z.boolean().optional(),
        notifyHousehold: zod_1.z.boolean().optional(),
        avatarUrl: zod_1.z.string().max(500).nullable().optional(),
        avatarPresetId: zod_1.z.string().max(50).nullable().optional(),
        avatarEmoji: zod_1.z.string().max(10).nullable().optional(),
    }),
};
//# sourceMappingURL=validation.js.map
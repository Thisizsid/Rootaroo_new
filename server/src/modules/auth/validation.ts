import { z } from 'zod';
import type { ValidationSchemas } from '../../shared/middleware/validate';

export const registerSchema: ValidationSchemas = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long'),
    // Optional — name is collected in signup step 1; empty/null treated as omitted
    displayName: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : v),
      z.string().min(1).max(100).optional(),
    ),
    phone: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : v),
      z.string().min(7).max(32).optional(),
    ),
  }),
};

export const loginSchema: ValidationSchemas = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const refreshSchema: ValidationSchemas = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token required'),
  }),
};

export const updateProfileSchema: ValidationSchemas = {
  body: z.object({
    displayName: z.string().min(1).max(100).optional(),
    avatarUrl: z.string().max(500).nullable().optional(),
    avatarEmoji: z.string().max(10).nullable().optional(),
    avatarPresetId: z.string().max(50).nullable().optional(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').nullable().optional(),
    homeAddress: z.string().max(500).nullable().optional(),
    phone: z.string().min(7).max(32).nullable().optional(),
    addToCalendar: z.boolean().optional(),
    notifyHousehold: z.boolean().optional(),
  }),
};

export const googleAuthSchema: ValidationSchemas = {
  body: z.object({
    idToken: z.string().min(1, 'ID token is required'),
  }),
};

export const appleAuthSchema: ValidationSchemas = {
  body: z.object({
    idToken: z.string().min(1, 'ID token is required'),
    displayName: z.string().min(1).max(100).optional(),
  }),
};

export const verifyEmailSchema: ValidationSchemas = {
  body: z.object({
    code: z.string().length(6, 'Verification code must be 6 characters'),
  }),
};

export const forgotPasswordSchema: ValidationSchemas = {
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
};

export const resetPasswordSchema: ValidationSchemas = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    code: z.string().length(6, 'Reset code must be 6 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
  }),
};

export const checkResetCodeSchema: ValidationSchemas = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    code: z.string().length(6, 'Code must be 6 characters'),
  }),
};

export const logoutSchema: ValidationSchemas = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

export const scheduleDeletionSchema: ValidationSchemas = {
  body: z.object({
    password: z.string().min(1, 'Password is required'),
  }),
};

export const sendPhoneOtpSchema: ValidationSchemas = {
  body: z.object({
    phone: z.string().min(7, 'Invalid phone number').max(32),
  }),
};

export const verifyPhoneOtpSchema: ValidationSchemas = {
  body: z.object({
    phone: z.string().min(7).max(32),
    code: z.string().length(6, 'OTP must be 6 digits'),
  }),
};

export const registerPhoneSchema: ValidationSchemas = {
  body: z.object({
    phone: z.string().min(7).max(32),
    displayName: z.string().min(1).max(100),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    homeAddress: z.string().max(500).optional(),
    addToCalendar: z.boolean().optional(),
    notifyHousehold: z.boolean().optional(),
    avatarUrl: z.string().max(500).nullable().optional(),
    avatarPresetId: z.string().max(50).nullable().optional(),
    avatarEmoji: z.string().max(10).nullable().optional(),
  }),
};

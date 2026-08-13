import { z } from 'zod';
import type { ValidationSchemas } from '../../shared/middleware/validate';

export const createHouseholdSchema: ValidationSchemas = {
  body: z.object({
    name: z
      .string()
      .min(1, 'Household name is required')
      .max(100, 'Household name too long'),
  }),
};

export const joinHouseholdSchema: ValidationSchemas = {
  body: z.object({
    code: z
      .string()
      .min(1, 'Invitation code is required')
      .max(20, 'Invalid code format'),
  }),
};

export const transferAdminSchema: ValidationSchemas = {
  body: z.object({
    newAdminId: z.string().uuid('Invalid user ID format'),
  }),
};

export const changeMemberRoleSchema: ValidationSchemas = {
  body: z.object({
    role: z.enum(['admin', 'member', 'child'], {
      errorMap: () => ({ message: 'Role must be admin, member, or child' }),
    }),
  }),
};

export const scheduleHouseholdDeletionSchema: ValidationSchemas = {
  body: z.object({
    password: z.string().min(1, 'Password is required'),
  }),
};

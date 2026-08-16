import { z } from 'zod';
import type { ValidationSchemas } from '../../shared/middleware/validate';

const isoDateTime = z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
  message: 'Must be a valid ISO date-time',
});

export const createEventSchema: ValidationSchemas = {
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    startsAt: isoDateTime,
    endsAt: isoDateTime,
    inviteeIds: z.array(z.string().uuid()).max(30, 'Max 30 invitees').optional(),
    repeats: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
    syncToGoogle: z.boolean().optional(),
    description: z.string().max(2000, 'Description too long').nullable().optional(),
  }),
};

export const updateEventSchema: ValidationSchemas = {
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
    startsAt: isoDateTime.optional(),
    endsAt: isoDateTime.optional(),
    inviteeIds: z.array(z.string().uuid()).max(30, 'Max 30 invitees').optional(),
    repeats: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
    syncToGoogle: z.boolean().optional(),
    description: z.string().max(2000, 'Description too long').nullable().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid event id'),
  }),
};

export const listEventsQuerySchema: ValidationSchemas = {
  query: z.object({
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM')
      .optional(),
  }),
};

export const connectGoogleCalendarSchema: ValidationSchemas = {
  body: z.object({
    code: z.string().min(1, 'Authorization code is required'),
    redirectUri: z.string().min(1, 'Redirect URI is required'),
  }),
};

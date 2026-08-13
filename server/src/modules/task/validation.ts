import { z } from 'zod';
import type { ValidationSchemas } from '../../shared/middleware/validate';

export const createTaskSchema: ValidationSchemas = {
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(5000).optional(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD')
      .optional(),
    assigneeIds: z.array(z.string().uuid()).max(20, 'Max 20 assignees').optional(),
    recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
    recurrenceEndDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    points: z.number().int().min(0).max(10000).optional(),
  }),
};

export const updateTaskSchema: ValidationSchemas = {
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
    recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
    recurrenceEndDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
    points: z.number().int().min(0).max(10000).optional(),
  }),
};

export const taskQuerySchema: ValidationSchemas = {
  query: z.object({
    group: z.enum(['status']).optional(),
    status: z.enum(['pending', 'completed', 'reopened']).optional(),
  }),
};

import { z } from 'zod';
import type { ValidationSchemas } from '../../shared/middleware/validate';

export const createGrocerySchema: ValidationSchemas = {
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
    quantity: z.string().max(100).nullable().optional(),
    note: z.string().max(500).nullable().optional(),
    assignedTo: z.string().uuid().nullable().optional(),
  }),
};

export const updateGrocerySchema: ValidationSchemas = {
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    quantity: z.string().max(100).nullable().optional(),
    note: z.string().max(500).nullable().optional(),
    assignedTo: z.string().uuid().nullable().optional(),
  }),
};

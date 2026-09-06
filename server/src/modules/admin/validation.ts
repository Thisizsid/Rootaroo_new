import { z } from 'zod';
import type { ValidationSchemas } from '../../shared/middleware/validate';

export const reviewActionRequestSchema: ValidationSchemas = {
  body: z.object({
    reviewerNote: z.string().max(500, 'Note too long').optional(),
  }),
};

import { z } from 'zod';
import type { ValidationSchemas } from '../../shared/middleware/validate';

export const createCheckInSchema: ValidationSchemas = {
  body: z
    .object({
      latitude: z.number().min(-90).max(90).nullable().optional(),
      longitude: z.number().min(-180).max(180).nullable().optional(),
      address: z.string().max(500).nullable().optional(),
      note: z.string().max(1000).nullable().optional(),
    })
    .refine(
      (data) =>
        (data.latitude == null && data.longitude == null) ||
        (data.latitude != null && data.longitude != null),
      { message: 'Both latitude and longitude must be provided together', path: ['latitude'] },
    ),
};

export const checkInQuerySchema: ValidationSchemas = {
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    userId: z.string().uuid().optional(),
    days: z.coerce.number().int().min(1).max(30).default(7),
  }),
};

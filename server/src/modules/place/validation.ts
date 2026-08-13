import { z } from 'zod';
import type { ValidationSchemas } from '../../shared/middleware/validate';

const iconEnum = z.enum(['home', 'office', 'school', 'custom']);

export const createSavedPlaceSchema: ValidationSchemas = {
  body: z.object({
    name: z.string().min(1).max(100),
    icon: iconEnum,
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().max(500).nullable().optional(),
  }),
};

export const updateSavedPlaceSchema: ValidationSchemas = {
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    icon: iconEnum.optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    address: z.string().max(500).nullable().optional(),
  }),
};

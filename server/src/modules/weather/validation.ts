import { z } from 'zod';
import type { ValidationSchemas } from '../../shared/middleware/validate';

export const getWeatherSchema: ValidationSchemas = {
  query: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
  }),
};

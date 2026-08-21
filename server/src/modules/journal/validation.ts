import { z } from 'zod';
import type { ValidationSchemas } from '../../shared/middleware/validate';

export const createEntrySchema: ValidationSchemas = {
  body: z.object({
    content: z.string().max(10000).optional(),
    media: z
      .array(
        z.object({
          mediaUrl: z.string().min(1, 'mediaUrl is required'),
          mediaType: z.enum(['photo', 'video']),
          thumbnailUrl: z.string().min(1).optional(),
          fileSizeBytes: z.number().int().positive().optional(),
        }),
      )
      .max(10, 'Maximum 10 media items per entry')
      .optional(),
  }).refine(
    (data) => data.content || (data.media && data.media.length > 0),
    { message: 'Entry must have text or media', path: ['content'] },
  ),
};

export const updateEntrySchema: ValidationSchemas = {
  body: z.object({
    content: z.string().min(1).max(10000),
  }),
  params: z.object({ id: z.string().uuid() }),
};

export const entryIdParamSchema: ValidationSchemas = {
  params: z.object({ id: z.string().uuid() }),
};

export const entryQuerySchema: ValidationSchemas = {
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
};

import { z } from 'zod';
import type { ValidationSchemas } from '../../shared/middleware/validate';

export const createPostSchema: ValidationSchemas = {
  body: z.object({
    content: z.string().max(10000).optional(),
    mediaType: z.enum(['text', 'photo', 'video']).default('text'),
    media: z
      .array(
        z.object({
          mediaUrl: z.string().min(1, 'mediaUrl is required'),
          mediaType: z.enum(['photo', 'video']),
          thumbnailUrl: z.string().min(1).optional(),
          fileSizeBytes: z.number().int().positive().optional(),
        }),
      )
      .max(10, 'Maximum 10 media items per post')
      .optional(),
    activity: z.string().max(100).optional(),
    location: z.string().max(200).optional(),
    taggedUserIds: z.array(z.string().uuid()).max(20).optional(),
    privacy: z.enum(['household', 'members']).optional(),
  }).refine(
    (data) => data.content || (data.media && data.media.length > 0),
    { message: 'Post must have text or media', path: ['content'] },
  ),
};

export const updatePostSchema: ValidationSchemas = {
  body: z.object({
    content: z.string().min(1).max(10000).optional(),
  }),
};

export const feedQuerySchema: ValidationSchemas = {
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    since: z.string().datetime({ offset: true }).optional(),
    authorId: z.string().uuid().optional(),
  }),
};

export const createCommentSchema: ValidationSchemas = {
  body: z.object({
    content: z.string().min(1).max(5000, 'Comment too long'),
    parentId: z.string().uuid().optional(),
  }),
};

export const commentQuerySchema: ValidationSchemas = {
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
};

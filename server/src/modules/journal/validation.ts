import { z } from 'zod';
import type { ValidationSchemas } from '../../shared/middleware/validate';

/** Ordered worst → best; the index is the score History plots. */
export const MOOD_VALUES = ['rough', 'low', 'neutral', 'calm', 'happy'] as const;

const moodSchema = z.enum(MOOD_VALUES);

// Photos only. The `journal_media.media_type` column still carries the shared
// photo/video enum, but the journal itself accepts no video — an entry is a
// piece of writing with stills attached, not a place to store footage.
const newMediaSchema = z.object({
  mediaUrl: z.string().min(1, 'mediaUrl is required'),
  mediaType: z.literal('photo', {
    errorMap: () => ({ message: 'Journal entries accept photos only' }),
  }),
  thumbnailUrl: z.string().min(1).optional(),
  fileSizeBytes: z.number().int().positive().optional(),
});

const mediaSchema = z.array(newMediaSchema).max(10, 'Maximum 10 media items per entry');

/**
 * On update the client sends the complete attachment list, but it only has
 * *signed* URLs for the media already on the entry — those expire and are not
 * the stored S3 key, so echoing one back would corrupt the row. An existing
 * attachment is therefore referenced by `{ id }` and a newly uploaded one by
 * its full descriptor; anything not listed is dropped.
 */
const updateMediaSchema = z
  .array(z.union([z.object({ id: z.string().uuid() }), newMediaSchema]))
  .max(10, 'Maximum 10 media items per entry');

/** Tags are display labels, not identifiers: trimmed, deduped, capped. */
const tagsSchema = z
  .array(z.string().trim().min(1).max(24))
  .max(8, 'Maximum 8 tags per entry')
  .transform((tags) => Array.from(new Set(tags.map((t) => t.toLowerCase()))));

export const createEntrySchema: ValidationSchemas = {
  body: z.object({
    content: z.string().max(10000).optional(),
    mood: moodSchema.optional(),
    tags: tagsSchema.optional(),
    media: mediaSchema.optional(),
  }).refine(
    (data) => data.content || (data.media && data.media.length > 0),
    { message: 'Entry must have text or media', path: ['content'] },
  ),
};

export const updateEntrySchema: ValidationSchemas = {
  // Every field optional so the client can PATCH just the mood or just the
  // tags; `.refine` keeps an empty body from silently no-op'ing.
  body: z
    .object({
      content: z.string().min(1).max(10000).optional(),
      mood: moodSchema.nullable().optional(),
      tags: tagsSchema.optional(),
      media: updateMediaSchema.optional(),
    })
    .refine(
      (data) =>
        data.content !== undefined ||
        data.mood !== undefined ||
        data.tags !== undefined ||
        data.media !== undefined,
      { message: 'Nothing to update' },
    ),
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

export const historyQuerySchema: ValidationSchemas = {
  query: z.object({
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'month must be formatted YYYY-MM')
      .optional(),
  }),
};

export const onThisDayQuerySchema: ValidationSchemas = {
  query: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be formatted YYYY-MM-DD')
      .optional(),
  }),
};

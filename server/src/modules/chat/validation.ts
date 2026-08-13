import { z } from 'zod';

export const createMessageSchema = {
  body: z.object({
    conversationId: z.string().uuid(),
    content: z.string().min(1).max(5000).optional(),
    mediaIds: z.array(z.string().uuid()).max(10).optional(),
    replyToId: z.string().uuid().optional(),
  }).refine(
    (data) => data.content || (data.mediaIds && data.mediaIds.length > 0),
    { message: 'Message must have content or media' }
  ),
};

export const updateMessageSchema = {
  body: z.object({
    content: z.string().min(1).max(5000),
  }),
  params: z.object({ id: z.string().uuid() }),
};

export const reactionSchema = {
  body: z.object({
    emoji: z.enum(['👍', '❤️', '😂', '😲', '😢']),
  }),
  params: z.object({ id: z.string().uuid() }),
};

export const deleteReactionSchema = {
  params: z.object({
    id: z.string().uuid(),
    emoji: z.enum(['👍', '❤️', '😂', '😲', '😢']),
  }),
};

export const messageQuerySchema = {
  query: z.object({
    conversationId: z.string().uuid().optional(),
    cursor: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
};

export const createConversationSchema = {
  body: z.object({
    type: z.enum(['dm', 'group']),
    participantIds: z.array(z.string().uuid()).min(1).max(50),
    name: z.string().min(1).max(100).optional(),
  }),
};

export const conversationIdParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};

export const addParticipantSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ userId: z.string().uuid() }),
};

export const removeParticipantSchema = {
  params: z.object({ id: z.string().uuid(), userId: z.string().uuid() }),
};

export const messageIdParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};

export const typingSchema = {
  query: z.object({
    action: z.enum(['start', 'stop']),
  }),
};

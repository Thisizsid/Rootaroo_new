"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typingSchema = exports.messageIdParamSchema = exports.addParticipantSchema = exports.conversationIdParamSchema = exports.createConversationSchema = exports.messageQuerySchema = exports.deleteReactionSchema = exports.reactionSchema = exports.updateMessageSchema = exports.createMessageSchema = void 0;
const zod_1 = require("zod");
exports.createMessageSchema = {
    body: zod_1.z.object({
        conversationId: zod_1.z.string().uuid(),
        content: zod_1.z.string().min(1).max(5000).optional(),
        mediaIds: zod_1.z.array(zod_1.z.string().uuid()).max(10).optional(),
        replyToId: zod_1.z.string().uuid().optional(),
    }).refine((data) => data.content || (data.mediaIds && data.mediaIds.length > 0), { message: 'Message must have content or media' }),
};
exports.updateMessageSchema = {
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(5000),
    }),
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
};
exports.reactionSchema = {
    body: zod_1.z.object({
        emoji: zod_1.z.enum(['👍', '❤️', '😂', '😲', '😢']),
    }),
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
};
exports.deleteReactionSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        emoji: zod_1.z.enum(['👍', '❤️', '😂', '😲', '😢']),
    }),
};
exports.messageQuerySchema = {
    query: zod_1.z.object({
        conversationId: zod_1.z.string().uuid().optional(),
        cursor: zod_1.z.string().datetime().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).optional(),
    }),
};
exports.createConversationSchema = {
    body: zod_1.z.object({
        type: zod_1.z.enum(['dm', 'group']),
        participantIds: zod_1.z.array(zod_1.z.string().uuid()).min(1).max(50),
        name: zod_1.z.string().min(1).max(100).optional(),
    }),
};
exports.conversationIdParamSchema = {
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
};
exports.addParticipantSchema = {
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
    body: zod_1.z.object({ userId: zod_1.z.string().uuid() }),
};
exports.messageIdParamSchema = {
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
};
exports.typingSchema = {
    query: zod_1.z.object({
        action: zod_1.z.enum(['start', 'stop']),
    }),
};
//# sourceMappingURL=validation.js.map
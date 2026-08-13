"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentQuerySchema = exports.createCommentSchema = exports.feedQuerySchema = exports.updatePostSchema = exports.createPostSchema = void 0;
const zod_1 = require("zod");
exports.createPostSchema = {
    body: zod_1.z.object({
        content: zod_1.z.string().max(10000).optional(),
        mediaType: zod_1.z.enum(['text', 'photo', 'video']).default('text'),
        media: zod_1.z
            .array(zod_1.z.object({
            mediaUrl: zod_1.z.string().min(1, 'mediaUrl is required'),
            mediaType: zod_1.z.enum(['photo', 'video']),
            thumbnailUrl: zod_1.z.string().min(1).optional(),
            fileSizeBytes: zod_1.z.number().int().positive().optional(),
        }))
            .max(10, 'Maximum 10 media items per post')
            .optional(),
        activity: zod_1.z.string().max(100).optional(),
        location: zod_1.z.string().max(200).optional(),
        taggedUserIds: zod_1.z.array(zod_1.z.string().uuid()).max(20).optional(),
        privacy: zod_1.z.enum(['household', 'members']).optional(),
    }).refine((data) => data.content || (data.media && data.media.length > 0), { message: 'Post must have text or media', path: ['content'] }),
};
exports.updatePostSchema = {
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(10000).optional(),
    }),
};
exports.feedQuerySchema = {
    query: zod_1.z.object({
        cursor: zod_1.z.string().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
        since: zod_1.z.string().datetime({ offset: true }).optional(),
    }),
};
exports.createCommentSchema = {
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(5000, 'Comment too long'),
    }),
};
exports.commentQuerySchema = {
    query: zod_1.z.object({
        cursor: zod_1.z.string().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
    }),
};
//# sourceMappingURL=validation.js.map
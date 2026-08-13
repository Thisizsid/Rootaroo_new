import { z } from 'zod';
export declare const createMessageSchema: {
    body: z.ZodEffects<z.ZodObject<{
        conversationId: z.ZodString;
        content: z.ZodOptional<z.ZodString>;
        mediaIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        replyToId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        conversationId: string;
        content?: string | undefined;
        replyToId?: string | undefined;
        mediaIds?: string[] | undefined;
    }, {
        conversationId: string;
        content?: string | undefined;
        replyToId?: string | undefined;
        mediaIds?: string[] | undefined;
    }>, {
        conversationId: string;
        content?: string | undefined;
        replyToId?: string | undefined;
        mediaIds?: string[] | undefined;
    }, {
        conversationId: string;
        content?: string | undefined;
        replyToId?: string | undefined;
        mediaIds?: string[] | undefined;
    }>;
};
export declare const updateMessageSchema: {
    body: z.ZodObject<{
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
    }, {
        content: string;
    }>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
};
export declare const reactionSchema: {
    body: z.ZodObject<{
        emoji: z.ZodEnum<["👍", "❤️", "😂", "😲", "😢"]>;
    }, "strip", z.ZodTypeAny, {
        emoji: "👍" | "❤️" | "😂" | "😲" | "😢";
    }, {
        emoji: "👍" | "❤️" | "😂" | "😲" | "😢";
    }>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
};
export declare const deleteReactionSchema: {
    params: z.ZodObject<{
        id: z.ZodString;
        emoji: z.ZodEnum<["👍", "❤️", "😂", "😲", "😢"]>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        emoji: "👍" | "❤️" | "😂" | "😲" | "😢";
    }, {
        id: string;
        emoji: "👍" | "❤️" | "😂" | "😲" | "😢";
    }>;
};
export declare const messageQuerySchema: {
    query: z.ZodObject<{
        conversationId: z.ZodOptional<z.ZodString>;
        cursor: z.ZodOptional<z.ZodString>;
        limit: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        conversationId?: string | undefined;
        limit?: number | undefined;
        cursor?: string | undefined;
    }, {
        conversationId?: string | undefined;
        limit?: number | undefined;
        cursor?: string | undefined;
    }>;
};
export declare const createConversationSchema: {
    body: z.ZodObject<{
        type: z.ZodEnum<["dm", "group"]>;
        participantIds: z.ZodArray<z.ZodString, "many">;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "dm" | "group";
        participantIds: string[];
        name?: string | undefined;
    }, {
        type: "dm" | "group";
        participantIds: string[];
        name?: string | undefined;
    }>;
};
export declare const conversationIdParamSchema: {
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
};
export declare const addParticipantSchema: {
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
    }, {
        userId: string;
    }>;
};
export declare const messageIdParamSchema: {
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
};
export declare const typingSchema: {
    query: z.ZodObject<{
        action: z.ZodEnum<["start", "stop"]>;
    }, "strip", z.ZodTypeAny, {
        action: "start" | "stop";
    }, {
        action: "start" | "stop";
    }>;
};
//# sourceMappingURL=validation.d.ts.map
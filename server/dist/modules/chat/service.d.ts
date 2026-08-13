import type { ChatReactionType, ConversationResponse, CreateConversationBody, CreateMessageBody, MessageQuery, MessageResponse, PaginatedMessagesResponse, ReactionCountResponse } from './types';
export declare function createConversation(userId: string, body: CreateConversationBody): Promise<ConversationResponse>;
export declare function getUserConversations(userId: string): Promise<ConversationResponse[]>;
export declare function sendMessage(userId: string, body: CreateMessageBody): Promise<MessageResponse>;
export declare function listMessages(userId: string, query: MessageQuery): Promise<PaginatedMessagesResponse>;
export declare function getMessageById(messageId: string, userId: string): Promise<MessageResponse>;
export declare function updateMessage(messageId: string, userId: string, userRole: string, body: {
    content?: string;
}): Promise<MessageResponse>;
export declare function deleteMessage(messageId: string, userId: string, userRole: string): Promise<void>;
export declare function addReaction(messageId: string, userId: string, emoji: ChatReactionType): Promise<ReactionCountResponse[]>;
export declare function removeReaction(messageId: string, userId: string, emoji: ChatReactionType): Promise<ReactionCountResponse[]>;
export declare function getReactions(messageId: string): Promise<ReactionCountResponse[]>;
export declare function typingStart(userId: string): Promise<void>;
export declare function typingStop(userId: string): Promise<void>;
export declare function addParticipant(conversationId: string, userId: string, requesterId: string): Promise<void>;
export declare function removeParticipant(conversationId: string, userId: string, requesterId: string): Promise<void>;
export declare function deleteConversation(conversationId: string, userId: string): Promise<void>;
//# sourceMappingURL=service.d.ts.map
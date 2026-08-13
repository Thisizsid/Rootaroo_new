export type ChatReactionType = '👍' | '❤️' | '😂' | '😲' | '😢';
export interface ConversationResponse {
    id: string;
    householdId: string;
    type: 'dm' | 'group';
    name: string | null;
    participants: Array<{
        id: string;
        displayName: string;
        avatarUrl: string | null;
    }>;
    lastMessage: {
        content: string | null;
        createdAt: string;
        senderName: string;
    } | null;
    createdAt: string;
}
export interface CreateConversationBody {
    type: 'dm' | 'group';
    participantIds: string[];
    name?: string;
}
export interface AddParticipantBody {
    userId: string;
}
export interface CreateMessageBody {
    conversationId: string;
    content?: string;
    mediaIds?: string[];
    replyToId?: string;
}
export interface UpdateMessageBody {
    content?: string;
}
export interface ReactionBody {
    emoji: ChatReactionType;
}
export interface MessageQuery {
    conversationId?: string;
    cursor?: string;
    limit?: number;
}
export interface MessageSenderResponse {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarEmoji: string | null;
}
export interface ReactionCountResponse {
    emoji: ChatReactionType;
    count: number;
    userReacted: boolean;
}
export interface MessageResponse {
    id: string;
    householdId: string;
    senderId: string;
    sender: MessageSenderResponse;
    content: string | null;
    mediaUrl: string | null;
    replyToId: string | null;
    replyPreview: {
        id: string;
        content: string | null;
        senderName: string;
    } | null;
    reactions: ReactionCountResponse[];
    replyCount: number;
    editedAt: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}
export interface PaginatedMessagesResponse {
    messages: MessageResponse[];
    nextCursor: string | null;
    hasMore: boolean;
}
//# sourceMappingURL=types.d.ts.map
export type ChatReactionType = '👍' | '❤️' | '😂' | '😲' | '😢';

// ── Conversation types ──

export interface ConversationResponse {
  id: string;
  householdId: string;
  type: 'dm' | 'group' | 'household';
  name: string | null;
  createdBy: string;
  participants: Array<{ id: string; displayName: string; avatarUrl: string | null }>;
  lastMessage: {
    content: string | null;
    type: 'text' | 'image' | 'voice';
    createdAt: string;
    senderName: string;
  } | null;
  createdAt: string;
}

export interface CreateConversationBody {
  type: 'dm' | 'group' | 'household';
  participantIds: string[];
  name?: string;
}

export interface AddParticipantBody {
  userId: string;
}

// ── Message types ──

export interface CreateMessageBody {
  conversationId: string;
  content?: string;
  mediaIds?: string[];
  mediaUrl?: string;
  type?: 'text' | 'image' | 'voice';
  durationSeconds?: number;
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
  type: 'text' | 'image' | 'voice';
  durationSeconds: number | null;
  replyToId: string | null;
  replyPreview: { id: string; content: string | null; senderName: string } | null;
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

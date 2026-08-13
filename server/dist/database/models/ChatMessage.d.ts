import { Model, CreationOptional } from 'sequelize';
declare class ChatMessage extends Model {
    id: CreationOptional<string>;
    householdId: string;
    conversationId: string;
    senderId: string;
    content: string | null;
    mediaUrl: string | null;
    replyToId: string | null;
    editedAt: Date | null;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
    deletedAt: Date | null;
}
export default ChatMessage;
//# sourceMappingURL=ChatMessage.d.ts.map
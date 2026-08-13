import { Model, CreationOptional } from 'sequelize';
declare class ConversationParticipant extends Model {
    id: CreationOptional<string>;
    conversationId: string;
    userId: string;
    joinedAt: CreationOptional<Date>;
}
export default ConversationParticipant;
//# sourceMappingURL=ConversationParticipant.d.ts.map
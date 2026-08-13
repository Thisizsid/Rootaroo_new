import { Model, CreationOptional } from 'sequelize';
declare class ChatReaction extends Model {
    id: CreationOptional<string>;
    messageId: string;
    userId: string;
    reaction: '👍' | '❤️' | '😂' | '😲' | '😢';
    createdAt: CreationOptional<Date>;
}
export default ChatReaction;
//# sourceMappingURL=ChatReaction.d.ts.map
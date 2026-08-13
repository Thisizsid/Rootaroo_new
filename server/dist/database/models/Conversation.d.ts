import { Model, CreationOptional } from 'sequelize';
declare class Conversation extends Model {
    id: CreationOptional<string>;
    householdId: string;
    type: 'dm' | 'group';
    name: string | null;
    createdBy: string;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
export default Conversation;
//# sourceMappingURL=Conversation.d.ts.map
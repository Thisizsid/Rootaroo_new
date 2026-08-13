import { Model, CreationOptional } from 'sequelize';
declare class FeedComment extends Model {
    id: CreationOptional<string>;
    postId: string;
    userId: string;
    content: string;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
    deletedAt: Date | null;
}
export default FeedComment;
//# sourceMappingURL=FeedComment.d.ts.map
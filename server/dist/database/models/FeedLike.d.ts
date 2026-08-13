import { Model, CreationOptional } from 'sequelize';
declare class FeedLike extends Model {
    id: CreationOptional<string>;
    postId: string;
    userId: string;
    createdAt: CreationOptional<Date>;
}
export default FeedLike;
//# sourceMappingURL=FeedLike.d.ts.map
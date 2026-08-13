import { Model, CreationOptional } from 'sequelize';
declare class PostTag extends Model {
    id: CreationOptional<string>;
    postId: string;
    userId: string;
    createdAt: CreationOptional<Date>;
}
export default PostTag;
//# sourceMappingURL=PostTag.d.ts.map
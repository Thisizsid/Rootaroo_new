import { Model, CreationOptional } from 'sequelize';
declare class FeedPost extends Model {
    id: CreationOptional<string>;
    householdId: string;
    userId: string;
    content: string | null;
    mediaType: 'text' | 'photo' | 'video';
    activity: string | null;
    location: string | null;
    privacy: 'household' | 'members';
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
    deletedAt: Date | null;
}
export default FeedPost;
//# sourceMappingURL=FeedPost.d.ts.map
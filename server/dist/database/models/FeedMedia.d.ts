import { Model, CreationOptional } from 'sequelize';
declare class FeedMedia extends Model {
    id: CreationOptional<string>;
    postId: string;
    mediaUrl: string;
    mediaType: 'photo' | 'video';
    thumbnailUrl: string | null;
    fileSizeBytes: number | null;
    createdAt: CreationOptional<Date>;
}
export default FeedMedia;
//# sourceMappingURL=FeedMedia.d.ts.map
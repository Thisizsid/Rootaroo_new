import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class FeedMedia extends Model {
  declare id: CreationOptional<string>;
  declare postId: string;
  declare mediaUrl: string;
  declare mediaType: 'photo' | 'video';
  declare thumbnailUrl: string | null;
  declare fileSizeBytes: number | null;
  declare createdAt: CreationOptional<Date>;
}

FeedMedia.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'post_id',
    },
    mediaUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'media_url',
    },
    mediaType: {
      type: DataTypes.ENUM('photo', 'video'),
      allowNull: false,
      field: 'media_type',
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'thumbnail_url',
    },
    fileSizeBytes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'file_size_bytes',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'feed_media',
    timestamps: true,
    paranoid: false,
  }
);

export default FeedMedia;

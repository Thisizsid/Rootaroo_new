import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class FeedPost extends Model {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare userId: string;
  declare content: string | null;
  declare mediaType: 'text' | 'photo' | 'video';
  declare activity: string | null;
  declare location: string | null;
  declare privacy: 'household' | 'members';
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: Date | null;
}

FeedPost.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    householdId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'household_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mediaType: {
      type: DataTypes.ENUM('text', 'photo', 'video'),
      allowNull: false,
      field: 'media_type',
    },
    activity: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    privacy: {
      type: DataTypes.ENUM('household', 'members'),
      defaultValue: 'household',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'feed_posts',
    paranoid: true,
    indexes: [
      { name: 'idx_feed_posts_household_created', fields: ['household_id', 'created_at'] },
    ],
  }
);

export default FeedPost;

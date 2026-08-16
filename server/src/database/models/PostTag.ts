import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class PostTag extends Model {
  declare id: CreationOptional<string>;
  declare postId: string;
  declare userId: string;
  declare createdAt: CreationOptional<Date>;
}

PostTag.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'post_tags',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['post_id'] },
      { fields: ['user_id'] },
      { unique: true, fields: ['post_id', 'user_id'] },
    ],
  },
);

export default PostTag;

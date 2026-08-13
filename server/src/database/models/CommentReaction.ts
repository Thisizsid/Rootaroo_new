import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class CommentReaction extends Model {
  declare id: CreationOptional<string>;
  declare commentId: string;
  declare userId: string;
  declare reaction: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

CommentReaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    commentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'comment_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    reaction: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'comment_reactions',
    timestamps: true,
    paranoid: false,
    indexes: [
      { unique: true, fields: ['comment_id', 'user_id', 'reaction'] },
    ],
  }
);

export default CommentReaction;

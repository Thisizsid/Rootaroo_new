import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class ChatReaction extends Model {
  declare id: CreationOptional<string>;
  declare messageId: string;
  declare userId: string;
  declare reaction: '👍' | '❤️' | '😂' | '😲' | '😢';
  declare createdAt: CreationOptional<Date>;
}

ChatReaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'message_id',
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
  },
  {
    sequelize,
    tableName: 'chat_reactions',
    timestamps: true,
    paranoid: false,
    indexes: [
      { unique: true, fields: ['message_id', 'user_id', 'reaction'] },
    ],
  }
);

export default ChatReaction;

import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class ChatMessage extends Model {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare conversationId: string;
  declare senderId: string;
  declare content: string | null;
  declare mediaUrl: string | null;
  declare type: 'text' | 'image' | 'voice';
  declare durationSeconds: number | null;
  declare replyToId: string | null;
  declare editedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: Date | null;
}

ChatMessage.init(
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
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'conversation_id',
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'sender_id',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mediaUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'media_url',
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'voice'),
      allowNull: false,
      defaultValue: 'text',
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'duration_seconds',
    },
    replyToId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reply_to_id',
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'edited_at',
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
    tableName: 'chat_messages',
    paranoid: true,
    indexes: [
      { name: 'idx_chat_messages_household_created', fields: ['household_id', 'created_at'] },
    ],
  }
);

export default ChatMessage;

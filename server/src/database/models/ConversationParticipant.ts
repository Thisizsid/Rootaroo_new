import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class ConversationParticipant extends Model {
  declare id: CreationOptional<string>;
  declare conversationId: string;
  declare userId: string;
  declare joinedAt: CreationOptional<Date>;
  declare lastReadAt: Date | null;
}

ConversationParticipant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'conversation_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    joinedAt: {
      type: DataTypes.DATE,
      field: 'joined_at',
      defaultValue: DataTypes.NOW,
    },
    // Null means "never read" — every message in the conversation counts as
    // unread until the user opens it for the first time.
    lastReadAt: {
      type: DataTypes.DATE,
      field: 'last_read_at',
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'conversation_participants',
    timestamps: false,
    indexes: [
      { fields: ['conversation_id'] },
      { fields: ['user_id'] },
      { unique: true, fields: ['conversation_id', 'user_id'] },
    ],
  },
);

export default ConversationParticipant;

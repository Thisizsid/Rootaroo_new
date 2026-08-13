import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class ConversationParticipant extends Model {
  declare id: CreationOptional<string>;
  declare conversationId: string;
  declare userId: string;
  declare joinedAt: CreationOptional<Date>;
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

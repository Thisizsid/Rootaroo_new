import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class Conversation extends Model {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare type: 'dm' | 'group';
  declare name: string | null;
  declare createdBy: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Conversation.init(
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
    type: {
      type: DataTypes.ENUM('dm', 'group'),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
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
    tableName: 'conversations',
    indexes: [
      { fields: ['household_id'] },
    ],
  },
);

export default Conversation;

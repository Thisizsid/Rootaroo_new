import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class JournalEntry extends Model {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare userId: string;
  declare content: string | null;
  declare mood: string | null;
  declare tags: string[] | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: Date | null;
}

JournalEntry.init(
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
    mood: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },
    // Free-text labels, private to the entry's author. Stored as JSON rather
    // than a join table — they are never queried across users, so a table
    // would only add a join to every list page.
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
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
    tableName: 'journal_entries',
    paranoid: true,
    indexes: [
      { name: 'idx_journal_entries_user_created', fields: ['user_id', 'created_at'] },
    ],
  }
);

export default JournalEntry;

import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class Task extends Model {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare createdBy: string;
  declare title: string;
  declare description: string | null;
  declare dueDate: string | null;        // DATEONLY → Sequelize returns a string "YYYY-MM-DD"
  declare recurrence: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  declare recurrenceEndDate: string | null; // DATEONLY → string
  declare points: number;
  declare pointsReduced: boolean;
  declare status: 'pending' | 'completed' | 'reopened';
  declare completedAt: Date | null;
  declare completedBy: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: Date | null;
}

Task.init(
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
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'due_date',
    },
    recurrence: {
      type: DataTypes.ENUM('none', 'daily', 'weekly', 'biweekly', 'monthly'),
      defaultValue: 'none',
    },
    recurrenceEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'recurrence_end_date',
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    pointsReduced: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'points_reduced',
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'reopened'),
      defaultValue: 'pending',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
    completedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'completed_by',
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
    tableName: 'tasks',
    paranoid: true,
    indexes: [
      { name: 'idx_tasks_household_status', fields: ['household_id', 'status'] },
    ],
  }
);

export default Task;

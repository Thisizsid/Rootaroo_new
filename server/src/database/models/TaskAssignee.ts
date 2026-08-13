import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class TaskAssignee extends Model {
  declare id: CreationOptional<string>;
  declare taskId: string;
  declare userId: string;
  declare createdAt: CreationOptional<Date>;
}

TaskAssignee.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'task_id',
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
    tableName: 'task_assignees',
    timestamps: true,
    paranoid: false,
  }
);

export default TaskAssignee;

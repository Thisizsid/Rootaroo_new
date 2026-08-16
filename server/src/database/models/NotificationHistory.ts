import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class NotificationHistory extends Model {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare type: string;
  declare title: string;
  declare body: string | null;
  declare data: object | null;
  declare isRead: boolean;
  declare readAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare deletedAt: Date | null;
}

NotificationHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'notification_history',
    paranoid: true,
    indexes: [
      { name: 'idx_notifications_user_read', fields: ['user_id', 'is_read', 'created_at'] },
    ],
  }
);

export default NotificationHistory;

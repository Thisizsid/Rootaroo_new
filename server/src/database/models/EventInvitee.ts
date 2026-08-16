import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class EventInvitee extends Model {
  declare id: CreationOptional<string>;
  declare calendarEventId: string;
  declare userId: string;
  declare createdAt: CreationOptional<Date>;
}

EventInvitee.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    calendarEventId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'calendar_event_id',
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
    tableName: 'calendar_invitees',
    timestamps: true,
    paranoid: false,
    indexes: [{ name: 'idx_calendar_invitee_event', fields: ['calendar_event_id'] }],
  }
);

export default EventInvitee;

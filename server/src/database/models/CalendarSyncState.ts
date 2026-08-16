import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class CalendarSyncState extends Model {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare googleCalendarId: string;
  declare syncToken: string | null;
  declare lastSyncedAt: Date | null;
  declare isActive: boolean;
  declare accessToken: string | null;
  declare refreshToken: string | null;
  declare tokenExpiresAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

CalendarSyncState.init(
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
    googleCalendarId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'google_calendar_id',
    },
    syncToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'sync_token',
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_synced_at',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'access_token',
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'refresh_token',
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'token_expires_at',
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
    tableName: 'calendar_sync_states',
    timestamps: true,
    paranoid: false,
  }
);

export default CalendarSyncState;

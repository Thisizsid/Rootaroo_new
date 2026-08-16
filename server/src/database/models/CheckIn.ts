import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class CheckIn extends Model {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare userId: string;
  declare latitude: number | null;
  declare longitude: number | null;
  declare address: string | null;
  declare note: string | null;
  declare checkedInAt: Date;
  declare createdAt: CreationOptional<Date>;
}

CheckIn.init(
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
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    checkedInAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'checked_in_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'check_ins',
    timestamps: true,
    paranoid: false,
  }
);

export default CheckIn;

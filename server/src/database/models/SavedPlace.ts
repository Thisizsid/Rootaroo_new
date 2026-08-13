import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

export type SavedPlaceIcon = 'home' | 'office' | 'school' | 'custom';

class SavedPlace extends Model {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare userId: string;
  declare name: string;
  declare icon: SavedPlaceIcon;
  declare latitude: number;
  declare longitude: number;
  declare address: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

SavedPlace.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    icon: {
      type: DataTypes.ENUM('home', 'office', 'school', 'custom'),
      allowNull: false,
      defaultValue: 'custom',
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(500),
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
  },
  {
    sequelize,
    tableName: 'saved_places',
    timestamps: true,
    paranoid: false,
  }
);

export default SavedPlace;

import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';
import type Household from './Household';
import type User from './User';

class HouseholdMember extends Model {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare userId: string;
  declare role: 'admin' | 'member' | 'child';
  declare joinedAt: Date;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: Date | null;
  declare household?: Household;
  declare user?: User;
}

HouseholdMember.init(
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
    role: {
      type: DataTypes.ENUM('admin', 'member', 'child'),
      allowNull: false,
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'joined_at',
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
    tableName: 'household_members',
    paranoid: true,
    indexes: [
      { unique: true, fields: ['household_id', 'user_id'] },
    ],
  }
);

export default HouseholdMember;

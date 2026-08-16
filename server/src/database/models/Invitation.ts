import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';
import type Household from './Household';
import type User from './User';

class Invitation extends Model {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare invitedBy: string;
  declare code: string;
  declare email: string | null;
  declare expiresAt: Date;
  declare acceptedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare inviter?: User;
  declare household?: Household;
}

Invitation.init(
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
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'invited_by',
      references: { model: 'users', key: 'id' },
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'accepted_at',
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
    tableName: 'invitations',
    timestamps: true,
    paranoid: false,
  }
);

export default Invitation;

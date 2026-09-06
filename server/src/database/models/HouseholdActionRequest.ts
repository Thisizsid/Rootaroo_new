import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

export type HouseholdActionRequestType = 'leave' | 'delete';
export type HouseholdActionRequestStatus = 'pending' | 'approved' | 'rejected';

class HouseholdActionRequest extends Model {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare requestedBy: string;
  declare type: HouseholdActionRequestType;
  declare status: HouseholdActionRequestStatus;
  declare reviewerNote: string | null;
  declare reviewedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

HouseholdActionRequest.init(
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
    requestedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'requested_by',
    },
    type: {
      type: DataTypes.ENUM('leave', 'delete'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    reviewerNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'reviewer_note',
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at',
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
    tableName: 'household_action_requests',
    timestamps: true,
    paranoid: false,
  }
);

export default HouseholdActionRequest;

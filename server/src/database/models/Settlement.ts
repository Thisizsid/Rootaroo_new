import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class Settlement extends Model {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare fromUserId: string;
  declare toUserId: string;
  declare amount: number;
  declare settledAt: Date;
  declare createdAt: CreationOptional<Date>;
}

Settlement.init(
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
    fromUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'from_user_id',
    },
    toUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'to_user_id',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    settledAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'settled_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'settlements',
    timestamps: true,
    paranoid: false,
  }
);

export default Settlement;

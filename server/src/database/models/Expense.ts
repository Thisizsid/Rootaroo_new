import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class Expense extends Model {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare paidBy: string;
  declare title: string;
  declare amount: number;
  declare splitType: 'equal' | 'custom';
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: Date | null;
}

Expense.init(
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
    paidBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'paid_by',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    splitType: {
      type: DataTypes.ENUM('equal', 'custom'),
      defaultValue: 'equal',
      field: 'split_type',
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
    tableName: 'expenses',
    paranoid: true,
    indexes: [
      { name: 'idx_expenses_household_created', fields: ['household_id', 'created_at'] },
    ],
  }
);

export default Expense;

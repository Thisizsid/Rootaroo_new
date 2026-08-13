import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class ExpenseParticipant extends Model {
  declare id: CreationOptional<string>;
  declare expenseId: string;
  declare userId: string;
  declare shareAmount: number;
  declare isSettled: boolean;
  declare createdAt: CreationOptional<Date>;
}

ExpenseParticipant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    expenseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'expense_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    shareAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'share_amount',
    },
    isSettled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_settled',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'expense_participants',
    timestamps: true,
    paranoid: false,
  }
);

export default ExpenseParticipant;

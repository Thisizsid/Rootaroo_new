import { Model, DataTypes, CreationOptional } from 'sequelize';
import sequelize from '../../config/database';

class GroceryItem extends Model {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare name: string;
  declare quantity: string | null;
  declare note: string | null;
  declare assignedTo: string | null;
  declare isBought: boolean;
  declare boughtBy: string | null;
  declare boughtAt: Date | null;
  declare archivedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: Date | null;
}

GroceryItem.init(
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
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assigned_to',
    },
    isBought: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_bought',
    },
    boughtBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'bought_by',
    },
    boughtAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'bought_at',
    },
    archivedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'archived_at',
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
    tableName: 'grocery_items',
    paranoid: true,
    indexes: [
      { name: 'idx_grocery_household_bought', fields: ['household_id', 'is_bought'] },
    ],
  }
);

export default GroceryItem;

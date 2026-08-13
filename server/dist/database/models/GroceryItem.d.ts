import { Model, CreationOptional } from 'sequelize';
declare class GroceryItem extends Model {
    id: CreationOptional<string>;
    householdId: string;
    name: string;
    quantity: string | null;
    note: string | null;
    assignedTo: string | null;
    isBought: boolean;
    boughtBy: string | null;
    boughtAt: Date | null;
    archivedAt: Date | null;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
    deletedAt: Date | null;
}
export default GroceryItem;
//# sourceMappingURL=GroceryItem.d.ts.map
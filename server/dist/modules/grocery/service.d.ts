import type { CreateGroceryBody, UpdateGroceryBody, GroceryResponse, GroupedGroceriesResponse, GrocerySummaryResponse } from './types';
/** FR-080: Add grocery item. */
export declare function createItem(userId: string, body: CreateGroceryBody): Promise<GroceryResponse>;
/** FR-087: List groceries with grouping. */
export declare function getItems(userId: string): Promise<GroupedGroceriesResponse>;
/** FR-083: Edit a grocery item. */
export declare function updateItem(itemId: string, userId: string, userRole: string, body: UpdateGroceryBody): Promise<GroceryResponse>;
/** FR-082: Delete item. */
export declare function deleteItem(itemId: string, userId: string, userRole: string): Promise<void>;
/** FR-081: Toggle bought status. */
export declare function toggleBought(itemId: string, userId: string, userRole: string): Promise<GroceryResponse>;
/** FR-088: Archive bought items (move out of default view). */
export declare function archiveItem(itemId: string, userId: string, userRole: string): Promise<GroceryResponse>;
/** FR-089: Summary counts for dashboard. */
export declare function getSummary(userId: string): Promise<GrocerySummaryResponse>;
//# sourceMappingURL=service.d.ts.map
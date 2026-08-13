import type { CreateTodoBody, UpdateTodoBody, TodoResponse, GroupedTodosResponse, TodoSummaryResponse, TodoFilter } from './types';
export declare function createItem(userId: string, body: CreateTodoBody): Promise<TodoResponse>;
export declare function getItems(userId: string, filter?: TodoFilter): Promise<GroupedTodosResponse>;
export declare function updateItem(itemId: string, userId: string, userRole: string, body: UpdateTodoBody): Promise<TodoResponse>;
export declare function deleteItem(itemId: string, userId: string, userRole: string): Promise<void>;
export declare function toggleComplete(itemId: string, userId: string, userRole: string): Promise<TodoResponse>;
export declare function getSummary(userId: string): Promise<TodoSummaryResponse>;
//# sourceMappingURL=service.d.ts.map
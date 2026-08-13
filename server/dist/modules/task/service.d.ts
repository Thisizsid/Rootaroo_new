import type { CreateTaskBody, UpdateTaskBody, TaskResponse, GroupedTasksResponse, TaskSummaryResponse } from './types';
/** FR-060/061: Create task with assignees. */
export declare function createTask(userId: string, body: CreateTaskBody): Promise<TaskResponse>;
/** FR-065: List tasks with optional grouping. */
export declare function getTasks(userId: string, options: {
    group?: string;
    status?: string;
}): Promise<TaskResponse[] | GroupedTasksResponse>;
/** FR-060: Get a single task. */
export declare function getTaskById(taskId: string, userId: string): Promise<TaskResponse>;
/** FR-066: Edit task (creator or admin only). */
export declare function updateTask(taskId: string, userId: string, userRole: string, body: UpdateTaskBody): Promise<TaskResponse>;
/** FR-067: Delete task (creator or admin only). */
export declare function deleteTask(taskId: string, userId: string, userRole: string): Promise<void>;
/** FR-063: Complete a task. FR-068: Clone recurring if applicable. */
export declare function completeTask(taskId: string, userId: string): Promise<TaskResponse>;
/** FR-064: Re-open a completed task. */
export declare function reopenTask(taskId: string, userId: string, userRole: string): Promise<TaskResponse>;
/** FR-069: Dashboard summary counts. */
export declare function getTaskSummary(userId: string): Promise<TaskSummaryResponse>;
//# sourceMappingURL=service.d.ts.map
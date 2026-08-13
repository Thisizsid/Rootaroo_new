export interface CreateTaskBody {
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  assigneeIds?: string[];
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrenceEndDate?: string; // YYYY-MM-DD
  points?: number;
}

export interface UpdateTaskBody {
  title?: string;
  description?: string;
  dueDate?: string | null;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrenceEndDate?: string | null;
  points?: number;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  recurrence: string;
  recurrenceEndDate: string | null;
  points: number;
  assignees: TaskAssigneeResponse[];
  createdBy: TaskAuthorResponse;
  completedBy: TaskAuthorResponse | null;
  completedAt: string | null;
  createdAt: string;
}

export interface TaskAssigneeResponse {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  avatarEmoji: string | null;
}

export interface TaskAuthorResponse {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  avatarEmoji: string | null;
}

export interface GroupedTasksResponse {
  pending: TaskResponse[];
  overdue: TaskResponse[];
  completedToday: TaskResponse[];
}

export interface TaskSummaryResponse {
  pending: number;
  overdue: number;
  completedToday: number;
}

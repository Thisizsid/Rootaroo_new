export interface DashboardActivity {
    date: string;
    tasksCompleted: number;
    todosCompleted: number;
    groceriesBought: number;
}
export interface DashboardResponse {
    tasks: {
        pending: number;
        overdue: number;
        completedToday: number;
    };
    groceries: {
        pending: number;
    };
    todos: {
        pending: number;
        completedToday: number;
    };
    expenses: {
        totalExpenses: number;
        totalAmount: number;
        myBalance: number;
    };
    notifications: {
        unreadCount: number;
    };
    activity: DashboardActivity[];
}
//# sourceMappingURL=types.d.ts.map
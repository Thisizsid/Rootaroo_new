/**
 * Notify a single user about an event.
 * Wraps the notification service's sendToUser with common defaults.
 */
export declare function notifyUser(userId: string, type: string, title: string, body: string, data?: Record<string, unknown>): Promise<void>;
/**
 * Notify all members of a household about an event.
 * Fetches all household member IDs and calls notifyUser for each.
 */
export declare function notifyHousehold(householdId: string, type: string, title: string, body: string, data?: Record<string, unknown>, excludeUserId?: string): Promise<void>;
//# sourceMappingURL=notifications.d.ts.map
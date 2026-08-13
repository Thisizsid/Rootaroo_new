import type { DeviceTokenBody, NotificationHistoryResponse, NotificationPreferencesResponse, UpdatePreferencesBody } from './types';
/** Register a push notification device token. */
export declare function registerToken(userId: string, body: DeviceTokenBody): Promise<void>;
/** Remove a device token (e.g., on logout). */
export declare function unregisterToken(userId: string, token: string): Promise<void>;
/** Get all FCM tokens for a user. */
export declare function getUserTokens(userId: string): Promise<string[]>;
/** List notification history for the current user. */
export declare function getHistory(userId: string, options: {
    limit?: number;
    cursor?: string;
}): Promise<{
    notifications: NotificationHistoryResponse[];
    nextCursor: string | null;
    hasMore: boolean;
}>;
/** Mark a notification as read. */
export declare function markAsRead(notificationId: string, userId: string): Promise<NotificationHistoryResponse>;
/** Mark all notifications as read for the user. */
export declare function markAllAsRead(userId: string): Promise<void>;
/** Get notification preferences (auto-create defaults if missing). */
export declare function getPreferences(userId: string): Promise<NotificationPreferencesResponse>;
/** Update notification preferences. */
export declare function updatePreferences(userId: string, body: UpdatePreferencesBody): Promise<NotificationPreferencesResponse>;
/**
 * Send a push notification to a specific user.
 * Always creates a NotificationHistory record.
 * Only delivers via FCM when FCM_ENABLED is true.
 */
export declare function sendToUser(userId: string, type: string, title: string, body?: string, data?: Record<string, unknown>): Promise<void>;
/** Get unread count. */
export declare function getUnreadCount(userId: string): Promise<number>;
//# sourceMappingURL=service.d.ts.map
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import {
  NotificationHistory,
  NotificationPreference,
  DeviceToken,
} from '../../database/models';
import { NotFoundError } from '../../shared/utils/errors';
import { env } from '../../config/env';
import { sendFCM } from '../../shared/utils/fcm';
import logger from '../../shared/utils/logger';
import type {
  DeviceTokenBody,
  NotificationHistoryResponse,
  NotificationPreferencesResponse,
  UpdatePreferencesBody,
} from './types';

// Maps a notification `type` string to the NotificationPreference field
// that gates it. Types with no entry here (e.g. household deletion
// warnings) are never opt-out-able by design — they're account-lifecycle
// critical, not a subscribable feed. This is the single choke point every
// send path (sendToUser directly, or via notifyUser/notifyHousehold)
// funnels through, so the gate can't be bypassed by calling one path vs
// the other (F-08).
const TYPE_TO_PREFERENCE_FIELD: Partial<Record<string, keyof NotificationPreferencesResponse>> = {
  feed: 'newPost',
  task: 'taskAssigned',
  todo: 'taskAssigned',
  expense_reminder: 'newExpense',
  check_in: 'checkIn',
  ping_request: 'pingRequest',
  ping_response: 'pingRequest',
  calendar: 'calendarEvent',
  chat: 'chatMessage',
};

// ── Device Token Management ── (DB-backed)

/** Register a push notification device token. */
export async function registerToken(
  userId: string,
  body: DeviceTokenBody,
): Promise<void> {
  await DeviceToken.upsert({
    userId,
    token: body.token,
    platform: body.platform,
  });
}

/** Remove a device token (e.g., on logout). */
export async function unregisterToken(
  userId: string,
  token: string,
): Promise<void> {
  await DeviceToken.destroy({ where: { userId, token } });
}

/** Get all FCM tokens for a user. */
export async function getUserTokens(userId: string): Promise<string[]> {
  const tokens = await DeviceToken.findAll({
    where: { userId },
    attributes: ['token'],
  });
  return tokens.map((t) => t.token);
}

// ── Notification History ──

/** List notification history for the current user. */
export async function getHistory(
  userId: string,
  options: { limit?: number; cursor?: string },
): Promise<{ notifications: NotificationHistoryResponse[]; nextCursor: string | null; hasMore: boolean }> {
  const limit = Math.min(options.limit || 20, 50);

  const where: any = { userId };
  if (options.cursor) {
    where.createdAt = { [Op.lt]: new Date(options.cursor) };
  }

  const items = await NotificationHistory.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: limit + 1,
  });

  const hasMore = items.length > limit;
  const pageItems = items.slice(0, limit);
  const nextCursor = hasMore && pageItems.length > 0
    ? pageItems[pageItems.length - 1].createdAt.toISOString()
    : null;

  return {
    notifications: pageItems.map(toHistoryResponse),
    nextCursor,
    hasMore,
  };
}

/** Mark a notification as read. */
export async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<NotificationHistoryResponse> {
  const notification = await NotificationHistory.findOne({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new NotFoundError('Notification');

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return toHistoryResponse(notification);
}

/** Mark all notifications as read for the user. */
export async function markAllAsRead(userId: string): Promise<void> {
  await NotificationHistory.update(
    { isRead: true, readAt: new Date() },
    { where: { userId, isRead: false } },
  );
}

// ── Notification Preferences ──

/** Get notification preferences (auto-create defaults if missing). */
export async function getPreferences(
  userId: string,
): Promise<NotificationPreferencesResponse> {
  let prefs = await NotificationPreference.findOne({ where: { userId } });

  if (!prefs) {
    prefs = await NotificationPreference.create({
      id: uuidv4(),
      userId,
      newPost: true,
      taskAssigned: true,
      taskCompleted: true,
      checkIn: true,
      pingRequest: true,
      newExpense: true,
      chatMessage: true,
      calendarEvent: true,
      memberJoined: true,
    });
  }

  return {
    newPost: prefs.newPost,
    taskAssigned: prefs.taskAssigned,
    taskCompleted: prefs.taskCompleted,
    checkIn: prefs.checkIn,
    pingRequest: prefs.pingRequest,
    newExpense: prefs.newExpense,
    chatMessage: prefs.chatMessage,
    calendarEvent: prefs.calendarEvent,
    memberJoined: prefs.memberJoined,
  };
}

/** Update notification preferences. */
export async function updatePreferences(
  userId: string,
  body: UpdatePreferencesBody,
): Promise<NotificationPreferencesResponse> {
  let prefs = await NotificationPreference.findOne({ where: { userId } });

  if (!prefs) {
    prefs = await NotificationPreference.create({
      id: uuidv4(),
      userId,
      ...body,
    });
  } else {
    if (body.newPost !== undefined) prefs.newPost = body.newPost;
    if (body.taskAssigned !== undefined) prefs.taskAssigned = body.taskAssigned;
    if (body.taskCompleted !== undefined) prefs.taskCompleted = body.taskCompleted;
    if (body.checkIn !== undefined) prefs.checkIn = body.checkIn;
    if (body.pingRequest !== undefined) prefs.pingRequest = body.pingRequest;
    if (body.newExpense !== undefined) prefs.newExpense = body.newExpense;
    if (body.chatMessage !== undefined) prefs.chatMessage = body.chatMessage;
    if (body.calendarEvent !== undefined) prefs.calendarEvent = body.calendarEvent;
    if (body.memberJoined !== undefined) prefs.memberJoined = body.memberJoined;
    await prefs.save();
  }

  return {
    newPost: prefs.newPost,
    taskAssigned: prefs.taskAssigned,
    taskCompleted: prefs.taskCompleted,
    checkIn: prefs.checkIn,
    pingRequest: prefs.pingRequest,
    newExpense: prefs.newExpense,
    chatMessage: prefs.chatMessage,
    calendarEvent: prefs.calendarEvent,
    memberJoined: prefs.memberJoined,
  };
}

// ── Sending (placeholder) ──

/**
 * Send a push notification to a specific user.
 * Always creates a NotificationHistory record.
 * Only delivers via FCM when FCM_ENABLED is true.
 */
export async function sendToUser(
  userId: string,
  type: string,
  title: string,
  body?: string,
  data?: Record<string, unknown>,
  options?: { skipPush?: boolean },
): Promise<void> {
  // Always persist to history
  await NotificationHistory.create({
    id: uuidv4(),
    userId,
    type,
    title,
    body: body || null,
    data: data || null,
    isRead: false,
  });

  // Respect the user's notification preferences before pushing — history
  // is always recorded above regardless, so the item still shows up in
  // their in-app notification list even with push disabled for this type.
  const prefField = TYPE_TO_PREFERENCE_FIELD[type];
  if (prefField) {
    const prefs = await NotificationPreference.findOne({ where: { userId } });
    if (prefs && prefs[prefField] === false) return;
  }

  // Deliver via FCM if enabled (skip for self-actions — history only)
  if (env.fcm.enabled && !options?.skipPush) {
    const tokens = await getUserTokens(userId);
    if (tokens.length > 0) {
      sendFCM(tokens, title, body || '', (data || {}) as Record<string, string>)
        .catch((e: Error) => logger.error('[FCM] Delivery failed:', e.message));
    }
  }
}

/** Get unread count. */
export async function getUnreadCount(userId: string): Promise<number> {
  return NotificationHistory.count({
    where: { userId, isRead: false },
  });
}

// ── Helpers ──

function toHistoryResponse(n: NotificationHistory): NotificationHistoryResponse {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data as Record<string, unknown> | null,
    isRead: n.isRead,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  };
}
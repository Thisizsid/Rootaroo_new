"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerToken = registerToken;
exports.unregisterToken = unregisterToken;
exports.getUserTokens = getUserTokens;
exports.getHistory = getHistory;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.getPreferences = getPreferences;
exports.updatePreferences = updatePreferences;
exports.sendToUser = sendToUser;
exports.getUnreadCount = getUnreadCount;
const uuid_1 = require("uuid");
const sequelize_1 = require("sequelize");
const models_1 = require("../../database/models");
const errors_1 = require("../../shared/utils/errors");
const env_1 = require("../../config/env");
const fcm_1 = require("../../shared/utils/fcm");
const logger_1 = __importDefault(require("../../shared/utils/logger"));
// ── Device Token Management ── (DB-backed)
/** Register a push notification device token. */
async function registerToken(userId, body) {
    await models_1.DeviceToken.upsert({
        userId,
        token: body.token,
        platform: body.platform,
    });
}
/** Remove a device token (e.g., on logout). */
async function unregisterToken(userId, token) {
    await models_1.DeviceToken.destroy({ where: { userId, token } });
}
/** Get all FCM tokens for a user. */
async function getUserTokens(userId) {
    const tokens = await models_1.DeviceToken.findAll({
        where: { userId },
        attributes: ['token'],
    });
    return tokens.map((t) => t.token);
}
// ── Notification History ──
/** List notification history for the current user. */
async function getHistory(userId, options) {
    const limit = Math.min(options.limit || 20, 50);
    const where = { userId };
    if (options.cursor) {
        where.createdAt = { [sequelize_1.Op.lt]: new Date(options.cursor) };
    }
    const items = await models_1.NotificationHistory.findAll({
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
async function markAsRead(notificationId, userId) {
    const notification = await models_1.NotificationHistory.findOne({
        where: { id: notificationId, userId },
    });
    if (!notification)
        throw new errors_1.NotFoundError('Notification');
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    return toHistoryResponse(notification);
}
/** Mark all notifications as read for the user. */
async function markAllAsRead(userId) {
    await models_1.NotificationHistory.update({ isRead: true, readAt: new Date() }, { where: { userId, isRead: false } });
}
// ── Notification Preferences ──
/** Get notification preferences (auto-create defaults if missing). */
async function getPreferences(userId) {
    let prefs = await models_1.NotificationPreference.findOne({ where: { userId } });
    if (!prefs) {
        prefs = await models_1.NotificationPreference.create({
            id: (0, uuid_1.v4)(),
            userId,
            newPost: true,
            taskAssigned: true,
            taskCompleted: true,
            checkIn: true,
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
        newExpense: prefs.newExpense,
        chatMessage: prefs.chatMessage,
        calendarEvent: prefs.calendarEvent,
        memberJoined: prefs.memberJoined,
    };
}
/** Update notification preferences. */
async function updatePreferences(userId, body) {
    let prefs = await models_1.NotificationPreference.findOne({ where: { userId } });
    if (!prefs) {
        prefs = await models_1.NotificationPreference.create({
            id: (0, uuid_1.v4)(),
            userId,
            ...body,
        });
    }
    else {
        if (body.newPost !== undefined)
            prefs.newPost = body.newPost;
        if (body.taskAssigned !== undefined)
            prefs.taskAssigned = body.taskAssigned;
        if (body.taskCompleted !== undefined)
            prefs.taskCompleted = body.taskCompleted;
        if (body.checkIn !== undefined)
            prefs.checkIn = body.checkIn;
        if (body.newExpense !== undefined)
            prefs.newExpense = body.newExpense;
        if (body.chatMessage !== undefined)
            prefs.chatMessage = body.chatMessage;
        if (body.calendarEvent !== undefined)
            prefs.calendarEvent = body.calendarEvent;
        if (body.memberJoined !== undefined)
            prefs.memberJoined = body.memberJoined;
        await prefs.save();
    }
    return {
        newPost: prefs.newPost,
        taskAssigned: prefs.taskAssigned,
        taskCompleted: prefs.taskCompleted,
        checkIn: prefs.checkIn,
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
async function sendToUser(userId, type, title, body, data) {
    // Always persist to history
    await models_1.NotificationHistory.create({
        id: (0, uuid_1.v4)(),
        userId,
        type,
        title,
        body: body || null,
        data: data || null,
        isRead: false,
    });
    // Deliver via FCM if enabled
    if (env_1.env.fcm.enabled) {
        const tokens = await getUserTokens(userId);
        if (tokens.length > 0) {
            (0, fcm_1.sendFCM)(tokens, title, body || '', (data || {}))
                .catch((e) => logger_1.default.error('[FCM] Delivery failed:', e.message));
        }
    }
}
/** Get unread count. */
async function getUnreadCount(userId) {
    return models_1.NotificationHistory.count({
        where: { userId, isRead: false },
    });
}
// ── Helpers ──
function toHistoryResponse(n) {
    return {
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        isRead: n.isRead,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
    };
}
//# sourceMappingURL=service.js.map
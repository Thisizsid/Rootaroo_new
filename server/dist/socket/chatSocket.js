"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatSocket = registerChatSocket;
const socketAuth_1 = require("../shared/middleware/socketAuth");
const logger_1 = __importDefault(require("../shared/utils/logger"));
/**
 * Registers chat-related socket event handlers.
 *
 * All events are scoped to the household room — the auth middleware
 * in socketAuth.ts handles JWT verification and room joining.
 * Each event handler re-checks household membership via the guard.
 */
function registerChatSocket(io) {
    io.on('connection', (socket) => {
        // ── Typing indicator ──
        socket.on('chat:typing', (data) => {
            if (!data?.householdId || typeof data.householdId !== 'string')
                return;
            if (!(0, socketAuth_1.requireHouseholdAccess)(socket, data.householdId))
                return;
            socket.to(`household:${data.householdId}`).emit('chat:typing', {
                userId: socket.data.userId,
            });
        });
        socket.on('chat:stop-typing', (data) => {
            if (!data?.householdId || typeof data.householdId !== 'string')
                return;
            if (!(0, socketAuth_1.requireHouseholdAccess)(socket, data.householdId))
                return;
            socket.to(`household:${data.householdId}`).emit('chat:stop-typing', {
                userId: socket.data.userId,
            });
        });
        // ── Message read receipt ──
        socket.on('chat:read', (data) => {
            if (!data?.householdId || typeof data.householdId !== 'string')
                return;
            if (!data?.messageId || typeof data.messageId !== 'string')
                return;
            if (!(0, socketAuth_1.requireHouseholdAccess)(socket, data.householdId))
                return;
            socket.to(`household:${data.householdId}`).emit('chat:read', {
                userId: socket.data.userId,
                messageId: data.messageId,
            });
        });
        // ── Presence / online status ──
        socket.on('presence:online', (data) => {
            if (!data?.householdId || typeof data.householdId !== 'string')
                return;
            if (!(0, socketAuth_1.requireHouseholdAccess)(socket, data.householdId))
                return;
            socket.to(`household:${data.householdId}`).emit('presence:online', {
                userId: socket.data.userId,
            });
        });
    });
    logger_1.default.info('✓ Chat socket handlers registered (household-scoped with auth guards)');
}
//# sourceMappingURL=chatSocket.js.map
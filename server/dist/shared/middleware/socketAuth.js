"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = socketAuthMiddleware;
exports.setupSocketConnectionHandlers = setupSocketConnectionHandlers;
exports.requireHouseholdAccess = requireHouseholdAccess;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const models_1 = require("../../database/models");
const logger_1 = __importDefault(require("../utils/logger"));
// ── Authentication middleware ──
// Verifies the JWT from handshake.auth.token before allowing connection
function socketAuthMiddleware(io) {
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            logger_1.default.warn(`Socket auth rejected: no token provided (${socket.id})`);
            return next(new Error('Authentication required — provide a token in auth.token'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwt.accessSecret);
            // Attach user data to socket
            socket.data.userId = decoded.userId;
            socket.data.email = decoded.email;
            socket.data.role = decoded.role;
            socket.data.householdId = decoded.householdId ?? null;
            // If householdId wasn't in the JWT, look up the active membership
            if (!socket.data.householdId) {
                const membership = await models_1.HouseholdMember.findOne({
                    where: { userId: decoded.userId },
                    attributes: ['householdId'],
                    order: [['joinedAt', 'DESC']],
                });
                if (membership) {
                    socket.data.householdId = membership.householdId;
                }
            }
            next();
        }
        catch (err) {
            const message = err instanceof jsonwebtoken_1.default.TokenExpiredError
                ? 'Token expired — please refresh and reconnect'
                : 'Invalid token';
            logger_1.default.warn(`Socket auth rejected: ${message} (${socket.id})`);
            next(new Error(message));
        }
    });
}
// ── Connection handler ──
// Auto-joins the user to their household room + personal room
function setupSocketConnectionHandlers(io) {
    io.on('connection', (socket) => {
        const { userId, householdId } = socket.data;
        // Join a personal room for targeted events (e.g., notifications)
        socket.join(`user:${userId}`);
        if (householdId) {
            socket.join(`household:${householdId}`);
            logger_1.default.info(`Socket connected: ${socket.id} | user:${userId} → household:${householdId}`);
        }
        else {
            logger_1.default.info(`Socket connected: ${socket.id} | user:${userId} (no household yet)`);
        }
        // ── Household room change ──
        // If a user joins a household after connecting, they can request to join the room
        socket.on('join:household', async (targetHouseholdId) => {
            if (typeof targetHouseholdId !== 'string' || !targetHouseholdId) {
                socket.emit('error', { message: 'Invalid household ID' });
                return;
            }
            // Verify actual membership — don't trust the client
            const membership = await models_1.HouseholdMember.findOne({
                where: { userId, householdId: targetHouseholdId },
                attributes: ['id'],
            });
            if (!membership) {
                socket.emit('error', { message: 'You are not a member of this household' });
                return;
            }
            // Leave old household room if present
            if (socket.data.householdId) {
                socket.leave(`household:${socket.data.householdId}`);
            }
            socket.data.householdId = targetHouseholdId;
            socket.join(`household:${targetHouseholdId}`);
            socket.emit('joined:household', { householdId: targetHouseholdId });
            logger_1.default.info(`Socket ${socket.id} joined household room: ${targetHouseholdId}`);
        });
        // ── Disconnect ──
        socket.on('disconnect', (reason) => {
            logger_1.default.info(`Socket disconnected: ${socket.id} | reason: ${reason}`);
        });
        // ── Periodic token validation ──
        // If the client supports it, re-verify token on heartbeat
        socket.on('auth:ping', () => {
            const freshToken = socket.handshake.auth?.token;
            if (!freshToken) {
                socket.emit('auth:expired');
                socket.disconnect(true);
                return;
            }
            try {
                jsonwebtoken_1.default.verify(freshToken, env_1.env.jwt.accessSecret);
                socket.emit('auth:pong', { valid: true });
            }
            catch {
                socket.emit('auth:expired');
                socket.disconnect(true);
            }
        });
    });
}
// ── Guard helper ──
// Use inside socket event handlers to ensure the user belongs to the target household
function requireHouseholdAccess(socket, targetHouseholdId) {
    if (socket.data.householdId !== targetHouseholdId) {
        socket.emit('error', {
            message: 'You do not have access to this household',
        });
        return false;
    }
    return true;
}
//# sourceMappingURL=socketAuth.js.map
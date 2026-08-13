"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerToken = registerToken;
exports.unregisterToken = unregisterToken;
exports.getHistory = getHistory;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.getUnreadCount = getUnreadCount;
exports.getPreferences = getPreferences;
exports.updatePreferences = updatePreferences;
const notificationService = __importStar(require("./service"));
function getUserId(req) {
    return req.user.userId;
}
async function registerToken(req, res, next) {
    try {
        await notificationService.registerToken(getUserId(req), req.body);
        res.status(201).json({ success: true, data: { message: 'Token registered' } });
    }
    catch (e) {
        next(e);
    }
}
async function unregisterToken(req, res, next) {
    try {
        await notificationService.unregisterToken(getUserId(req), req.params.token);
        res.status(200).json({ success: true, data: { message: 'Token removed' } });
    }
    catch (e) {
        next(e);
    }
}
async function getHistory(req, res, next) {
    try {
        const result = await notificationService.getHistory(getUserId(req), { limit: Number(req.query.limit) || 20, cursor: req.query.cursor });
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function markAsRead(req, res, next) {
    try {
        const result = await notificationService.markAsRead(req.params.id, getUserId(req));
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function markAllAsRead(_req, res, next) {
    try {
        await notificationService.markAllAsRead(_req.user.userId);
        res.status(200).json({ success: true, data: { message: 'All marked as read' } });
    }
    catch (e) {
        next(e);
    }
}
async function getUnreadCount(req, res, next) {
    try {
        const count = await notificationService.getUnreadCount(getUserId(req));
        res.status(200).json({ success: true, data: { count } });
    }
    catch (e) {
        next(e);
    }
}
async function getPreferences(req, res, next) {
    try {
        const result = await notificationService.getPreferences(getUserId(req));
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function updatePreferences(req, res, next) {
    try {
        const result = await notificationService.updatePreferences(getUserId(req), req.body);
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
//# sourceMappingURL=controller.js.map
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyUser = notifyUser;
exports.notifyHousehold = notifyHousehold;
const service_1 = require("../../modules/notification/service");
const logger_1 = __importDefault(require("../../shared/utils/logger"));
/**
 * Notify a single user about an event.
 * Wraps the notification service's sendToUser with common defaults.
 */
async function notifyUser(userId, type, title, body, data) {
    try {
        await (0, service_1.sendToUser)(userId, type, title, body, data);
    }
    catch (error) {
        logger_1.default.error(`[notifyUser] Failed to notify user ${userId}:`, error);
    }
}
/**
 * Notify all members of a household about an event.
 * Fetches all household member IDs and calls notifyUser for each.
 */
async function notifyHousehold(householdId, type, title, body, data, excludeUserId) {
    try {
        const { HouseholdMember } = await Promise.resolve().then(() => __importStar(require('../../database/models')));
        const memberships = await HouseholdMember.findAll({
            where: { householdId },
            attributes: ['userId'],
        });
        const userIds = memberships
            .map((m) => m.userId)
            .filter((id) => id !== excludeUserId);
        await Promise.all(userIds.map((userId) => notifyUser(userId, type, title, body, data)));
    }
    catch (error) {
        logger_1.default.error(`[notifyHousehold] Failed to notify household ${householdId}:`, error);
    }
}
//# sourceMappingURL=notifications.js.map
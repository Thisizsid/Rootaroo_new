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
exports.createItem = createItem;
exports.getItems = getItems;
exports.updateItem = updateItem;
exports.deleteItem = deleteItem;
exports.toggleComplete = toggleComplete;
exports.getSummary = getSummary;
const uuid_1 = require("uuid");
const models_1 = require("../../database/models");
const errors_1 = require("../../shared/utils/errors");
const logger_1 = __importDefault(require("../../shared/utils/logger"));
const notificationService = __importStar(require("../notification/service"));
function toAssignee(user) {
    if (!user)
        return null;
    return {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        avatarEmoji: user.avatarEmoji,
    };
}
async function getUserHousehold(userId) {
    const membership = await models_1.HouseholdMember.findOne({ where: { userId } });
    if (!membership)
        throw new errors_1.ForbiddenError('You must belong to a household');
    return membership.householdId;
}
function toTodoResponse(item) {
    return {
        id: item.id,
        title: item.title,
        dueDate: item.dueDate
            ? typeof item.dueDate === 'string'
                ? item.dueDate
                : item.dueDate.toISOString().split('T')[0]
            : null,
        assignedTo: toAssignee(item.get('assignee')),
        isCompleted: item.isCompleted,
        completedAt: item.completedAt ? item.completedAt.toISOString() : null,
        createdAt: item.createdAt.toISOString(),
    };
}
async function createItem(userId, body) {
    const householdId = await getUserHousehold(userId);
    const item = await models_1.TodoItem.create({
        id: (0, uuid_1.v4)(),
        householdId,
        title: body.title,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        assignedTo: body.assignedTo || null,
        isCompleted: false,
    });
    const full = await models_1.TodoItem.findByPk(item.id, {
        include: [{ model: models_1.User, as: 'assignee' }],
    });
    if (!full)
        throw new Error('Failed to load');
    // FR-087: Notify assignee (async, fire-and-forget)
    if (body.assignedTo && body.assignedTo !== userId) {
        notificationService.sendToUser(body.assignedTo, 'todo', 'New to-do assigned', `You were assigned: ${body.title}`, { todoId: item.id, type: 'todo' }).catch((e) => logger_1.default.warn('[Push] Todo notify failed:', e.message));
    }
    return toTodoResponse(full);
}
async function getItems(userId, filter = 'all') {
    const householdId = await getUserHousehold(userId);
    const where = { householdId };
    if (filter === 'assigned-to-me') {
        where.assignedTo = userId;
    }
    else if (filter === 'completed') {
        where.isCompleted = true;
    }
    const all = await models_1.TodoItem.findAll({
        where,
        include: [{ model: models_1.User, as: 'assignee' }],
        order: [['createdAt', 'DESC']],
    });
    const grouped = { pending: [], completed: [] };
    for (const item of all) {
        const resp = toTodoResponse(item);
        if (item.isCompleted) {
            grouped.completed.push(resp);
        }
        else {
            grouped.pending.push(resp);
        }
    }
    return grouped;
}
async function updateItem(itemId, userId, userRole, body) {
    const householdId = await getUserHousehold(userId);
    const item = await models_1.TodoItem.findOne({
        where: { id: itemId, householdId },
        include: [{ model: models_1.User, as: 'assignee' }],
    });
    if (!item)
        throw new errors_1.NotFoundError('To-do item');
    // Only the assignee or an admin can edit
    if (item.assignedTo && item.assignedTo !== userId && userRole !== 'admin') {
        throw new errors_1.ForbiddenError('Only the assignee or an admin can edit this to-do');
    }
    if (body.title !== undefined)
        item.title = body.title;
    if (body.dueDate !== undefined) {
        item.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }
    if (body.assignedTo !== undefined)
        item.assignedTo = body.assignedTo;
    await item.save();
    return toTodoResponse(item);
}
async function deleteItem(itemId, userId, userRole) {
    const householdId = await getUserHousehold(userId);
    const item = await models_1.TodoItem.findOne({ where: { id: itemId, householdId } });
    if (!item)
        throw new errors_1.NotFoundError('To-do item');
    // Only the assignee or an admin can delete
    if (item.assignedTo && item.assignedTo !== userId && userRole !== 'admin') {
        throw new errors_1.ForbiddenError('Only the assignee or an admin can delete this to-do');
    }
    await item.destroy();
}
async function toggleComplete(itemId, userId, userRole) {
    const householdId = await getUserHousehold(userId);
    const item = await models_1.TodoItem.findOne({
        where: { id: itemId, householdId },
        include: [{ model: models_1.User, as: 'assignee' }],
    });
    if (!item)
        throw new errors_1.NotFoundError('To-do item');
    // Only the assignee or an admin can toggle
    if (item.assignedTo && item.assignedTo !== userId && userRole !== 'admin') {
        throw new errors_1.ForbiddenError('Only the assignee or an admin can toggle this to-do');
    }
    if (item.isCompleted) {
        item.isCompleted = false;
        item.completedAt = null;
    }
    else {
        item.isCompleted = true;
        item.completedAt = new Date();
    }
    await item.save();
    return toTodoResponse(item);
}
async function getSummary(userId) {
    const householdId = await getUserHousehold(userId);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const all = await models_1.TodoItem.findAll({
        where: { householdId },
        attributes: ['id', 'isCompleted', 'completedAt'],
    });
    let pending = 0;
    let completedToday = 0;
    for (const item of all) {
        if (item.isCompleted) {
            if (item.completedAt && item.completedAt >= todayStart && item.completedAt <= todayEnd) {
                completedToday++;
            }
        }
        else {
            pending++;
        }
    }
    return { pending, completedToday };
}
//# sourceMappingURL=service.js.map
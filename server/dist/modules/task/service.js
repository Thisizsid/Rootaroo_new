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
exports.createTask = createTask;
exports.getTasks = getTasks;
exports.getTaskById = getTaskById;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
exports.completeTask = completeTask;
exports.reopenTask = reopenTask;
exports.getTaskSummary = getTaskSummary;
const uuid_1 = require("uuid");
const models_1 = require("../../database/models");
const errors_1 = require("../../shared/utils/errors");
const logger_1 = __importDefault(require("../../shared/utils/logger"));
const notificationService = __importStar(require("../notification/service"));
// ── Helpers ──
function toAuthorResponse(user) {
    return {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        avatarEmoji: user.avatarEmoji,
    };
}
function toAssigneeResponse(user) {
    return {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        avatarEmoji: user.avatarEmoji,
    };
}
async function getUserHousehold(userId) {
    const membership = await models_1.HouseholdMember.findOne({ where: { userId } });
    if (!membership) {
        throw new errors_1.ForbiddenError('You must belong to a household to manage tasks');
    }
    return membership.householdId;
}
function todayStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}
function todayEnd() {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
}
function computeNextDueDate(currentDueDate, rule) {
    if (!currentDueDate || rule === 'none')
        return null;
    const date = new Date(currentDueDate);
    switch (rule) {
        case 'daily':
            date.setDate(date.getDate() + 1);
            break;
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        default:
            return null;
    }
    return date.toISOString().split('T')[0];
}
function toISODateString(value) {
    if (!value)
        return null;
    if (typeof value === 'string') {
        // already "YYYY-MM-DD" or an ISO string — normalise to date portion only
        return value.split('T')[0];
    }
    return value.toISOString().split('T')[0];
}
function toISOTimestamp(value) {
    if (!value)
        return null;
    if (typeof value === 'string')
        return new Date(value).toISOString();
    return value.toISOString();
}
function toTaskResponse(task) {
    return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: toISODateString(task.dueDate),
        recurrence: task.recurrence,
        recurrenceEndDate: toISODateString(task.recurrenceEndDate),
        assignees: (task.get('assignees') || []).map(toAssigneeResponse),
        createdBy: toAuthorResponse(task.get('creator')),
        completedBy: task.get('completer')
            ? toAuthorResponse(task.get('completer'))
            : null,
        completedAt: toISOTimestamp(task.completedAt),
        createdAt: toISOTimestamp(task.createdAt) ?? '',
    };
}
// ── Public Methods ──
/** FR-060/061: Create task with assignees. */
async function createTask(userId, body) {
    const householdId = await getUserHousehold(userId);
    const task = await models_1.Task.create({
        id: (0, uuid_1.v4)(),
        householdId,
        createdBy: userId,
        title: body.title,
        description: body.description || null,
        dueDate: body.dueDate || null,
        status: 'pending',
        recurrence: body.recurrence || 'none',
        recurrenceEndDate: body.recurrenceEndDate || null,
    });
    if (body.assigneeIds && body.assigneeIds.length > 0) {
        await models_1.TaskAssignee.bulkCreate(body.assigneeIds.map((assigneeId) => ({
            id: (0, uuid_1.v4)(),
            taskId: task.id,
            userId: assigneeId,
        })));
    }
    const fullTask = await models_1.Task.findByPk(task.id, {
        include: [
            { model: models_1.User, as: 'creator' },
            { model: models_1.User, as: 'completer' },
            { model: models_1.User, as: 'assignees' },
        ],
    });
    if (!fullTask)
        throw new Error('Failed to load created task');
    // FR-062: Notify assignees (async, fire-and-forget)
    const assigneeIds = body.assigneeIds || [];
    for (const assigneeId of assigneeIds) {
        notificationService.sendToUser(assigneeId, 'task', 'New task assigned', `You were assigned: ${body.title}`, { taskId: task.id, type: 'task' }).catch((e) => logger_1.default.warn('[Push] Task notify failed:', e.message));
    }
    return toTaskResponse(fullTask);
}
/** FR-065: List tasks with optional grouping. */
async function getTasks(userId, options) {
    const householdId = await getUserHousehold(userId);
    const include = [
        { model: models_1.User, as: 'creator' },
        { model: models_1.User, as: 'completer' },
        { model: models_1.User, as: 'assignees' },
    ];
    if (options.group === 'status') {
        const allTasks = await models_1.Task.findAll({
            where: { householdId },
            include,
            order: [['createdAt', 'DESC']],
        });
        const now = new Date();
        const start = todayStart();
        const end = todayEnd();
        const grouped = {
            pending: [],
            overdue: [],
            completedToday: [],
        };
        for (const t of allTasks) {
            const resp = toTaskResponse(t);
            if (t.status === 'completed') {
                if (t.completedAt && t.completedAt >= start && t.completedAt <= end) {
                    grouped.completedToday.push(resp);
                }
            }
            else if (t.dueDate && new Date(t.dueDate) < now) {
                grouped.overdue.push(resp);
            }
            else {
                grouped.pending.push(resp);
            }
        }
        return grouped;
    }
    const where = { householdId };
    if (options.status)
        where.status = options.status;
    const tasks = await models_1.Task.findAll({
        where,
        include,
        order: [['createdAt', 'DESC']],
    });
    return tasks.map(toTaskResponse);
}
/** FR-060: Get a single task. */
async function getTaskById(taskId, userId) {
    const householdId = await getUserHousehold(userId);
    const task = await models_1.Task.findOne({
        where: { id: taskId, householdId },
        include: [
            { model: models_1.User, as: 'creator' },
            { model: models_1.User, as: 'completer' },
            { model: models_1.User, as: 'assignees' },
        ],
    });
    if (!task)
        throw new errors_1.NotFoundError('Task');
    return toTaskResponse(task);
}
/** FR-066: Edit task (creator or admin only). */
async function updateTask(taskId, userId, userRole, body) {
    const householdId = await getUserHousehold(userId);
    const task = await models_1.Task.findOne({
        where: { id: taskId, householdId },
        include: [
            { model: models_1.User, as: 'creator' },
            { model: models_1.User, as: 'completer' },
            { model: models_1.User, as: 'assignees' },
        ],
    });
    if (!task)
        throw new errors_1.NotFoundError('Task');
    if (task.createdBy !== userId && userRole !== 'admin') {
        throw new errors_1.ForbiddenError('Only the creator or an admin can edit this task');
    }
    if (body.title !== undefined)
        task.title = body.title;
    if (body.description !== undefined)
        task.description = body.description;
    if (body.dueDate !== undefined) {
        task.dueDate = body.dueDate || null;
    }
    if (body.recurrence !== undefined)
        task.recurrence = body.recurrence;
    if (body.recurrenceEndDate !== undefined) {
        task.recurrenceEndDate = body.recurrenceEndDate || null;
    }
    await task.save();
    return toTaskResponse(task);
}
/** FR-067: Delete task (creator or admin only). */
async function deleteTask(taskId, userId, userRole) {
    const householdId = await getUserHousehold(userId);
    const task = await models_1.Task.findOne({ where: { id: taskId, householdId } });
    if (!task)
        throw new errors_1.NotFoundError('Task');
    if (task.createdBy !== userId && userRole !== 'admin') {
        throw new errors_1.ForbiddenError('Only the creator or an admin can delete this task');
    }
    await task.destroy();
}
/** FR-063: Complete a task. FR-068: Clone recurring if applicable. */
async function completeTask(taskId, userId) {
    const householdId = await getUserHousehold(userId);
    const task = await models_1.Task.findOne({
        where: { id: taskId, householdId },
        include: [
            { model: models_1.User, as: 'creator' },
            { model: models_1.User, as: 'completer' },
            { model: models_1.User, as: 'assignees' },
        ],
    });
    if (!task)
        throw new errors_1.NotFoundError('Task');
    // Only assignees can complete
    const assignees = task.get('assignees') || [];
    if (!assignees.some((a) => a.id === userId)) {
        throw new errors_1.ForbiddenError('Only assigned members can complete this task');
    }
    task.status = 'completed';
    task.completedBy = userId;
    task.completedAt = new Date();
    await task.save();
    // FR-068: Clone recurring task
    if (task.recurrence !== 'none') {
        const nextDueDate = computeNextDueDate(toISODateString(task.dueDate), task.recurrence);
        if (nextDueDate &&
            (!task.recurrenceEndDate || new Date(nextDueDate) <= new Date(task.recurrenceEndDate))) {
            const newTask = await models_1.Task.create({
                id: (0, uuid_1.v4)(),
                householdId: task.householdId,
                createdBy: task.createdBy,
                title: task.title,
                description: task.description,
                dueDate: nextDueDate,
                status: 'pending',
                recurrence: task.recurrence,
                recurrenceEndDate: task.recurrenceEndDate,
            });
            const assignees = await models_1.TaskAssignee.findAll({
                where: { taskId: task.id },
            });
            if (assignees.length > 0) {
                await models_1.TaskAssignee.bulkCreate(assignees.map((a) => ({
                    id: (0, uuid_1.v4)(),
                    taskId: newTask.id,
                    userId: a.userId,
                })));
            }
        }
    }
    return toTaskResponse(task);
}
/** FR-064: Re-open a completed task. */
async function reopenTask(taskId, userId, userRole) {
    const householdId = await getUserHousehold(userId);
    const task = await models_1.Task.findOne({
        where: { id: taskId, householdId },
        include: [
            { model: models_1.User, as: 'creator' },
            { model: models_1.User, as: 'completer' },
            { model: models_1.User, as: 'assignees' },
        ],
    });
    if (!task)
        throw new errors_1.NotFoundError('Task');
    // Only admin or the member who completed the task can reopen
    if (userRole !== 'admin' && task.completedBy !== userId) {
        throw new errors_1.ForbiddenError('Only admin or the member who completed this task can reopen it');
    }
    task.status = 'reopened';
    task.completedBy = null;
    task.completedAt = null;
    await task.save();
    return toTaskResponse(task);
}
/** FR-069: Dashboard summary counts. */
async function getTaskSummary(userId) {
    const householdId = await getUserHousehold(userId);
    const now = new Date();
    const start = todayStart();
    const end = todayEnd();
    const allTasks = await models_1.Task.findAll({
        where: { householdId },
        attributes: ['id', 'status', 'dueDate', 'completedAt'],
    });
    let pending = 0;
    let overdue = 0;
    let completedToday = 0;
    for (const t of allTasks) {
        if (t.status === 'completed') {
            if (t.completedAt && t.completedAt >= start && t.completedAt <= end) {
                completedToday++;
            }
        }
        else if (t.dueDate && new Date(t.dueDate) < now) {
            overdue++;
        }
        else {
            pending++;
        }
    }
    return { pending, overdue, completedToday };
}
//# sourceMappingURL=service.js.map
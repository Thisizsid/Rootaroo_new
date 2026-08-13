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
const service_1 = require("../service");
const models = __importStar(require("../../../database/models"));
const userId = '550e8400-e29b-41d4-a716-446655440001';
const otherUserId = '660e8400-e29b-41d4-a716-446655440002';
const householdId = '770e8400-e29b-41d4-a716-446655440003';
const taskId = '880e8400-e29b-41d4-a716-446655440004';
jest.mock('../../../database/models', () => ({
    Task: {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByPk: jest.fn(),
    },
    TaskAssignee: {
        create: jest.fn(),
        findAll: jest.fn(),
        bulkCreate: jest.fn(),
    },
    User: {},
    HouseholdMember: {
        findOne: jest.fn(),
    },
}));
const mockUser = {
    id: userId,
    displayName: 'Test User',
    avatarUrl: null,
    avatarEmoji: null,
    email: 'test@example.com',
};
function fakeTask(overrides = {}) {
    return {
        id: taskId,
        householdId,
        createdBy: userId,
        title: 'Test task',
        description: 'A task description',
        dueDate: new Date('2026-07-20'),
        status: 'pending',
        recurrence: 'none',
        recurrenceEndDate: null,
        completedAt: null,
        completedBy: null,
        createdAt: new Date('2026-07-10'),
        updatedAt: new Date('2026-07-10'),
        deletedAt: null,
        get: jest.fn((key) => {
            if (key === 'creator')
                return mockUser;
            if (key === 'completer')
                return null;
            if (key === 'assignees')
                return [];
            return undefined;
        }),
        save: jest.fn().mockResolvedValue(true),
        destroy: jest.fn(),
        ...overrides,
    };
}
const modelsMock = models;
beforeEach(() => {
    jest.clearAllMocks();
});
describe('Task Service', () => {
    describe('createTask', () => {
        it('creates a task with title and returns it', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            modelsMock.Task.create.mockResolvedValue(fakeTask());
            modelsMock.Task.findByPk.mockResolvedValue(fakeTask());
            const result = await (0, service_1.createTask)(userId, { title: 'Test task' });
            expect(result.title).toBe('Test task');
            expect(result.status).toBe('pending');
            expect(modelsMock.Task.create).toHaveBeenCalled();
        });
        it('throws ForbiddenError if user has no household', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue(null);
            await expect((0, service_1.createTask)(userId, { title: 'Test' })).rejects.toThrow('You must belong to a household');
        });
    });
    describe('getTasks', () => {
        it('returns flat list of tasks', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            modelsMock.Task.findAll.mockResolvedValue([fakeTask()]);
            const result = await (0, service_1.getTasks)(userId, {});
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(1);
        });
        it('returns grouped tasks when group=status', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const overdueTask = fakeTask({
                dueDate: new Date('2025-01-01'),
                status: 'pending',
            });
            const completedTask = fakeTask({
                status: 'completed',
                completedAt: new Date(),
                completedBy: userId,
            });
            modelsMock.Task.findAll.mockResolvedValue([overdueTask, completedTask]);
            const result = await (0, service_1.getTasks)(userId, { group: 'status' });
            expect(result).toHaveProperty('pending');
            expect(result).toHaveProperty('overdue');
            expect(result).toHaveProperty('completedToday');
        });
    });
    describe('getTaskById', () => {
        it('returns a task by ID', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            modelsMock.Task.findOne.mockResolvedValue(fakeTask());
            const result = await (0, service_1.getTaskById)(taskId, userId);
            expect(result.title).toBe('Test task');
            expect(modelsMock.Task.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: taskId, householdId } }));
        });
        it('throws NotFoundError for missing task', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            modelsMock.Task.findOne.mockResolvedValue(null);
            await expect((0, service_1.getTaskById)(taskId, userId)).rejects.toThrow('Task not found');
        });
    });
    describe('updateTask', () => {
        it('allows creator to update task', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const task = fakeTask();
            modelsMock.Task.findOne.mockResolvedValue(task);
            await (0, service_1.updateTask)(taskId, userId, 'member', { title: 'Updated title' });
            expect(task.title).toBe('Updated title');
            expect(task.save).toHaveBeenCalled();
        });
        it('forbids non-creator, non-admin from updating', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            modelsMock.Task.findOne.mockResolvedValue(fakeTask());
            await expect((0, service_1.updateTask)(taskId, otherUserId, 'member', { title: 'Hacked' })).rejects.toThrow('Only the creator or an admin can edit this task');
        });
    });
    describe('deleteTask', () => {
        it('allows creator to delete task', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const task = fakeTask();
            modelsMock.Task.findOne.mockResolvedValue(task);
            await (0, service_1.deleteTask)(taskId, userId, 'member');
            expect(task.destroy).toHaveBeenCalled();
        });
        it('allows admin to delete any task', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const task = fakeTask({ createdBy: otherUserId });
            modelsMock.Task.findOne.mockResolvedValue(task);
            await (0, service_1.deleteTask)(taskId, otherUserId, 'admin');
            expect(task.destroy).toHaveBeenCalled();
        });
        it('prevents non-creator, non-admin from deleting', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const task = fakeTask({ createdBy: otherUserId });
            task.destroy = jest.fn();
            modelsMock.Task.findOne.mockResolvedValue(task);
            await expect((0, service_1.deleteTask)(taskId, 'stranger', 'member')).rejects.toThrow('Only the creator or an admin can delete this task');
            expect(task.destroy).not.toHaveBeenCalled();
        });
    });
    describe('completeTask / reopenTask', () => {
        it('completes a task with timestamp', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const task = fakeTask({
                get: jest.fn((key) => {
                    if (key === 'creator')
                        return mockUser;
                    if (key === 'completer')
                        return null;
                    if (key === 'assignees')
                        return [mockUser];
                    return undefined;
                }),
            });
            modelsMock.Task.findOne.mockResolvedValue(task);
            const result = await (0, service_1.completeTask)(taskId, userId);
            expect(result.status).toBe('completed');
            expect(result.completedAt).toBeTruthy();
        });
        it('re-opens a completed task', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const task = fakeTask({ status: 'completed', completedAt: new Date(), completedBy: userId });
            modelsMock.Task.findOne.mockResolvedValue(task);
            const result = await (0, service_1.reopenTask)(taskId, userId, 'admin');
            expect(result.status).toBe('reopened');
            expect(result.completedAt).toBeNull();
        });
        it('creates a recurring task clone on completion', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const task = fakeTask({
                status: 'pending',
                recurrence: 'daily',
                dueDate: '2026-07-10',
                get: jest.fn((key) => {
                    if (key === 'creator')
                        return mockUser;
                    if (key === 'completer')
                        return null;
                    if (key === 'assignees')
                        return [mockUser];
                    return undefined;
                }),
            });
            modelsMock.Task.findOne.mockResolvedValue(task);
            modelsMock.Task.create.mockResolvedValue(fakeTask({ id: 'new-task-id' }));
            modelsMock.TaskAssignee.findAll.mockResolvedValue([]);
            const result = await (0, service_1.completeTask)(taskId, userId);
            expect(result.status).toBe('completed');
            expect(modelsMock.Task.create).toHaveBeenCalledTimes(1);
        });
    });
    describe('getTaskSummary', () => {
        it('returns pending/overdue/completed-today counts', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            modelsMock.Task.findAll.mockResolvedValue([
                { status: 'completed', completedAt: new Date(), id: '1' },
                { status: 'pending', dueDate: new Date(Date.now() - 86400000), id: '2' },
                { status: 'pending', dueDate: new Date(Date.now() + 86400000), id: '3' },
            ]);
            const result = await (0, service_1.getTaskSummary)(userId);
            expect(result.completedToday).toBe(1);
            expect(result.overdue).toBe(1);
            expect(result.pending).toBe(1);
        });
    });
});
//# sourceMappingURL=task.service.test.js.map
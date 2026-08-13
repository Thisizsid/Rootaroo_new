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
const householdId = '770e8400-e29b-41d4-a716-446655440003';
const itemId = 'aa0e8400-e29b-41d4-a716-446655440006';
jest.mock('../../../database/models', () => ({
    TodoItem: {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByPk: jest.fn(),
    },
    User: {},
    HouseholdMember: { findOne: jest.fn() },
}));
function fakeItem(overrides = {}) {
    return {
        id: itemId,
        householdId,
        title: 'Buy milk',
        dueDate: new Date('2026-07-25'),
        assignedTo: null,
        isCompleted: false,
        completedAt: null,
        createdAt: new Date('2026-07-10'),
        updatedAt: new Date('2026-07-10'),
        deletedAt: null,
        get: jest.fn((key) => {
            if (key === 'assignee')
                return null;
            return undefined;
        }),
        save: jest.fn().mockResolvedValue(true),
        destroy: jest.fn(),
        ...overrides,
    };
}
const modelsMock = models;
beforeEach(() => { jest.clearAllMocks(); });
describe('Todo Service', () => {
    describe('createItem', () => {
        it('creates a todo item', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            modelsMock.TodoItem.create.mockResolvedValue(fakeItem());
            modelsMock.TodoItem.findByPk.mockResolvedValue(fakeItem());
            const result = await (0, service_1.createItem)(userId, { title: 'Buy milk' });
            expect(result.title).toBe('Buy milk');
            expect(result.isCompleted).toBe(false);
        });
        it('throws if no household', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue(null);
            await expect((0, service_1.createItem)(userId, { title: 'Test' })).rejects.toThrow('belong to a household');
        });
    });
    describe('getItems', () => {
        it('returns grouped todos', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            modelsMock.TodoItem.findAll.mockResolvedValue([
                fakeItem({ title: 'Pending' }),
                fakeItem({ title: 'Done', isCompleted: true, completedAt: new Date() }),
            ]);
            const result = await (0, service_1.getItems)(userId);
            expect(result.pending).toHaveLength(1);
            expect(result.completed).toHaveLength(1);
        });
    });
    describe('updateItem', () => {
        it('updates title', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const item = fakeItem();
            modelsMock.TodoItem.findOne.mockResolvedValue(item);
            await (0, service_1.updateItem)(itemId, userId, 'admin', { title: 'Updated' });
            expect(item.title).toBe('Updated');
            expect(item.save).toHaveBeenCalled();
        });
    });
    describe('deleteItem', () => {
        it('deletes', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const item = fakeItem();
            modelsMock.TodoItem.findOne.mockResolvedValue(item);
            await (0, service_1.deleteItem)(itemId, userId, 'admin');
            expect(item.destroy).toHaveBeenCalled();
        });
    });
    describe('toggleComplete', () => {
        it('marks complete then incomplete', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const item = fakeItem();
            modelsMock.TodoItem.findOne.mockResolvedValue(item);
            await (0, service_1.toggleComplete)(itemId, userId, 'admin');
            expect(item.isCompleted).toBe(true);
            expect(item.completedAt).toBeTruthy();
        });
    });
    describe('getSummary', () => {
        it('returns counts', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            modelsMock.TodoItem.findAll.mockResolvedValue([
                { id: '1', isCompleted: false, completedAt: null },
                { id: '2', isCompleted: true, completedAt: new Date() },
                { id: '3', isCompleted: false, completedAt: null },
            ]);
            const result = await (0, service_1.getSummary)(userId);
            expect(result.pending).toBe(2);
            expect(result.completedToday).toBe(1);
        });
    });
});
//# sourceMappingURL=todo.service.test.js.map
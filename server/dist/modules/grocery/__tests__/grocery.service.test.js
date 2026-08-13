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
const itemId = '990e8400-e29b-41d4-a716-446655440005';
jest.mock('../../../database/models', () => ({
    GroceryItem: {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByPk: jest.fn(),
    },
    User: {},
    HouseholdMember: {
        findOne: jest.fn(),
    },
}));
function fakeItem(overrides = {}) {
    return {
        id: itemId,
        householdId,
        name: 'Milk',
        quantity: '1 gallon',
        note: null,
        assignedTo: null,
        isBought: false,
        boughtBy: null,
        boughtAt: null,
        archivedAt: null,
        createdAt: new Date('2026-07-10'),
        updatedAt: new Date('2026-07-10'),
        deletedAt: null,
        get: jest.fn((key) => {
            if (key === 'assignee')
                return null;
            if (key === 'buyer')
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
describe('Grocery Service', () => {
    describe('createItem', () => {
        it('creates a grocery item', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            modelsMock.GroceryItem.create.mockResolvedValue(fakeItem());
            modelsMock.GroceryItem.findByPk.mockResolvedValue(fakeItem());
            const result = await (0, service_1.createItem)(userId, { name: 'Milk' });
            expect(result.name).toBe('Milk');
            expect(result.isBought).toBe(false);
            expect(modelsMock.GroceryItem.create).toHaveBeenCalled();
        });
        it('throws if no household', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue(null);
            await expect((0, service_1.createItem)(userId, { name: 'Milk' })).rejects.toThrow('You must belong to a household');
        });
    });
    describe('getItems', () => {
        it('returns grouped groceries', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            modelsMock.GroceryItem.findAll.mockResolvedValue([
                fakeItem({ name: 'Pending item' }),
                fakeItem({ name: 'Bought item', isBought: true, boughtBy: userId, boughtAt: new Date() }),
                fakeItem({ name: 'Archived item', isBought: true, archivedAt: new Date() }),
            ]);
            const result = await (0, service_1.getItems)(userId);
            expect(result.pending).toHaveLength(1);
            expect(result.bought).toHaveLength(1);
            expect(result.archived).toHaveLength(1);
        });
    });
    describe('updateItem', () => {
        it('updates item fields', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const item = fakeItem();
            modelsMock.GroceryItem.findOne.mockResolvedValue(item);
            await (0, service_1.updateItem)(itemId, userId, 'admin', { name: 'Oat Milk' });
            expect(item.name).toBe('Oat Milk');
            expect(item.save).toHaveBeenCalled();
        });
    });
    describe('deleteItem', () => {
        it('deletes an item', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const item = fakeItem();
            modelsMock.GroceryItem.findOne.mockResolvedValue(item);
            await (0, service_1.deleteItem)(itemId, userId, 'admin');
            expect(item.destroy).toHaveBeenCalled();
        });
    });
    describe('toggleBought', () => {
        it('marks item as bought', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const item = fakeItem({ get: (key) => {
                    if (key === 'assignee')
                        return null;
                    if (key === 'buyer')
                        return null;
                    return undefined;
                } });
            modelsMock.GroceryItem.findOne.mockResolvedValue(item);
            await (0, service_1.toggleBought)(itemId, userId, 'admin');
            expect(item.isBought).toBe(true);
            expect(item.boughtBy).toBe(userId);
        });
        it('un-marks item as not bought', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const item = fakeItem({ isBought: true, boughtBy: userId, boughtAt: new Date(), get: (_key) => null });
            modelsMock.GroceryItem.findOne.mockResolvedValue(item);
            await (0, service_1.toggleBought)(itemId, userId, 'admin');
            expect(item.isBought).toBe(false);
            expect(item.boughtBy).toBeNull();
        });
    });
    describe('archiveItem', () => {
        it('sets archivedAt', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            const item = fakeItem({ isBought: true });
            modelsMock.GroceryItem.findOne.mockResolvedValue(item);
            await (0, service_1.archiveItem)(itemId, userId, 'admin');
            expect(item.archivedAt).toBeTruthy();
        });
    });
    describe('getSummary', () => {
        it('returns pending and bought-today counts', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            modelsMock.GroceryItem.findAll.mockResolvedValue([
                { id: '1', isBought: false, boughtAt: null, archivedAt: null },
                { id: '2', isBought: true, boughtAt: new Date(), archivedAt: null },
                { id: '3', isBought: false, boughtAt: null, archivedAt: null },
            ]);
            const result = await (0, service_1.getSummary)(userId);
            expect(result.pending).toBe(2);
            expect(result.boughtToday).toBe(1);
        });
    });
});
//# sourceMappingURL=grocery.service.test.js.map
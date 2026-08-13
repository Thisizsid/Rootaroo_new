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
const taskService = __importStar(require("../../task/service"));
const groceryService = __importStar(require("../../grocery/service"));
const todoService = __importStar(require("../../todo/service"));
const notificationService = __importStar(require("../../notification/service"));
const errors_1 = require("../../../shared/utils/errors");
const sequelize_1 = require("sequelize");
const userId = '550e8400-e29b-41d4-a716-446655440001';
const householdId = '770e8400-e29b-41d4-a716-446655440003';
const otherUserId = '660e8400-e29b-41d4-a716-446655440002';
jest.mock('../../../database/models', () => ({
    HouseholdMember: {
        findOne: jest.fn(),
        count: jest.fn(),
    },
    User: {
        findByPk: jest.fn(),
    },
}));
jest.mock('../../task/service', () => ({
    getTaskSummary: jest.fn(),
}));
jest.mock('../../grocery/service', () => ({
    getSummary: jest.fn(),
}));
jest.mock('../../todo/service', () => ({
    getSummary: jest.fn(),
}));
jest.mock('../../notification/service', () => ({
    getUnreadCount: jest.fn(),
    sendToUser: jest.fn(),
}));
jest.mock('../../../shared/utils/logger');
const modelsMock = models;
beforeEach(() => {
    jest.clearAllMocks();
});
describe('Dashboard Service', () => {
    describe('getDashboard', () => {
        it('returns aggregated dashboard data', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            taskService.getTaskSummary.mockResolvedValue({ pending: 3, overdue: 1, completedToday: 2 });
            groceryService.getSummary.mockResolvedValue({ pending: 5, boughtToday: 0 });
            todoService.getSummary.mockResolvedValue({ pending: 2, completedToday: 1 });
            notificationService.getUnreadCount.mockResolvedValue(4);
            const result = await (0, service_1.getDashboard)(userId);
            expect(result.tasks).toEqual({ pending: 3, overdue: 1, completedToday: 2 });
            expect(result.groceries).toEqual({ pending: 5 });
            expect(result.todos).toEqual({ pending: 2, completedToday: 1 });
            expect(result.notifications).toEqual({ unreadCount: 4 });
            expect(result.activity).toHaveLength(7);
            expect(result.activity[0]).toHaveProperty('date');
            expect(result.activity[0]).toHaveProperty('tasksCompleted');
        });
        it('throws ForbiddenError when user has no household', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue(null);
            await expect((0, service_1.getDashboard)(userId)).rejects.toThrow(errors_1.ForbiddenError);
        });
    });
    describe('quickNotify', () => {
        it('sends notification to selected members', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            modelsMock.HouseholdMember.count.mockResolvedValue(1);
            modelsMock.User.findByPk.mockResolvedValue({ displayName: 'Sender' });
            notificationService.sendToUser.mockResolvedValue(undefined);
            await (0, service_1.quickNotify)(userId, 'checked in', [otherUserId]);
            expect(modelsMock.HouseholdMember.count).toHaveBeenCalledWith({
                where: { householdId, userId: { [sequelize_1.Op.in]: [otherUserId] } },
            });
            expect(notificationService.sendToUser).toHaveBeenCalledWith(otherUserId, 'check_in', 'Sender checked in', 'Quick update from Sender', { type: 'check_in' });
        });
        it('throws ForbiddenError for invalid member', async () => {
            modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId });
            modelsMock.HouseholdMember.count.mockResolvedValue(0);
            await expect((0, service_1.quickNotify)(userId, 'checked in', [otherUserId])).rejects.toThrow(errors_1.ForbiddenError);
        });
    });
});
//# sourceMappingURL=dashboard.service.test.js.map
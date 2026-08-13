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
const express_1 = require("express");
const auth_1 = require("../../shared/middleware/auth");
const rbac_1 = require("../../shared/middleware/rbac");
const validate_1 = require("../../shared/middleware/validate");
const validation_1 = require("./validation");
const ctrl = __importStar(require("./controller"));
const router = (0, express_1.Router)();
// All household endpoints require auth
router.use(auth_1.authenticate);
router.post('/', (0, validate_1.validate)(validation_1.createHouseholdSchema), ctrl.create);
router.get('/', ctrl.listMyHouseholds);
router.get('/:id', ctrl.getById);
// Invitations
router.post('/:id/invitations', (0, rbac_1.requireRole)('member'), ctrl.generateInvitation);
router.post('/join', (0, validate_1.validate)(validation_1.joinHouseholdSchema), ctrl.join);
// Member management
router.get('/:id/members', ctrl.listMembers);
router.delete('/:id/members/:userId', ctrl.removeMember);
router.patch('/:id/members/:userId/role', (0, validate_1.validate)(validation_1.changeMemberRoleSchema), ctrl.changeMemberRole);
// Leave / Transfer
router.post('/:id/leave', ctrl.leave);
router.post('/:id/transfer', (0, validate_1.validate)(validation_1.transferAdminSchema), ctrl.transferAdmin);
exports.default = router;
//# sourceMappingURL=routes.js.map
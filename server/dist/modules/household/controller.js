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
exports.create = create;
exports.getById = getById;
exports.listMyHouseholds = listMyHouseholds;
exports.generateInvitation = generateInvitation;
exports.join = join;
exports.removeMember = removeMember;
exports.leave = leave;
exports.transferAdmin = transferAdmin;
exports.changeMemberRole = changeMemberRole;
exports.listMembers = listMembers;
const householdService = __importStar(require("./service"));
function getUserId(req) {
    return req.user.userId;
}
async function create(req, res, next) {
    try {
        const result = await householdService.createHousehold(getUserId(req), req.body);
        res.status(201).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function getById(req, res, next) {
    try {
        const result = await householdService.getHousehold(req.params.id, getUserId(req));
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function listMyHouseholds(req, res, next) {
    try {
        const result = await householdService.listUserHouseholds(getUserId(req));
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function generateInvitation(req, res, next) {
    try {
        const result = await householdService.generateInvitation(getUserId(req), req.params.id);
        res.status(201).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function join(req, res, next) {
    try {
        const result = await householdService.joinViaCode(getUserId(req), req.body);
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function removeMember(req, res, next) {
    try {
        await householdService.removeMember(getUserId(req), req.params.id, req.params.userId);
        res.status(200).json({ success: true, data: { message: 'Member removed successfully' } });
    }
    catch (e) {
        next(e);
    }
}
async function leave(req, res, next) {
    try {
        await householdService.leaveHousehold(getUserId(req), req.params.id);
        res.status(200).json({ success: true, data: { message: 'Left household successfully' } });
    }
    catch (e) {
        next(e);
    }
}
async function transferAdmin(req, res, next) {
    try {
        const result = await householdService.transferAdmin(getUserId(req), req.params.id, req.body.newAdminId);
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function changeMemberRole(req, res, next) {
    try {
        const result = await householdService.changeMemberRole(getUserId(req), req.params.id, req.params.userId, req.body);
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function listMembers(req, res, next) {
    try {
        const result = await householdService.listMembers(req.params.id, getUserId(req));
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
//# sourceMappingURL=controller.js.map
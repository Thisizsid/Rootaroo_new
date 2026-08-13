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
exports.sendMessageCtrl = sendMessageCtrl;
exports.listMessagesCtrl = listMessagesCtrl;
exports.getMessageByIdCtrl = getMessageByIdCtrl;
exports.updateMessageCtrl = updateMessageCtrl;
exports.deleteMessageCtrl = deleteMessageCtrl;
exports.addReactionCtrl = addReactionCtrl;
exports.removeReactionCtrl = removeReactionCtrl;
exports.createConversationCtrl = createConversationCtrl;
exports.getUserConversationsCtrl = getUserConversationsCtrl;
exports.addParticipantCtrl = addParticipantCtrl;
exports.removeParticipantCtrl = removeParticipantCtrl;
exports.typingCtrl = typingCtrl;
exports.deleteConversationCtrl = deleteConversationCtrl;
const chatService = __importStar(require("./service"));
function getUserId(req) {
    return req.user.userId;
}
function getUserRole(req) {
    return req.user.role;
}
async function sendMessageCtrl(req, res, next) {
    try {
        const result = await chatService.sendMessage(getUserId(req), req.body);
        res.status(201).json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
}
async function listMessagesCtrl(req, res, next) {
    try {
        const result = await chatService.listMessages(getUserId(req), req.query);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
}
async function getMessageByIdCtrl(req, res, next) {
    try {
        const result = await chatService.getMessageById(req.params.id, getUserId(req));
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
}
async function updateMessageCtrl(req, res, next) {
    try {
        const result = await chatService.updateMessage(req.params.id, getUserId(req), getUserRole(req), req.body);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
}
async function deleteMessageCtrl(req, res, next) {
    try {
        await chatService.deleteMessage(req.params.id, getUserId(req), getUserRole(req));
        res.json({ success: true, data: { message: 'Message deleted' } });
    }
    catch (err) {
        next(err);
    }
}
async function addReactionCtrl(req, res, next) {
    try {
        const result = await chatService.addReaction(req.params.id, getUserId(req), req.body.emoji);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
}
async function removeReactionCtrl(req, res, next) {
    try {
        const result = await chatService.removeReaction(req.params.id, getUserId(req), req.params.emoji);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
}
// ── Conversation Controllers ──
async function createConversationCtrl(req, res, next) {
    try {
        const result = await chatService.createConversation(getUserId(req), req.body);
        res.status(201).json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
}
async function getUserConversationsCtrl(req, res, next) {
    try {
        const result = await chatService.getUserConversations(getUserId(req));
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
}
async function addParticipantCtrl(req, res, next) {
    try {
        await chatService.addParticipant(req.params.id, req.body.userId, getUserId(req));
        res.json({ success: true, data: { message: 'Participant added' } });
    }
    catch (err) {
        next(err);
    }
}
async function removeParticipantCtrl(req, res, next) {
    try {
        await chatService.removeParticipant(req.params.id, req.params.userId, getUserId(req));
        res.json({ success: true, data: { message: 'Participant removed' } });
    }
    catch (err) {
        next(err);
    }
}
async function typingCtrl(req, res, next) {
    try {
        const action = req.query.action;
        if (action === 'start') {
            await chatService.typingStart(getUserId(req));
        }
        else {
            await chatService.typingStop(getUserId(req));
        }
        res.json({ success: true, data: { typing: action === 'start' } });
    }
    catch (err) {
        next(err);
    }
}
async function deleteConversationCtrl(req, res, next) {
    try {
        await chatService.deleteConversation(req.params.id, getUserId(req));
        res.json({ success: true, data: { message: 'Conversation deleted' } });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map
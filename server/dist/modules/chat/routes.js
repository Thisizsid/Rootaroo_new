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
const validate_1 = require("../../shared/middleware/validate");
const ctrl = __importStar(require("./controller"));
const validation_1 = require("./validation");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Conversations — must be registered before /:id so "conversations" is not treated as a message id
router.post('/conversations', (0, validate_1.validate)(validation_1.createConversationSchema), ctrl.createConversationCtrl);
router.get('/conversations', ctrl.getUserConversationsCtrl);
router.delete('/conversations/:id', (0, validate_1.validate)(validation_1.conversationIdParamSchema), ctrl.deleteConversationCtrl);
router.post('/conversations/:id/participants', (0, validate_1.validate)(validation_1.addParticipantSchema), ctrl.addParticipantCtrl);
router.delete('/conversations/:id/participants/:userId', (0, validate_1.validate)(validation_1.conversationIdParamSchema), ctrl.removeParticipantCtrl);
// Typing indicator — before /:id
router.post('/typing', (0, validate_1.validate)(validation_1.typingSchema), ctrl.typingCtrl); // FR-149
// Chat CRUD
router.post('/', (0, validate_1.validate)(validation_1.createMessageSchema), ctrl.sendMessageCtrl); // FR-140/143/144
router.get('/', (0, validate_1.validate)(validation_1.messageQuerySchema), ctrl.listMessagesCtrl); // FR-140
router.get('/:id', (0, validate_1.validate)(validation_1.messageIdParamSchema), ctrl.getMessageByIdCtrl);
router.patch('/:id', (0, validate_1.validate)(validation_1.updateMessageSchema), ctrl.updateMessageCtrl); // FR-150
router.delete('/:id', (0, validate_1.validate)(validation_1.messageIdParamSchema), ctrl.deleteMessageCtrl); // FR-145/146
// Reactions
router.post('/:id/reactions', (0, validate_1.validate)(validation_1.reactionSchema), ctrl.addReactionCtrl); // FR-148
router.delete('/:id/reactions/:emoji', (0, validate_1.validate)(validation_1.deleteReactionSchema), ctrl.removeReactionCtrl);
exports.default = router;
//# sourceMappingURL=routes.js.map
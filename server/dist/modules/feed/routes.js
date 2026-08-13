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
const upload_1 = require("../../shared/middleware/upload");
const validation_1 = require("./validation");
const router = (0, express_1.Router)();
// All feed routes require authentication
router.use(auth_1.authenticate);
// Post CRUD
router.post('/', (0, validate_1.validate)(validation_1.createPostSchema), ctrl.create); // FR-040/041/042/043
router.get('/', (0, validate_1.validate)(validation_1.feedQuerySchema), ctrl.list); // FR-040/046/050
router.get('/:postId', ctrl.getById); // FR-040
router.delete('/:postId', ctrl.remove); // FR-048/049
// Likes
router.post('/:postId/like', ctrl.toggleLike); // FR-044
router.delete('/:postId/like', ctrl.removeLike); // FR-044
// Comments
router.get('/:postId/comments', (0, validate_1.validate)(validation_1.commentQuerySchema), ctrl.listComments); // FR-045
router.post('/:postId/comments', (0, validate_1.validate)(validation_1.createCommentSchema), ctrl.addComment); // FR-045
router.delete('/comments/:commentId', ctrl.removeComment); // FR-045
// Media upload (for FR-042/043)
router.post('/media/upload', upload_1.uploadFeedMedia.array('files', 10), ctrl.uploadMedia); // FR-042/043
exports.default = router;
//# sourceMappingURL=routes.js.map
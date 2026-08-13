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
exports.list = list;
exports.getById = getById;
exports.remove = remove;
exports.toggleLike = toggleLike;
exports.removeLike = removeLike;
exports.addComment = addComment;
exports.removeComment = removeComment;
exports.listComments = listComments;
exports.uploadMedia = uploadMedia;
const feedService = __importStar(require("./service"));
const cloudinary_1 = require("../../shared/utils/cloudinary");
function getUserId(req) {
    return req.user.userId;
}
function getUserRole(req) {
    return req.user.role;
}
async function create(req, res, next) {
    try {
        const result = await feedService.createPost(getUserId(req), req.body);
        res.status(201).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function list(req, res, next) {
    try {
        const result = await feedService.getFeed(getUserId(req), req.query);
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function getById(req, res, next) {
    try {
        const result = await feedService.getPostById(req.params.postId, getUserId(req));
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function remove(req, res, next) {
    try {
        await feedService.deletePost(req.params.postId, getUserId(req), getUserRole(req));
        res.status(200).json({ success: true, data: { message: 'Post deleted successfully' } });
    }
    catch (e) {
        next(e);
    }
}
async function toggleLike(req, res, next) {
    try {
        const liked = await feedService.likePost(req.params.postId, getUserId(req));
        res.status(200).json({ success: true, data: { liked } });
    }
    catch (e) {
        next(e);
    }
}
async function removeLike(req, res, next) {
    try {
        await feedService.unlikePost(req.params.postId, getUserId(req));
        res.status(200).json({ success: true, data: { message: 'Like removed' } });
    }
    catch (e) {
        next(e);
    }
}
async function addComment(req, res, next) {
    try {
        const result = await feedService.addComment(req.params.postId, getUserId(req), req.body);
        res.status(201).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function removeComment(req, res, next) {
    try {
        await feedService.deleteComment(req.params.commentId, getUserId(req), getUserRole(req));
        res.status(200).json({ success: true, data: { message: 'Comment deleted' } });
    }
    catch (e) {
        next(e);
    }
}
async function listComments(req, res, next) {
    try {
        const result = await feedService.getComments(req.params.postId, getUserId(req), req.query);
        res.status(200).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
}
async function uploadMedia(req, res, next) {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ success: false, error: 'No files provided' });
            return;
        }
        const results = await Promise.all(files.map(async (f) => {
            const isVideo = f.mimetype.startsWith('video/');
            const result = await (0, cloudinary_1.uploadBuffer)(f.buffer, {
                folder: isVideo ? 'rootaru/feed/videos' : 'rootaru/feed/images',
                public_id: f.originalname.replace(/\.[^.]+$/, ''),
                resource_type: isVideo ? 'video' : 'image',
            });
            return {
                fileName: result.public_id,
                url: result.secure_url,
                size: result.bytes,
                mimetype: f.mimetype,
            };
        }));
        res.status(201).json({ success: true, data: results });
    }
    catch (e) {
        next(e);
    }
}
//# sourceMappingURL=controller.js.map
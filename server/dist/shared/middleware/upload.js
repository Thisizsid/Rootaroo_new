"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFeedMedia = exports.uploadAvatar = void 0;
const multer_1 = __importDefault(require("multer"));
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
const ALLOWED = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS];
const imageFilter = (_req, file, cb) => {
    const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
    if (IMAGE_EXTENSIONS.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Only images (${IMAGE_EXTENSIONS.join(', ')}) are allowed.`));
    }
};
const mediaFilter = (_req, file, cb) => {
    const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
    if (ALLOWED.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Only images and videos (${ALLOWED.join(', ')}) are allowed.`));
    }
};
const memory = multer_1.default.memoryStorage();
exports.uploadAvatar = (0, multer_1.default)({
    storage: memory,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('avatar');
exports.uploadFeedMedia = (0, multer_1.default)({
    storage: memory,
    fileFilter: mediaFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB (covers max 2min 720p video)
});
//# sourceMappingURL=upload.js.map
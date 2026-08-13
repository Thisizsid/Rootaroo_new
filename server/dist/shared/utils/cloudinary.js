"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBuffer = uploadBuffer;
exports.deleteResource = deleteResource;
const cloudinary_1 = require("cloudinary");
const env_1 = require("../../config/env");
const logger_1 = __importDefault(require("./logger"));
cloudinary_1.v2.config({
    cloud_name: env_1.env.cloudinary.cloudName,
    api_key: env_1.env.cloudinary.apiKey,
    api_secret: env_1.env.cloudinary.apiSecret,
});
const BASE_OPTIONS = {
    folder: 'rootaru',
    resource_type: 'auto',
};
/**
 * Upload a file buffer to Cloudinary.
 *
 * @param buffer  Raw file bytes
 * @param options Overrides (e.g. `{ folder: 'rootaru/avatars', public_id: '...' }`)
 * @returns Upload result with `secure_url`, `public_id`, `bytes`, etc.
 */
async function uploadBuffer(buffer, options) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({ ...BASE_OPTIONS, ...options }, (error, result) => {
            if (error) {
                logger_1.default.error('[Cloudinary] Upload failed:', error.message);
                reject(error);
            }
            else if (result) {
                resolve(result);
            }
            else {
                reject(new Error('Cloudinary upload returned no result'));
            }
        });
        stream.end(buffer);
    });
}
/**
 * Delete a resource by its Cloudinary public_id.
 */
async function deleteResource(publicId) {
    await cloudinary_1.v2.uploader.destroy(publicId);
}
//# sourceMappingURL=cloudinary.js.map
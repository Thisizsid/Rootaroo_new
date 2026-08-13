"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeAndRekeySchema = exports.storeUserKeySchema = exports.keyRotationSchema = exports.keyCeremonySchema = exports.vaultDocumentQuerySchema = exports.updateVaultDocumentSchema = exports.createVaultDocumentSchema = void 0;
const zod_1 = require("zod");
exports.createVaultDocumentSchema = {
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255),
        mimeType: zod_1.z.string().regex(/^(image\/|application\/pdf)/, 'Only images and PDFs allowed'),
        sizeBytes: zod_1.z.number().int().positive().max(20 * 1024 * 1024),
        encryptedKey: zod_1.z.string().min(1),
        iv: zod_1.z.string().min(1),
    }),
};
exports.updateVaultDocumentSchema = {
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255).optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
};
exports.vaultDocumentQuerySchema = {
    query: zod_1.z.object({
        cursor: zod_1.z.string().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).optional(),
    }),
};
exports.keyCeremonySchema = {
    body: zod_1.z.object({
        wrappedKeys: zod_1.z.array(zod_1.z.object({
            userId: zod_1.z.string().uuid(),
            wrappedKey: zod_1.z.string().min(1),
        })).min(1),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
};
exports.keyRotationSchema = {
    body: zod_1.z.object({
        documents: zod_1.z.array(zod_1.z.object({
            documentId: zod_1.z.string().uuid(),
            wrappedKeys: zod_1.z.array(zod_1.z.object({
                userId: zod_1.z.string().uuid(),
                wrappedKey: zod_1.z.string().min(1),
            })).min(1),
        })).min(1),
    }),
};
exports.storeUserKeySchema = {
    body: zod_1.z.object({
        publicKey: zod_1.z.string().min(1),
        privateKeyEncrypted: zod_1.z.string().min(1),
    }),
};
exports.revokeAndRekeySchema = {
    body: zod_1.z.object({
        revokedUserId: zod_1.z.string().uuid(),
        documents: zod_1.z.array(zod_1.z.object({
            documentId: zod_1.z.string().uuid(),
            wrappedKeys: zod_1.z.array(zod_1.z.object({
                userId: zod_1.z.string().uuid(),
                wrappedKey: zod_1.z.string().min(1),
            })).min(1),
        })).min(1),
    }),
    params: zod_1.z.object({
        memberId: zod_1.z.string().uuid(),
    }),
};
//# sourceMappingURL=validation.js.map
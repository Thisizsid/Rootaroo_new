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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vaultUpload = void 0;
exports.uploadDocumentCtrl = uploadDocumentCtrl;
exports.listDocumentsCtrl = listDocumentsCtrl;
exports.getDocumentByIdCtrl = getDocumentByIdCtrl;
exports.updateDocumentCtrl = updateDocumentCtrl;
exports.deleteDocumentCtrl = deleteDocumentCtrl;
exports.hardDeleteDocumentCtrl = hardDeleteDocumentCtrl;
exports.getStorageUsageCtrl = getStorageUsageCtrl;
exports.storeUserKeyCtrl = storeUserKeyCtrl;
exports.getUserKeyCtrl = getUserKeyCtrl;
exports.getHouseholdPublicKeysCtrl = getHouseholdPublicKeysCtrl;
exports.performKeyCeremonyCtrl = performKeyCeremonyCtrl;
exports.rotateVaultKeyCtrl = rotateVaultKeyCtrl;
exports.getDocumentKeyCtrl = getDocumentKeyCtrl;
exports.getHouseholdKeyStatusCtrl = getHouseholdKeyStatusCtrl;
exports.revokeAndRekeyCtrl = revokeAndRekeyCtrl;
const vaultService = __importStar(require("./service"));
const multer_1 = __importDefault(require("multer"));
exports.vaultUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
}).single('file');
function getUserId(req) {
    return req.user.userId;
}
function getUserRole(req) {
    return req.user.role;
}
async function uploadDocumentCtrl(req, res, next) {
    try {
        if (!req.file) {
            return next(new Error('No file uploaded'));
        }
        const document = await vaultService.uploadDocument(getUserId(req), req.body, req.file.buffer);
        res.status(201).json({ success: true, data: document });
    }
    catch (error) {
        next(error);
    }
}
async function listDocumentsCtrl(req, res, next) {
    try {
        const result = await vaultService.listDocuments(getUserId(req), req.query);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
}
async function getDocumentByIdCtrl(req, res, next) {
    try {
        const document = await vaultService.getDocumentById(req.params.id, getUserId(req));
        res.json({ success: true, data: document });
    }
    catch (error) {
        next(error);
    }
}
async function updateDocumentCtrl(req, res, next) {
    try {
        const document = await vaultService.updateDocument(req.params.id, getUserId(req), getUserRole(req), req.body);
        res.json({ success: true, data: document });
    }
    catch (error) {
        next(error);
    }
}
async function deleteDocumentCtrl(req, res, next) {
    try {
        await vaultService.deleteDocument(req.params.id, getUserId(req), getUserRole(req));
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
async function hardDeleteDocumentCtrl(req, res, next) {
    try {
        await vaultService.hardDeleteDocument(req.params.id, getUserId(req), getUserRole(req));
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
async function getStorageUsageCtrl(req, res, next) {
    try {
        const usage = await vaultService.getStorageUsage(getUserId(req));
        res.json({ success: true, data: usage });
    }
    catch (error) {
        next(error);
    }
}
async function storeUserKeyCtrl(req, res, next) {
    try {
        const key = await vaultService.storeUserKey(getUserId(req), req.body);
        res.status(201).json({ success: true, data: key });
    }
    catch (error) {
        next(error);
    }
}
async function getUserKeyCtrl(req, res, next) {
    try {
        const key = await vaultService.getUserKey(getUserId(req));
        res.json({ success: true, data: key });
    }
    catch (error) {
        next(error);
    }
}
async function getHouseholdPublicKeysCtrl(req, res, next) {
    try {
        const householdId = await vaultService.getUserHousehold(getUserId(req));
        const keys = await vaultService.getHouseholdPublicKeys(householdId);
        res.json({ success: true, data: keys });
    }
    catch (error) {
        next(error);
    }
}
async function performKeyCeremonyCtrl(req, res, next) {
    try {
        const result = await vaultService.performKeyCeremony(req.params.id, getUserId(req), req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
}
async function rotateVaultKeyCtrl(req, res, next) {
    try {
        const result = await vaultService.rotateVaultKey(getUserId(req), req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
}
async function getDocumentKeyCtrl(req, res, next) {
    try {
        const key = await vaultService.getDocumentKey(req.params.id, getUserId(req));
        res.json({ success: true, data: key });
    }
    catch (error) {
        next(error);
    }
}
async function getHouseholdKeyStatusCtrl(req, res, next) {
    try {
        const status = await vaultService.getHouseholdKeyStatus(getUserId(req));
        res.json({ success: true, data: status });
    }
    catch (error) {
        next(error);
    }
}
async function revokeAndRekeyCtrl(req, res, next) {
    try {
        const result = await vaultService.revokeAndRekeyMember(getUserId(req), getUserRole(req), req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=controller.js.map
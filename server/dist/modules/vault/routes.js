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
const controller_1 = require("./controller");
const validation_1 = require("./validation");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Document CRUD
router.post('/', controller_1.vaultUpload, (0, validate_1.validate)(validation_1.createVaultDocumentSchema), ctrl.uploadDocumentCtrl);
router.get('/', (0, validate_1.validate)(validation_1.vaultDocumentQuerySchema), ctrl.listDocumentsCtrl);
router.get('/summary', ctrl.getStorageUsageCtrl);
// Key management
router.get('/keys/status', ctrl.getHouseholdKeyStatusCtrl);
router.get('/keys', ctrl.getHouseholdPublicKeysCtrl);
router.get('/keys/me', ctrl.getUserKeyCtrl);
router.post('/keys/me', (0, validate_1.validate)(validation_1.storeUserKeySchema), ctrl.storeUserKeyCtrl);
router.post('/keys/rotate', (0, validate_1.validate)(validation_1.keyRotationSchema), ctrl.rotateVaultKeyCtrl);
// Member revocation + rekey (admin only)
// POST body contains revokedUserId + re-wrapped keys for all remaining members
router.post('/keys/revoke', (0, validate_1.validate)(validation_1.revokeAndRekeySchema), ctrl.revokeAndRekeyCtrl);
// Document routes (must come after static /keys routes to avoid prefix conflicts)
router.get('/:id', ctrl.getDocumentByIdCtrl);
router.patch('/:id', (0, validate_1.validate)(validation_1.updateVaultDocumentSchema), ctrl.updateDocumentCtrl);
router.delete('/:id', ctrl.deleteDocumentCtrl);
// Per-user wrapped key for a document
router.get('/:id/key', ctrl.getDocumentKeyCtrl);
// Hard delete (admin only, FR-130)
router.delete('/:id/hard', ctrl.hardDeleteDocumentCtrl);
// Key ceremony (FR-132) — client provides real RSA-wrapped AES keys
router.post('/:id/key-ceremony', (0, validate_1.validate)(validation_1.keyCeremonySchema), ctrl.performKeyCeremonyCtrl);
exports.default = router;
//# sourceMappingURL=routes.js.map
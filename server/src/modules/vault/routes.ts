import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import * as ctrl from './controller';
import { vaultUpload } from './controller';
import {
  createVaultDocumentSchema,
  updateVaultDocumentSchema,
  vaultDocumentQuerySchema,
  storeUserKeySchema,
  keyCeremonySchema,
  keyRotationSchema,
  revokeAndRekeySchema,
} from './validation';

const router = Router();

router.use(authenticate);

// Document CRUD
router.post('/', vaultUpload, validate(createVaultDocumentSchema), ctrl.uploadDocumentCtrl);
router.get('/', validate(vaultDocumentQuerySchema), ctrl.listDocumentsCtrl);
router.get('/summary', ctrl.getStorageUsageCtrl);

// Key management
router.get('/keys/status', ctrl.getHouseholdKeyStatusCtrl);
router.get('/keys', ctrl.getHouseholdPublicKeysCtrl);
router.get('/keys/me', ctrl.getUserKeyCtrl);
router.post('/keys/me', validate(storeUserKeySchema), ctrl.storeUserKeyCtrl);
router.post('/keys/rotate', validate(keyRotationSchema), ctrl.rotateVaultKeyCtrl);

// Member revocation + rekey (admin only)
// POST body contains revokedUserId + re-wrapped keys for all remaining members
router.post('/keys/revoke', validate(revokeAndRekeySchema), ctrl.revokeAndRekeyCtrl);

// Document routes (must come after static /keys routes to avoid prefix conflicts)
router.get('/:id', ctrl.getDocumentByIdCtrl);
router.patch('/:id', validate(updateVaultDocumentSchema), ctrl.updateDocumentCtrl);
router.delete('/:id', ctrl.deleteDocumentCtrl);

// Per-user wrapped key for a document
router.get('/:id/key', ctrl.getDocumentKeyCtrl);

// Hard delete (admin only, FR-130)
router.delete('/:id/hard', ctrl.hardDeleteDocumentCtrl);

// Key ceremony (FR-132) — client provides real RSA-wrapped AES keys
router.post('/:id/key-ceremony', validate(keyCeremonySchema), ctrl.performKeyCeremonyCtrl);

export default router;
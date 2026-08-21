import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import { uploadFeedMedia } from '../../shared/middleware/upload';
import * as ctrl from './controller';
import {
  createEntrySchema,
  updateEntrySchema,
  entryIdParamSchema,
  entryQuerySchema,
} from './validation';

const router = Router();

router.use(authenticate);

// Media upload — before /:id
router.post('/media/upload', uploadFeedMedia.array('files', 10), ctrl.uploadMedia);

// Journal CRUD
router.post('/', validate(createEntrySchema), ctrl.create);
router.get('/', validate(entryQuerySchema), ctrl.list);
router.get('/:id', validate(entryIdParamSchema), ctrl.getById);
router.patch('/:id', validate(updateEntrySchema), ctrl.update);
router.delete('/:id', validate(entryIdParamSchema), ctrl.remove);

export default router;

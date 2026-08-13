import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import * as ctrl from './controller';
import { createTodoSchema, updateTodoSchema } from './validation';

const router = Router();

router.use(authenticate);

router.post('/', validate(createTodoSchema), ctrl.create);    // FR-070
router.get('/', ctrl.list);                                     // FR-075
router.patch('/:id', validate(updateTodoSchema), ctrl.update);  // FR-073
router.delete('/:id', ctrl.remove);                             // FR-072
router.post('/:id/toggle', ctrl.toggle);                        // FR-071
router.get('/summary', ctrl.summary);                           // FR-076

export default router;

import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import * as ctrl from './controller';
import {
  createEventSchema,
  listEventsQuerySchema,
  updateEventSchema,
  connectGoogleCalendarSchema,
} from './validation';

const router = Router();

router.use(authenticate);

router.post('/', validate(createEventSchema), ctrl.create);     // FR-181: create family event
router.get('/', validate(listEventsQuerySchema), ctrl.list);    // FR-180/182: household events
router.get('/export.ics', ctrl.exportIcs);                      // FR-185: iCalendar export (must precede /:id)

// Google Calendar two-way sync (must precede /:id)
router.get('/google/status', ctrl.googleStatus);
router.post('/google/connect', validate(connectGoogleCalendarSchema), ctrl.googleConnect);
router.post('/google/disconnect', ctrl.googleDisconnect);

router.get('/:id', ctrl.getById);                               // FR: single event detail
router.patch('/:id', validate(updateEventSchema), ctrl.update); // FR-187/188: edit
router.delete('/:id', ctrl.remove);                             // FR-187/188: delete

export default router;

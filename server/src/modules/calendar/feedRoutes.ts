import { Router } from 'express';
import * as ctrl from './controller';

/**
 * Public, unauthenticated router for the Outlook ICS subscription feed —
 * Microsoft's servers poll this URL directly with no Rootaroo auth token,
 * so it must be mounted outside the `authenticate`-gated `/events` router.
 * The feed token itself is the only access control (a capability URL).
 */
const router = Router();

router.get('/:token.ics', ctrl.outlookFeed);

export default router;

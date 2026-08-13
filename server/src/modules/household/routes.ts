import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { requireRole } from '../../shared/middleware/rbac';
import { validate } from '../../shared/middleware/validate';
import { createHouseholdSchema, joinHouseholdSchema, transferAdminSchema, changeMemberRoleSchema, scheduleHouseholdDeletionSchema } from './validation';
import * as ctrl from './controller';

const router = Router();

// All household endpoints require auth
router.use(authenticate);

router.post('/', validate(createHouseholdSchema), ctrl.create);
router.get('/', ctrl.listMyHouseholds);
router.get('/:id', ctrl.getById);

// Invitations
router.post('/:id/invitations', requireRole('member'), ctrl.generateInvitation);
router.post('/join', validate(joinHouseholdSchema), ctrl.join);

// Member management
router.get('/:id/members', ctrl.listMembers);
router.delete('/:id/members/:userId', ctrl.removeMember);
router.patch('/:id/members/:userId/role', validate(changeMemberRoleSchema), ctrl.changeMemberRole);

// Leave / Transfer
router.post('/:id/leave', ctrl.leave);
router.post('/:id/transfer', validate(transferAdminSchema), ctrl.transferAdmin);

// Deletion (admin-only, password-confirmed, 30-day grace)
router.post('/:id/schedule-deletion', validate(scheduleHouseholdDeletionSchema), ctrl.scheduleDeletion);
router.post('/:id/cancel-deletion', ctrl.cancelDeletion);
router.post('/:id/confirm-deletion', validate(scheduleHouseholdDeletionSchema), ctrl.confirmDeletion);

export default router;

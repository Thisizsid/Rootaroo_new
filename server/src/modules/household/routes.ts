import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { requireRole } from '../../shared/middleware/rbac';
import { validate } from '../../shared/middleware/validate';
import { uploadHouseholdCover } from '../../shared/middleware/upload';
import { createHouseholdSchema, joinHouseholdSchema, transferAdminSchema, changeMemberRoleSchema, scheduleHouseholdDeletionSchema } from './validation';
import * as ctrl from './controller';

const router = Router();

// All household endpoints require auth
router.use(authenticate);

/**
 * @openapi
 * /households:
 *   post:
 *     tags: [Household]
 *     summary: Create a household (caller becomes its admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Household created
 *       409:
 *         description: Caller already belongs to a household
 *   get:
 *     tags: [Household]
 *     summary: List households the caller belongs to
 *     responses:
 *       200:
 *         description: List of households
 */
router.post('/', validate(createHouseholdSchema), ctrl.create);
router.get('/', ctrl.listMyHouseholds);

/**
 * @openapi
 * /households/{id}:
 *   get:
 *     tags: [Household]
 *     summary: Get a household by id (caller must be a member)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Household details. inviteCode is null for non-admin members.
 *       404:
 *         description: Not found (also returned if caller isn't a member, to avoid leaking existence)
 */
router.get('/:id', ctrl.getById);

// Invitations

/**
 * @openapi
 * /households/{id}/invitations:
 *   post:
 *     tags: [Household]
 *     summary: Generate a one-time, 7-day invitation code (member role or higher)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Invitation created
 *       403:
 *         description: Children cannot generate invitations
 */
router.post('/:id/invitations', requireRole('member'), ctrl.generateInvitation);

/**
 * @openapi
 * /households/join:
 *   post:
 *     tags: [Household]
 *     summary: Join a household via a one-time invitation code or the household's permanent invite code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Joined
 *       409:
 *         description: Already belongs to a household, or already a member
 */
router.post('/join', validate(joinHouseholdSchema), ctrl.join);

/**
 * @openapi
 * /households/{id}/invite-code/rotate:
 *   post:
 *     tags: [Household]
 *     summary: Rotate the household's permanent invite code (admin-only)
 *     description: >
 *       Invalidates the previous permanent code immediately. Use this if the
 *       code may have leaked (former member, screenshot, etc.).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: New invite code issued
 *       403:
 *         description: Caller is not an admin
 */
router.post('/:id/invite-code/rotate', requireRole('admin'), ctrl.rotateInviteCode);

// Cover photo (admin-only)
router.post('/:id/cover-photo', requireRole('admin'), uploadHouseholdCover, ctrl.uploadCoverPhoto);
router.delete('/:id/cover-photo', requireRole('admin'), ctrl.removeCoverPhoto);

// Member management
router.get('/:id/members', ctrl.listMembers);
router.delete('/:id/members/:userId', ctrl.removeMember);

/**
 * @openapi
 * /households/{id}/members/{userId}/role:
 *   patch:
 *     tags: [Household]
 *     summary: Change a member's role (admin-only)
 *     description: >
 *       Cannot promote to admin — that only happens via /transfer, which
 *       demotes the caller as part of the same swap (single-admin model).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [member, child] }
 *     responses:
 *       200:
 *         description: Role changed
 *       400:
 *         description: Attempted to set role to admin
 */
router.patch('/:id/members/:userId/role', validate(changeMemberRoleSchema), ctrl.changeMemberRole);

// Leave / Transfer
router.post('/:id/leave', ctrl.leave);
router.post('/:id/transfer', validate(transferAdminSchema), ctrl.transferAdmin);

/**
 * @openapi
 * /households/{id}/schedule-deletion:
 *   post:
 *     tags: [Household]
 *     summary: Schedule the household for deletion in 30 days (admin-only)
 *     description: >
 *       Password-holding admins must confirm their password. Password-less
 *       (OAuth/phone) admins must present a freshly issued access token
 *       (re-authenticated within the last 5 minutes) instead.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Deletion scheduled
 *       401:
 *         description: Invalid password, or token too old for a password-less account
 * /households/{id}/cancel-deletion:
 *   post:
 *     tags: [Household]
 *     summary: Cancel a scheduled deletion (admin-only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deletion cancelled
 * /households/{id}/confirm-deletion:
 *   post:
 *     tags: [Household]
 *     summary: Confirm and finalize a scheduled deletion (admin-only)
 *     description: >
 *       Requires the 30-day grace period to have already elapsed — cannot
 *       be called before scheduling, or before the window passes.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Household deleted
 *       400:
 *         description: Deletion not scheduled, or the 30-day window hasn't elapsed
 */
router.post('/:id/schedule-deletion', validate(scheduleHouseholdDeletionSchema), ctrl.scheduleDeletion);
router.post('/:id/cancel-deletion', ctrl.cancelDeletion);
router.post('/:id/confirm-deletion', validate(scheduleHouseholdDeletionSchema), ctrl.confirmDeletion);

export default router;

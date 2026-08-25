import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Household, HouseholdMember, Invitation, User, Conversation, ConversationParticipant } from '../../database/models';
import { ConflictError, NotFoundError, ForbiddenError, AppError } from '../../shared/utils/errors';
import { getSignedUrl } from '../../shared/utils/s3';
import * as notificationService from '../../shared/services/notifications';
import type {
  CreateHouseholdBody, HouseholdResponse, InvitationResponse, JoinHouseholdBody,
  MemberResponse, ChangeRoleBody, ScheduleHouseholdDeletionBody,
} from './types';

function generateCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Keep the household's 'household'-type conversation (the "Everyone" chat)
 * in sync with actual membership. No-op if that conversation doesn't exist
 * yet (created lazily, on first use, from the chat module).
 */
async function addToHouseholdConversation(householdId: string, userId: string): Promise<void> {
  const conv = await Conversation.findOne({ where: { householdId, type: 'household' } });
  if (!conv) return;
  const existing = await ConversationParticipant.findOne({ where: { conversationId: conv.id, userId } });
  if (existing) return;
  await ConversationParticipant.create({ id: uuidv4(), conversationId: conv.id, userId });
}

async function removeFromHouseholdConversation(householdId: string, userId: string): Promise<void> {
  const conv = await Conversation.findOne({ where: { householdId, type: 'household' } });
  if (!conv) return;
  await ConversationParticipant.destroy({ where: { conversationId: conv.id, userId } });
}

async function toHouseholdResponse(household: Household, role: string, memberCount: number): Promise<HouseholdResponse> {
  return {
    id: household.id,
    name: household.name,
    inviteCode: household.inviteCode,
    memberCount,
    role,
    coverPhotoUrl: await getSignedUrl(household.coverPhotoUrl),
    createdAt: household.createdAt.toISOString(),
    scheduledDeletionAt: household.scheduledDeletionAt ? household.scheduledDeletionAt.toISOString() : null,
  };
}

export async function createHousehold(
  userId: string,
  body: CreateHouseholdBody,
): Promise<HouseholdResponse> {
  const { name } = body;

  const existing = await HouseholdMember.findOne({ where: { userId } });
  if (existing) {
    throw new ConflictError('You already belong to a household. Leave it first to create a new one.');
  }

  const inviteCode = generateCode();
  const household = await Household.create({ id: uuidv4(), name, inviteCode });

  await HouseholdMember.create({
    id: uuidv4(), householdId: household.id, userId, role: 'admin', joinedAt: new Date(),
  });

  await User.update({ role: 'admin' }, { where: { id: userId } });

  return await toHouseholdResponse(household, 'admin', 1);
}

export async function getHousehold(householdId: string, userId: string): Promise<HouseholdResponse> {
  const household = await Household.findByPk(householdId);
  if (!household) throw new NotFoundError('Household');

  const membership = await HouseholdMember.findOne({ where: { householdId, userId } });
  if (!membership) throw new NotFoundError('Household');

  const memberCount = await HouseholdMember.count({ where: { householdId } });

  return await toHouseholdResponse(household, membership.role, memberCount);
}

export async function listUserHouseholds(userId: string): Promise<HouseholdResponse[]> {
  const memberships = await HouseholdMember.findAll({
    where: { userId },
    include: [{ model: Household, as: 'household' }],
  });

  return Promise.all(
    memberships.map(async (m) => {
      const count = await HouseholdMember.count({ where: { householdId: m.householdId } });
      return await toHouseholdResponse(m.household!, m.role, count);
    }),
  );
}

export async function generateInvitation(
  userId: string,
  householdId: string,
): Promise<InvitationResponse> {
  // Verify membership + role
  const membership = await HouseholdMember.findOne({ where: { householdId, userId } });
  if (!membership) throw new NotFoundError('Household');
  if (membership.role === 'child') {
    throw new ForbiddenError('Children cannot generate invitations');
  }

  // Generate unique code
  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
  } while (await Invitation.findOne({ where: { code } }) && attempts < 5);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await Invitation.create({
    id: uuidv4(),
    householdId,
    invitedBy: userId,
    code,
    expiresAt,
  });

  return {
    id: invitation.id,
    code,
    expiresAt: expiresAt.toISOString(),
    shareLink: `rootaru://join?code=${code}`,
  };
}

export async function joinViaCode(userId: string, body: JoinHouseholdBody): Promise<HouseholdResponse> {
  const { code } = body;

  // Check user doesn't already belong to a household
  const existing = await HouseholdMember.findOne({ where: { userId } });
  if (existing) {
    throw new ConflictError('You already belong to a household. Leave it first to join another.');
  }

  // First: look up an Invitation record by code
  const invitation = await Invitation.findOne({
    where: { code },
    include: [{ model: Household, as: 'household' }],
  });

  let household: Household;

  if (invitation) {
    if (!invitation.household) {
      throw new AppError(500, 'Invitation references a deleted household');
    }
    if (invitation.expiresAt < new Date()) {
      throw new AppError(410, 'Invitation has expired. Ask the household admin for a new one.');
    }
    if (invitation.acceptedAt) {
      throw new ConflictError('This invitation has already been used.');
    }
    household = invitation.household;
  } else {
    // Fallback: check the household's permanent invite code
    const h = await Household.findOne({ where: { inviteCode: code } });
    if (!h) {
      throw new NotFoundError('Invitation');
    }
    household = h;
  }

  // Check that the user isn't already a member (double-check)
  const alreadyMember = await HouseholdMember.findOne({ where: { householdId: household.id, userId } });
  if (alreadyMember) {
    throw new ConflictError('You are already a member of this household.');
  }

  // Join
  await HouseholdMember.create({
    id: uuidv4(),
    householdId: household.id,
    userId,
    role: 'member',
    joinedAt: new Date(),
  });

  await User.update({ role: 'member' }, { where: { id: userId } });
  await addToHouseholdConversation(household.id, userId);

  // Mark invitation as accepted if using an invitation record
  if (invitation && !invitation.acceptedAt) {
    await invitation.update({ acceptedAt: new Date() });
  }

  const memberCount = await HouseholdMember.count({
    where: { householdId: household.id },
  });

  return await toHouseholdResponse(household, 'member', memberCount);
}

export async function updateCoverPhoto(
  userId: string,
  householdId: string,
  coverPhotoUrl: string | null,
): Promise<HouseholdResponse> {
  const membership = await getMembership(householdId, userId);
  if (membership.role !== 'admin') {
    throw new ForbiddenError('Only admins can change the household cover photo');
  }

  const household = await Household.findByPk(householdId);
  if (!household) throw new NotFoundError('Household');

  household.coverPhotoUrl = coverPhotoUrl;
  await household.save();

  const memberCount = await HouseholdMember.count({ where: { householdId } });
  return await toHouseholdResponse(household, membership.role, memberCount);
}

export async function removeCoverPhoto(userId: string, householdId: string): Promise<HouseholdResponse> {
  return updateCoverPhoto(userId, householdId, null);
}

// ── Member Management ──

async function getMembership(householdId: string, userId: string): Promise<HouseholdMember> {
  const membership = await HouseholdMember.findOne({ where: { householdId, userId } });
  if (!membership) throw new NotFoundError('Household');
  return membership;
}

export async function removeMember(
  adminUserId: string,
  householdId: string,
  targetUserId: string,
): Promise<void> {
  const membership = await getMembership(householdId, adminUserId);
  if (membership.role !== 'admin') {
    throw new ForbiddenError('Only admins can remove members');
  }
  if (targetUserId === adminUserId) {
    throw new AppError(400, 'Use the leave endpoint to remove yourself');
  }

  const target = await HouseholdMember.findOne({ where: { householdId, userId: targetUserId } });
  if (!target) throw new NotFoundError('Member');
  if (target.role === 'admin') {
    throw new ForbiddenError('Cannot remove another admin. Transfer their role first.');
  }

  await target.destroy();
  await removeFromHouseholdConversation(householdId, targetUserId);
}

export async function leaveHousehold(userId: string, householdId: string): Promise<void> {
  const membership = await getMembership(householdId, userId);
  if (membership.role === 'admin') {
    throw new ForbiddenError(
      'Transfer admin role to another member before leaving the household.',
    );
  }
  await membership.destroy();
  await User.update({ role: 'member' }, { where: { id: userId } });
  await removeFromHouseholdConversation(householdId, userId);
}

export async function transferAdmin(
  userId: string,
  householdId: string,
  newAdminId: string,
): Promise<HouseholdResponse> {
  const membership = await getMembership(householdId, userId);
  if (membership.role !== 'admin') {
    throw new ForbiddenError('Only admins can transfer the admin role');
  }
  if (newAdminId === userId) {
    throw new AppError(400, 'You are already the admin');
  }

  const newAdmin = await HouseholdMember.findOne({ where: { householdId, userId: newAdminId } });
  if (!newAdmin) throw new NotFoundError('Member');

  await membership.update({ role: 'member' });
  await newAdmin.update({ role: 'admin' });

  await User.update({ role: 'member' }, { where: { id: userId } });
  await User.update({ role: 'admin' }, { where: { id: newAdminId } });

  const memberCount = await HouseholdMember.count({ where: { householdId } });
  const household = await Household.findByPk(householdId);
  if (!household) throw new AppError(500, 'Household no longer exists');
  return await toHouseholdResponse(household, 'member', memberCount);
}

export async function changeMemberRole(
  adminUserId: string,
  householdId: string,
  targetUserId: string,
  body: ChangeRoleBody,
): Promise<MemberResponse> {
  const membership = await getMembership(householdId, adminUserId);
  if (membership.role !== 'admin') {
    throw new ForbiddenError('Only admins can change roles');
  }
  if (targetUserId === adminUserId) {
    throw new AppError(400, 'Use the transfer endpoint to change your own role');
  }

  const target = await HouseholdMember.findOne({
    where: { householdId, userId: targetUserId },
    include: [{ model: User, as: 'user' }],
  });
  if (!target) throw new NotFoundError('Member');
  if (!target.user) throw new AppError(500, 'Member record references a deleted user');

  await target.update({ role: body.role });
  await User.update({ role: body.role }, { where: { id: targetUserId } });

  return {
    userId: target.userId,
    displayName: target.user.displayName,
    email: target.user.email,
    avatarUrl: await getSignedUrl(target.user.avatarUrl),
    avatarEmoji: target.user.avatarEmoji,
    dateOfBirth: target.user.dateOfBirth,
    role: body.role,
    joinedAt: target.joinedAt.toISOString(),
  };
}

export async function listMembers(
  householdId: string,
  userId: string,
): Promise<MemberResponse[]> {
  await getMembership(householdId, userId);

  const members = await HouseholdMember.findAll({
    where: { householdId },
    include: [{ model: User, as: 'user' }],
    order: [['joinedAt', 'ASC']],
  });

  return Promise.all(members.map(async (m) => ({
    userId: m.userId,
    displayName: m.user!.displayName,
    email: m.user!.email,
    avatarUrl: await getSignedUrl(m.user!.avatarUrl),
    avatarEmoji: m.user!.avatarEmoji,
    dateOfBirth: m.user!.dateOfBirth,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
  })));
}

// ── Household Deletion (admin-only, password-confirmed, 30-day grace) ──

async function assertAdminWithPassword(
  userId: string,
  householdId: string,
  password: string,
): Promise<Household> {
  const membership = await getMembership(householdId, userId);
  if (membership.role !== 'admin') {
    throw new ForbiddenError('Only the household admin can delete the household');
  }

  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User');
  if (user.passwordHash) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(400, 'Invalid password');
  }

  const household = await Household.findByPk(householdId);
  if (!household) throw new NotFoundError('Household');
  return household;
}

export async function scheduleHouseholdDeletion(
  userId: string,
  householdId: string,
  body: ScheduleHouseholdDeletionBody,
): Promise<void> {
  const household = await assertAdminWithPassword(userId, householdId, body.password);

  household.scheduledDeletionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await household.save();

  notificationService
    .notifyHousehold(
      householdId,
      'household_deletion_scheduled',
      'Household deletion scheduled',
      'An admin has scheduled this household for deletion in 30 days.',
      { type: 'household_deletion_scheduled', householdId },
      userId,
    )
    .catch(() => {});
}

export async function cancelHouseholdDeletion(userId: string, householdId: string): Promise<void> {
  const membership = await getMembership(householdId, userId);
  if (membership.role !== 'admin') {
    throw new ForbiddenError('Only the household admin can cancel a scheduled deletion');
  }

  const household = await Household.findByPk(householdId);
  if (!household) throw new NotFoundError('Household');

  household.scheduledDeletionAt = null;
  await household.save();

  notificationService
    .notifyHousehold(
      householdId,
      'household_deletion_cancelled',
      'Household deletion cancelled',
      'The scheduled deletion of this household has been cancelled.',
      { type: 'household_deletion_cancelled', householdId },
      userId,
    )
    .catch(() => {});
}

export async function confirmHouseholdDeletion(
  userId: string,
  householdId: string,
  body: ScheduleHouseholdDeletionBody,
): Promise<void> {
  const household = await assertAdminWithPassword(userId, householdId, body.password);

  // Sever every member's access; the household row itself is soft-deleted
  // (paranoid) so its data can still be audited/recovered if needed — same
  // lightweight approach used for account deletion, no cascading purge of
  // owned content (feed posts, tasks, vault docs, etc.).
  await HouseholdMember.destroy({ where: { householdId } });
  await household.destroy();
}

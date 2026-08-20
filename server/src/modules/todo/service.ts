import { v4 as uuidv4 } from 'uuid';
import {
  TodoItem,
  User,
  HouseholdMember,
} from '../../database/models';
import { NotFoundError, ForbiddenError } from '../../shared/utils/errors';
import logger from '../../shared/utils/logger';
import { getIO } from '../../shared/utils/socket';
import * as notificationService from '../notification/service';
import type {
  CreateTodoBody,
  UpdateTodoBody,
  TodoResponse,
  GroupedTodosResponse,
  TodoSummaryResponse,
  TodoAssignee,
  TodoFilter,
} from './types';

function toAssignee(user: User | undefined | null): TodoAssignee | null {
  if (!user) return null;
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    avatarEmoji: user.avatarEmoji,
  };
}

async function getUserHousehold(userId: string): Promise<string> {
  const membership = await HouseholdMember.findOne({ where: { userId } });
  if (!membership) throw new ForbiddenError('You must belong to a household');
  return membership.householdId;
}

function toTodoResponse(item: TodoItem): TodoResponse {
  return {
    id: item.id,
    title: item.title,
    dueDate: item.dueDate
      ? typeof item.dueDate === 'string'
        ? item.dueDate
        : item.dueDate.toISOString().split('T')[0]
      : null,
    assignedTo: toAssignee(item.get('assignee') as User | undefined),
    isCompleted: item.isCompleted,
    completedAt: item.completedAt ? item.completedAt.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function createItem(
  userId: string,
  body: CreateTodoBody,
): Promise<TodoResponse> {
  const householdId = await getUserHousehold(userId);

  const item = await TodoItem.create({
    id: uuidv4(),
    householdId,
    title: body.title,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    assignedTo: body.assignedTo || null,
    isCompleted: false,
  });

  const full = await TodoItem.findByPk(item.id, {
    include: [{ model: User, as: 'assignee' }],
  });
  if (!full) throw new Error('Failed to load');

  // FR-087: Notify assignee (async, fire-and-forget)
  if (body.assignedTo && body.assignedTo !== userId) {
    notificationService.sendToUser(body.assignedTo, 'todo', 'New to-do assigned',
      `You were assigned: ${body.title}`, { todoId: item.id as string, type: 'todo' }
    ).catch((e: Error) => logger.warn('[Push] Todo notify failed:', e.message));
  }

  return toTodoResponse(full);
}

export async function getItems(
  userId: string,
  filter: TodoFilter = 'all',
): Promise<GroupedTodosResponse> {
  const householdId = await getUserHousehold(userId);

  const where: Record<string, unknown> = { householdId };

  if (filter === 'assigned-to-me') {
    where.assignedTo = userId;
  } else if (filter === 'completed') {
    where.isCompleted = true;
  }

  const all = await TodoItem.findAll({
    where,
    include: [{ model: User, as: 'assignee' }],
    order: [['createdAt', 'DESC']],
  });

  const grouped: GroupedTodosResponse = { pending: [], completed: [] };
  for (const item of all) {
    const resp = toTodoResponse(item);
    if (item.isCompleted) {
      grouped.completed.push(resp);
    } else {
      grouped.pending.push(resp);
    }
  }
  return grouped;
}

export async function updateItem(
  itemId: string,
  userId: string,
  userRole: string,
  body: UpdateTodoBody,
): Promise<TodoResponse> {
  const householdId = await getUserHousehold(userId);
  const item = await TodoItem.findOne({
    where: { id: itemId, householdId },
    include: [{ model: User, as: 'assignee' }],
  });
  if (!item) throw new NotFoundError('To-do item');

  // Only the assignee or an admin can edit
  if (item.assignedTo && item.assignedTo !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Only the assignee or an admin can edit this to-do');
  }

  if (body.title !== undefined) item.title = body.title;
  if (body.dueDate !== undefined) {
    item.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }
  if (body.assignedTo !== undefined) item.assignedTo = body.assignedTo;

  await item.save();
  return toTodoResponse(item);
}

export async function deleteItem(
  itemId: string,
  userId: string,
  userRole: string,
): Promise<void> {
  const householdId = await getUserHousehold(userId);
  const item = await TodoItem.findOne({ where: { id: itemId, householdId } });
  if (!item) throw new NotFoundError('To-do item');

  // Only the assignee or an admin can delete
  if (item.assignedTo && item.assignedTo !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Only the assignee or an admin can delete this to-do');
  }

  await item.destroy();
}

export async function toggleComplete(
  itemId: string,
  userId: string,
  userRole: string,
): Promise<TodoResponse> {
  const householdId = await getUserHousehold(userId);
  const item = await TodoItem.findOne({
    where: { id: itemId, householdId },
    include: [{ model: User, as: 'assignee' }],
  });
  if (!item) throw new NotFoundError('To-do item');

  // Only the assignee or an admin can toggle
  if (item.assignedTo && item.assignedTo !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Only the assignee or an admin can toggle this to-do');
  }

  const becameCompleted = !item.isCompleted;
  if (item.isCompleted) {
    item.isCompleted = false;
    item.completedAt = null;
  } else {
    item.isCompleted = true;
    item.completedAt = new Date();
  }

  await item.save();
  const response = toTodoResponse(item);

  // Only broadcast on the completing edge — reopening isn't streak-relevant.
  if (becameCompleted) {
    try {
      getIO().to(`household:${householdId}`).emit('todo:completed', response);
    } catch (e) {
      logger.warn('[WS] Todo-completed broadcast failed:', (e as Error).message);
    }
  }

  return response;
}

export async function getSummary(
  userId: string,
): Promise<TodoSummaryResponse> {
  const householdId = await getUserHousehold(userId);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const all = await TodoItem.findAll({
    where: { householdId },
    attributes: ['id', 'isCompleted', 'completedAt'],
  });

  let pending = 0;
  let completedToday = 0;

  for (const item of all) {
    if (item.isCompleted) {
      if (item.completedAt && item.completedAt >= todayStart && item.completedAt <= todayEnd) {
        completedToday++;
      }
    } else {
      pending++;
    }
  }

  return { pending, completedToday };
}

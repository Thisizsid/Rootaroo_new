import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth';
import * as taskService from './service';

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user!.userId;
}

function getUserRole(req: Request): string {
  return (req as AuthenticatedRequest).user!.role;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await taskService.createTask(getUserId(req), req.body);
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await taskService.getTasks(getUserId(req), req.query as any);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await taskService.getTaskById(req.params.id, getUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await taskService.updateTask(req.params.id, getUserId(req), getUserRole(req), req.body);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await taskService.deleteTask(req.params.id, getUserId(req), getUserRole(req));
    res.status(200).json({ success: true, data: { message: 'Task deleted' } });
  } catch (e) { next(e); }
}

export async function complete(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await taskService.completeTask(req.params.id, getUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function reopen(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await taskService.reopenTask(req.params.id, getUserId(req), getUserRole(req));
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await taskService.getTaskSummary(getUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

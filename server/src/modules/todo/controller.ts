import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth';
import * as todoService from './service';

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user!.userId;
}

function getUserRole(req: Request): string {
  return (req as AuthenticatedRequest).user!.role;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await todoService.createItem(getUserId(req), req.body);
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const filter = (req.query.filter as string) || 'all';
    const result = await todoService.getItems(getUserId(req), filter as any);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await todoService.updateItem(req.params.id, getUserId(req), getUserRole(req), req.body);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await todoService.deleteItem(req.params.id, getUserId(req), getUserRole(req));
    res.status(200).json({ success: true, data: { message: 'Deleted' } });
  } catch (e) { next(e); }
}

export async function toggle(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await todoService.toggleComplete(req.params.id, getUserId(req), getUserRole(req));
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await todoService.getSummary(getUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

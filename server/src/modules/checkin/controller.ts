import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth';
import * as checkInService from './service';

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user!.userId;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await checkInService.createCheckIn(getUserId(req), req.body);
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await checkInService.listCheckIns(getUserId(req), req.query as any);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function listByMember(req: Request, res: Response, next: NextFunction) {
  try {
    const days = Number(req.query.days) || 7;
    const result = await checkInService.listMemberCheckIns(
      getUserId(req),
      req.params.userId,
      days,
    );
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth';
import * as placeService from './service';

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user!.userId;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await placeService.createSavedPlace(getUserId(req), req.body);
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await placeService.listSavedPlaces(getUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await placeService.updateSavedPlace(getUserId(req), req.params.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await placeService.deleteSavedPlace(getUserId(req), req.params.id);
    res.status(200).json({ success: true, data: { message: 'Place deleted' } });
  } catch (e) { next(e); }
}

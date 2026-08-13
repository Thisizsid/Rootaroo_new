import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth';
import * as dashboardService from './service';

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const result = await dashboardService.getDashboard(userId);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function quickNotify(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const { action, memberIds, message } = req.body;
    if (!action || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ success: false, message: 'action and memberIds required' });
    }
    const customMessage = typeof message === 'string' ? message.trim() : '';
    if (customMessage.length > 500) {
      return res.status(400).json({ success: false, message: 'Message too long (max 500 characters)' });
    }
    await dashboardService.quickNotify(userId, action, memberIds, customMessage || undefined);
    res.status(200).json({ success: true });
  } catch (e) { next(e); }
}

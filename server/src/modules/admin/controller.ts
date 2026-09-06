import { Request, Response, NextFunction } from 'express';
import * as householdService from '../household/service';
import type { HouseholdActionRequestStatus } from '../household/types';

const VALID_STATUSES: HouseholdActionRequestStatus[] = ['pending', 'approved', 'rejected'];

export async function listRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    if (status && !VALID_STATUSES.includes(status as HouseholdActionRequestStatus)) {
      res.status(400).json({ success: false, error: 'Invalid status filter' });
      return;
    }
    const result = await householdService.listActionRequests(status as HouseholdActionRequestStatus | undefined);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function approveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await householdService.approveActionRequest(req.params.id, req.body.reviewerNote);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function rejectRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await householdService.rejectActionRequest(req.params.id, req.body.reviewerNote);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

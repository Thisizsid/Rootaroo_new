import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth';
import { uploadBuffer } from '../../shared/utils/cloudinary';
import * as householdService from './service';

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user!.userId;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await householdService.createHousehold(getUserId(req), req.body);
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await householdService.getHousehold(req.params.id, getUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function listMyHouseholds(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await householdService.listUserHouseholds(getUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function generateInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await householdService.generateInvitation(getUserId(req), req.params.id);
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function join(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await householdService.joinViaCode(getUserId(req), req.body);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    await householdService.removeMember(getUserId(req), req.params.id, req.params.userId);
    res.status(200).json({ success: true, data: { message: 'Member removed successfully' } });
  } catch (e) { next(e); }
}

export async function leave(req: Request, res: Response, next: NextFunction) {
  try {
    await householdService.leaveHousehold(getUserId(req), req.params.id);
    res.status(200).json({ success: true, data: { message: 'Left household successfully' } });
  } catch (e) { next(e); }
}

export async function transferAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await householdService.transferAdmin(getUserId(req), req.params.id, req.body.newAdminId);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function changeMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await householdService.changeMemberRole(getUserId(req), req.params.id, req.params.userId, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function uploadCoverPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'No file uploaded.' });
      return;
    }
    const result = await uploadBuffer(file.buffer, {
      folder: 'rootaru/household-covers',
      resource_type: 'image',
      // Cap the stored asset's size so the banner loads quickly on Home and
      // Edit Profile — this is a wide 4:3 crop from a phone camera, which can
      // otherwise be several MB at full resolution.
      transformation: [
        { width: 1200, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
    const household = await householdService.updateCoverPhoto(getUserId(req), req.params.id, result.secure_url);
    res.status(200).json({ success: true, data: household });
  } catch (e) { next(e); }
}

export async function removeCoverPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const household = await householdService.removeCoverPhoto(getUserId(req), req.params.id);
    res.status(200).json({ success: true, data: household });
  } catch (e) { next(e); }
}

export async function listMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await householdService.listMembers(req.params.id, getUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function scheduleDeletion(req: Request, res: Response, next: NextFunction) {
  try {
    await householdService.scheduleHouseholdDeletion(getUserId(req), req.params.id, req.body);
    res.status(200).json({ success: true, data: { message: 'Household deletion scheduled in 30 days' } });
  } catch (e) { next(e); }
}

export async function cancelDeletion(req: Request, res: Response, next: NextFunction) {
  try {
    await householdService.cancelHouseholdDeletion(getUserId(req), req.params.id);
    res.status(200).json({ success: true, data: { message: 'Household deletion cancelled' } });
  } catch (e) { next(e); }
}

export async function confirmDeletion(req: Request, res: Response, next: NextFunction) {
  try {
    await householdService.confirmHouseholdDeletion(getUserId(req), req.params.id, req.body);
    res.status(200).json({ success: true, data: { message: 'Household deleted' } });
  } catch (e) { next(e); }
}

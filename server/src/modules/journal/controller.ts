import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth';
import * as journalService from './service';
import { uploadBuffer, getSignedUrl } from '../../shared/utils/s3';

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user!.userId;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await journalService.createEntry(getUserId(req), req.body);
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await journalService.listEntries(getUserId(req), req.query as any);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await journalService.getEntryById(getUserId(req), req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await journalService.updateEntry(getUserId(req), req.params.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await journalService.deleteEntry(getUserId(req), req.params.id);
    res.status(200).json({ success: true, data: { message: 'Journal entry deleted successfully' } });
  } catch (e) { next(e); }
}

export async function uploadMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: 'No files provided' });
      return;
    }
    const results = await Promise.all(
      files.map(async (f) => {
        const isVideo = f.mimetype.startsWith('video/');
        const result = await uploadBuffer(
          f.buffer,
          isVideo ? 'journal/videos' : 'journal/images',
          f.mimetype,
          f.originalname.split('.').pop(),
        );
        // `fileName` is the S3 key — persist this as `mediaUrl` when creating
        // the entry. `url` is a signed URL for immediate preview only; it
        // expires and must never be stored.
        return {
          fileName: result.key,
          url: await getSignedUrl(result.key),
          size: f.size,
          mimetype: f.mimetype,
        };
      }),
    );
    res.status(201).json({ success: true, data: results });
  } catch (e) { next(e); }
}

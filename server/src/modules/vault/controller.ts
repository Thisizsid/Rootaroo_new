import { Request, Response, NextFunction } from 'express';
import * as vaultService from './service';
import multer from 'multer';

export const vaultUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
}).single('file');

function getUserId(req: Request): string {
  return (req as any).user!.userId;
}

function getUserRole(req: Request): string {
  return (req as any).user!.role;
}

export async function uploadDocumentCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      return next(new Error('No file uploaded'));
    }

    const document = await vaultService.uploadDocument(
      getUserId(req),
      req.body,
      req.file.buffer
    );

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
}

export async function listDocumentsCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await vaultService.listDocuments(getUserId(req), req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentByIdCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const document = await vaultService.getDocumentById(req.params.id, getUserId(req));
    res.json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
}

export async function updateDocumentCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const document = await vaultService.updateDocument(
      req.params.id,
      getUserId(req),
      getUserRole(req),
      req.body
    );
    res.json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
}

export async function deleteDocumentCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await vaultService.deleteDocument(req.params.id, getUserId(req), getUserRole(req));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function hardDeleteDocumentCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await vaultService.hardDeleteDocument(req.params.id, getUserId(req), getUserRole(req));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function getStorageUsageCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const usage = await vaultService.getStorageUsage(getUserId(req));
    res.json({ success: true, data: usage });
  } catch (error) {
    next(error);
  }
}

export async function storeUserKeyCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key = await vaultService.storeUserKey(getUserId(req), req.body);
    res.status(201).json({ success: true, data: key });
  } catch (error) {
    next(error);
  }
}

export async function getUserKeyCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key = await vaultService.getUserKey(getUserId(req));
    res.json({ success: true, data: key });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentKeyCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key = await vaultService.getDocumentKey(req.params.id, getUserId(req));
    res.json({ success: true, data: key });
  } catch (error) {
    next(error);
  }
}
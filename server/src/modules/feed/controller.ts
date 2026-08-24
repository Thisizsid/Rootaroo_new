import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth';
import * as feedService from './service';
import { uploadBuffer, getSignedUrl } from '../../shared/utils/s3';

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user!.userId;
}

function getUserRole(req: Request): string {
  return (req as AuthenticatedRequest).user!.role;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await feedService.createPost(getUserId(req), req.body);
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await feedService.getFeed(getUserId(req), req.query as any);
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await feedService.getPostById(req.params.postId, getUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await feedService.deletePost(req.params.postId, getUserId(req), getUserRole(req));
    res.status(200).json({ success: true, data: { message: 'Post deleted successfully' } });
  } catch (e) { next(e); }
}

export async function toggleLike(req: Request, res: Response, next: NextFunction) {
  try {
    const liked = await feedService.likePost(req.params.postId, getUserId(req));
    res.status(200).json({ success: true, data: { liked } });
  } catch (e) { next(e); }
}

export async function removeLike(req: Request, res: Response, next: NextFunction) {
  try {
    await feedService.unlikePost(req.params.postId, getUserId(req));
    res.status(200).json({ success: true, data: { message: 'Like removed' } });
  } catch (e) { next(e); }
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await feedService.addComment(req.params.postId, getUserId(req), req.body);
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function removeComment(req: Request, res: Response, next: NextFunction) {
  try {
    await feedService.deleteComment(req.params.commentId, getUserId(req), getUserRole(req));
    res.status(200).json({ success: true, data: { message: 'Comment deleted' } });
  } catch (e) { next(e); }
}

export async function toggleReaction(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await feedService.toggleCommentReaction(
      req.params.commentId,
      getUserId(req),
      (req.params.reaction || req.body.reaction) as string,
    );
    res.status(200).json({ success: true, data: result });
  } catch (e) { next(e); }
}

export async function listComments(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await feedService.getComments(req.params.postId, getUserId(req), req.query as any);
    res.status(200).json({ success: true, data: result });
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
          isVideo ? 'feed/videos' : 'feed/images',
          f.mimetype,
          f.originalname.split('.').pop(),
        );
        // `fileName` is the S3 key — persist this as `mediaUrl` when creating
        // the post. `url` is a signed URL for immediate preview only; it
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

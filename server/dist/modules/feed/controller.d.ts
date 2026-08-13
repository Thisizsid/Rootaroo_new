import { Request, Response, NextFunction } from 'express';
export declare function create(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function list(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getById(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function remove(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function toggleLike(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function removeLike(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function addComment(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function removeComment(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listComments(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map
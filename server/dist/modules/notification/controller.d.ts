import { Request, Response, NextFunction } from 'express';
export declare function registerToken(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function unregisterToken(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getHistory(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function markAllAsRead(_req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getPreferences(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map
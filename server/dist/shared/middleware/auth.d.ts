import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    householdId?: string;
}
export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}
export declare function authenticate(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map
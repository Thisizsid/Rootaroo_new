import { Request, Response, NextFunction } from 'express';
type Role = 'admin' | 'member' | 'child';
export declare function requireRole(minRole: Role): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requireHouseholdMembership(req: Request, _res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=rbac.d.ts.map
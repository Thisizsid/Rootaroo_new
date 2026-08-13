import { Request, Response, NextFunction } from 'express';
export declare function createExpenseCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listExpensesCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getExpenseByIdCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateExpenseCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteExpenseCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getExpenseSummaryCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function recordSettlementCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listSettlementsCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getLedgerCtrl(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map
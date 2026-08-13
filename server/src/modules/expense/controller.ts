import { Request, Response, NextFunction } from 'express';
import * as expenseService from './service';

function getUserId(req: Request): string {
  return (req as any).user!.userId;
}

function getUserRole(req: Request): string {
  return (req as any).user!.role;
}

export async function createExpenseCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const expense = await expenseService.createExpense(getUserId(req), req.body);
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
}

export async function listExpensesCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await expenseService.listExpenses(getUserId(req), req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getExpenseByIdCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const expense = await expenseService.getExpenseById(req.params.id, getUserId(req));
    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
}

export async function updateExpenseCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const expense = await expenseService.updateExpense(
      req.params.id,
      getUserId(req),
      getUserRole(req),
      req.body
    );
    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
}

export async function deleteExpenseCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await expenseService.deleteExpense(req.params.id, getUserId(req), getUserRole(req));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function markExpenseSettledCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const expense = await expenseService.markExpenseSettled(
      req.params.id,
      getUserId(req),
      getUserRole(req)
    );
    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
}

export async function getExpenseSummaryCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const summary = await expenseService.getExpenseSummary(getUserId(req));
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}

export async function recordSettlementCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const settlement = await expenseService.recordSettlement(getUserId(req), req.body);
    res.status(201).json({ success: true, data: settlement });
  } catch (error) {
    next(error);
  }
}

export async function listSettlementsCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await expenseService.getSettlements(getUserId(req), req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getLedgerCtrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ledger = await expenseService.getLedger(getUserId(req));
    res.json({ success: true, data: ledger });
  } catch (error) {
    next(error);
  }
}
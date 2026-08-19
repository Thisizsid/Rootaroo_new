import { z } from 'zod';

export const createExpenseSchema = {
  body: z.object({
    title: z.string().min(1).max(200),
    amount: z.number().positive().multipleOf(0.01),
    paidBy: z.string().uuid(),
    date: z.string().date().optional(),
    splitType: z.enum(['equal', 'custom']),
    participants: z
      .array(
        z.object({
          userId: z.string().uuid(),
          shareAmount: z.number().multipleOf(0.01).optional(),
        })
      )
      .min(1),
  }),
};

export const updateExpenseSchema = {
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    amount: z.number().positive().multipleOf(0.01).optional(),
    paidBy: z.string().uuid().optional(),
    date: z.string().date().optional(),
    splitType: z.enum(['equal', 'custom']).optional(),
    participants: z
      .array(
        z.object({
          userId: z.string().uuid(),
          shareAmount: z.number().multipleOf(0.01).optional(),
        })
      )
      .min(1)
      .optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
};

export const expenseQuerySchema = {
  query: z.object({
    cursor: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
};

export const settlementSchema = {
  body: z.object({
    fromUserId: z.string().uuid(),
    toUserId: z.string().uuid(),
    amount: z.number().positive().multipleOf(0.01),
  }),
};

export const markSettledSchema = {
  params: z.object({ id: z.string().uuid() }),
};

export const remindSchema = {
  params: z.object({ id: z.string().uuid() }),
};
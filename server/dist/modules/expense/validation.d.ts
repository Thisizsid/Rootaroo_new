import { z } from 'zod';
export declare const createExpenseSchema: {
    body: z.ZodObject<{
        title: z.ZodString;
        amount: z.ZodNumber;
        paidBy: z.ZodString;
        date: z.ZodOptional<z.ZodString>;
        splitType: z.ZodEnum<["equal", "custom"]>;
        participants: z.ZodArray<z.ZodObject<{
            userId: z.ZodString;
            shareAmount: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            shareAmount?: number | undefined;
        }, {
            userId: string;
            shareAmount?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        title: string;
        paidBy: string;
        amount: number;
        splitType: "custom" | "equal";
        participants: {
            userId: string;
            shareAmount?: number | undefined;
        }[];
        date?: string | undefined;
    }, {
        title: string;
        paidBy: string;
        amount: number;
        splitType: "custom" | "equal";
        participants: {
            userId: string;
            shareAmount?: number | undefined;
        }[];
        date?: string | undefined;
    }>;
};
export declare const updateExpenseSchema: {
    body: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        amount: z.ZodOptional<z.ZodNumber>;
        paidBy: z.ZodOptional<z.ZodString>;
        date: z.ZodOptional<z.ZodString>;
        splitType: z.ZodOptional<z.ZodEnum<["equal", "custom"]>>;
        participants: z.ZodOptional<z.ZodArray<z.ZodObject<{
            userId: z.ZodString;
            shareAmount: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            shareAmount?: number | undefined;
        }, {
            userId: string;
            shareAmount?: number | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        date?: string | undefined;
        title?: string | undefined;
        paidBy?: string | undefined;
        amount?: number | undefined;
        splitType?: "custom" | "equal" | undefined;
        participants?: {
            userId: string;
            shareAmount?: number | undefined;
        }[] | undefined;
    }, {
        date?: string | undefined;
        title?: string | undefined;
        paidBy?: string | undefined;
        amount?: number | undefined;
        splitType?: "custom" | "equal" | undefined;
        participants?: {
            userId: string;
            shareAmount?: number | undefined;
        }[] | undefined;
    }>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
};
export declare const expenseQuerySchema: {
    query: z.ZodObject<{
        cursor: z.ZodOptional<z.ZodString>;
        limit: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit?: number | undefined;
        cursor?: string | undefined;
    }, {
        limit?: number | undefined;
        cursor?: string | undefined;
    }>;
};
export declare const settlementSchema: {
    body: z.ZodObject<{
        fromUserId: z.ZodString;
        toUserId: z.ZodString;
        amount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        fromUserId: string;
        toUserId: string;
    }, {
        amount: number;
        fromUserId: string;
        toUserId: string;
    }>;
};
//# sourceMappingURL=validation.d.ts.map
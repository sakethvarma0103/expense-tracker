import type { Request, Response } from 'express';
import { z } from 'zod';
import { getUserId } from '../middleware/auth';
import { MAX_AMOUNT_PAISE, TRANSACTION_TYPES } from '../models/Transaction';
import { MONTH_PATTERN } from '../services/dateRange';
import {
  createTransaction,
  deleteTransaction,
  findOwnedTransaction,
  getTransaction,
  listTransactions,
  replaceTransaction,
  summarizeMonth,
  toInput,
} from '../services/transactionService';

const objectId = (label: string) => z.string().regex(/^[0-9a-f]{24}$/i, `Choose a valid ${label}`);

const amount = z
  .int('Amount must be a whole number of paise')
  .min(1, 'Amount must be greater than zero')
  .max(MAX_AMOUNT_PAISE, 'Amount is too large');

const date = z.iso
  .datetime({ offset: true, error: 'Date must be an ISO date-time, e.g. 2026-10-21T14:30:00+05:30' })
  .transform((s) => new Date(s))
  .refine((d) => d.getUTCFullYear() >= 1970 && d.getUTCFullYear() <= 2100, 'Date is out of range');

const note = z.string().trim().max(200, 'Note must be at most 200 characters').optional();

const base = { amount, accountId: objectId('account'), date, note };

// Unknown keys are stripped, so stale fields (e.g. categoryId on a transfer) are dropped
export const transactionSchema = z.discriminatedUnion(
  'type',
  [
    z.object({ ...base, type: z.literal('expense'), categoryId: objectId('category') }),
    z.object({ ...base, type: z.literal('income'), categoryId: objectId('category') }),
    z
      .object({ ...base, type: z.literal('transfer'), toAccountId: objectId('account') })
      .refine((t) => t.toAccountId !== t.accountId, {
        message: 'Choose a different account to transfer to',
        path: ['toAccountId'],
      }),
  ],
  { error: 'Type must be expense, income or transfer' },
);

// Partial update; merged with the stored transaction and re-validated as a whole
export const transactionUpdateSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES),
    amount: z.unknown(),
    accountId: z.unknown(),
    toAccountId: z.unknown(),
    categoryId: z.unknown(),
    date: z.unknown(),
    note: z.unknown(),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

const listQuerySchema = z.object({
  month: z.string().regex(MONTH_PATTERN, 'Month must be YYYY-MM').optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  accountId: objectId('account').optional(),
  categoryId: objectId('category').optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
});

const summaryQuerySchema = z.object({
  month: z.string().regex(MONTH_PATTERN, 'Month must be YYYY-MM'),
  accountId: objectId('account').optional(),
  categoryId: objectId('category').optional(),
});

type IdParams = { id: string };

export async function summary(req: Request, res: Response): Promise<void> {
  const filters = summaryQuerySchema.parse(req.query);
  res.json({ summary: await summarizeMonth(getUserId(req), filters) });
}

export async function list(req: Request, res: Response): Promise<void> {
  const filters = listQuerySchema.parse(req.query);
  res.json(await listTransactions(getUserId(req), filters));
}

export async function getOne(req: Request<IdParams>, res: Response): Promise<void> {
  res.json({ transaction: await getTransaction(getUserId(req), req.params.id) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = req.body as z.infer<typeof transactionSchema>;
  res.status(201).json({ transaction: await createTransaction(getUserId(req), input) });
}

export async function update(req: Request<IdParams>, res: Response): Promise<void> {
  const userId = getUserId(req);
  const tx = await findOwnedTransaction(userId, req.params.id);
  const changes = req.body as Record<string, unknown>;
  const merged = transactionSchema.parse({ ...toInput(tx), ...changes });
  res.json({ transaction: await replaceTransaction(userId, tx, merged) });
}

export async function remove(req: Request<IdParams>, res: Response): Promise<void> {
  await deleteTransaction(getUserId(req), req.params.id);
  res.status(204).end();
}

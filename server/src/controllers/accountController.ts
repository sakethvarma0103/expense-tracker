import type { Request, Response } from 'express';
import { z } from 'zod';
import { getUserId } from '../middleware/auth';
import { ACCOUNT_TYPES } from '../models/Account';
import {
  createAccount,
  deleteAccount,
  getAccount,
  listAccounts,
  updateAccount,
} from '../services/accountService';

// ₹10,000 crore in paise; guards against absurd or unsafe numbers
const MAX_ABS_PAISE = 10_000 * 1_00_00_000 * 100;

const accountFields = {
  name: z.string().trim().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  type: z.enum(ACCOUNT_TYPES, 'Choose a valid account type'),
  openingBalance: z
    .int('Amount must be a whole number of paise')
    .min(-MAX_ABS_PAISE, 'Amount is too large')
    .max(MAX_ABS_PAISE, 'Amount is too large'),
};

export const createAccountSchema = z.object({
  ...accountFields,
  openingBalance: accountFields.openingBalance.default(0),
});

export const updateAccountSchema = z
  .object({ ...accountFields, archived: z.boolean() })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

type IdParams = { id: string };

export async function list(req: Request, res: Response): Promise<void> {
  res.json({ accounts: await listAccounts(getUserId(req)) });
}

export async function getOne(req: Request<IdParams>, res: Response): Promise<void> {
  res.json({ account: await getAccount(getUserId(req), req.params.id) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = req.body as z.infer<typeof createAccountSchema>;
  res.status(201).json({ account: await createAccount(getUserId(req), input) });
}

export async function update(req: Request<IdParams>, res: Response): Promise<void> {
  const input = req.body as z.infer<typeof updateAccountSchema>;
  res.json({ account: await updateAccount(getUserId(req), req.params.id, input) });
}

export async function remove(req: Request<IdParams>, res: Response): Promise<void> {
  await deleteAccount(getUserId(req), req.params.id);
  res.status(204).end();
}

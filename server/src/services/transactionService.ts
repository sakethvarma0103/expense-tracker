import { Types, isValidObjectId, type FilterQuery } from 'mongoose';
import { HttpError } from '../middleware/error';
import { Account } from '../models/Account';
import { Category } from '../models/Category';
import {
  Transaction,
  type ITransaction,
  type PublicTransaction,
  type TransactionDocument,
  type TransactionType,
} from '../models/Transaction';
import { istMonthRange } from './dateRange';

interface BaseInput {
  amount: number;
  accountId: string;
  date: Date;
  note?: string;
}

export type TransactionInput =
  | (BaseInput & { type: 'expense' | 'income'; categoryId: string })
  | (BaseInput & { type: 'transfer'; toAccountId: string });

export interface ListFilters {
  month?: string;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  limit: number;
  cursor?: string;
}

function toPublicTransaction(tx: TransactionDocument): PublicTransaction {
  return {
    id: tx.id as string,
    type: tx.type,
    amount: tx.amount,
    accountId: tx.accountId.toString(),
    toAccountId: tx.toAccountId?.toString() ?? null,
    categoryId: tx.categoryId?.toString() ?? null,
    date: tx.date,
    note: tx.note ?? null,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  };
}

/** The current values of a transaction, in the same shape as a create request */
export function toInput(tx: TransactionDocument): Record<string, unknown> {
  return {
    type: tx.type,
    amount: tx.amount,
    accountId: tx.accountId.toString(),
    toAccountId: tx.toAccountId?.toString(),
    categoryId: tx.categoryId?.toString(),
    date: tx.date.toISOString(),
    note: tx.note,
  };
}

function fieldError(field: string, message: string): HttpError {
  return new HttpError(400, 'Validation failed', { [field]: [message] });
}

/**
 * Checks that referenced accounts and categories belong to the user, are active, and that the
 * category matches the transaction type. References unchanged from `previous` may be archived,
 * so old transactions stay editable after an account or category is archived.
 */
async function checkReferences(
  userId: string,
  input: TransactionInput,
  previous?: TransactionDocument,
): Promise<void> {
  const accountRefs = [
    { field: 'accountId', id: input.accountId, previousId: previous?.accountId.toString() },
  ];
  if (input.type === 'transfer') {
    accountRefs.push({ field: 'toAccountId', id: input.toAccountId, previousId: previous?.toAccountId?.toString() });
  }

  for (const { field, id, previousId } of accountRefs) {
    const account = await Account.findOne({ _id: id, userId });
    if (!account) throw fieldError(field, 'Account not found');
    if (account.archived && previousId !== id) throw fieldError(field, 'This account is archived');
  }

  if (input.type !== 'transfer') {
    const category = await Category.findOne({ _id: input.categoryId, userId });
    if (!category) throw fieldError('categoryId', 'Category not found');
    if (category.type !== input.type) {
      throw fieldError('categoryId', `Choose an ${input.type} category`);
    }
    const unchanged = previous?.categoryId?.toString() === input.categoryId;
    if (category.archived && !unchanged) throw fieldError('categoryId', 'This category is archived');
  }
}

function toDocumentFields(input: TransactionInput) {
  return {
    type: input.type,
    amount: input.amount,
    accountId: new Types.ObjectId(input.accountId),
    toAccountId: input.type === 'transfer' ? new Types.ObjectId(input.toAccountId) : undefined,
    categoryId: input.type !== 'transfer' ? new Types.ObjectId(input.categoryId) : undefined,
    date: input.date,
    note: input.note || undefined,
  };
}

export async function findOwnedTransaction(userId: string, id: string): Promise<TransactionDocument> {
  const tx = isValidObjectId(id) ? await Transaction.findOne({ _id: id, userId }) : null;
  if (!tx) throw new HttpError(404, 'Transaction not found');
  return tx;
}

// Cursor = base64url of "<ISO date>|<id>" of the last item on the previous page
function encodeCursor(tx: TransactionDocument): string {
  return Buffer.from(`${tx.date.toISOString()}|${tx.id as string}`).toString('base64url');
}

function decodeCursor(cursor: string): { date: Date; id: Types.ObjectId } {
  const [iso, id] = Buffer.from(cursor, 'base64url').toString().split('|');
  const date = new Date(iso ?? '');
  if (!id || !isValidObjectId(id) || Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'Invalid cursor');
  }
  return { date, id: new Types.ObjectId(id) };
}

export async function listTransactions(
  userId: string,
  filters: ListFilters,
): Promise<{ transactions: PublicTransaction[]; nextCursor: string | null }> {
  const and: FilterQuery<ITransaction>[] = [{ userId }];

  if (filters.month) {
    const { start, end } = istMonthRange(filters.month);
    and.push({ date: { $gte: start, $lt: end } });
  }
  if (filters.type) and.push({ type: filters.type });
  if (filters.categoryId) and.push({ categoryId: filters.categoryId });
  if (filters.accountId) {
    and.push({ $or: [{ accountId: filters.accountId }, { toAccountId: filters.accountId }] });
  }
  if (filters.cursor) {
    const { date, id } = decodeCursor(filters.cursor);
    and.push({ $or: [{ date: { $lt: date } }, { date, _id: { $lt: id } }] });
  }

  const docs = await Transaction.find({ $and: and })
    .sort({ date: -1, _id: -1 })
    .limit(filters.limit + 1);

  const page = docs.slice(0, filters.limit);
  const last = page.at(-1);
  return {
    transactions: page.map(toPublicTransaction),
    nextCursor: docs.length > filters.limit && last ? encodeCursor(last) : null,
  };
}

export async function getTransaction(userId: string, id: string): Promise<PublicTransaction> {
  return toPublicTransaction(await findOwnedTransaction(userId, id));
}

export async function createTransaction(
  userId: string,
  input: TransactionInput,
): Promise<PublicTransaction> {
  await checkReferences(userId, input);
  const tx = await Transaction.create({ ...toDocumentFields(input), userId });
  return toPublicTransaction(tx);
}

/** `input` is the full, already-validated result of merging the update into the existing values */
export async function replaceTransaction(
  userId: string,
  tx: TransactionDocument,
  input: TransactionInput,
): Promise<PublicTransaction> {
  await checkReferences(userId, input, tx);
  tx.set(toDocumentFields(input));
  await tx.save();
  return toPublicTransaction(tx);
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  const tx = await findOwnedTransaction(userId, id);
  await tx.deleteOne();
}

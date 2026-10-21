import { isValidObjectId } from 'mongoose';
import { HttpError, isDuplicateKeyError } from '../middleware/error';
import {
  Account,
  type AccountDocument,
  type AccountType,
  type PublicAccount,
} from '../models/Account';
import { Transaction } from '../models/Transaction';
import { getTransactionTotals } from './balanceService';

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  openingBalance: number;
}

export type UpdateAccountInput = Partial<CreateAccountInput & { archived: boolean }>;

const duplicateName = () => new HttpError(409, 'You already have an account with this name');

function toPublicAccount(account: AccountDocument, transactionTotal: number): PublicAccount {
  return {
    id: account.id as string,
    name: account.name,
    type: account.type,
    openingBalance: account.openingBalance,
    balance: account.openingBalance + transactionTotal,
    archived: account.archived,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

async function withBalance(userId: string, account: AccountDocument): Promise<PublicAccount> {
  const totals = await getTransactionTotals(userId, [account.id as string]);
  return toPublicAccount(account, totals.get(account.id as string) ?? 0);
}

async function findOwnedAccount(userId: string, accountId: string): Promise<AccountDocument> {
  // Invalid ids and other users' accounts both look like "not found"
  const account = isValidObjectId(accountId)
    ? await Account.findOne({ _id: accountId, userId })
    : null;
  if (!account) {
    throw new HttpError(404, 'Account not found');
  }
  return account;
}

export async function listAccounts(userId: string): Promise<PublicAccount[]> {
  const [accounts, totals] = await Promise.all([
    Account.find({ userId }).collation({ locale: 'en', strength: 2 }).sort({ archived: 1, name: 1 }),
    getTransactionTotals(userId),
  ]);
  return accounts.map((a) => toPublicAccount(a, totals.get(a.id as string) ?? 0));
}

export async function getAccount(userId: string, accountId: string): Promise<PublicAccount> {
  return withBalance(userId, await findOwnedAccount(userId, accountId));
}

export async function createAccount(
  userId: string,
  input: CreateAccountInput,
): Promise<PublicAccount> {
  try {
    const account = await Account.create({ ...input, userId });
    return toPublicAccount(account, 0);
  } catch (err) {
    if (isDuplicateKeyError(err)) throw duplicateName();
    throw err;
  }
}

export async function updateAccount(
  userId: string,
  accountId: string,
  input: UpdateAccountInput,
): Promise<PublicAccount> {
  const account = await findOwnedAccount(userId, accountId);
  account.set(input);
  try {
    await account.save();
  } catch (err) {
    if (isDuplicateKeyError(err)) throw duplicateName();
    throw err;
  }
  return withBalance(userId, account);
}

export async function deleteAccount(userId: string, accountId: string): Promise<void> {
  const account = await findOwnedAccount(userId, accountId);
  const inUse = await Transaction.exists({
    userId,
    $or: [{ accountId: account._id }, { toAccountId: account._id }],
  });
  if (inUse) {
    throw new HttpError(409, 'This account has transactions. Archive it instead to keep its history.');
  }
  await account.deleteOne();
}

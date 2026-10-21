import { isValidObjectId } from 'mongoose';
import { HttpError, isDuplicateKeyError } from '../middleware/error';
import {
  Account,
  type AccountDocument,
  type AccountType,
  type PublicAccount,
} from '../models/Account';

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  openingBalance: number;
}

export type UpdateAccountInput = Partial<CreateAccountInput & { archived: boolean }>;

const duplicateName = () => new HttpError(409, 'You already have an account with this name');

// TODO: add the sum of the account's transactions once transactions exist
function toPublicAccount(account: AccountDocument): PublicAccount {
  return {
    id: account.id as string,
    name: account.name,
    type: account.type,
    openingBalance: account.openingBalance,
    balance: account.openingBalance,
    archived: account.archived,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
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
  const accounts = await Account.find({ userId })
    .collation({ locale: 'en', strength: 2 })
    .sort({ archived: 1, name: 1 });
  return accounts.map(toPublicAccount);
}

export async function getAccount(userId: string, accountId: string): Promise<PublicAccount> {
  return toPublicAccount(await findOwnedAccount(userId, accountId));
}

export async function createAccount(
  userId: string,
  input: CreateAccountInput,
): Promise<PublicAccount> {
  try {
    const account = await Account.create({ ...input, userId });
    return toPublicAccount(account);
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
  return toPublicAccount(account);
}

// TODO: once transactions exist, refuse to delete accounts that have them (archive instead)
export async function deleteAccount(userId: string, accountId: string): Promise<void> {
  const account = await findOwnedAccount(userId, accountId);
  await account.deleteOne();
}

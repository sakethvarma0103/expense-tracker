import { Schema, Types, model, type HydratedDocument } from 'mongoose';

export const TRANSACTION_TYPES = ['expense', 'income', 'transfer'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/** ₹10,000 crore in paise; upper bound for any single amount or balance */
export const MAX_AMOUNT_PAISE = 10_000 * 1_00_00_000 * 100;

export interface ITransaction {
  userId: Types.ObjectId;
  type: TransactionType;
  /** Positive integer paise; `type` decides the direction */
  amount: number;
  /** The account money leaves (expense, transfer) or enters (income) */
  accountId: Types.ObjectId;
  /** Transfers only: the account money moves into */
  toAccountId?: Types.ObjectId;
  /** Expense and income only */
  categoryId?: Types.ObjectId;
  /** UTC instant; grouped into days/months in Asia/Kolkata */
  date: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amount: {
      type: Number,
      required: true,
      min: 1,
      max: MAX_AMOUNT_PAISE,
      validate: { validator: Number.isSafeInteger, message: 'amount must be an integer (paise)' },
    },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    toAccountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    date: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: true },
);

// Newest-first listing and month ranges
transactionSchema.index({ userId: 1, date: -1, _id: -1 });
// Balance calculations and "is this account/category in use?" checks
transactionSchema.index({ userId: 1, accountId: 1 });
transactionSchema.index({ userId: 1, toAccountId: 1 }, { sparse: true });
transactionSchema.index({ userId: 1, categoryId: 1 }, { sparse: true });

export type TransactionDocument = HydratedDocument<ITransaction>;

export const Transaction = model<ITransaction>('Transaction', transactionSchema);

export interface PublicTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  date: Date;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

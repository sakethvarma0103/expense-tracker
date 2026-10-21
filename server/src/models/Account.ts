import { Schema, Types, model, type HydratedDocument } from 'mongoose';

export const ACCOUNT_TYPES = ['bank', 'cash', 'credit_card', 'wallet'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface IAccount {
  userId: Types.ObjectId;
  name: string;
  type: AccountType;
  /** Integer paise. Negative for money owed (e.g. a credit card balance). */
  openingBalance: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<IAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    type: { type: String, enum: ACCOUNT_TYPES, required: true },
    openingBalance: {
      type: Number,
      required: true,
      default: 0,
      validate: { validator: Number.isSafeInteger, message: 'openingBalance must be an integer (paise)' },
    },
    archived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

// Account names are unique per user, case-insensitively
accountSchema.index(
  { userId: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);

export type AccountDocument = HydratedDocument<IAccount>;

export const Account = model<IAccount>('Account', accountSchema);

export interface PublicAccount {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  /** Current balance in paise (opening balance + transactions) */
  balance: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

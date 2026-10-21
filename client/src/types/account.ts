export const ACCOUNT_TYPES = ['bank', 'cash', 'credit_card', 'wallet'] as const
export type AccountType = (typeof ACCOUNT_TYPES)[number]

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: 'Bank account',
  cash: 'Cash',
  credit_card: 'Credit card',
  wallet: 'Wallet / UPI',
}

export interface Account {
  id: string
  name: string
  type: AccountType
  /** Integer paise */
  openingBalance: number
  /** Current balance in integer paise */
  balance: number
  archived: boolean
  createdAt: string
  updatedAt: string
}

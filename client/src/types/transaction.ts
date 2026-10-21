export const TRANSACTION_TYPES = ['expense', 'income', 'transfer'] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  expense: 'Expense',
  income: 'Income',
  transfer: 'Transfer',
}

export interface Transaction {
  id: string
  type: TransactionType
  /** Positive integer paise; `type` decides the direction */
  amount: number
  accountId: string
  /** Transfers only */
  toAccountId: string | null
  /** Expense and income only */
  categoryId: string | null
  /** ISO date-time (UTC) */
  date: string
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface MonthSummary {
  month: string
  income: number
  expense: number
  net: number
}

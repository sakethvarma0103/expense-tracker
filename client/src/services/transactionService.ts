import { api } from './api'
import type { MonthSummary, Transaction, TransactionType } from '../types/transaction'

interface BaseInput {
  /** Positive integer paise */
  amount: number
  accountId: string
  /** ISO date-time */
  date: string
  note?: string
}

export type TransactionInput =
  | (BaseInput & { type: 'expense' | 'income'; categoryId: string })
  | (BaseInput & { type: 'transfer'; toAccountId: string })

export interface TransactionFilters {
  /** YYYY-MM, in India time */
  month?: string
  type?: TransactionType
  accountId?: string
  categoryId?: string
  limit?: number
  cursor?: string
}

export interface TransactionPage {
  transactions: Transaction[]
  nextCursor: string | null
}

export async function fetchTransactions(filters: TransactionFilters): Promise<TransactionPage> {
  const { data } = await api.get<TransactionPage>('/transactions', { params: filters })
  return data
}

export async function fetchMonthSummary(
  filters: Pick<TransactionFilters, 'accountId' | 'categoryId'> & { month: string },
): Promise<MonthSummary> {
  const { data } = await api.get<{ summary: MonthSummary }>('/transactions/summary', { params: filters })
  return data.summary
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const { data } = await api.post<{ transaction: Transaction }>('/transactions', input)
  return data.transaction
}

/** Sends the full transaction; the server drops fields that don't apply to the type */
export async function updateTransaction(id: string, input: TransactionInput): Promise<Transaction> {
  const { data } = await api.patch<{ transaction: Transaction }>(`/transactions/${id}`, input)
  return data.transaction
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/transactions/${id}`)
}

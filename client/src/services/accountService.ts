import { api } from './api'
import type { Account, AccountType } from '../types/account'

export interface AccountInput {
  name: string
  type: AccountType
  /** Integer paise */
  openingBalance: number
}

export type AccountUpdate = Partial<AccountInput & { archived: boolean }>

export async function fetchAccounts(): Promise<Account[]> {
  const { data } = await api.get<{ accounts: Account[] }>('/accounts')
  return data.accounts
}

export async function createAccount(input: AccountInput): Promise<Account> {
  const { data } = await api.post<{ account: Account }>('/accounts', input)
  return data.account
}

export async function updateAccount(id: string, update: AccountUpdate): Promise<Account> {
  const { data } = await api.patch<{ account: Account }>(`/accounts/${id}`, update)
  return data.account
}

export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`/accounts/${id}`)
}

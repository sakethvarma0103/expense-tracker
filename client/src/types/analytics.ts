export interface CategoryTotal {
  categoryId: string
  /** Paise */
  total: number
  count: number
}

/** All amounts in paise. Transfers are excluded. */
export interface MonthlyAnalytics {
  month: string
  totals: { income: number; expense: number; net: number; count: number }
  /** Largest first */
  expenseByCategory: CategoryTotal[]
  incomeByCategory: CategoryTotal[]
  /** Every day of the month (India time) */
  daily: { date: string; income: number; expense: number }[]
  /** Last 6 months ending with `month`, oldest first */
  trend: { month: string; income: number; expense: number }[]
}

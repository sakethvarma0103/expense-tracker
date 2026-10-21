import { api } from './api'
import type { MonthlyAnalytics } from '../types/analytics'

/** @param month YYYY-MM, in India time */
export async function fetchMonthlyAnalytics(month: string): Promise<MonthlyAnalytics> {
  const { data } = await api.get<{ analytics: MonthlyAnalytics }>('/analytics/monthly', { params: { month } })
  return data.analytics
}

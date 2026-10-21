import { Types } from 'mongoose';
import { Transaction } from '../models/Transaction';
import { APP_TIMEZONE, daysOfMonth, istMonthRange, shiftMonth } from './dateRange';

/** Number of months in the income-vs-expense trend, ending with the selected month */
export const TREND_MONTHS = 6;

export interface CategoryTotal {
  categoryId: string;
  /** Paise */
  total: number;
  count: number;
}

export interface MonthlyAnalytics {
  month: string;
  /** All amounts in paise. Transfers are excluded everywhere: they move money, not earn or spend it. */
  totals: { income: number; expense: number; net: number; count: number };
  /** Largest first */
  expenseByCategory: CategoryTotal[];
  incomeByCategory: CategoryTotal[];
  /** Every day of the month (India time), zero-filled */
  daily: { date: string; income: number; expense: number }[];
  /** The last TREND_MONTHS months ending with `month`, oldest first, zero-filled */
  trend: { month: string; income: number; expense: number }[];
}

interface TypedTotal<K> {
  _id: K;
  total: number;
  count: number;
}

type Flow = 'income' | 'expense';

export async function getMonthlyAnalytics(userId: string, month: string): Promise<MonthlyAnalytics> {
  const firstTrendMonth = shiftMonth(month, -(TREND_MONTHS - 1));
  const { start: trendStart } = istMonthRange(firstTrendMonth);
  const { start, end } = istMonthRange(month);
  const inMonth = { date: { $gte: start, $lt: end } };

  // One round trip: match the whole trend window, then split into views with $facet.
  // aggregate() doesn't cast types, so ids must be ObjectIds.
  const [result] = await Transaction.aggregate<{
    totals: TypedTotal<Flow>[];
    byCategory: TypedTotal<{ type: Flow; categoryId: Types.ObjectId }>[];
    daily: TypedTotal<{ type: Flow; day: string }>[];
    trend: TypedTotal<{ type: Flow; month: string }>[];
  }>([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        type: { $in: ['income', 'expense'] },
        date: { $gte: trendStart, $lt: end },
      },
    },
    {
      $facet: {
        totals: [
          { $match: inMonth },
          { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ],
        byCategory: [
          { $match: inMonth },
          {
            $group: {
              _id: { type: '$type', categoryId: '$categoryId' },
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
        ],
        daily: [
          { $match: inMonth },
          {
            $group: {
              _id: {
                type: '$type',
                day: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: APP_TIMEZONE } },
              },
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ],
        trend: [
          {
            $group: {
              _id: {
                type: '$type',
                month: { $dateToString: { format: '%Y-%m', date: '$date', timezone: APP_TIMEZONE } },
              },
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const totalOf = (type: Flow) => result?.totals.find((t) => t._id === type);
  const income = totalOf('income')?.total ?? 0;
  const expense = totalOf('expense')?.total ?? 0;

  const categoryTotals = (type: Flow): CategoryTotal[] =>
    (result?.byCategory ?? [])
      .filter((c) => c._id.type === type)
      .map((c) => ({ categoryId: c._id.categoryId.toString(), total: c.total, count: c.count }));

  const dailyMap = new Map((result?.daily ?? []).map((d) => [`${d._id.type}:${d._id.day}`, d.total]));
  const trendMap = new Map((result?.trend ?? []).map((t) => [`${t._id.type}:${t._id.month}`, t.total]));

  return {
    month,
    totals: {
      income,
      expense,
      net: income - expense,
      count: (totalOf('income')?.count ?? 0) + (totalOf('expense')?.count ?? 0),
    },
    expenseByCategory: categoryTotals('expense'),
    incomeByCategory: categoryTotals('income'),
    daily: daysOfMonth(month).map((date) => ({
      date,
      income: dailyMap.get(`income:${date}`) ?? 0,
      expense: dailyMap.get(`expense:${date}`) ?? 0,
    })),
    trend: Array.from({ length: TREND_MONTHS }, (_, i) => {
      const m = shiftMonth(firstTrendMonth, i);
      return { month: m, income: trendMap.get(`income:${m}`) ?? 0, expense: trendMap.get(`expense:${m}`) ?? 0 };
    }),
  };
}

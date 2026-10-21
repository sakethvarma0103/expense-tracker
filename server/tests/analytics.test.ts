import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { MonthlyAnalytics } from '../src/services/analyticsService';
import { app, newUser, setupUser, type Agent, type Ids } from './helpers';

describe('monthly analytics', () => {
  let a: Agent;
  let b: Agent;
  let ids: Ids;
  let oct: MonthlyAnalytics;

  const cat = (name: string, type = 'expense') => ids.categories[`${type}:${name}`];
  const octIncome = 100000_00 + 500_00;
  const octExpense = 25000_00 + 300_00 + 200_00 + 1500_00;

  beforeAll(async () => {
    a = (await newUser()).agent;
    b = (await newUser()).agent;
    ids = await setupUser(a, { Bank: ['bank', 0], Cash: ['cash', 0] });
    const add = async (type: string, amount: number, extra: object, date: string) => {
      const res = await a.post('/api/transactions').send({ type, amount, accountId: ids.accounts.Bank, date, ...extra });
      if (res.status !== 201) throw new Error(JSON.stringify(res.body));
    };

    // October 2026 in India time
    await add('income', 100000_00, { categoryId: cat('Salary', 'income') }, '2026-10-01T09:00:00+05:30');
    await add('income', 500_00, { categoryId: cat('Interest', 'income') }, '2026-10-31T23:30:00+05:30');
    await add('expense', 25000_00, { categoryId: cat('Rent') }, '2026-10-02T10:00:00+05:30');
    await add('expense', 300_00, { categoryId: cat('Food & Dining') }, '2026-10-15T20:00:00Z'); // 16 Oct 01:30 IST
    await add('expense', 200_00, { categoryId: cat('Food & Dining') }, '2026-10-16T12:00:00+05:30');
    await add('expense', 1500_00, { categoryId: cat('Fuel') }, '2026-10-01T00:00:00+05:30');
    await add('transfer', 9999_00, { toAccountId: ids.accounts.Cash }, '2026-10-10T10:00:00+05:30'); // ignored
    // Around the edges
    await add('expense', 111_00, { categoryId: cat('Food & Dining') }, '2026-09-30T23:59:00+05:30');
    await add('expense', 222_00, { categoryId: cat('Food & Dining') }, '2026-11-01T00:00:00+05:30');
    await add('income', 90000_00, { categoryId: cat('Salary', 'income') }, '2026-08-01T09:00:00+05:30');
    await add('expense', 777_00, { categoryId: cat('Food & Dining') }, '2026-04-30T23:00:00+05:30'); // before the trend window
    await add('expense', 888_00, { categoryId: cat('Food & Dining') }, '2026-05-01T00:30:00+05:30');

    oct = (await a.get('/api/analytics/monthly?month=2026-10')).body.analytics;
  });

  it('requires login and a valid month', async () => {
    expect((await request(app).get('/api/analytics/monthly?month=2026-10')).status).toBe(401);
    expect((await a.get('/api/analytics/monthly')).status).toBe(400);
    expect((await a.get('/api/analytics/monthly?month=2026-10-01')).status).toBe(400);
  });

  it('totals the month in India time and ignores transfers', () => {
    expect(oct.totals).toEqual({ income: octIncome, expense: octExpense, net: octIncome - octExpense, count: 6 });
  });

  it('ranks spending and income by category', () => {
    expect(oct.expenseByCategory.map((c) => c.categoryId)).toEqual([cat('Rent'), cat('Fuel'), cat('Food & Dining')]);
    expect(oct.expenseByCategory.find((c) => c.categoryId === cat('Food & Dining'))).toMatchObject({ total: 500_00, count: 2 });
    expect(oct.incomeByCategory).toHaveLength(2);
  });

  it('buckets days in India time and zero-fills the month', () => {
    expect(oct.daily).toHaveLength(31);
    expect(oct.daily[0]?.date).toBe('2026-10-01');
    const day = (d: string) => oct.daily.find((x) => x.date === d);
    expect(day('2026-10-15')?.expense).toBe(0);
    expect(day('2026-10-16')?.expense).toBe(500_00);
    expect(day('2026-10-01')?.expense).toBe(1500_00);
    expect(day('2026-10-31')?.income).toBe(500_00);
    expect(oct.daily.reduce((s, d) => s + d.expense, 0)).toBe(octExpense);
  });

  it('returns a zero-filled 6-month trend in India time', () => {
    expect(oct.trend.map((t) => t.month)).toEqual(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
    const m = (month: string) => oct.trend.find((t) => t.month === month);
    expect(m('2026-05')?.expense).toBe(888_00);
    expect(m('2026-06')).toMatchObject({ income: 0, expense: 0 });
    expect(m('2026-08')).toMatchObject({ income: 90000_00, expense: 0 });
    expect(m('2026-09')?.expense).toBe(111_00);
    expect(m('2026-10')).toMatchObject({ income: octIncome, expense: octExpense });
  });

  it('handles the next month, empty months and other users', async () => {
    const nov: MonthlyAnalytics = (await a.get('/api/analytics/monthly?month=2026-11')).body.analytics;
    expect(nov.totals.expense).toBe(222_00);
    expect(nov.daily).toHaveLength(30);

    const feb: MonthlyAnalytics = (await a.get('/api/analytics/monthly?month=2027-02')).body.analytics;
    expect(feb.totals.count).toBe(0);
    expect(feb.daily).toHaveLength(28);
    expect(feb.expenseByCategory).toHaveLength(0);

    const other: MonthlyAnalytics = (await b.get('/api/analytics/monthly?month=2026-10')).body.analytics;
    expect(other.totals.count).toBe(0);
  });

  it('agrees with the transactions summary', async () => {
    const summary = (await a.get('/api/transactions/summary?month=2026-10')).body.summary;
    expect(summary).toMatchObject({ income: oct.totals.income, expense: oct.totals.expense });
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { app, balances, newUser, setupUser, type Agent, type Ids } from './helpers';

interface Tx {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  categoryId: string | null;
  toAccountId: string | null;
}

describe('transactions', () => {
  let a: Agent;
  let b: Agent;
  let ids: Ids;
  let bIds: Ids;
  const tx = (body: object) => a.post('/api/transactions').send(body);
  const food = () => ids.categories['expense:Food & Dining'];
  const salary = () => ids.categories['income:Salary'];

  let dinnerId: string;
  let atmId: string;

  beforeAll(async () => {
    a = (await newUser()).agent;
    b = (await newUser()).agent;
    ids = await setupUser(a, { HDFC: ['bank', 100000_00], Cash: ['cash', 5000_00], Card: ['credit_card', 0] });
    bIds = await setupUser(b, { 'B Bank': ['bank', 0] });
  });

  describe('validation', () => {
    it('requires login and a known type', async () => {
      expect((await request(app).get('/api/transactions')).status).toBe(401);
      expect((await tx({ type: 'loan' })).status).toBe(400);
    });

    it('reports bad amount, account and date per field', async () => {
      const res = await tx({ type: 'expense', amount: 0, accountId: 'x', categoryId: food(), date: 'yesterday' });
      expect(res.status).toBe(400);
      expect(Object.keys(res.body.error.details)).toEqual(expect.arrayContaining(['amount', 'accountId', 'date']));
    });

    it('rejects fractional paise, missing category and same-account transfers', async () => {
      const date = '2026-10-01T10:00:00Z';
      expect((await tx({ type: 'expense', amount: 12.5, accountId: ids.accounts.HDFC, categoryId: food(), date })).body.error.details.amount).toBeDefined();
      expect((await tx({ type: 'expense', amount: 100, accountId: ids.accounts.HDFC, date })).body.error.details.categoryId).toBeDefined();
      expect((await tx({ type: 'transfer', amount: 100, accountId: ids.accounts.HDFC, toAccountId: ids.accounts.HDFC, date })).body.error.details.toAccountId).toBeDefined();
    });

    it('requires a category of the matching type', async () => {
      const res = await tx({ type: 'expense', amount: 100, accountId: ids.accounts.HDFC, categoryId: salary(), date: '2026-10-01T10:00:00Z' });
      expect(res.status).toBe(400);
      expect(res.body.error.details.categoryId[0]).toMatch(/expense category/);
    });

    it("rejects other users' accounts and categories", async () => {
      const date = '2026-10-01T10:00:00Z';
      const acc = await tx({ type: 'expense', amount: 100, accountId: bIds.accounts['B Bank'], categoryId: food(), date });
      expect(acc.body.error.details.accountId).toEqual(['Account not found']);
      const cat = await tx({ type: 'expense', amount: 100, accountId: ids.accounts.HDFC, categoryId: bIds.categories['expense:Food & Dining'], date });
      expect(cat.body.error.details.categoryId).toEqual(['Category not found']);
    });
  });

  describe('balances', () => {
    it('applies income, expense and transfers to account balances', async () => {
      const income = await tx({ type: 'income', amount: 50000_00, accountId: ids.accounts.HDFC, categoryId: salary(), date: '2026-10-01T09:00:00+05:30', note: '  October salary ' });
      expect(income.status).toBe(201);
      expect(income.body.transaction).toMatchObject({ note: 'October salary', toAccountId: null });

      const dinner = await tx({ type: 'expense', amount: 450_50, accountId: ids.accounts.Card, categoryId: food(), date: '2026-10-05T20:15:00+05:30', note: 'Dinner' });
      dinnerId = dinner.body.transaction.id;

      // A stray categoryId on a transfer is dropped
      const atm = await tx({ type: 'transfer', amount: 2000_00, accountId: ids.accounts.HDFC, toAccountId: ids.accounts.Cash, date: '2026-10-06T11:00:00+05:30', categoryId: food() });
      expect(atm.body.transaction).toMatchObject({ toAccountId: ids.accounts.Cash, categoryId: null });
      atmId = atm.body.transaction.id;

      await tx({ type: 'transfer', amount: 450_50, accountId: ids.accounts.HDFC, toAccountId: ids.accounts.Card, date: '2026-10-10T12:00:00+05:30', note: 'Card bill' });

      expect(await balances(a)).toEqual({
        HDFC: 100000_00 + 50000_00 - 2000_00 - 450_50,
        Cash: 7000_00,
        Card: 0,
      });
      expect((await a.get(`/api/accounts/${ids.accounts.Cash}`)).body.account.balance).toBe(7000_00);
    });
  });

  describe('listing', () => {
    beforeAll(async () => {
      const cash = ids.accounts.Cash;
      await tx({ type: 'expense', amount: 100, accountId: cash, categoryId: food(), date: '2026-09-30T23:59:00+05:30', note: 'last minute of Sep IST' });
      await tx({ type: 'expense', amount: 200, accountId: cash, categoryId: food(), date: '2026-10-31T23:30:00+05:30', note: 'last 30 min of Oct IST' });
      await tx({ type: 'expense', amount: 300, accountId: cash, categoryId: food(), date: '2026-11-01T00:00:00+05:30', note: 'first instant of Nov IST' });
    });

    it('filters by month in India time, newest first', async () => {
      const oct: Tx[] = (await a.get('/api/transactions?month=2026-10')).body.transactions;
      const notes = oct.map((t) => t.note);
      expect(oct).toHaveLength(5);
      expect(notes[0]).toBe('last 30 min of Oct IST');
      expect(notes).not.toContain('last minute of Sep IST');
      expect(notes).not.toContain('first instant of Nov IST');
      const sep: Tx[] = (await a.get('/api/transactions?month=2026-09')).body.transactions;
      expect(sep.map((t) => t.note)).toEqual(['last minute of Sep IST']);
      expect((await a.get('/api/transactions?month=2026-13')).status).toBe(400);
    });

    it('filters by account (including transfers in), type and category', async () => {
      expect((await a.get(`/api/transactions?accountId=${ids.accounts.Card}`)).body.transactions).toHaveLength(2);
      const transfers: Tx[] = (await a.get('/api/transactions?type=transfer')).body.transactions;
      expect(transfers.every((t) => t.type === 'transfer')).toBe(true);
      expect(transfers).toHaveLength(2);
      expect((await a.get(`/api/transactions?categoryId=${salary()}`)).body.transactions).toHaveLength(1);
      expect((await b.get('/api/transactions')).body.transactions).toHaveLength(0);
    });

    it('pages with a cursor without repeating items', async () => {
      const seen: string[] = [];
      let cursor: string | null = null;
      let pages = 0;
      do {
        const res = await a.get('/api/transactions').query({ limit: 3, ...(cursor ? { cursor } : {}) });
        seen.push(...(res.body.transactions as Tx[]).map((t) => t.id));
        cursor = res.body.nextCursor;
        pages++;
      } while (cursor && pages < 10);
      expect(pages).toBe(3);
      expect(new Set(seen).size).toBe(7);
      expect((await a.get('/api/transactions?cursor=garbage')).status).toBe(400);
    });

    it('summarises a month excluding transfers', async () => {
      const res = await a.get('/api/transactions/summary?month=2026-10');
      expect(res.body.summary).toEqual({ month: '2026-10', income: 50000_00, expense: 450_50 + 200, net: 50000_00 - 450_50 - 200 });
      expect((await a.get('/api/transactions/summary')).status).toBe(400);
    });
  });

  describe('updates', () => {
    it('merges a partial update and keeps other fields', async () => {
      const res = await a.patch(`/api/transactions/${dinnerId}`).send({ amount: 500_00 });
      expect(res.body.transaction).toMatchObject({ amount: 500_00, note: 'Dinner', categoryId: food() });
      expect((await balances(a)).Card).toBe(-500_00 + 450_50);
    });

    it('switches type and clears fields that no longer apply', async () => {
      const missing = await a.patch(`/api/transactions/${dinnerId}`).send({ type: 'transfer' });
      expect(missing.body.error.details.toAccountId).toBeDefined();

      const toTransfer = await a.patch(`/api/transactions/${dinnerId}`).send({ type: 'transfer', toAccountId: ids.accounts.Cash });
      expect(toTransfer.body.transaction).toMatchObject({ type: 'transfer', categoryId: null });

      const back = await a.patch(`/api/transactions/${dinnerId}`).send({ type: 'expense', categoryId: food() });
      expect(back.body.transaction).toMatchObject({ toAccountId: null, categoryId: food() });

      expect((await a.patch(`/api/transactions/${dinnerId}`).send({ note: '' })).body.transaction.note).toBeNull();
    });

    it('rejects unknown fields and other users', async () => {
      expect((await a.patch(`/api/transactions/${dinnerId}`).send({ userId: 'x' })).status).toBe(400);
      expect((await b.patch(`/api/transactions/${dinnerId}`).send({ amount: 1 })).status).toBe(404);
    });

    it('blocks archived categories on new transactions but allows editing old ones', async () => {
      await a.patch(`/api/categories/${food()}`).send({ archived: true });
      const created = await tx({ type: 'expense', amount: 100, accountId: ids.accounts.Cash, categoryId: food(), date: '2026-10-15T10:00:00Z' });
      expect(created.body.error.details.categoryId).toEqual(['This category is archived']);
      expect((await a.patch(`/api/transactions/${dinnerId}`).send({ amount: 600_00 })).status).toBe(200);
      await a.patch(`/api/categories/${food()}`).send({ archived: false });
    });
  });

  describe('deleting', () => {
    it('refuses to delete accounts and categories that have transactions', async () => {
      const acc = await a.delete(`/api/accounts/${ids.accounts.Card}`);
      expect(acc.status).toBe(409);
      expect(acc.body.error.message).toMatch(/Archive it instead/);
      expect((await a.delete(`/api/categories/${food()}`)).status).toBe(409);
      expect((await a.delete(`/api/categories/${ids.categories['expense:Travel']}`)).status).toBe(204);
    });

    it('deletes a transaction and updates balances', async () => {
      expect((await b.delete(`/api/transactions/${atmId}`)).status).toBe(404);
      expect((await a.delete(`/api/transactions/${atmId}`)).status).toBe(204);
      const bal = await balances(a);
      expect(bal.Cash).toBe(5000_00 - 100 - 200 - 300);
      expect(bal.HDFC).toBe(100000_00 + 50000_00 - 450_50);
      expect((await a.get(`/api/transactions/${atmId}`)).status).toBe(404);
    });
  });
});

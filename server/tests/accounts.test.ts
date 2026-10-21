import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { app, newUser, type Agent } from './helpers';

describe('accounts', () => {
  let a: Agent;
  let b: Agent;
  let hdfcId: string;
  let cashId: string;
  let otherUsersAccountId: string;

  beforeAll(async () => {
    a = (await newUser()).agent;
    b = (await newUser()).agent;
  });

  it('requires login', async () => {
    expect((await request(app).get('/api/accounts')).status).toBe(401);
  });

  it('validates input', async () => {
    const res = await a.post('/api/accounts').send({ name: '', type: 'gold', openingBalance: 10.5 });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details)).toEqual(expect.arrayContaining(['name', 'type', 'openingBalance']));
    expect((await a.post('/api/accounts').send({ name: 'X', type: 'bank', openingBalance: '25050' })).status).toBe(400);
    expect((await a.post('/api/accounts').send({ name: 'X', type: 'bank', openingBalance: 2e13 })).status).toBe(400);
  });

  it('creates accounts with paise balances and no internal fields', async () => {
    const res = await a.post('/api/accounts').send({ name: '  HDFC Savings ', type: 'bank', openingBalance: 25050 });
    expect(res.status).toBe(201);
    expect(res.body.account).toMatchObject({ name: 'HDFC Savings', openingBalance: 25050, balance: 25050, archived: false });
    expect(res.body.account).not.toHaveProperty('userId');
    expect(res.body.account).not.toHaveProperty('_id');
    hdfcId = res.body.account.id;

    const cash = await a.post('/api/accounts').send({ name: 'Cash', type: 'cash' });
    expect(cash.body.account.openingBalance).toBe(0);
    cashId = cash.body.account.id;

    const card = await a.post('/api/accounts').send({ name: 'Amex', type: 'credit_card', openingBalance: -1234567 });
    expect(card.body.account.balance).toBe(-1234567);
  });

  it('keeps names unique per user, ignoring case', async () => {
    const dup = await a.post('/api/accounts').send({ name: 'hdfc savings', type: 'bank' });
    expect(dup.status).toBe(409);
    expect(dup.body.error.message).toBe('You already have an account with this name');

    const other = await b.post('/api/accounts').send({ name: 'HDFC Savings', type: 'bank' });
    expect(other.status).toBe(201);
    otherUsersAccountId = other.body.account.id;
  });

  it("lists only the user's own accounts, sorted by name", async () => {
    const res = await a.get('/api/accounts');
    expect(res.body.accounts.map((x: { name: string }) => x.name)).toEqual(['Amex', 'Cash', 'HDFC Savings']);
  });

  it("hides other users' accounts behind 404", async () => {
    expect((await a.get(`/api/accounts/${otherUsersAccountId}`)).status).toBe(404);
    expect((await a.patch(`/api/accounts/${otherUsersAccountId}`).send({ name: 'Hacked' })).status).toBe(404);
    expect((await a.delete(`/api/accounts/${otherUsersAccountId}`)).status).toBe(404);
    expect((await b.get(`/api/accounts/${otherUsersAccountId}`)).body.account.name).toBe('HDFC Savings');
    expect((await a.get('/api/accounts/not-an-id')).status).toBe(404);
  });

  it('updates, archives and deletes', async () => {
    expect((await a.patch(`/api/accounts/${hdfcId}`).send({})).status).toBe(400);

    const patched = await a.patch(`/api/accounts/${hdfcId}`).send({ name: 'HDFC', openingBalance: 100 });
    expect(patched.body.account).toMatchObject({ name: 'HDFC', balance: 100, type: 'bank' });

    expect((await a.patch(`/api/accounts/${cashId}`).send({ name: 'AMEX' })).status).toBe(409);

    const archived = await a.patch(`/api/accounts/${cashId}`).send({ archived: true });
    expect(archived.body.account.archived).toBe(true);
    const list = await a.get('/api/accounts');
    expect(list.body.accounts.at(-1).id).toBe(cashId);

    expect((await a.delete(`/api/accounts/${cashId}`)).status).toBe(204);
    expect((await a.get(`/api/accounts/${cashId}`)).status).toBe(404);
  });
});

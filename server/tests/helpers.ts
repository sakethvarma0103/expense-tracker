import request from 'supertest';
import { createApp } from '../src/app';

export const app = createApp();

/** A supertest agent keeps cookies between requests, like a browser */
export type Agent = ReturnType<typeof request.agent>;

let counter = 0;

/** Registers a fresh user and returns an agent that is logged in as them */
export async function newUser(name = 'Test User'): Promise<{ agent: Agent; email: string }> {
  const agent = request.agent(app);
  const email = `user${++counter}-${Date.now()}@example.com`;
  const res = await agent.post('/api/auth/register').send({ name, email, password: 'correct-horse-1' });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, email };
}

export interface Ids {
  accounts: Record<string, string>;
  categories: Record<string, string>;
}

/** Creates accounts (name -> [type, openingBalance in paise]) and looks up default category ids */
export async function setupUser(
  agent: Agent,
  accounts: Record<string, [string, number]>,
): Promise<Ids> {
  const ids: Ids = { accounts: {}, categories: {} };
  for (const [name, [type, openingBalance]] of Object.entries(accounts)) {
    const res = await agent.post('/api/accounts').send({ name, type, openingBalance });
    if (res.status !== 201) throw new Error(`account failed: ${JSON.stringify(res.body)}`);
    ids.accounts[name] = res.body.account.id as string;
  }
  const res = await agent.get('/api/categories');
  for (const c of res.body.categories as { id: string; name: string; type: string }[]) {
    ids.categories[`${c.type}:${c.name}`] = c.id;
  }
  return ids;
}

/** Current balances keyed by account name */
export async function balances(agent: Agent): Promise<Record<string, number>> {
  const res = await agent.get('/api/accounts');
  return Object.fromEntries(
    (res.body.accounts as { name: string; balance: number }[]).map((a) => [a.name, a.balance]),
  );
}

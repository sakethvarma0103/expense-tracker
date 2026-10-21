import mongoose from 'mongoose';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { Category } from '../src/models/Category';
import { User } from '../src/models/User';
import { ensureDefaultCategories } from '../src/services/categoryService';
import { app, newUser, type Agent } from './helpers';

interface Cat {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
  archived: boolean;
}

describe('categories', () => {
  let a: Agent;
  let b: Agent;
  let petsId: string;

  beforeAll(async () => {
    a = (await newUser()).agent;
    b = (await newUser()).agent;
  });

  it('gives new users 18 default categories, once', async () => {
    expect((await request(app).get('/api/categories')).status).toBe(401);
    const all: Cat[] = (await a.get('/api/categories')).body.categories;
    expect(all).toHaveLength(18);
    expect(all.filter((c) => c.type === 'expense')).toHaveLength(13);
    expect(all.filter((c) => c.name === 'Other')).toHaveLength(2);
    expect(all.every((c) => /^#[0-9a-f]{6}$/.test(c.color) && c.icon && !('userId' in c))).toBe(true);
    expect((await a.get('/api/categories')).body.categories).toHaveLength(18);
  });

  it('filters by type', async () => {
    const income: Cat[] = (await a.get('/api/categories?type=income')).body.categories;
    expect(income).toHaveLength(5);
    expect(income.every((c) => c.type === 'income')).toBe(true);
    expect((await a.get('/api/categories?type=bogus')).status).toBe(400);
  });

  it('validates and creates categories', async () => {
    const bad = await a.post('/api/categories').send({ name: '', type: 'spend', color: 'red', icon: 'rocket' });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.error.details)).toEqual(expect.arrayContaining(['name', 'type', 'color', 'icon']));

    const res = await a.post('/api/categories').send({ name: ' Pets ', type: 'expense', color: '#AABBCC', icon: 'pets' });
    expect(res.status).toBe(201);
    expect(res.body.category).toMatchObject({ name: 'Pets', color: '#aabbcc' });
    petsId = res.body.category.id;
  });

  it('keeps names unique per type, ignoring case', async () => {
    const dup = await a.post('/api/categories').send({ name: 'groceries', type: 'expense', color: '#000000', icon: 'label' });
    expect(dup.status).toBe(409);
    const otherType = await a.post('/api/categories').send({ name: 'Groceries', type: 'income', color: '#000000', icon: 'label' });
    expect(otherType.status).toBe(201);
  });

  it("hides other users' categories behind 404", async () => {
    const bGroceries = ((await b.get('/api/categories')).body.categories as Cat[]).find((c) => c.name === 'Groceries');
    expect((await a.patch(`/api/categories/${bGroceries?.id}`).send({ name: 'Hacked' })).status).toBe(404);
    expect((await a.delete(`/api/categories/${bGroceries?.id}`)).status).toBe(404);
  });

  it("updates name, colour, icon and archive state, but never type", async () => {
    expect((await a.patch(`/api/categories/${petsId}`).send({ type: 'income' })).status).toBe(400);
    expect((await a.patch(`/api/categories/${petsId}`).send({})).status).toBe(400);
    const res = await a.patch(`/api/categories/${petsId}`).send({ name: 'Pet care', color: '#123456', icon: 'spa' });
    expect(res.body.category).toMatchObject({ name: 'Pet care', color: '#123456', icon: 'spa', type: 'expense' });
    expect((await a.patch(`/api/categories/${petsId}`).send({ name: 'Rent' })).status).toBe(409);

    await a.patch(`/api/categories/${petsId}`).send({ archived: true });
    const expense: Cat[] = (await a.get('/api/categories?type=expense')).body.categories;
    expect(expense.at(-1)?.id).toBe(petsId);
  });

  it('deletes unused categories', async () => {
    expect((await a.delete(`/api/categories/${petsId}`)).status).toBe(204);
    expect((await a.delete(`/api/categories/${petsId}`)).status).toBe(404);
    expect((await a.delete('/api/categories/nope')).status).toBe(404);
  });

  it('seeds a pre-existing user exactly once, even with concurrent requests', async () => {
    const legacy = await User.create({ name: 'Legacy', email: `legacy-${Date.now()}@example.com`, passwordHash: 'x' });
    const id = legacy.id as string;
    await Promise.all(Array.from({ length: 5 }, () => ensureDefaultCategories(id)));
    await ensureDefaultCategories(id);
    expect(await Category.countDocuments({ userId: new mongoose.Types.ObjectId(id) })).toBe(18);
    expect((await User.findById(id))?.categoriesSeededAt).toBeInstanceOf(Date);
  });
});

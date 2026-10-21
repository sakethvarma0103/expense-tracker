import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './helpers';

// Runs in its own file so the limiter's in-memory counter starts fresh
describe('login rate limit', () => {
  beforeAll(() => {
    process.env.TEST_RATE_LIMIT = '1';
  });
  afterAll(() => {
    delete process.env.TEST_RATE_LIMIT;
  });

  it('allows 20 attempts per 15 minutes, then returns 429 in the standard format', async () => {
    const attempt = () => request(app).post('/api/auth/login').send({ email: 'x@example.com', password: 'nope' });
    for (let i = 0; i < 20; i++) {
      expect((await attempt()).status).toBe(401);
    }
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: { message: 'Too many attempts. Please try again later.' } });
  });
});

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './helpers';

describe('auth', () => {
  const email = `auth-${Date.now()}@example.com`;
  const agent = request.agent(app);

  it('rejects invalid registration with per-field errors', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: '', email: 'bad', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
    expect(Object.keys(res.body.error.details)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('registers, trims and lowercases, and sets an HttpOnly cookie', async () => {
    const res = await agent
      .post('/api/auth/register')
      .send({ name: ' Test User ', email: email.toUpperCase(), password: 'correct-horse-1' });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: 'Test User', email });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/token=.+HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('rejects a duplicate email with 409', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Dup', email, password: 'correct-horse-1' });
    expect(res.status).toBe(409);
  });

  it('returns the user from /me only with a valid cookie', async () => {
    expect((await agent.get('/api/auth/me')).body.user.email).toBe(email);
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Cookie', 'token=forged')).status).toBe(401);
  });

  it('gives the same message for a wrong password and an unknown email', async () => {
    const wrong = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
    const unknown = await request(app).post('/api/auth/login').send({ email: `x${email}`, password: 'whatever1' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe('Invalid email or password');
    expect(unknown.body.error.message).toBe(wrong.body.error.message);
  });

  it('logs in case-insensitively and logs out by clearing the cookie', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: ` ${email.toUpperCase()}`, password: 'correct-horse-1' });
    expect(login.status).toBe(200);
    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(204);
    expect(String(logout.headers['set-cookie'])).toMatch(/token=;.*Expires=Thu, 01 Jan 1970/i);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  it('returns errors in the standard format for bad JSON and unknown routes', async () => {
    const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad json');
    expect(bad.status).toBe(400);
    expect(bad.body.error.message).toBe('Malformed JSON in request body');
    const missing = await request(app).get('/api/nope');
    expect(missing.status).toBe(404);
    expect(typeof missing.body.error.message).toBe('string');
  });
});

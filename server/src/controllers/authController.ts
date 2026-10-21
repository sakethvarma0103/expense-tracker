import type { Request, Response } from 'express';
import { z } from 'zod';
import { getUserId } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import { toPublicUser } from '../models/User';
import {
  AUTH_COOKIE,
  authCookieMaxAgeMs,
  authCookieOptions,
  authenticateUser,
  findUserById,
  registerUser,
  signToken,
} from '../services/authService';

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email'));

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  email,
  // bcrypt only uses the first 72 bytes
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

function setAuthCookie(res: Response, userId: string): void {
  res.cookie(AUTH_COOKIE, signToken(userId), { ...authCookieOptions, maxAge: authCookieMaxAgeMs });
}

export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as z.infer<typeof registerSchema>;
  const user = await registerUser(input);
  setAuthCookie(res, user.id as string);
  res.status(201).json({ user: toPublicUser(user) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = await authenticateUser(email, password);
  setAuthCookie(res, user.id as string);
  res.json({ user: toPublicUser(user) });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(AUTH_COOKIE, authCookieOptions);
  res.status(204).end();
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await findUserById(getUserId(req));
  if (!user) {
    // Token is valid but the account no longer exists
    res.clearCookie(AUTH_COOKIE, authCookieOptions);
    throw new HttpError(401, 'Not authenticated');
  }
  res.json({ user: toPublicUser(user) });
}

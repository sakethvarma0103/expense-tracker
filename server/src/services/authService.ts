import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { CookieOptions } from 'express';
import { env } from '../config/env';
import { HttpError } from '../middleware/error';
import { User, type UserDocument } from '../models/User';

export const AUTH_COOKIE = 'token';

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const BCRYPT_ROUNDS = 12;

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export function signToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    expiresIn: TOKEN_TTL_SECONDS,
    algorithm: 'HS256',
  });
}

export const authCookieMaxAgeMs = TOKEN_TTL_SECONDS * 1000;

// Returns the userId if the token is valid, otherwise null.
export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<UserDocument> {
  const existing = await User.exists({ email: input.email });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists');
  }
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  return User.create({ name: input.name, email: input.email, passwordHash });
}

// Hash used to keep login timing similar whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

export async function authenticateUser(email: string, password: string): Promise<UserDocument> {
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    throw new HttpError(401, 'Invalid email or password');
  }
  return user;
}

export async function findUserById(userId: string): Promise<UserDocument | null> {
  return User.findById(userId);
}

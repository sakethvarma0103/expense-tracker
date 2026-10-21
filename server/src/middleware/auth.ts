import type { RequestHandler } from 'express';
import { AUTH_COOKIE, verifyToken } from '../services/authService';
import { HttpError } from './error';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token: unknown = req.cookies?.[AUTH_COOKIE];
  const userId = typeof token === 'string' ? verifyToken(token) : null;
  if (!userId) {
    throw new HttpError(401, 'Not authenticated');
  }
  req.userId = userId;
  next();
};

// Use in handlers behind requireAuth to get a definitely-set userId.
export function getUserId(req: { userId?: string }): string {
  if (!req.userId) {
    throw new HttpError(401, 'Not authenticated');
  }
  return req.userId;
}

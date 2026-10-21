import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { login, loginSchema, logout, me, register, registerSchema } from '../controllers/authController';
import { env } from '../config/env';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

// Slows down password guessing: 20 attempts per IP per 15 minutes.
// Off under NODE_ENV=test (suites register many users) unless a test opts back in.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test' && process.env.TEST_RATE_LIMIT !== '1',
  handler: (_req, res) => {
    res.status(429).json({ error: { message: 'Too many attempts. Please try again later.' } });
  },
});

export const authRouter = Router();

authRouter.post('/register', authLimiter, validateBody(registerSchema), register);
authRouter.post('/login', authLimiter, validateBody(loginSchema), login);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, me);

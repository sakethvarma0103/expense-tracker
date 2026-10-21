import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/error';
import { accountRouter } from './routes/accountRoutes';
import { analyticsRouter } from './routes/analyticsRoutes';
import { authRouter } from './routes/authRoutes';
import { categoryRouter } from './routes/categoryRoutes';
import { transactionRouter } from './routes/transactionRoutes';

/** Builds the Express app without connecting to the database or listening (tests import this) */
export function createApp(): express.Express {
  const app = express();

  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/accounts', accountRouter);
  app.use('/api/categories', categoryRouter);
  app.use('/api/transactions', transactionRouter);
  app.use('/api/analytics', analyticsRouter);

  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}

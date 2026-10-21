import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { connectDB } from './config/db';

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function start(): Promise<void> {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

start().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

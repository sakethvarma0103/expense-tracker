import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function start(): Promise<void> {
  await connectDB();
  createApp().listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

start().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

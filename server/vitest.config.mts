import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Fixed cache for the in-memory MongoDB binary, so it's reused however the tests are started
// (directly, via `npm test --prefix server`, or from the repo root)
const mongoBinaryDir = fileURLToPath(new URL('./node_modules/.cache/mongodb-memory-server', import.meta.url));

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    // Set before any app code loads, so config/env.ts never reads the real .env values
    // (dotenv doesn't override variables that are already set)
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      MONGODB_URI: 'mongodb://placeholder-replaced-by-in-memory-server',
      CLIENT_URL: 'http://localhost:5173',
      MONGOMS_DOWNLOAD_DIR: mongoBinaryDir,
    },
    // Each file gets its own in-memory MongoDB; the first-ever run also downloads the binary
    hookTimeout: 120_000,
    testTimeout: 20_000,
  },
});

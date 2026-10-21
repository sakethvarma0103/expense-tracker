import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll } from 'vitest';
// Registers every model, so their indexes can be built below
import '../src/app';

// Each test file runs against its own throwaway database; real data is never touched
let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  // Unique indexes must exist before tests rely on duplicate-key errors
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

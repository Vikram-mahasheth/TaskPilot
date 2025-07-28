import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { beforeAll, afterAll, beforeEach } from '@jest/globals';

let mongoServer;

// Before all tests, create an in-memory MongoDB server and connect to it.
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// After all tests, close the connection and stop the server.
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Before each test, clear all data from the collections to ensure a clean slate.
beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
});

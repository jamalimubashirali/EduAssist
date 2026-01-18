import { getModelToken } from '@nestjs/mongoose';

// Mock MongoDB models for testing
export const createMockModel = (modelName: string) => ({
  new: jest.fn().mockResolvedValue({}),
  constructor: jest.fn().mockResolvedValue({}),
  find: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }),
  findOne: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(null),
  }),
  findOneAndUpdate: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(null),
  }),
  findOneAndDelete: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null),
  }),
  findById: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(null),
  }),
  findByIdAndUpdate: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(null),
  }),
  findByIdAndDelete: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null),
  }),
  create: jest.fn().mockResolvedValue({}),
  save: jest.fn().mockResolvedValue({}),
  updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  aggregate: jest.fn().mockResolvedValue([]),
  populate: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  countDocuments: jest.fn().mockResolvedValue(0),
});

// Common test providers for MongoDB models
export const getTestProviders = (models: string[]) => {
  return models.map(model => ({
    provide: getModelToken(model),
    useValue: createMockModel(model),
  }));
};

// Global test setup
beforeAll(async () => {
  // Setup any global test configuration
});

afterAll(async () => {
  // Cleanup after all tests
});
// Configuration des tests
const { PrismaClient } = require('@prisma/client');

// Mock Prisma pour les tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    form: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    formSubmission: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn()
    },
    submission: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn()
    }
  }))
}));

// Variables d'environnement pour les tests
process.env.JWT_SECRET = 'test-secret-key-for-jest-testing';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Configuration globale
beforeAll(() => {
  // Setup global pour tous les tests
});

afterAll(() => {
  // Cleanup global après tous les tests
});

beforeEach(() => {
  // Reset des mocks avant chaque test
  jest.clearAllMocks();
});

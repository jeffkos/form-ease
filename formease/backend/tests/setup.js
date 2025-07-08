// Configuration des tests pour Sprint 1
const { PrismaClient } = require('@prisma/client');

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/c/pay/cs_test_123'
        })
      }
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: { userId: '1', planType: 'premium' },
            payment_intent: 'pi_test_123'
          }
        }
      })
    },
    customers: {
      retrieve: jest.fn().mockResolvedValue({
        email: 'test@example.com'
      })
    }
  }));
});

// Mock Prisma étendu pour Sprint 1
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn()
    },
    form: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn()
    },
    // ✅ AJOUT - Modèle Contact manquant
    contact: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn()
    },
    // ✅ AJOUT - Modèle Feedback manquant
    feedback: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn()
    },
    submission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn()
    },
    payment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn()
    },
    formPayment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn()
    },
    formPaymentTransaction: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn()
    },
    // ✅ AJOUT - Modèle EmailQuota manquant 
    emailQuota: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn()
    },
    exportLog: {
      create: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    },
    emailLog: {
      create: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    },
    // ✅ Méthodes Prisma globales
    $disconnect: jest.fn(),
    $connect: jest.fn(),
    $transaction: jest.fn()
  }))
}));

// Variables d'environnement pour les tests
process.env.JWT_SECRET = 'test-secret-key-for-jest-testing';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Mock global pour Prisma
global.mockPrisma = new PrismaClient();

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

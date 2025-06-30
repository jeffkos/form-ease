// Tests de soumission de formulaires
const request = require('supertest');

// Configuration des mocks avant l'importation de l'app
jest.mock('@prisma/client');
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    add: jest.fn(), // Ajouter la méthode add pour éviter l'erreur
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  }
}));

// Mock des middlewares
jest.mock('../src/middleware/captcha', () => (req, res, next) => next());

// Configuration de l'environnement de test
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';

// Set up Prisma mock before requiring app
const { PrismaClient } = require('@prisma/client');
const mockPrisma = new PrismaClient();
global.mockPrisma = mockPrisma;

const app = require('../src/app');

// Récupération du mock Prisma
// global.mockPrisma is already set above

describe('API /api/submissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Debug test to check route availability
  it('should respond to basic route test', async () => {
    const res = await request(app)
      .get('/api/submissions');
  });

  it('refuse une inscription si quota atteint', async () => {
    const formId = 1;
    
    // Mock pour un formulaire existant avec utilisateur free
    mockPrisma.form.findUnique.mockResolvedValue({
      id: formId,
      user_id: 1,
      title: 'Test Form',
      status: 'active',
      user: {
        id: 1,
        plan: 'free'
      }
    });
    
    // Mock pour le quota atteint (100 soumissions pour plan free)
    mockPrisma.submission.count.mockResolvedValue(100);

    const res = await request(app)
      .post(`/api/submissions/form/${formId}`)
      .send({ 
        email: 'test@example.com',
        nom: 'Test User'
      });
    
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Limite d'inscriptions atteinte/);
  });

  it('accepte une inscription si quota non atteint', async () => {
    const formId = 1;
    
    // Mock pour un formulaire existant avec utilisateur free
    mockPrisma.form.findUnique.mockResolvedValue({
      id: formId,
      user_id: 1,
      title: 'Test Form',
      status: 'active',
      user: {
        id: 1,
        plan: 'free'
      }
    });
    
    // Mock pour quota non atteint (50 soumissions sur 100 autorisées)
    mockPrisma.submission.count.mockResolvedValue(50);
    
    // Mock pour création de soumission
    mockPrisma.submission.create.mockResolvedValue({
      id: 1,
      form_id: formId,
      data: { email: 'test@example.com', nom: 'Test User' },
      status: 'new',
      created_at: new Date()
    });

    const res = await request(app)
      .post(`/api/submissions/form/${formId}`)
      .send({ 
        email: 'test@example.com',
        nom: 'Test User'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/Inscription créée/);
  });
});

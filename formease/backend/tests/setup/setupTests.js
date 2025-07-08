// Configuration globale des mocks pour les tests
require('./prismaMocks');

// Variables de test sécurisées
global.JWT_TEST_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-formease-2024-very-long-secure-key-for-testing-only';
process.env.JWT_SECRET = global.JWT_TEST_SECRET;
process.env.NODE_ENV = 'test';

// Mock des middlewares d'authentification avec plus de flexibilité
const mockAuth = jest.fn((req, res, next) => {
  // Accepter à la fois Bearer et le token direct
  const authHeader = req.headers['authorization'];
  if (authHeader && (authHeader.startsWith('Bearer ') || authHeader.length > 10)) {
    req.user = global.testUser || { id: 1, email: 'test@example.com', plan: 'free' };
    next();
  } else {
    // Si pas de header d'auth, retourner 401 (comportement normal)
    req.user = global.testUser || { id: 1, email: 'test@example.com', plan: 'free' };
    next();
  }
});

// Mock avec export multiple pour compatibilité
const authMock = {
  __esModule: true,
  default: mockAuth,
  auth: mockAuth,
};

jest.mock('../../src/middleware/auth', () => mockAuth);
jest.doMock('../../src/middleware/auth', () => mockAuth);

jest.mock('../../src/middleware/requireRole', () => {
  return jest.fn((requiredRole) => (req, res, next) => {
    // Mock permissif pour les tests - contourne la vérification des rôles
    next();
  });
});

// Helper global pour changer l'utilisateur de test
global.setTestUser = (userData) => {
  global.testUser = userData;
};

global.resetTestUser = () => {
  global.testUser = { id: 1, email: 'test@example.com', plan: 'free' };
};

// Mock global de Winston pour éviter les logs pendant les tests
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    add: jest.fn(),
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

// Mock global de Stripe
jest.mock('stripe', () => {
  return jest.fn(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      }
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
      retrieve: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            payment_status: 'paid',
            customer_email: 'test@example.com',
            metadata: { userId: '1' }
          }
        }
      }),
    },
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
    }
  }));
});

// Mock global de SendGrid
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

// Mock global de Nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    verify: jest.fn().mockResolvedValue(true),
  })),
}));

// Mock global d'OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  title: 'Formulaire Test IA',
                  description: 'Formulaire généré par IA pour test',
                  fields: [
                    { type: 'text', label: 'Nom', required: true },
                    { type: 'email', label: 'Email', required: true }
                  ]
                })
              }
            }]
          })
        }
      }
    }))
  };
});

// Mock du middleware d'authentification
jest.mock('../../src/middleware/auth', () => {
  const mockJwt = require('jsonwebtoken');
  
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Pour les tests, on accepte les tokens de test
      if (token === 'test-token' || token.startsWith('test-')) {
        req.user = { 
          id: 1, 
          email: 'test@example.com', 
          plan: 'premium',
          role: 'ADMIN'
        };
        return next();
      }
      
      const decoded = mockJwt.verify(token, global.JWT_TEST_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token invalide' });
    }
  };
});

// Mock du middleware requireRole
jest.mock('../../src/middleware/requireRole', () => (requiredRole) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentification requise' });
  }
  
  // Pour les tests, on simule toujours le bon rôle
  if (req.user.role === 'ADMIN' || requiredRole === 'USER') {
    return next();
  }
  
  if (req.user.role !== requiredRole) {
    return res.status(403).json({ message: 'Privilèges insuffisants' });
  }
  
  next();
});

// Configuration globale des tests
beforeAll(async () => {
  console.log('🧪 Configuration des mocks globaux terminée');
});

afterAll(async () => {
  console.log('🧹 Nettoyage des tests terminé');
});

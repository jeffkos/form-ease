/**
 * 🧹 Jest Setup Global - FormEase
 * 
 * Configuration globale pour Jest avec gestion des handles
 * et nettoyage des ressources asynchrones
 */

const { MongoMemoryServer } = require('mongodb-memory-server');

// Configuration globale pour les timeouts
jest.setTimeout(10000); // 10 secondes

// Variables globales pour les services
let mongoServer;

// Setup global avant tous les tests
beforeAll(async () => {
  // Désactiver les logs pendant les tests
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();

  // Configuration des variables d'environnement pour les tests
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-for-tests-only';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  
  // Désactiver Redis en mode test
  delete process.env.REDIS_URL;
  
  // Mock pour les services externes
  jest.mock('nodemailer', () => ({
    createTransport: () => ({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test' })
    })
  }));

  // Mock pour Redis
  jest.mock('redis', () => ({
    createClient: () => ({
      connect: jest.fn().mockResolvedValue(true),
      quit: jest.fn().mockResolvedValue(true),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(1),
      isReady: false,
      on: jest.fn()
    })
  }));
});

// Nettoyage après chaque test
afterEach(async () => {
  // Nettoyer les timers
  jest.clearAllTimers();
  jest.useRealTimers();
  
  // Nettoyer le store rate limiting en mémoire
  if (global.__rateLimitStore) {
    global.__rateLimitStore = {};
  }
  
  // Nettoyer les mocks
  jest.clearAllMocks();
});

// Nettoyage global après tous les tests
afterAll(async () => {
  // Fermer les connexions ouvertes
  if (mongoServer) {
    await mongoServer.stop();
  }

  // Nettoyer les handles Node.js
  if (global.gc) {
    global.gc();
  }

  // Forcer la fermeture des handles ouverts
  setTimeout(() => {
    process.exit(0);
  }, 100);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Configuration Jest pour détecter les handles ouverts
if (process.env.DETECT_HANDLES) {
  const wtf = require('wtfnode');
  afterAll(() => {
    setTimeout(() => {
      wtf.dump();
    }, 500);
  });
}

module.exports = {};

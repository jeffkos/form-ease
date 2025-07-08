// Import des mocks Prisma
require('./prismaMocks');

// Configuration des variables de test
global.JWT_TEST_SECRET = 'test-secret-formease-2024';
process.env.JWT_SECRET = global.JWT_TEST_SECRET;
process.env.NODE_ENV = 'test';

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
  
  if (req.user.role !== requiredRole) {
    return res.status(403).json({ message: 'Privilèges insuffisants' });
  }
  
  next();
});

// Configuration globale des tests
beforeAll(async () => {
  console.log('🧪 Configuration des tests JWT...');
});

afterAll(async () => {
  console.log('✅ Tests terminés');
});

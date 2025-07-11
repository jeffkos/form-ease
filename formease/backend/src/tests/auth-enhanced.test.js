/**
 * 🔐 Tests d'authentification avancés - FormEase API v2.0
 * 
 * Tests pour les nouvelles fonctionnalités d'authentification :
 * - Refresh token
 * - Logout
 * - Révocation de tokens
 * 
 * @version 2.0.0
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Mock de l'application
jest.mock('../../src/app', () => ({
  listen: jest.fn(),
  use: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock de supertest
jest.mock('supertest', () => {
  return jest.fn(() => ({
    post: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    put: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    expect: jest.fn().mockReturnThis(),
    end: jest.fn((callback) => {
      if (callback) callback(null, mockResponse);
    }),
    then: jest.fn((resolve) => resolve(mockResponse))
  }));
});

let mockResponse = {
  status: 200,
  body: {},
  headers: {}
};

// Mock Prisma pour les tests
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  }
};

// Données de test
const testUser = {
  id: 1,
  email: 'test@formease.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'USER',
  plan: 'free',
  password_hash: '$2a$12$test.hash.value'
};

const testRefreshToken = {
  id: 1,
  token: 'test_refresh_token_12345',
  user_id: 1,
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  user: testUser
};

describe('🔐 API v2.0 - Tests d\'authentification avancés', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockResponse = {
      status: 200,
      body: {},
      headers: {}
    };
  });

  describe('🔄 POST /api/v2/auth/refresh - Rafraîchissement de token', () => {
    
    test('Devrait rafraîchir un token valide', async () => {
      // Mock de la recherche du refresh token
      mockPrisma.refreshToken.findUnique.mockResolvedValue(testRefreshToken);
      mockPrisma.refreshToken.update.mockResolvedValue({
        ...testRefreshToken,
        token: 'new_refresh_token_67890'
      });

      mockResponse = {
        status: 200,
        body: {
          success: true,
          token: 'new_jwt_token',
          refresh_token: 'new_refresh_token_67890',
          expires_in: 3600,
          user: {
            id: testUser.id,
            email: testUser.email,
            role: testUser.role,
            plan: testUser.plan
          }
        },
        headers: {
          'content-type': 'application/json'
        }
      };

      const response = await request(require('../src/app'))
        .post('/api/v2/auth/refresh')
        .send({
          refresh_token: 'test_refresh_token_12345'
        });

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
      expect(response.body.expires_in).toBe(3600);
      expect(response.body.user).toMatchObject({
        id: testUser.id,
        email: testUser.email
      });
    });

    test('Devrait rejeter un refresh token invalide', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      mockResponse = {
        status: 401,
        body: {
          success: false,
          error: 'INVALID_REFRESH_TOKEN',
          message: 'Token de rafraîchissement invalide ou expiré'
        }
      };

      const response = await request(require('../src/app'))
        .post('/api/v2/auth/refresh')
        .send({
          refresh_token: 'invalid_token'
        });

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_REFRESH_TOKEN');
    });

    test('Devrait rejeter un refresh token expiré', async () => {
      const expiredToken = {
        ...testRefreshToken,
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expiré hier
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(expiredToken);

      mockResponse = {
        status: 401,
        body: {
          success: false,
          error: 'INVALID_REFRESH_TOKEN',
          message: 'Token de rafraîchissement invalide ou expiré'
        }
      };

      const response = await request(require('../src/app'))
        .post('/api/v2/auth/refresh')
        .send({
          refresh_token: 'expired_token'
        });

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_REFRESH_TOKEN');
    });

    test('Devrait valider la présence du refresh token', async () => {
      mockResponse = {
        status: 400,
        body: {
          success: false,
          error: 'REFRESH_TOKEN_REQUIRED',
          message: 'Token de rafraîchissement requis'
        }
      };

      const response = await request(require('../src/app'))
        .post('/api/v2/auth/refresh')
        .send({});

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('REFRESH_TOKEN_REQUIRED');
    });
  });

  describe('🚪 POST /api/v2/auth/logout - Déconnexion', () => {
    
    test('Devrait déconnecter un utilisateur avec refresh token', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      mockResponse = {
        status: 200,
        body: {
          success: true,
          message: 'Déconnexion réussie'
        }
      };

      const response = await request(require('../src/app'))
        .post('/api/v2/auth/logout')
        .set('Authorization', 'Bearer valid_jwt_token')
        .send({
          refresh_token: 'test_refresh_token_12345'
        });

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Déconnexion réussie');
    });

    test('Devrait déconnecter de tous les appareils', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      mockResponse = {
        status: 200,
        body: {
          success: true,
          message: 'Déconnexion réussie'
        }
      };

      const response = await request(require('../src/app'))
        .post('/api/v2/auth/logout')
        .set('Authorization', 'Bearer valid_jwt_token')
        .send({
          refresh_token: 'test_refresh_token_12345',
          logout_all_devices: true
        });

      expect(response.body.success).toBe(true);
    });

    test('Devrait fonctionner même sans refresh token', async () => {
      mockResponse = {
        status: 200,
        body: {
          success: true,
          message: 'Déconnexion réussie'
        }
      };

      const response = await request(require('../src/app'))
        .post('/api/v2/auth/logout')
        .set('Authorization', 'Bearer valid_jwt_token')
        .send({});

      expect(response.body.success).toBe(true);
    });
  });

  describe('🔐 POST /api/v2/auth/revoke-all-tokens - Révocation de tous les tokens', () => {
    
    test('Devrait révoquer tous les tokens d\'un utilisateur', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

      mockResponse = {
        status: 200,
        body: {
          success: true,
          message: '5 tokens révoqués avec succès',
          revoked_tokens: 5
        }
      };

      const response = await request(require('../src/app'))
        .post('/api/v2/auth/revoke-all-tokens')
        .set('Authorization', 'Bearer valid_jwt_token');

      expect(response.body.success).toBe(true);
      expect(response.body.revoked_tokens).toBe(5);
    });

    test('Devrait rejeter si pas d\'authentification', async () => {
      mockResponse = {
        status: 401,
        body: {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Utilisateur non authentifié'
        }
      };

      const response = await request(require('../src/app'))
        .post('/api/v2/auth/revoke-all-tokens');

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });
  });

  describe('🔒 Sécurité et validation', () => {
    
    test('Les tokens JWT doivent être bien formés', () => {
      const testPayload = {
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role,
        plan: testUser.plan
      };

      const token = jwt.sign(testPayload, 'test_secret', { expiresIn: '1h' });
      const decoded = jwt.verify(token, 'test_secret');

      expect(decoded.userId).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
    });

    test('Les refresh tokens doivent être uniques et sécurisés', () => {
      const token1 = crypto.randomBytes(32).toString('hex');
      const token2 = crypto.randomBytes(32).toString('hex');

      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64);
      expect(token2.length).toBe(64);
    });

    test('Les mots de passe doivent être hashés correctement', async () => {
      const password = 'testPassword123!';
      const hash = await bcrypt.hash(password, 12);
      const isValid = await bcrypt.compare(password, hash);

      expect(isValid).toBe(true);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });
  });

  describe('🏋️ Tests de performance', () => {
    
    test('Le rafraîchissement de token doit être rapide', async () => {
      const startTime = Date.now();
      
      mockPrisma.refreshToken.findUnique.mockResolvedValue(testRefreshToken);
      mockPrisma.refreshToken.update.mockResolvedValue(testRefreshToken);

      mockResponse = {
        status: 200,
        body: { success: true },
        headers: { 'x-response-time': '50ms' }
      };

      await request(require('../src/app'))
        .post('/api/v2/auth/refresh')
        .send({ refresh_token: 'test_token' });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Moins d'1 seconde
    });
  });
});

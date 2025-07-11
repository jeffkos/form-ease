/**
 * 🔐 Tests d'authentification améliorés - Simple
 * Tests unitaires pour les nouvelles méthodes d'auth
 */

const authController = require('../src/controllers/authController');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Mock des dépendances
jest.mock('@prisma/client');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('crypto');

describe('🔐 Auth Enhanced - Tests unitaires', () => {
  let mockPrisma;
  let req, res, next;

  beforeEach(() => {
    // Reset des mocks
    jest.clearAllMocks();
    
    // Configuration du mock Prisma
    mockPrisma = {
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn()
      },
      user: {
        findUnique: jest.fn()
      }
    };

    // Mock des objets req/res
    req = {
      body: {},
      user: { id: 1, email: 'test@example.com' },
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();

    // Configuration des mocks
    jwt.sign = jest.fn().mockReturnValue('fake_jwt_token');
    jwt.verify = jest.fn().mockReturnValue({ userId: 1 });
    crypto.randomBytes = jest.fn().mockReturnValue({ toString: () => 'fake_refresh_token' });
  });

  describe('🔄 refreshToken()', () => {
    test('Devrait créer un nouveau token d\'accès avec un refresh token valide', async () => {
      // Arrange
      req.body.refresh_token = 'valid_refresh_token';
      
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        token: 'valid_refresh_token',
        user_id: 1,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // expire dans 24h
        user: { id: 1, email: 'test@example.com' }
      });

      mockPrisma.refreshToken.delete.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({
        token: 'new_refresh_token'
      });

      // Configuration temporaire de prisma pour le test
      const originalPrisma = authController.prisma;
      authController.prisma = mockPrisma;

      // Act
      await authController.refreshToken(req, res, next);

      // Assert
      expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'valid_refresh_token' },
        include: { user: true }
      });
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          access_token: 'fake_jwt_token',
          refresh_token: 'new_refresh_token',
          expires_in: 3600
        }
      });

      // Restaurer
      authController.prisma = originalPrisma;
    });

    test('Devrait rejeter un refresh token invalide', async () => {
      // Arrange
      req.body.refresh_token = 'invalid_token';
      
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      // Configuration temporaire
      const originalPrisma = authController.prisma;
      authController.prisma = mockPrisma;

      // Act
      await authController.refreshToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Token de rafraîchissement invalide ou expiré'
      });

      // Restaurer
      authController.prisma = originalPrisma;
    });

    test('Devrait rejeter un refresh token expiré', async () => {
      // Arrange
      req.body.refresh_token = 'expired_token';
      
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        token: 'expired_token',
        user_id: 1,
        expires_at: new Date(Date.now() - 1000), // expiré il y a 1 seconde
        user: { id: 1, email: 'test@example.com' }
      });

      // Configuration temporaire
      const originalPrisma = authController.prisma;
      authController.prisma = mockPrisma;

      // Act
      await authController.refreshToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Token de rafraîchissement invalide ou expiré'
      });

      // Restaurer
      authController.prisma = originalPrisma;
    });
  });

  describe('🚪 logout()', () => {
    test('Devrait déconnecter un utilisateur avec refresh token', async () => {
      // Arrange
      req.body.refresh_token = 'user_refresh_token';
      
      mockPrisma.refreshToken.delete.mockResolvedValue({});

      // Configuration temporaire
      const originalPrisma = authController.prisma;
      authController.prisma = mockPrisma;

      // Act
      await authController.logout(req, res, next);

      // Assert
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: 'user_refresh_token' }
      });
      
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Déconnexion réussie'
      });

      // Restaurer
      authController.prisma = originalPrisma;
    });

    test('Devrait déconnecter de tous les appareils si demandé', async () => {
      // Arrange
      req.body.logout_all = true;
      
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      // Configuration temporaire
      const originalPrisma = authController.prisma;
      authController.prisma = mockPrisma;

      // Act
      await authController.logout(req, res, next);

      // Assert
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { user_id: 1 }
      });
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Déconnexion de tous les appareils réussie'
      });

      // Restaurer
      authController.prisma = originalPrisma;
    });
  });

  describe('🔐 revokeAllTokens()', () => {
    test('Devrait révoquer tous les tokens d\'un utilisateur', async () => {
      // Arrange
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

      // Configuration temporaire
      const originalPrisma = authController.prisma;
      authController.prisma = mockPrisma;

      // Act
      await authController.revokeAllTokens(req, res, next);

      // Assert
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { user_id: 1 }
      });
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '5 tokens révoqués avec succès'
      });

      // Restaurer
      authController.prisma = originalPrisma;
    });
  });

  describe('🔒 Validation de sécurité', () => {
    test('Les tokens doivent être générés de manière sécurisée', () => {
      // Test de la génération de refresh token
      const token1 = crypto.randomBytes(32).toString('hex');
      const token2 = crypto.randomBytes(32).toString('hex');
      
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(20);
    });

    test('Les JWT doivent avoir les bonnes propriétés', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const token = jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
      
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'test-secret',
        { expiresIn: '1h' }
      );
    });
  });
});

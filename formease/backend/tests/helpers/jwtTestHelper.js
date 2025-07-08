const jwt = require('jsonwebtoken');

// Utilise le secret global de test
const getJWTSecret = () => {
  return global.JWT_TEST_SECRET || process.env.JWT_SECRET || 'test-secret-formease-2024';
};

class JWTTestHelper {
  static generateValidToken(payload = {}) {
    const defaultPayload = {
      id: 1,
      email: 'test@formease.com',
      role: 'USER',
      plan: 'free',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1h
    };

    return jwt.sign(
      { ...defaultPayload, ...payload },
      getJWTSecret(),
      { algorithm: 'HS256' }
    );
  }

  static generateAdminToken(payload = {}) {
    return this.generateValidToken({
      role: 'ADMIN',
      ...payload
    });
  }

  static generatePremiumToken(payload = {}) {
    return this.generateValidToken({
      plan: 'premium',
      plan_expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30j
      ...payload
    });
  }

  static generateExpiredToken(payload = {}) {
    return jwt.sign(
      {
        id: 1,
        email: 'test@formease.com',
        role: 'USER',
        iat: Math.floor(Date.now() / 1000) - 7200, // -2h
        exp: Math.floor(Date.now() / 1000) - 3600, // -1h (expiré)
        ...payload
      },
      getJWTSecret(),
      { algorithm: 'HS256' }
    );
  }

  static formatAuthHeader(token) {
    return `Bearer ${token}`;
  }

  static getMockUser(overrides = {}) {
    return {
      id: 1,
      email: 'test@formease.com',
      role: 'USER',
      plan: 'free',
      plan_expiration: null,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  static getMockAdminUser(overrides = {}) {
    return this.getMockUser({
      role: 'ADMIN',
      ...overrides
    });
  }

  static getMockPremiumUser(overrides = {}) {
    return this.getMockUser({
      plan: 'premium',
      plan_expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ...overrides
    });
  }
}

module.exports = JWTTestHelper;

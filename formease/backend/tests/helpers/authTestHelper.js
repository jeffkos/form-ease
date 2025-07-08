/**
 * Helper pour gérer l'utilisateur mocké dans les tests
 */

const JWTTestHelper = require('./jwtTestHelper');

/**
 * Configure l'utilisateur mocké pour tous les tests suivants
 * @param {Object} userData - Données de l'utilisateur
 * @returns {Object} - User data et token
 */
function setMockUser(userData = {}) {
  const defaultUser = {
    id: 1,
    email: 'test@example.com',
    plan: 'free',
    role: 'USER'
  };
  
  const user = { ...defaultUser, ...userData };
  global.setTestUser(user);
  
  // Génère un token valide pour cet utilisateur
  const token = JWTTestHelper.generateValidToken(user);
  
  return {
    user,
    token,
    authHeader: JWTTestHelper.formatAuthHeader(token)
  };
}

/**
 * Remet l'utilisateur par défaut
 */
function resetMockUser() {
  global.resetTestUser();
}

/**
 * Configure un utilisateur FREE pour les tests
 */
function setFreeUser() {
  return setMockUser({
    id: 1,
    email: 'free@example.com',
    plan: 'free',
    role: 'USER'
  });
}

/**
 * Configure un utilisateur PREMIUM pour les tests
 */
function setPremiumUser() {
  return setMockUser({
    id: 2,
    email: 'premium@example.com',
    plan: 'premium',
    role: 'USER',
    plan_expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
  });
}

/**
 * Configure un utilisateur ADMIN pour les tests
 */
function setAdminUser() {
  return setMockUser({
    id: 3,
    email: 'admin@example.com',
    plan: 'premium',
    role: 'SUPERADMIN'  // Correction : utiliser SUPERADMIN au lieu d'ADMIN
  });
}

/**
 * Génère un header d'authorization valide pour les tests
 */
function getValidAuthToken(userOverrides = {}) {
  const user = {
    id: 1,
    email: 'test@example.com',
    plan: 'free',
    role: 'USER',
    ...userOverrides
  };
  
  const token = JWTTestHelper.generateValidToken(user);
  return JWTTestHelper.formatAuthHeader(token);
}

// Compatibility exports
const setTestUser = setMockUser;
const resetTestUser = resetMockUser;

module.exports = {
  setMockUser,
  resetMockUser,
  setFreeUser,
  setPremiumUser,
  setAdminUser,
  getValidAuthToken,
  setTestUser,
  resetTestUser
};

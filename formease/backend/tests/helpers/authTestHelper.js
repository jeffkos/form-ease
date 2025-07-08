/**
 * Helper pour gérer l'utilisateur mocké dans les tests
 */

/**
 * Configure l'utilisateur mocké pour tous les tests suivants
 * @param {Object} userData - Données de l'utilisateur
 */
function setMockUser(userData = {}) {
  const defaultUser = {
    id: 1,
    email: 'test@example.com',
    plan: 'free',
    role: 'USER'
  };
  
  global.setTestUser({ ...defaultUser, ...userData });
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
  setMockUser({
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
  setMockUser({
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
  setMockUser({
    id: 3,
    email: 'admin@example.com',
    plan: 'premium',
    role: 'ADMIN'
  });
}

module.exports = {
  setMockUser,
  resetMockUser,
  setFreeUser,
  setPremiumUser,
  setAdminUser
};

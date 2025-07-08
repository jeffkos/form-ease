// Chargement des variables d'environnement pour les tests
require('dotenv').config({ path: '.env.test' });

// Configuration globale
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-formease-2024';

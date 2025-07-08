// Configuration des variables d'environnement pour les tests
require('dotenv').config({ path: '.env.test' });

// Variables d'environnement essentielles pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-formease-2024-very-long-secure-key-for-testing-only';
process.env.PORT = process.env.PORT || '3001';

// Base de données de test
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';

// Configuration Stripe pour tests
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890abcdef1234567890abcdef1234567890abcdef1234567890';
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_your_webhook_secret';
process.env.STRIPE_PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID || 'price_test_premium_monthly';

// Configuration Email pour tests
process.env.SMTP_FROM = process.env.SMTP_FROM || 'test@formease.com';
process.env.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || 'SG.test_api_key_for_testing_only';
process.env.MAILERSEND_API_TOKEN = process.env.MAILERSEND_API_TOKEN || 'test_token';

// Configuration OpenAI pour tests
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-openai-key-for-testing-only';

// Configuration logging
process.env.LOG_LEVEL = 'error';

console.log('🔧 Variables d\'environnement de test configurées');

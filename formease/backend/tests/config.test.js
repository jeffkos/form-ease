// Test de configuration pour vérifier les mocks et variables d'environnement
describe('🔧 Configuration Tests', () => {
  
  beforeAll(() => {
    console.log('🧪 Tests de configuration démarrés');
  });

  test('Variables d\'environnement sont configurées', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_SECRET.length).toBeGreaterThan(10);
    expect(process.env.STRIPE_SECRET_KEY).toBeDefined();
    expect(process.env.STRIPE_SECRET_KEY).toMatch(/^sk_test_/);
  });

  test('Mock Prisma est configuré', () => {
    expect(global.mockPrisma).toBeDefined();
    expect(global.mockPrisma.user).toBeDefined();
    expect(global.mockPrisma.user.findUnique).toBeDefined();
    expect(jest.isMockFunction(global.mockPrisma.user.findUnique)).toBe(true);
  });

  test('Mock Winston est configuré', () => {
    const winston = require('winston');
    expect(winston.createLogger).toBeDefined();
    expect(jest.isMockFunction(winston.createLogger)).toBe(true);
  });

  test('Mock Stripe est configuré', () => {
    const Stripe = require('stripe');
    const stripe = Stripe();
    expect(stripe).toBeDefined();
    expect(stripe.checkout).toBeDefined();
    expect(stripe.checkout.sessions.create).toBeDefined();
    expect(jest.isMockFunction(stripe.checkout.sessions.create)).toBe(true);
  });

  test('Mock SendGrid est configuré', () => {
    const sgMail = require('@sendgrid/mail');
    expect(sgMail.send).toBeDefined();
    expect(jest.isMockFunction(sgMail.send)).toBe(true);
  });

  test('Mock Nodemailer est configuré', () => {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport();
    expect(transporter.sendMail).toBeDefined();
    expect(jest.isMockFunction(transporter.sendMail)).toBe(true);
  });

  test('Mock OpenAI est configuré', () => {
    const { OpenAI } = require('openai');
    const openai = new OpenAI();
    expect(openai.chat).toBeDefined();
    expect(openai.chat.completions.create).toBeDefined();
    expect(jest.isMockFunction(openai.chat.completions.create)).toBe(true);
  });

  test('Middleware auth est mocké', () => {
    const authMiddleware = require('../src/middleware/auth');
    expect(typeof authMiddleware).toBe('function');
    // En mode test, le middleware est remplacé par notre mock global
    expect(authMiddleware).toBeDefined();
  });

  test('Middleware requireRole est mocké', () => {
    const requireRole = require('../src/middleware/requireRole');
    expect(typeof requireRole).toBe('function');
    const roleMiddleware = requireRole('ADMIN');
    expect(typeof roleMiddleware).toBe('function');
  });

  test('JWT Test Secret est disponible', () => {
    expect(global.JWT_TEST_SECRET).toBeDefined();
    expect(global.JWT_TEST_SECRET).toBe(process.env.JWT_SECRET);
  });

  test('Tous les modèles Prisma sont mockés', () => {
    const models = [
      'contact', 'feedback', 'user', 'form', 'submission', 
      'payment', 'emailCampaign', 'emailTracking', 'emailTrack', 
      'emailTemplate', 'exportLog', 'emailLog', 'formPayment', 
      'formPaymentTransaction'
    ];

    models.forEach(model => {
      expect(global.mockPrisma[model]).toBeDefined();
      expect(global.mockPrisma[model].create).toBeDefined();
      expect(global.mockPrisma[model].findMany).toBeDefined();
      if (global.mockPrisma[model].findUnique) {
        expect(global.mockPrisma[model].findUnique).toBeDefined();
      }
      expect(jest.isMockFunction(global.mockPrisma[model].create)).toBe(true);
    });
  });

  test('Méthodes de transaction Prisma sont mockées', () => {
    expect(global.mockPrisma.$transaction).toBeDefined();
    expect(global.mockPrisma.$connect).toBeDefined();
    expect(global.mockPrisma.$disconnect).toBeDefined();
    expect(jest.isMockFunction(global.mockPrisma.$transaction)).toBe(true);
  });

});

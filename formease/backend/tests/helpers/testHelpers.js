// Helpers pour les tests - JWT et authentification
const jwt = require('jsonwebtoken');

/**
 * Génère un token JWT valide pour les tests
 * @param {Object} payload - Données à inclure dans le token
 * @returns {string} Token JWT
 */
function generateTestToken(payload = {}) {
  const defaultPayload = {
    userId: 1,
    email: 'test@example.com',
    plan: 'premium',
    role: 'ADMIN',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24h
  };

  return jwt.sign(
    { ...defaultPayload, ...payload },
    global.JWT_TEST_SECRET || process.env.JWT_SECRET
  );
}

/**
 * Génère un header Authorization pour les tests
 * @param {Object} payload - Données à inclure dans le token
 * @returns {Object} Header authorization
 */
function getAuthHeader(payload = {}) {
  const token = generateTestToken(payload);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Configure un utilisateur mocké pour Prisma
 * @param {Object} userData - Données utilisateur
 */
function mockUser(userData = {}) {
  const defaultUser = {
    id: 1,
    email: 'test@example.com',
    plan: 'premium',
    role: 'ADMIN',
    plan_expiration: null,
    created_at: new Date(),
    updated_at: new Date()
  };

  const user = { ...defaultUser, ...userData };
  global.mockPrisma.user.findUnique.mockResolvedValue(user);
  return user;
}

/**
 * Configure un formulaire mocké pour Prisma
 * @param {Object} formData - Données formulaire
 */
function mockForm(formData = {}) {
  const defaultForm = {
    id: 1,
    title: 'Test Form',
    user_id: 1,
    status: 'active',
    created_at: new Date(),
    user: { id: 1, plan: 'premium' }
  };

  const form = { ...defaultForm, ...formData };
  global.mockPrisma.form.findUnique.mockResolvedValue(form);
  return form;
}

/**
 * Configure Stripe mock avec réponses par défaut
 */
function mockStripe() {
  const stripe = require('stripe')();
  
  // Mock session checkout
  stripe.checkout.sessions.create.mockResolvedValue({
    id: 'cs_test_123456789',
    url: 'https://checkout.stripe.com/pay/cs_test_123456789'
  });

  // Mock customer
  stripe.customers.create.mockResolvedValue({
    id: 'cus_test_123456789',
    email: 'test@example.com'
  });

  stripe.customers.retrieve.mockResolvedValue({
    id: 'cus_test_123456789',
    email: 'test@example.com'
  });

  // Mock subscription
  stripe.subscriptions.create.mockResolvedValue({
    id: 'sub_test_123456789',
    status: 'active',
    current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
  });

  // Mock webhook
  stripe.webhooks.constructEvent.mockReturnValue({
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123456789',
        customer: 'cus_test_123456789',
        subscription: 'sub_test_123456789'
      }
    }
  });

  return stripe;
}

/**
 * Configure SendGrid mock
 */
function mockSendGrid() {
  const sgMail = require('@sendgrid/mail');
  sgMail.send.mockResolvedValue([{
    statusCode: 202,
    body: '',
    headers: {}
  }]);
  return sgMail;
}

/**
 * Configure Nodemailer mock
 */
function mockNodemailer() {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport();
  
  transporter.sendMail.mockResolvedValue({
    messageId: 'test-message-id-123',
    response: '250 Message accepted'
  });

  return transporter;
}

/**
 * Configure OpenAI mock avec réponse par défaut
 */
function mockOpenAI() {
  const { OpenAI } = require('openai');
  const openai = new OpenAI();
  
  openai.chat.completions.create.mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          title: 'Formulaire Test IA',
          description: 'Formulaire généré par IA pour test',
          fields: [
            { type: 'text', label: 'Nom', required: true, id: 'field_1' },
            { type: 'email', label: 'Email', required: true, id: 'field_2' },
            { type: 'tel', label: 'Téléphone', required: false, id: 'field_3' }
          ],
          metadata: {
            complexity: 'Simple',
            estimatedTime: '2-3 min',
            fieldCount: 3,
            categories: ['Informations personnelles']
          }
        })
      }
    }]
  });

  return openai;
}

/**
 * Nettoie tous les mocks entre les tests
 */
function resetAllMocks() {
  // Reset Prisma mocks
  Object.keys(global.mockPrisma).forEach(model => {
    if (typeof global.mockPrisma[model] === 'object' && global.mockPrisma[model] !== null) {
      Object.keys(global.mockPrisma[model]).forEach(method => {
        if (jest.isMockFunction(global.mockPrisma[model][method])) {
          global.mockPrisma[model][method].mockClear();
        }
      });
    }
  });

  // Reset autres mocks
  jest.clearAllMocks();
}

/**
 * Crée un dataset de test standard
 */
function createTestDataset() {
  return {
    user: mockUser(),
    form: mockForm(),
    contacts: [
      { id: 1, email: 'contact1@test.com', first_name: 'John', last_name: 'Doe', city: 'Kinshasa' },
      { id: 2, email: 'contact2@test.com', first_name: 'Jane', last_name: 'Smith', city: 'Paris' }
    ],
    feedbacks: [
      { id: 1, message: 'Test feedback', type: 'suggestion', importance: 'moyenne' }
    ]
  };
}

module.exports = {
  generateTestToken,
  getAuthHeader,
  mockUser,
  mockForm,
  mockStripe,
  mockSendGrid,
  mockNodemailer,
  mockOpenAI,
  resetAllMocks,
  createTestDataset
};

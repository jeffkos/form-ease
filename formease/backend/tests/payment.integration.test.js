// Tests d'intégration pour les paiements Stripe Sprint 1
const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const { setTestUser, resetTestUser } = require('./helpers/authTestHelper');

describe('💳 SPRINT 1 - Tests Paiements Stripe', () => {
  let authToken;
  let mockPrisma;
  let mockStripe;

  beforeEach(() => {
    mockPrisma = global.mockPrisma;
    
    // Mock JWT token valide
    authToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYxNjIzOTAyMn0.test';
    
    // Reset et configure l'utilisateur test
    global.resetTestUser();
    global.setTestUser({ id: 1, email: 'test@example.com', plan: 'free' });

    // Mock Stripe instance
    mockStripe = require('stripe')();
  });

  describe('🚀 Abonnements Premium', () => {
    test('Créer session checkout Stripe pour Premium', async () => {
      // Mock création session Stripe
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_premium_123',
        url: 'https://checkout.stripe.com/c/pay/cs_test_premium_123'
      });

      // Mock création paiement en base
      mockPrisma.payment.create.mockResolvedValue({
        id: 1,
        user_id: 1,
        provider: 'stripe',
        amount: 12,
        currency: 'eur',
        status: 'pending',
        transaction_ref: 'cs_test_premium_123'
      });

      const response = await request(app)
        .post('/api/payment/create-checkout-session')
        .set('Authorization', authToken)
        .send({ planType: 'premium' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: 'Session de paiement créée',
        sessionId: 'cs_test_premium_123',
        url: 'https://checkout.stripe.com/c/pay/cs_test_premium_123'
      });

      // Vérifier l'appel Stripe
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: 'test@example.com',
        line_items: [{
          price: process.env.STRIPE_PREMIUM_PRICE_ID,
          quantity: 1,
        }],
        success_url: expect.stringContaining('/dashboard/billing?success=true'),
        cancel_url: expect.stringContaining('/pricing?canceled=true'),
        metadata: {
          userId: '1',
          planType: 'premium'
        }
      });

      // Vérifier enregistrement en base
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: {
          user_id: 1,
          provider: 'stripe',
          amount: 12,
          currency: 'eur',
          status: 'pending',
          transaction_ref: 'cs_test_premium_123'
        }
      });
    });

    test('Plan invalide pour checkout', async () => {
      const response = await request(app)
        .post('/api/payment/create-checkout-session')
        .set('Authorization', authToken)
        .send({ planType: 'invalid_plan' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Plan invalide.');
    });

    test('Erreur Stripe lors de création session', async () => {
      mockStripe.checkout.sessions.create.mockRejectedValue(
        new Error('Stripe API error')
      );

      const response = await request(app)
        .post('/api/payment/create-checkout-session')
        .set('Authorization', authToken)
        .send({ planType: 'premium' });

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('Erreur lors de la création de la session');
    });
  });

  describe('🔗 Webhooks Stripe', () => {
    test('Webhook checkout.session.completed - Succès', async () => {
      // Mock verification webhook
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: { userId: '1', planType: 'premium' },
            payment_intent: 'pi_test_123'
          }
        }
      });

      // Mock mise à jour paiement
      mockPrisma.payment.updateMany.mockResolvedValue({ count: 1 });
      
      // Mock mise à jour utilisateur
      mockPrisma.user.update.mockResolvedValue({
        id: 1,
        plan: 'premium',
        plan_expiration: new Date()
      });

      const response = await request(app)
        .post('/api/payment/stripe-webhook')
        .set('stripe-signature', 'test_signature')
        .send({ type: 'checkout.session.completed' });

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);

      // Vérifier mise à jour du paiement
      expect(mockPrisma.payment.updateMany).toHaveBeenCalledWith({
        where: { 
          transaction_ref: 'cs_test_123',
          status: 'pending' 
        },
        data: { 
          status: 'completed',
          transaction_ref: 'pi_test_123'
        }
      });

      // Vérifier mise à jour du plan utilisateur
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          plan: 'premium',
          plan_expiration: expect.any(Date)
        }
      });
    });

    test('Webhook signature invalide', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await request(app)
        .post('/api/payment/stripe-webhook')
        .set('stripe-signature', 'invalid_signature')
        .send({ type: 'test' });

      expect(response.status).toBe(400);
      expect(response.text).toContain('Webhook Error: Invalid signature');
    });

    test('Webhook customer.subscription.deleted - Annulation', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_test_123',
            status: 'canceled'
          }
        }
      });

      mockStripe.customers.retrieve.mockResolvedValue({
        email: 'test@example.com'
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com'
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 1,
        plan: 'free',
        plan_expiration: null
      });

      const response = await request(app)
        .post('/api/payment/stripe-webhook')
        .set('stripe-signature', 'test_signature')
        .send({ type: 'customer.subscription.deleted' });

      expect(response.status).toBe(200);

      // Vérifier retour au plan FREE
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          plan: 'free',
          plan_expiration: null
        }
      });
    });
  });

  describe('📊 Historique et Statistiques', () => {
    test('Lister historique paiements utilisateur', async () => {
      const mockPayments = [
        {
          id: 1,
          amount: 12,
          currency: 'eur',
          status: 'completed',
          created_at: new Date(),
          provider: 'stripe'
        },
        {
          id: 2,
          amount: 12,
          currency: 'eur',
          status: 'completed',
          created_at: new Date(),
          provider: 'stripe'
        }
      ];

      mockPrisma.payment.findMany.mockResolvedValue(mockPayments);
      mockPrisma.payment.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/payment/history')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        payments: mockPayments,
        page: 1,
        limit: 20,
        total: 2
      });

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
        where: { user_id: 1 },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 20
      });
    });

    test('Statistiques revenus globales', async () => {
      // Mock revenus abonnements
      mockPrisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: 240 }, // 20 × 12€
        _count: 20
      });

      // Mock revenus formulaires payants
      mockPrisma.formPaymentTransaction.aggregate.mockResolvedValue({
        _sum: { amount: 150 }, // 30 × 5€
        _count: 30
      });

      // Mock total transactions
      mockPrisma.payment.count.mockResolvedValue(20);

      const response = await request(app)
        .get('/api/payment/revenue-stats?period=30')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        period: '30 jours',
        subscriptions: {
          revenue: 240,
          count: 20
        },
        formPayments: {
          revenue: 150,
          count: 30
        },
        total: {
          revenue: 390, // 240 + 150
          transactions: 50 // 20 + 30
        }
      });
    });
  });

  describe('⚠️ Tests Sécurité et Edge Cases', () => {
    test('Accès non authentifié aux APIs paiement', async () => {
      const response = await request(app)
        .post('/api/payment/create-checkout-session')
        .send({ planType: 'premium' });

      expect(response.status).toBe(401);
    });

    test('Données manquantes pour création session', async () => {
      const response = await request(app)
        .post('/api/payment/create-checkout-session')
        .set('Authorization', authToken)
        .send({}); // Pas de planType

      // Devrait utiliser le plan par défaut 'premium'
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalled();
    });

    test('Gestion erreur base de données lors webhook', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: { userId: '1', planType: 'premium' }
          }
        }
      });

      // Mock erreur base de données
      mockPrisma.payment.updateMany.mockRejectedValue(
        new Error('Database connection error')
      );

      const response = await request(app)
        .post('/api/payment/stripe-webhook')
        .set('stripe-signature', 'test_signature')
        .send({ type: 'checkout.session.completed' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Erreur traitement webhook');
    });
  });
});

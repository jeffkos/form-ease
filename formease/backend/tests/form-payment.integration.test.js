// Tests d'intégration pour les formulaires payants Sprint 1
const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const { setTestUser, resetTestUser } = require('./helpers/authTestHelper');

describe('💰 SPRINT 1 - Tests Formulaires Payants', () => {
  let authToken;
  let mockPrisma;
  let mockStripe;

  beforeEach(() => {
    mockPrisma = global.mockPrisma;
    
    // Mock JWT token valide
    authToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYxNjIzOTAyMn0.test';
    
    // Reset et configure l'utilisateur test
    global.resetTestUser();
    global.setTestUser({ id: 1, email: 'test@example.com', plan: 'premium' });

    // Mock Stripe instance
    mockStripe = require('stripe')();
  });

  describe('⚙️ Configuration Formulaires Payants', () => {
    test('Activer paiement pour un formulaire', async () => {
      // Mock formulaire existant appartenant à l'utilisateur
      mockPrisma.form.findFirst.mockResolvedValue({
        id: 1,
        title: 'Formulaire Test',
        user_id: 1
      });

      // Mock création/mise à jour configuration paiement
      mockPrisma.formPayment.upsert.mockResolvedValue({
        id: 1,
        form_id: 1,
        enabled: true,
        amount: 9.99,
        currency: 'EUR',
        description: 'Accès au formulaire premium'
      });

      const response = await request(app)
        .post('/api/form-payments/1/configure')
        .set('Authorization', authToken)
        .send({
          enabled: true,
          amount: 9.99,
          currency: 'EUR',
          description: 'Accès au formulaire premium',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: 'Paiement activé pour le formulaire',
        formPayment: {
          form_id: 1,
          enabled: true,
          amount: 9.99,
          currency: 'EUR'
        }
      });

      expect(mockPrisma.formPayment.upsert).toHaveBeenCalledWith({
        where: { form_id: 1 },
        update: {
          enabled: true,
          amount: 9.99,
          currency: 'EUR',
          description: 'Accès au formulaire premium',
          success_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel',
          updated_at: expect.any(Date)
        },
        create: {
          form_id: 1,
          enabled: true,
          amount: 9.99,
          currency: 'EUR',
          description: 'Accès au formulaire premium',
          success_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel'
        }
      });
    });

    test('Désactiver paiement pour un formulaire', async () => {
      mockPrisma.form.findFirst.mockResolvedValue({
        id: 1,
        title: 'Formulaire Test',
        user_id: 1
      });

      mockPrisma.formPayment.upsert.mockResolvedValue({
        id: 1,
        form_id: 1,
        enabled: false,
        amount: 0
      });

      const response = await request(app)
        .post('/api/form-payments/1/configure')
        .set('Authorization', authToken)
        .send({
          enabled: false
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Paiement désactivé');
    });

    test('Erreur formulaire non trouvé', async () => {
      mockPrisma.form.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/form-payments/1/configure')
        .set('Authorization', authToken)
        .send({
          enabled: true,
          amount: 5.99
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Formulaire non trouvé.');
    });

    test('Erreur montant invalide pour formulaire payant', async () => {
      mockPrisma.form.findFirst.mockResolvedValue({
        id: 1,
        user_id: 1
      });

      const response = await request(app)
        .post('/api/form-payments/1/configure')
        .set('Authorization', authToken)
        .send({
          enabled: true,
          amount: -5 // Montant négatif
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Montant invalide pour un formulaire payant.');
    });
  });

  describe('💳 Paiements de Formulaires', () => {
    test('Créer paiement pour formulaire payant (public)', async () => {
      // Mock configuration formulaire payant
      mockPrisma.formPayment.findUnique.mockResolvedValue({
        id: 1,
        form_id: 1,
        enabled: true,
        amount: 15.50,
        currency: 'EUR',
        description: 'Accès formulaire événement',
        form: {
          title: 'Inscription Événement 2025'
        }
      });

      // Mock session Stripe
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_form_payment_123',
        url: 'https://checkout.stripe.com/c/pay/cs_form_payment_123'
      });

      // Mock création transaction
      mockPrisma.formPaymentTransaction.create.mockResolvedValue({
        id: 1,
        form_payment_id: 1,
        payer_email: 'user@example.com',
        amount: 15.50,
        status: 'pending'
      });

      const response = await request(app)
        .post('/api/payment/form-payment/1')
        .send({
          payerEmail: 'user@example.com',
          successUrl: 'https://example.com/form/1?success=true',
          cancelUrl: 'https://example.com/form/1?cancelled=true'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        sessionId: 'cs_form_payment_123',
        url: 'https://checkout.stripe.com/c/pay/cs_form_payment_123',
        amount: 15.50,
        currency: 'EUR'
      });

      // Vérifier création session Stripe
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: 'user@example.com',
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Formulaire: Inscription Événement 2025',
              description: 'Accès formulaire événement'
            },
            unit_amount: 1550, // 15.50 * 100
          },
          quantity: 1,
        }],
        success_url: 'https://example.com/form/1?success=true',
        cancel_url: 'https://example.com/form/1?cancelled=true',
        metadata: {
          formId: '1',
          payerEmail: 'user@example.com',
          type: 'form_payment'
        }
      });

      // Vérifier enregistrement transaction
      expect(mockPrisma.formPaymentTransaction.create).toHaveBeenCalledWith({
        data: {
          form_payment_id: 1,
          payer_email: 'user@example.com',
          amount: 15.50,
          currency: 'EUR',
          status: 'pending',
          provider: 'stripe',
          transaction_ref: 'cs_form_payment_123'
        }
      });
    });

    test('Erreur formulaire non payant', async () => {
      mockPrisma.formPayment.findUnique.mockResolvedValue({
        id: 1,
        form_id: 1,
        enabled: false,
        amount: 0
      });

      const response = await request(app)
        .post('/api/payment/form-payment/1')
        .send({
          payerEmail: 'user@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Paiement non activé pour ce formulaire.');
    });

    test('Erreur configuration paiement inexistante', async () => {
      mockPrisma.formPayment.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/payment/form-payment/999')
        .send({
          payerEmail: 'user@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Paiement non activé pour ce formulaire.');
    });
  });

  describe('📊 Gestion et Analytics', () => {
    test('Récupérer configuration paiement formulaire (propriétaire)', async () => {
      mockPrisma.formPayment.findUnique.mockResolvedValue({
        id: 1,
        form_id: 1,
        enabled: true,
        amount: 12.99,
        currency: 'EUR',
        description: 'Accès premium',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        created_at: new Date(),
        updated_at: new Date(),
        form: {
          title: 'Formulaire Test',
          user_id: 1
        }
      });

      const response = await request(app)
        .get('/api/form-payments/1/config')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        enabled: true,
        amount: 12.99,
        currency: 'EUR',
        description: 'Accès premium',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel'
      });
    });

    test('Récupérer config formulaire (non propriétaire - données masquées)', async () => {
      // Mock utilisateur différent
      jest.spyOn(require('../src/middleware/auth'), 'default').mockImplementation((req, res, next) => {
        req.user = { id: 2, email: 'other@example.com' };
        next();
      });

      mockPrisma.formPayment.findUnique.mockResolvedValue({
        id: 1,
        form_id: 1,
        enabled: true,
        amount: 12.99,
        currency: 'EUR',
        description: 'Accès premium',
        form: {
          user_id: 1 // Formulaire appartient à user_id 1, pas 2
        }
      });

      const response = await request(app)
        .get('/api/form-payments/1/config')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        enabled: true,
        amount: 12.99,
        currency: 'EUR',
        description: 'Accès premium'
      });
      
      // URLs sensibles non incluses pour non-propriétaire
      expect(response.body.success_url).toBeUndefined();
      expect(response.body.cancel_url).toBeUndefined();
    });

    test('Lister transactions d\'un formulaire', async () => {
      mockPrisma.form.findFirst.mockResolvedValue({
        id: 1,
        user_id: 1
      });

      const mockTransactions = [
        {
          id: 1,
          payer_email: 'user1@example.com',
          amount: 9.99,
          status: 'completed',
          created_at: new Date(),
          submission: { id: 101, created_at: new Date() }
        },
        {
          id: 2,
          payer_email: 'user2@example.com',
          amount: 9.99,
          status: 'pending',
          created_at: new Date(),
          submission: null
        }
      ];

      mockPrisma.formPaymentTransaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.formPaymentTransaction.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/form-payments/1/transactions')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        transactions: mockTransactions,
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1
      });
    });

    test('Statistiques revenus par formulaire', async () => {
      const mockStats = [
        {
          form_payment_id: 1,
          _sum: { amount: 59.95 }, // 6 × 9.99€
          _count: 6
        },
        {
          form_payment_id: 2,
          _sum: { amount: 75.00 }, // 5 × 15€
          _count: 5
        }
      ];

      mockPrisma.formPaymentTransaction.groupBy.mockResolvedValue(mockStats);

      // Mock enrichissement avec titres formulaires
      mockPrisma.formPayment.findUnique
        .mockResolvedValueOnce({
          form: { id: 1, title: 'Formulaire Event A' }
        })
        .mockResolvedValueOnce({
          form: { id: 2, title: 'Formulaire Event B' }
        });

      const response = await request(app)
        .get('/api/form-payments/revenue-stats?period=30')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        period: '30 jours',
        totalRevenue: 134.95, // 59.95 + 75.00
        totalTransactions: 11, // 6 + 5
        averageTransaction: 12.27, // 134.95 / 11
        formStats: [
          {
            formId: 1,
            formTitle: 'Formulaire Event A',
            revenue: 59.95,
            transactionCount: 6,
            averageAmount: 9.99
          },
          {
            formId: 2,
            formTitle: 'Formulaire Event B',
            revenue: 75.00,
            transactionCount: 5,
            averageAmount: 15.00
          }
        ]
      });
    });
  });

  describe('⚠️ Tests Sécurité et Edge Cases', () => {
    test('Accès non autorisé à configuration formulaire', async () => {
      // Mock utilisateur différent
      jest.spyOn(require('../src/middleware/auth'), 'default').mockImplementation((req, res, next) => {
        req.user = { id: 2, email: 'hacker@example.com' };
        next();
      });

      mockPrisma.form.findFirst.mockResolvedValue(null); // Pas de formulaire pour cet utilisateur

      const response = await request(app)
        .post('/api/form-payments/1/configure')
        .set('Authorization', authToken)
        .send({
          enabled: true,
          amount: 1000 // Tentative de piratage
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Formulaire non trouvé.');
    });

    test('Montant négatif ou nul pour formulaire payant', async () => {
      mockPrisma.form.findFirst.mockResolvedValue({
        id: 1,
        user_id: 1
      });

      const response = await request(app)
        .post('/api/form-payments/1/configure')
        .set('Authorization', authToken)
        .send({
          enabled: true,
          amount: 0 // Montant nul
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Montant invalide pour un formulaire payant.');
    });

    test('Erreur Stripe lors création paiement formulaire', async () => {
      mockPrisma.formPayment.findUnique.mockResolvedValue({
        id: 1,
        form_id: 1,
        enabled: true,
        amount: 10,
        currency: 'EUR',
        form: { title: 'Test Form' }
      });

      mockStripe.checkout.sessions.create.mockRejectedValue(
        new Error('Stripe network error')
      );

      const response = await request(app)
        .post('/api/payment/form-payment/1')
        .send({
          payerEmail: 'test@example.com'
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('Erreur lors de la création du paiement');
    });

    test('Données manquantes pour paiement formulaire', async () => {
      const response = await request(app)
        .post('/api/payment/form-payment/1')
        .send({}); // Pas de payerEmail

      expect(response.status).toBe(500); // L'API devrait valider les données requises
    });
  });
});

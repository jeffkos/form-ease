const request = require('supertest');
const app = require('../src/app');
const { generateTestToken, generateUserMock } = require('./helpers/jwtTestHelper');
const { setAdminUser, setFreeUser, resetTestUser, getValidAuthToken } = require('./helpers/authTestHelper');

describe('🎟️ SPRINT 4 - Tests Gestion des Coupons', () => {
  let authTokenAdmin, authTokenUser;
  let mockPrisma;

  beforeEach(() => {
    // Reset et configure l'utilisateur test admin
    resetTestUser();
    
    // Génère les tokens avec les nouveaux helpers
    const adminSetup = setAdminUser();
    authTokenAdmin = adminSetup.authHeader;

    const userSetup = setFreeUser();
    authTokenUser = userSetup.authHeader;

    // Mock Prisma
    mockPrisma = global.mockPrisma;
  });

  afterEach(() => {
    resetTestUser();
    jest.clearAllMocks();
  });

  describe('🔑 Administration des Coupons', () => {
    test('Créer un coupon valide (Admin)', async () => {
      const couponData = {
        code: 'SAVE20',
        description: 'Réduction de 20%',
        type: 'PERCENTAGE',
        value: 20,
        minAmount: 50,
        maxUses: 100,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      // Mock Prisma responses
      mockPrisma.coupon.findUnique.mockResolvedValue(null); // Code unique
      mockPrisma.coupon.create.mockResolvedValue({
        id: 1,
        ...couponData,
        code: 'SAVE20',
        currentUses: 0,
        isActive: true,
        createdBy: 1,
        created_at: new Date(),
        updated_at: new Date(),
        creator: {
          id: 1,
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@example.com'
        },
        _count: { usages: 0 }
      });

      const response = await request(app)
        .post('/api/admin/coupons')
        .set('Authorization', authTokenAdmin)
        .send(couponData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('SAVE20');
      expect(response.body.data.type).toBe('PERCENTAGE');
      expect(response.body.data.value).toBe(20);
    });

    test('Empêcher création coupon avec code existant', async () => {
      const couponData = {
        code: 'EXISTING',
        type: 'PERCENTAGE',
        value: 10
      };

      // Mock code existant
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 1,
        code: 'EXISTING'
      });

      const response = await request(app)
        .post('/api/admin/coupons')
        .set('Authorization', authTokenAdmin)
        .send(couponData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('code existe déjà');
    });

    test('Lister tous les coupons avec pagination', async () => {
      const mockCoupons = [
        {
          id: 1,
          code: 'SAVE20',
          description: 'Réduction 20%',
          type: 'PERCENTAGE',
          value: 20,
          currentUses: 5,
          maxUses: 100,
          isActive: true,
          created_at: new Date(),
          creator: { id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@example.com' },
          _count: { usages: 5 }
        },
        {
          id: 2,
          code: 'FIXED10',
          description: 'Réduction 10€',
          type: 'FIXED_AMOUNT',
          value: 10,
          currentUses: 2,
          maxUses: 50,
          isActive: true,
          created_at: new Date(),
          creator: { id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@example.com' },
          _count: { usages: 2 }
        }
      ];

      mockPrisma.coupon.findMany.mockResolvedValue(mockCoupons);
      mockPrisma.coupon.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/admin/coupons?page=1&limit=10')
        .set('Authorization', authTokenAdmin);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.coupons).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    test('Mettre à jour un coupon', async () => {
      const updateData = {
        description: 'Nouvelle description',
        value: 25,
        isActive: false
      };

      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 1,
        code: 'SAVE20'
      });

      mockPrisma.coupon.update.mockResolvedValue({
        id: 1,
        code: 'SAVE20',
        ...updateData,
        updated_at: new Date(),
        creator: { id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@example.com' },
        _count: { usages: 0 }
      });

      const response = await request(app)
        .put('/api/admin/coupons/1')
        .set('Authorization', authTokenAdmin)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Nouvelle description');
      expect(response.body.data.value).toBe(25);
    });

    test('Désactiver un coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 1,
        code: 'SAVE20',
        isActive: true
      });

      mockPrisma.coupon.update.mockResolvedValue({
        id: 1,
        code: 'SAVE20',
        isActive: false,
        status: 'INACTIVE'
      });

      const response = await request(app)
        .post('/api/admin/coupons/1/disable')
        .set('Authorization', authTokenAdmin);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('désactivé');
    });

    test('Supprimer un coupon non utilisé', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 1,
        code: 'SAVE20',
        _count: { usages: 0 }
      });

      mockPrisma.coupon.delete.mockResolvedValue({});

      const response = await request(app)
        .delete('/api/admin/coupons/1')
        .set('Authorization', authTokenAdmin);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('supprimé');
    });

    test('Empêcher suppression coupon utilisé', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 1,
        code: 'SAVE20',
        _count: { usages: 5 }
      });

      const response = await request(app)
        .delete('/api/admin/coupons/1')
        .set('Authorization', authTokenAdmin);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('qui a été utilisé');
    });
  });

  describe('🎫 Validation et Application des Coupons', () => {
    test('Valider un coupon valide', async () => {
      const mockCoupon = {
        id: 1,
        code: 'SAVE20',
        description: 'Réduction 20%',
        type: 'PERCENTAGE',
        value: 20,
        minAmount: 50,
        maxUses: 100,
        currentUses: 5,
        isActive: true,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);

      const response = await request(app)
        .post('/api/coupons/validate')
        .send({
          code: 'SAVE20',
          orderAmount: 100
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.discount.amount).toBe(20); // 20% de 100€
      expect(response.body.data.discount.finalAmount).toBe(80);
    });

    test('Valider coupon à montant fixe', async () => {
      const mockCoupon = {
        id: 2,
        code: 'FIXED10',
        description: 'Réduction 10€',
        type: 'FIXED_AMOUNT',
        value: 10,
        isActive: true,
        status: 'ACTIVE',
        currentUses: 0,
        maxUses: 50,
        expiresAt: null
      };

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);

      const response = await request(app)
        .post('/api/coupons/validate')
        .send({
          code: 'FIXED10',
          orderAmount: 25
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.discount.amount).toBe(10);
      expect(response.body.data.discount.finalAmount).toBe(15);
    });

    test('Rejeter coupon expiré', async () => {
      const mockCoupon = {
        id: 1,
        code: 'EXPIRED',
        type: 'PERCENTAGE',
        value: 20,
        isActive: true,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Hier
      };

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);

      const response = await request(app)
        .post('/api/coupons/validate')
        .send({
          code: 'EXPIRED',
          orderAmount: 100
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expiré');
    });

    test('Rejeter coupon avec montant minimum non atteint', async () => {
      const mockCoupon = {
        id: 1,
        code: 'MIN50',
        type: 'PERCENTAGE',
        value: 20,
        minAmount: 50,
        isActive: true,
        status: 'ACTIVE',
        currentUses: 0,
        maxUses: 100,
        expiresAt: null
      };

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);

      const response = await request(app)
        .post('/api/coupons/validate')
        .send({
          code: 'MIN50',
          orderAmount: 30
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Montant minimum');
    });

    test('Rejeter coupon avec limite d\'utilisation atteinte', async () => {
      const mockCoupon = {
        id: 1,
        code: 'MAXED',
        type: 'PERCENTAGE',
        value: 20,
        maxUses: 10,
        currentUses: 10,
        isActive: true,
        status: 'ACTIVE',
        expiresAt: null
      };

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);

      const response = await request(app)
        .post('/api/coupons/validate')
        .send({
          code: 'MAXED',
          orderAmount: 100
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('limite d\'utilisation');
    });

    test('Rejeter coupon inexistant', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/coupons/validate')
        .send({
          code: 'NOTFOUND',
          orderAmount: 100
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('non trouvé');
    });
  });

  describe('📊 Statistiques des Coupons', () => {
    test('Récupérer statistiques globales des coupons', async () => {
      // Mock des statistiques
      mockPrisma.coupon.count
        .mockResolvedValueOnce(25) // Total coupons
        .mockResolvedValueOnce(20) // Active coupons  
        .mockResolvedValueOnce(3); // Expired coupons

      mockPrisma.couponUsage.count.mockResolvedValue(150); // Total usages
      mockPrisma.couponUsage.aggregate.mockResolvedValue({
        _sum: { amount: 2500 }
      });

      mockPrisma.coupon.findMany.mockResolvedValue([
        { id: 1, code: 'TOP1', currentUses: 50, _count: { usages: 50 } },
        { id: 2, code: 'TOP2', currentUses: 30, _count: { usages: 30 } }
      ]);

      mockPrisma.$queryRaw.mockResolvedValue([
        { date: new Date(), usage_count: 10, total_savings: 200 },
        { date: new Date(), usage_count: 8, total_savings: 150 }
      ]);

      const response = await request(app)
        .get('/api/admin/coupons/stats')
        .set('Authorization', authTokenAdmin);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overview.totalCoupons).toBe(25);
      expect(response.body.data.overview.activeCoupons).toBe(20);
      expect(response.body.data.overview.totalUsages).toBe(150);
      expect(response.body.data.overview.totalSavings).toBe(2500);
    });
  });

  describe('🔒 Tests de Sécurité', () => {
    test('Rejeter accès admin sans authentification', async () => {
      const response = await request(app)
        .get('/api/admin/coupons');

      expect(response.status).toBe(401);
    });

    test('Rejeter accès admin avec utilisateur non admin', async () => {
      const response = await request(app)
        .get('/api/admin/coupons')
        .set('Authorization', authTokenUser);

      expect(response.status).toBe(403);
    });

    test('Valider données d\'entrée pour création coupon', async () => {
      const invalidData = {
        code: 'ab', // Trop court
        type: 'INVALID_TYPE',
        value: -10 // Négatif
      };

      const response = await request(app)
        .post('/api/admin/coupons')
        .set('Authorization', authTokenAdmin)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('🧪 Tests d\'Edge Cases', () => {
    test('Gestion coupon avec montant ordre à 0', async () => {
      const mockCoupon = {
        id: 1,
        code: 'SAVE20',
        type: 'PERCENTAGE',
        value: 20,
        isActive: true,
        status: 'ACTIVE'
      };

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);

      const response = await request(app)
        .post('/api/coupons/validate')
        .send({
          code: 'SAVE20',
          orderAmount: 0
        });

      expect(response.status).toBe(200);
      expect(response.body.data.discount.amount).toBe(0);
      expect(response.body.data.discount.finalAmount).toBe(0);
    });

    test('Coupon montant fixe supérieur au prix de commande', async () => {
      const mockCoupon = {
        id: 1,
        code: 'BIG50',
        type: 'FIXED_AMOUNT',
        value: 50,
        isActive: true,
        status: 'ACTIVE'
      };

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);

      const response = await request(app)
        .post('/api/coupons/validate')
        .send({
          code: 'BIG50',
          orderAmount: 25
        });

      expect(response.status).toBe(200);
      expect(response.body.data.discount.amount).toBe(25); // Limité au montant de la commande
      expect(response.body.data.discount.finalAmount).toBe(0);
    });

    test('Récupération coupon inexistant par ID', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/admin/coupons/999')
        .set('Authorization', authTokenAdmin);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('non trouvé');
    });
  });
});

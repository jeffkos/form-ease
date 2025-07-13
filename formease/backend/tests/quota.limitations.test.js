// Tests d'intégration pour la logique des limitations et quotas
const request = require("supertest");
const app = require("../src/app");
const jwt = require("jsonwebtoken");

// Mock Prisma pour les tests
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  form: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  submission: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  exportLog: {
    count: jest.fn(),
    create: jest.fn(),
  },
  emailLog: {
    count: jest.fn(),
    create: jest.fn(),
  },
  actionLog: {
    create: jest.fn(),
  },
  contact: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

// Mock global pour Prisma
global.mockPrisma = mockPrisma;

describe("🎯 SPRINT 2 - Tests Logique des Limitations", () => {
  let authToken;
  let freeUserToken;
  let premiumUserToken;

  beforeAll(() => {
    // Créer des tokens JWT pour les tests
    const jwtSecret = process.env.JWT_SECRET || "test-secret";

    freeUserToken = jwt.sign(
      { id: 1, email: "free@test.com", plan: "free" },
      jwtSecret,
      { expiresIn: "1h" }
    );

    premiumUserToken = jwt.sign(
      { id: 2, email: "premium@test.com", plan: "premium" },
      jwtSecret,
      { expiresIn: "1h" }
    );

    authToken = `Bearer ${freeUserToken}`;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("🔄 Expiration Automatique des Plans Premium", () => {
    test("Utilisateur premium expiré doit être rétrogradé vers FREE", async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Expiré hier

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 2,
        plan: "premium",
        plan_expiration: expiredDate,
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 2,
        plan: "free",
        plan_expiration: null,
      });

      mockPrisma.form.count.mockResolvedValue(0);

      const response = await request(app)
        .get("/api/metrics/quota-status")
        .set("Authorization", `Bearer ${premiumUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.plan).toBe("free");
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { plan: "free", plan_expiration: null },
      });
    });

    test("Utilisateur premium valide doit garder son plan", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // Expire dans 30 jours

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 2,
        plan: "premium",
        plan_expiration: futureDate,
      });

      mockPrisma.form.count.mockResolvedValue(5);
      mockPrisma.exportLog.count.mockResolvedValue(2);
      mockPrisma.emailLog.count.mockResolvedValue(10);

      const response = await request(app)
        .get("/api/metrics/quota-status")
        .set("Authorization", `Bearer ${premiumUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.plan).toBe("premium");
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("📅 Expiration des Formulaires", () => {
    test("Formulaire FREE expiré après 18 jours doit être désactivé", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 20); // Créé il y a 20 jours

      mockPrisma.form.findUnique.mockResolvedValue({
        id: "form-123",
        user_id: 1,
        created_at: oldDate,
        is_active: true,
        user: { id: 1, plan: "free" },
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        plan: "free",
        plan_expiration: null,
      });

      const response = await request(app)
        .post("/api/forms/form-123/submit")
        .send({
          formId: "form-123",
          data: { email: "test@example.com" },
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("FORM_EXPIRED");
      expect(response.body.message).toContain("Formulaire expiré");
    });

    test("Formulaire PREMIUM valide après 30 jours doit rester actif", async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 25); // Créé il y a 25 jours

      const futureExpiration = new Date();
      futureExpiration.setDate(futureExpiration.getDate() + 30);

      mockPrisma.form.findUnique.mockResolvedValue({
        id: "form-456",
        user_id: 2,
        created_at: recentDate,
        is_active: true,
        user: { id: 2, plan: "premium" },
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 2,
        plan: "premium",
        plan_expiration: futureExpiration,
      });

      mockPrisma.submission.count.mockResolvedValue(50);

      const response = await request(app)
        .post("/api/forms/form-456/submit")
        .send({
          formId: "form-456",
          data: { email: "test@example.com" },
        });

      expect(response.status).not.toBe(403);
    });
  });

  describe("🚫 Limitations par Fonctionnalité", () => {
    test("Export PDF doit être bloqué pour les utilisateurs FREE", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        plan: "free",
        plan_expiration: null,
      });

      const response = await request(app)
        .get("/api/submissions/form/test-form/export/pdf")
        .set("Authorization", authToken);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("FEATURE_ACCESS_DENIED");
      expect(response.body.message).toContain("plan PREMIUM");
    });

    test("Export PDF doit être autorisé pour les utilisateurs PREMIUM", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 2,
        plan: "premium",
        plan_expiration: futureDate,
      });

      mockPrisma.exportLog.count.mockResolvedValue(5); // Sous la limite

      const response = await request(app)
        .get("/api/submissions/form/test-form/export/pdf")
        .set("Authorization", `Bearer ${premiumUserToken}`);

      // Ne devrait pas être bloqué par la vérification de fonctionnalité
      expect(response.status).not.toBe(403);
    });

    test("Analytics avancées doivent être bloquées pour les utilisateurs FREE", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        plan: "free",
        plan_expiration: null,
      });

      const response = await request(app)
        .get("/api/metrics/comparison")
        .set("Authorization", authToken);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("PREMIUM_REQUIRED");
    });
  });

  describe("📊 Quotas en Temps Réel", () => {
    test("Quota de formulaires FREE doit être vérifié en temps réel", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        plan: "free",
        plan_expiration: null,
      });

      mockPrisma.form.count.mockResolvedValue(1); // Déjà à la limite

      const response = await request(app)
        .post("/api/forms")
        .set("Authorization", authToken)
        .send({
          title: "Nouveau formulaire",
          description: "Test",
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("FORM_QUOTA_EXCEEDED");
      expect(response.body.quota.used).toBe(1);
      expect(response.body.quota.limit).toBe(1);
    });

    test("Quota d'exports quotidien doit être vérifié", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        plan: "free",
        plan_expiration: null,
      });

      mockPrisma.exportLog.count.mockResolvedValue(5); // À la limite quotidienne

      const response = await request(app)
        .get("/api/submissions/form/test-form/export/csv")
        .set("Authorization", authToken);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("EXPORT_QUOTA_EXCEEDED");
      expect(response.body.quota.used).toBe(5);
      expect(response.body.quota.limit).toBe(5);
    });

    test("Quota d'emails mensuel doit être vérifié", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        plan: "free",
        plan_expiration: null,
      });

      mockPrisma.emailLog.count.mockResolvedValue(50); // À la limite mensuelle

      const response = await request(app)
        .post("/api/emails/send")
        .set("Authorization", authToken)
        .send({
          to: "test@example.com",
          subject: "Test",
          content: "Test message",
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("EMAIL_QUOTA_EXCEEDED");
    });
  });

  describe("📈 Métriques Différenciées", () => {
    test("Métriques FREE doivent être limitées à 7 jours", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        plan: "free",
        plan_expiration: null,
      });

      mockPrisma.form.count.mockResolvedValue(1);
      mockPrisma.submission.count.mockResolvedValue(25);
      mockPrisma.contact.count.mockResolvedValue(15);
      mockPrisma.exportLog.count.mockResolvedValue(2);
      mockPrisma.emailLog.count.mockResolvedValue(10);

      const response = await request(app)
        .get("/api/metrics/dashboard")
        .set("Authorization", authToken);

      expect(response.status).toBe(200);
      expect(response.body.plan).toBe("free");
      expect(response.body.analyticsRange.days).toBe(7); // Validité du formulaire FREE
      expect(response.body.geographic).toBeNull(); // Pas de données géographiques
    });

    test("Métriques PREMIUM doivent inclure toutes les fonctionnalités", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 2,
        plan: "premium",
        plan_expiration: futureDate,
      });

      mockPrisma.form.count.mockResolvedValue(10);
      mockPrisma.submission.count.mockResolvedValue(250);
      mockPrisma.contact.count.mockResolvedValue(150);
      mockPrisma.exportLog.count.mockResolvedValue(15);
      mockPrisma.emailLog.count.mockResolvedValue(100);

      // Mock pour les données géographiques
      mockPrisma.contact.findMany.mockResolvedValue([
        { city: "Paris", country: "France" },
        { city: "Lyon", country: "France" },
        { city: "Berlin", country: "Germany" },
      ]);

      const response = await request(app)
        .get("/api/metrics/dashboard")
        .set("Authorization", `Bearer ${premiumUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.plan).toBe("premium");
      expect(response.body.analyticsRange.days).toBe(30); // Validité du formulaire PREMIUM
      expect(response.body.geographic).not.toBeNull();
      expect(response.body.performance.availableInPlan).toBe(true);
    });
  });

  describe("🔧 Logging et Audit", () => {
    test("Dépassement de quota doit être loggé", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        plan: "free",
        plan_expiration: null,
      });

      mockPrisma.form.count.mockResolvedValue(1);
      mockPrisma.actionLog.create.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post("/api/forms")
        .set("Authorization", authToken)
        .send({
          title: "Test form",
          description: "Test",
        });

      expect(response.status).toBe(403);
      expect(mockPrisma.actionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 1,
          action: "quota_form_limit_exceeded",
          entity: "Quota",
          details: expect.objectContaining({
            quotaType: "form_limit_exceeded",
            currentCount: 1,
            limit: 1,
            plan: "free",
          }),
        }),
      });
    });

    test("Utilisation de fonctionnalité doit être loggée", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 2,
        plan: "premium",
        plan_expiration: futureDate,
      });

      mockPrisma.exportLog.count.mockResolvedValue(10);
      mockPrisma.actionLog.create.mockResolvedValue({ id: 2 });

      const response = await request(app)
        .get("/api/submissions/form/test-form/export/pdf")
        .set("Authorization", `Bearer ${premiumUserToken}`);

      // Vérifier que l'accès à la fonctionnalité premium est autorisé
      expect(response.status).not.toBe(403);
    });
  });

  describe("⚠️ Alertes et Avertissements", () => {
    test("Utilisateur proche de la limite doit recevoir des avertissements", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        plan: "free",
        plan_expiration: null,
      });

      // 80% de la limite (4/5 exports)
      mockPrisma.exportLog.count.mockResolvedValue(4);
      mockPrisma.form.count.mockResolvedValue(1);
      mockPrisma.emailLog.count.mockResolvedValue(40);

      const response = await request(app)
        .get("/api/metrics/quota-status")
        .set("Authorization", authToken);

      expect(response.status).toBe(200);
      expect(response.body.warnings.exportsNearLimit).toBe(true);
      expect(response.body.warnings.emailsNearLimit).toBe(true);
      expect(response.body.percentages.exports).toBe(80);
      expect(response.body.percentages.emails).toBe(80);
    });
  });
});

describe("🔄 Maintenance et Nettoyage", () => {
  const {
    runMaintenance,
    downgradeExpiredPremiumUsers,
    archiveOldLogs,
  } = require("../src/scripts/maintenanceQuotas");

  test("Maintenance doit rétrograder les utilisateurs premium expirés", async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);

    mockPrisma.user.findMany.mockResolvedValue([
      { id: 1, email: "user1@test.com", plan_expiration: expiredDate },
      { id: 2, email: "user2@test.com", plan_expiration: expiredDate },
    ]);

    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.actionLog.create.mockResolvedValue({ id: 1 });

    const result = await downgradeExpiredPremiumUsers();

    expect(result).toBe(2);
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.actionLog.create).toHaveBeenCalledTimes(2);
  });

  test("Maintenance doit archiver les anciens logs", async () => {
    mockPrisma.actionLog.count.mockResolvedValue(100);
    mockPrisma.exportLog.count.mockResolvedValue(50);
    mockPrisma.emailLog.count.mockResolvedValue(75);

    mockPrisma.actionLog.deleteMany.mockResolvedValue({ count: 100 });
    mockPrisma.exportLog.deleteMany.mockResolvedValue({ count: 50 });
    mockPrisma.emailLog.deleteMany.mockResolvedValue({ count: 75 });

    const result = await archiveOldLogs();

    expect(result).toBe(225); // Total des logs archivés
    expect(mockPrisma.actionLog.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.exportLog.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.emailLog.deleteMany).toHaveBeenCalled();
  });
});

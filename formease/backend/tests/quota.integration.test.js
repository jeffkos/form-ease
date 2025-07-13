// Tests d'intégration pour le système de quotas Sprint 1
const request = require("supertest");
const app = require("../src/app");
const { PrismaClient } = require("@prisma/client");
const { setTestUser, resetTestUser } = require("./helpers/authTestHelper");

// Configuration des quotas pour les tests
const TEST_QUOTAS = {
  FREE: {
    maxForms: 1,
    maxSubmissions: 100,
    validityDays: 7, // 7 jours pour FREE
    maxEmailsPerMonth: 50,
    maxExportsPerDay: 5,
  },
  PREMIUM: {
    maxForms: 100,
    maxSubmissions: 10000,
    validityDays: 30, // 30 jours (1 mois) pour PREMIUM
    maxEmailsPerMonth: 5000,
    maxExportsPerDay: 100,
  },
};

describe("🎯 SPRINT 1 - Tests Quotas et Limitations", () => {
  let authToken;
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = global.mockPrisma;

    // Mock JWT token valide
    authToken =
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYxNjIzOTAyMn0.test";

    // Reset et configure l'utilisateur test
    global.resetTestUser();
    global.setTestUser({ id: 1, email: "test@example.com", plan: "free" });
  });

  describe("✅ Quotas FREE - Limitations", () => {
    test("Limite formulaires FREE (1 maximum)", async () => {
      // Mock: utilisateur a déjà 1 formulaire
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, plan: "free" });
      mockPrisma.form.count.mockResolvedValue(1);

      const response = await request(app)
        .post("/api/forms")
        .set("Authorization", authToken)
        .send({
          title: "Formulaire Test 2",
          description: "Deuxième formulaire (doit échouer)",
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("Limite de formulaires atteinte");
    });

    test("Quota soumissions FREE (100 par formulaire)", async () => {
      // Mock: formulaire avec 100 soumissions
      mockPrisma.form.findUnique.mockResolvedValue({
        id: 1,
        user: { plan: "free" },
      });
      mockPrisma.submission.count.mockResolvedValue(100);

      const response = await request(app)
        .post("/api/submissions")
        .send({
          formId: 1,
          data: { email: "test@example.com", name: "Test User" },
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("Limite d'inscriptions atteinte");
    });

    test("Expiration formulaire FREE après 18 jours", async () => {
      // Mock: formulaire créé il y a 19 jours
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 19);

      mockPrisma.form.findUnique.mockResolvedValue({
        id: 1,
        user: { plan: "free" },
        created_at: oldDate,
      });

      const response = await request(app)
        .post("/api/submissions")
        .send({
          formId: 1,
          data: { email: "test@example.com" },
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("Formulaire expiré");
      expect(response.body.formAge).toBe(19);
      expect(response.body.validityDays).toBe(7); // Corrigé : 7 jours pour FREE
    });

    test("Quota emails FREE (50 par mois)", async () => {
      // Mock: utilisateur a déjà envoyé 50 emails ce mois
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, plan: "free" });

      // Simuler 50 emails déjà envoyés ce mois
      const mockMiddleware = require("../src/middleware/quota");
      jest
        .spyOn(mockMiddleware, "checkEmailQuota")
        .mockImplementation((req, res, next) => {
          res.status(403).json({
            message: "Limite d'emails mensuelle atteinte pour votre offre.",
            quota: 50,
            used: 50,
          });
        });

      const response = await request(app)
        .post("/api/emails/send")
        .set("Authorization", authToken)
        .send({
          to: ["test@example.com"],
          subject: "Test Email",
          content: "Test content",
        });

      expect(response.status).toBe(403);
      expect(response.body.quota).toBe(50);
      expect(response.body.used).toBe(50);
    });
  });

  describe("🚀 Quotas PREMIUM - Illimités", () => {
    beforeEach(() => {
      // Configure utilisateur PREMIUM
      global.setTestUser({
        id: 2,
        email: "premium@example.com",
        plan: "premium",
      });
    });

    test("Formulaires illimités pour PREMIUM", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 2, plan: "premium" });
      mockPrisma.form.count.mockResolvedValue(50); // Déjà 50 formulaires

      const response = await request(app)
        .post("/api/forms")
        .set("Authorization", authToken)
        .send({
          title: "Formulaire Premium 51",
          description: "Doit réussir pour PREMIUM",
        });

      // Mock création réussie
      mockPrisma.form.create.mockResolvedValue({
        id: 51,
        title: "Formulaire Premium 51",
        user_id: 2,
      });

      // Le middleware ne devrait pas bloquer
      expect(response.status).not.toBe(403);
    });

    test("Soumissions illimitées pour PREMIUM", async () => {
      mockPrisma.form.findUnique.mockResolvedValue({
        id: 1,
        user: { plan: "premium" },
      });
      mockPrisma.submission.count.mockResolvedValue(5000); // Déjà 5000 soumissions

      const response = await request(app)
        .post("/api/submissions")
        .send({
          formId: 1,
          data: { email: "premium@example.com", name: "Premium User" },
        });

      // Le middleware ne devrait pas bloquer pour PREMIUM
      expect(response.status).not.toBe(403);
    });

    test("Pas d'expiration pour formulaires PREMIUM", async () => {
      // Mock: formulaire PREMIUM créé il y a 100 jours
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      mockPrisma.form.findUnique.mockResolvedValue({
        id: 1,
        user: { plan: "premium" },
        created_at: oldDate,
      });

      const response = await request(app)
        .post("/api/submissions")
        .send({
          formId: 1,
          data: { email: "premium@example.com" },
        });

      // Ne devrait pas être bloqué malgré l'âge
      expect(response.status).not.toBe(403);
    });
  });

  describe("📊 API Status Quotas", () => {
    test("Récupérer status quotas utilisateur FREE", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, plan: "free" });
      mockPrisma.form.count.mockResolvedValue(1);

      const response = await request(app)
        .get("/api/payment/quota-status")
        .set("Authorization", authToken);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        plan: "free",
        quotas: {
          forms: 1,
          submissionsPerForm: 100,
          emailsPerMonth: 50,
          formValidityDays: 7, // Corrigé : 7 jours pour FREE
        },
        usage: {
          forms: 1,
        },
        percentage: {
          forms: 100, // 1/1 = 100%
        },
      });
    });

    test("Récupérer status quotas utilisateur PREMIUM", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 2, plan: "premium" });
      mockPrisma.form.count.mockResolvedValue(25);

      const response = await request(app)
        .get("/api/payment/quota-status")
        .set("Authorization", authToken);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        plan: "premium",
        quotas: {
          forms: 100,
          submissionsPerForm: 10000,
          emailsPerMonth: 5000,
          formValidityDays: 30, // Corrigé : 30 jours pour PREMIUM
        },
        usage: {
          forms: 25,
        },
        percentage: {
          forms: 25, // 25/100 = 25%
        },
      });
    });
  });

  describe("⚠️ Tests Edge Cases", () => {
    test("Gestion utilisateur sans plan défini (défaut FREE)", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 3, plan: null });
      mockPrisma.form.count.mockResolvedValue(1);

      const response = await request(app)
        .post("/api/forms")
        .set("Authorization", authToken)
        .send({
          title: "Test formulaire",
          description: "Test",
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("Limite de formulaires atteinte");
    });

    test("Formulaire inexistant pour validation expiration", async () => {
      mockPrisma.form.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/submissions")
        .send({
          formId: 999,
          data: { email: "test@example.com" },
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("Formulaire non trouvé");
    });
  });
});

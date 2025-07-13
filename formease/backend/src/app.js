// Point d'entrée principal du backend FormEase
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const logger = require("./utils/logger");

// Chargement des variables d'environnement
dotenv.config();

const app = express();

// Import des middlewares de sécurité
const {
  securityHeaders,
  apiLimiter,
  checkCriticalSecrets,
  errorHandler,
} = require("./middleware/security");

// Import des nouveaux middlewares améliorés
const { initializeCache } = require("./middleware/performance");
const { initializeRedis } = require("./middleware/rateLimiting");
const enhancedApiRoutes = require("./routes/enhanced-api");

// Vérification des secrets critiques au démarrage
app.use(checkCriticalSecrets);

// Middleware de sécurité
app.use(securityHeaders);

// Configuration CORS - Permissive pour le développement
app.use(
  cors({
    origin: function (origin, callback) {
      // En développement, accepter toutes les origines
      if (process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        // En production, utiliser une liste d'origines autorisées
        const allowedOrigins = [
          process.env.FRONTEND_URL || "http://localhost:3000",
          "http://localhost:4000",
          "http://localhost:8080",
          "http://localhost:5173",
        ];
        callback(null, allowedOrigins.indexOf(origin) !== -1 || !origin);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
  })
);

// Rate limiting global
app.use("/api", apiLimiter);

// Middleware de parsing JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Route de test de santé
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 4000,
    environment: process.env.NODE_ENV || "development",
  });
});

// Route de test de parsing JSON
app.post("/api/test-login", (req, res) => {
  console.log("Body reçu:", req.body);
  res.json({
    message: "Test réussi",
    receivedData: req.body,
    timestamp: new Date().toISOString(),
  });
});

// Route de test de connexion avec données statiques
app.post("/api/test-auth", (req, res) => {
  const { email, password } = req.body;

  if (email === "jeff.kosi@formease.com" && password === "FormEase2025!") {
    res.json({
      success: true,
      message: "Connexion de test réussie",
      token: "test-token-123",
      user: {
        id: 3,
        firstName: "Jeff",
        lastName: "KOSI",
        email: "jeff.kosi@formease.com",
        role: "PREMIUM",
        plan: "premium",
      },
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Identifiants de test invalides",
    });
  }
});

// Route de test simple
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "FormEase backend is running",
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 4000,
  });
});

// Route de test pour la connexion (sans validation pour debug)
app.post("/api/test-login", (req, res) => {
  console.log("Body reçu:", req.body);
  console.log("Headers:", req.headers);
  res.json({
    message: "Test OK",
    body: req.body,
    timestamp: new Date().toISOString(),
  });
});

// Initialisation des systèmes de cache et monitoring
async function initializeEnhancedSystems() {
  try {
    await initializeCache();
    await initializeRedis();
    logger.info("🚀 Enhanced API systems initialized");
  } catch (error) {
    logger.warn(
      "Enhanced systems initialization partial failure:",
      error.message
    );
  }
}

// Initialiser au démarrage
initializeEnhancedSystems();

// Utiliser les routes API améliorées
app.use("/api/v2", enhancedApiRoutes);

// Importation des routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// Importation des routes dashboard
const dashboardRoutes = require("./routes/dashboard");
app.use("/api/dashboard", dashboardRoutes);

// Importation de la route de paiement
const paymentRoutes = require("./routes/payment");
app.use("/api/payment", paymentRoutes);

// Importation de la route de gestion des formulaires
const formRoutes = require("./routes/form");
app.use("/api/forms", formRoutes);

// Importation de la route de gestion des champs de formulaire
const formFieldRoutes = require("./routes/formField");
app.use("/api/forms", formFieldRoutes);

// Importation de la route de gestion des inscriptions
const submissionRoutes = require("./routes/submission");
app.use("/api/submissions", submissionRoutes);

// Importation de la route de gestion des QR codes
const qrcodeRoutes = require("./routes/qrcodes");
app.use("/api/qrcodes", qrcodeRoutes);

// Importation de la route de gestion des SMS
const smsRoutes = require("./routes/sms");
app.use("/api/sms", smsRoutes);

// Importation de la route des statistiques (dashboard)
const statsRoutes = require("./routes/stats");
app.use("/api/stats", statsRoutes);

// Importation de la route des métriques différenciées par plan
const metricsRoutes = require("./routes/metrics");
app.use("/api/metrics", metricsRoutes);

// Importation de la route de gestion des templates d'email (admin/superadmin)
const emailTemplateRoutes = require("./routes/emailTemplate");
app.use("/api/email-templates", emailTemplateRoutes);

// Importation de la route d'archivage avancé
const archiveRoutes = require("./routes/archive");
app.use("/api/archive", archiveRoutes);

// Importation de la route RGPD (export/suppression données utilisateur)
const rgpdRoutes = require("./routes/rgpd");
app.use("/api/rgpd", rgpdRoutes);

// Importation de la route des logs d'action admin (audit trail)
const actionLogRoutes = require("./routes/actionLog");
app.use("/api/action-logs", actionLogRoutes);

// Importation de la route de gestion des formulaires payants
const formPaymentRoutes = require("./routes/formPayment");
app.use("/api/form-payments", formPaymentRoutes);

// Importation de la route de gestion des abonnements
const subscriptionRoutes = require("./routes/subscription");
app.use("/api/subscription", subscriptionRoutes);

// Importation de la route de gestion des emails
const emailRoutes = require("./routes/emails");
app.use("/api/emails", emailRoutes);

// Importation de la route de gestion des contacts
const contactRoutes = require("./routes/contact");
app.use("/api/contacts", contactRoutes);

// Importation de la route des campagnes d'emailing
const emailCampaignRoutes = require("./routes/emailCampaign");
app.use("/api/email-campaigns", emailCampaignRoutes);

// Importation de la route d'automation marketing
const marketingAutomationRoutes = require("./routes/marketingAutomation");
app.use("/api/marketing-automation", marketingAutomationRoutes);

// Importation de la route de gestion des feedbacks
const feedbackRoute = require("./routes/feedback");
app.use("/api/feedback", feedbackRoute);

// Importation de la route de gestion des coupons
const couponRoutes = require("./routes/coupon");
app.use("/api", couponRoutes);

// Documentation Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./docs/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Gestion globale des erreurs (middleware de sécurité)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Ne démarrer le serveur que si ce fichier est exécuté directement
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`FormEase backend server started on port ${PORT}`);
    console.log(`Serveur FormEase backend démarré sur le port ${PORT}`);
  });
}

module.exports = app;

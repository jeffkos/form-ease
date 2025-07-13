/**
 * 🔧 Enhanced API Routes with Security & Performance - FormEase
 *
 * Routes principales améliorées avec les nouveaux middlewares
 * de sécurité, performance et monitoring
 *
 * @version 2.0.0
 * @author FormEase API Team
 */

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

// Import des nouveaux middlewares
const {
  smartRateLimit,
  bruteForceDetection,
  ipWhitelist,
  rateLimitLogger,
} = require("../middleware/rateLimiting");

const {
  cache,
  invalidateCache,
  intelligentCompression,
  performanceHeaders,
  requestSizeLimit,
  botDetection,
} = require("../middleware/performance");

const { optimizedPagination } = require("../middleware/optimizedPagination");

const {
  metricsMiddleware,
  cacheMetricsMiddleware,
  metricsEndpoint,
  healthEndpoint,
} = require("../middleware/monitoring");

const { validateRequest } = require("../middleware/validation");
const { sanitize } = require("../middleware/sanitize");
const { default: auth } = require("../middleware/auth");
const logger = require("../utils/logger");

// Import des contrôleurs existants
const authController = require("../controllers/authController");
const formController = require("../controllers/formController");
const submissionController = require("../controllers/submissionController");

const router = express.Router();

// =====================================
// MIDDLEWARE GLOBAL STACK
// =====================================

// 1. Sécurité de base
router.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// 2. CORS configuré
router.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-API-Version",
    ],
  })
);

// 3. Compression et performance
router.use(intelligentCompression);
router.use(performanceHeaders);
router.use(requestSizeLimit("50mb"));

// 4. Monitoring et métriques
router.use(metricsMiddleware);
router.use(cacheMetricsMiddleware);

// 5. Détection et sécurité
router.use(ipWhitelist);
router.use(bruteForceDetection);
router.use(botDetection);

// 6. Rate limiting intelligent
router.use(smartRateLimit);
router.use(rateLimitLogger);

// 7. Sanitisation globale
router.use(sanitize);

// 8. Pagination pour les routes GET
router.use(optimizedPagination);

// =====================================
// ROUTES DE MONITORING
// =====================================

// Health check - public
router.get("/health", healthEndpoint);

// Métriques Prometheus - protégé
router.get(
  "/metrics",
  auth,
  (req, res, next) => {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "ACCESS_DENIED",
        message: "Accès réservé aux administrateurs",
      });
    }
    next();
  },
  metricsEndpoint
);

// Status API détaillé
router.get(
  "/status",
  cache({ duration: 30, varyBy: ["user"] }),
  async (req, res) => {
    try {
      const status = {
        api: "FormEase API",
        version: process.env.npm_package_version || "2.0.0",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
        features: {
          authentication: true,
          rateLimit: true,
          cache: true,
          monitoring: true,
          compression: true,
        },
      };

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error("Status endpoint error:", error);
      res.status(500).json({
        success: false,
        error: "STATUS_ERROR",
        message: "Erreur lors de la récupération du statut",
      });
    }
  }
);

// =====================================
// ROUTES D'AUTHENTIFICATION
// =====================================

// Login - rate limiting strict
router.post(
  "/auth/login",
  // Validation spécifique pour login
  validateRequest([
    require("express-validator")
      .body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Email invalide"),
    require("express-validator")
      .body("password")
      .isLength({ min: 1 })
      .withMessage("Mot de passe requis"),
  ]),
  authController.login
);

// Register
router.post(
  "/auth/register",
  validateRequest([
    require("express-validator")
      .body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Email invalide"),
    require("express-validator")
      .body("password")
      .isLength({ min: 8 })
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage("Mot de passe trop faible"),
    require("express-validator")
      .body("first_name")
      .isLength({ min: 2, max: 50 })
      .matches(/^[a-zA-ZÀ-ÿ\s\-'\.]+$/)
      .withMessage("Prénom invalide"),
    require("express-validator")
      .body("last_name")
      .isLength({ min: 2, max: 50 })
      .matches(/^[a-zA-ZÀ-ÿ\s\-'\.]+$/)
      .withMessage("Nom invalide"),
  ]),
  authController.register
);

// Refresh token
router.post(
  "/auth/refresh",
  validateRequest([
    require("express-validator")
      .body("refresh_token")
      .isLength({ min: 1 })
      .withMessage("Refresh token requis"),
  ]),
  authController.refreshToken
);

// Logout
router.post("/auth/logout", auth, authController.logout);

// Profil utilisateur
router.get(
  "/auth/profile",
  auth,
  cache({ duration: 300, varyBy: ["user"] }),
  authController.getProfile
);

// Révocation de tous les tokens (sécurité)
router.post("/auth/revoke-all-tokens", auth, authController.revokeAllTokens);

// =====================================
// ROUTES DES FORMULAIRES
// =====================================

// Liste des formulaires avec cache et pagination
router.get(
  "/forms",
  auth,
  cache({
    duration: 300,
    varyBy: ["user", "url"],
    condition: (req) => !req.query.no_cache,
  }),
  async (req, res) => {
    // TODO: Implémenter la liste des formulaires
    res.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
      },
    });
  }
);

// Détails d'un formulaire
router.get(
  "/forms/:id",
  auth,
  validateRequest([
    require("express-validator")
      .param("id")
      .isInt({ min: 1 })
      .withMessage("ID formulaire invalide"),
  ]),
  cache({ duration: 600, varyBy: ["user", "url"] }),
  async (req, res) => {
    res.json({
      success: true,
      data: {
        id: req.params.id,
        title: "Formulaire test",
        fields: [],
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }
);

// Création de formulaire
router.post(
  "/forms",
  auth,
  validateRequest([
    require("express-validator")
      .body("title")
      .isLength({ min: 3, max: 100 })
      .withMessage("Titre invalide (3-100 caractères)"),
    require("express-validator")
      .body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Description trop longue (max 500 caractères)"),
    require("express-validator")
      .body("config")
      .isObject()
      .withMessage("Configuration invalide"),
    require("express-validator")
      .body("config.fields")
      .isArray({ min: 1, max: 50 })
      .withMessage("Au moins 1 champ requis (max 50)"),
  ]),
  invalidateCache(["forms*", "forms/:userId"]),
  async (req, res) => {
    res.status(201).json({
      success: true,
      data: {
        id: Math.floor(Math.random() * 1000),
        title: req.body.title,
        description: req.body.description || "",
        config: req.body.config,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }
);

// Mise à jour de formulaire
router.put(
  "/forms/:id",
  auth,
  validateRequest([
    require("express-validator")
      .param("id")
      .isInt({ min: 1 })
      .withMessage("ID formulaire invalide"),
    require("express-validator")
      .body("title")
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage("Titre invalide (3-100 caractères)"),
  ]),
  invalidateCache(["forms*", "forms/:formId", "submissions/:formId*"]),
  async (req, res) => {
    res.json({
      success: true,
      data: {
        id: req.params.id,
        title: req.body.title || "Formulaire modifié",
        description: req.body.description || "",
        config: req.body.config || {},
        updated_at: new Date(),
      },
    });
  }
);

// Suppression de formulaire
router.delete(
  "/forms/:id",
  auth,
  validateRequest([
    require("express-validator")
      .param("id")
      .isInt({ min: 1 })
      .withMessage("ID formulaire invalide"),
  ]),
  invalidateCache(["forms*", "forms/:formId", "submissions/:formId*"]),
  async (req, res) => {
    res.json({
      success: true,
      message: "Formulaire supprimé avec succès",
      data: { id: req.params.id },
    });
  }
);

// =====================================
// ROUTES DES SOUMISSIONS
// =====================================

// Liste des soumissions d'un formulaire
router.get(
  "/forms/:formId/submissions",
  auth,
  validateRequest([
    require("express-validator")
      .param("formId")
      .isInt({ min: 1 })
      .withMessage("ID formulaire invalide"),
  ]),
  cache({
    duration: 180,
    varyBy: ["user", "url"],
    condition: (req) => !req.query.real_time,
  }),
  async (req, res) => {
    res.json({
      success: true,
      data: {
        submissions: [
          {
            id: 1,
            form_id: req.params.formId,
            data: { test: "sample submission" },
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      },
    });
  }
);

// Détails d'une soumission
router.get(
  "/submissions/:id",
  auth,
  validateRequest([
    require("express-validator")
      .param("id")
      .isInt({ min: 1 })
      .withMessage("ID soumission invalide"),
  ]),
  cache({ duration: 300, varyBy: ["user", "url"] }),
  async (req, res) => {
    res.json({
      success: true,
      data: {
        id: req.params.id,
        form_id: req.params.formId,
        data: { sample: "data" },
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }
);

// Création de soumission (endpoint public)
router.post(
  "/forms/:formId/submissions",
  // Pas d'auth pour les soumissions publiques
  validateRequest([
    require("express-validator")
      .param("formId")
      .isInt({ min: 1 })
      .withMessage("ID formulaire invalide"),
    require("express-validator")
      .body("data")
      .isObject()
      .withMessage("Données de soumission requises"),
    require("express-validator")
      .body("honeypot")
      .optional()
      .isEmpty()
      .withMessage("Champ honeypot doit être vide"),
  ]),
  // Vérifier le honeypot anti-spam
  (req, res, next) => {
    if (req.body.honeypot && req.body.honeypot.trim() !== "") {
      logger.warn("Honeypot triggered - spam detected", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        formId: req.params.formId,
      });
      return res.status(400).json({
        success: false,
        error: "SPAM_DETECTED",
        message: "Soumission suspecte détectée",
      });
    }
    next();
  },
  invalidateCache(["submissions/:formId*", "forms/:formId/stats"]),
  async (req, res) => {
    res.status(201).json({
      success: true,
      data: {
        id: Math.floor(Math.random() * 1000),
        form_id: req.params.formId,
        data: req.body.data || {},
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }
);

// =====================================
// ROUTES D'ANALYTICS
// =====================================

// Statistiques d'un formulaire
router.get(
  "/forms/:formId/analytics",
  auth,
  validateRequest([
    require("express-validator")
      .param("formId")
      .isInt({ min: 1 })
      .withMessage("ID formulaire invalide"),
    require("express-validator")
      .query("period")
      .optional()
      .isIn(["day", "week", "month", "year"])
      .withMessage("Période invalide"),
  ]),
  cache({ duration: 900, varyBy: ["user", "url"] }), // 15 min cache
  async (req, res) => {
    try {
      // Implémentation des analytics sera ajoutée
      res.json({
        success: true,
        data: {
          message: "Analytics endpoint - à implémenter",
          formId: req.params.formId,
          period: req.query.period || "month",
        },
      });
    } catch (error) {
      logger.error("Analytics error:", error);
      res.status(500).json({
        success: false,
        error: "ANALYTICS_ERROR",
        message: "Erreur lors de la récupération des analytics",
      });
    }
  }
);

// =====================================
// GESTION DES ERREURS
// =====================================

// Middleware de gestion d'erreurs global
router.use((error, req, res, next) => {
  logger.error("API Error:", {
    error: error.message,
    stack: error.stack,
    endpoint: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  // Erreurs de validation
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "VALIDATION_ERROR",
      message: "Données invalides",
      details: error.details,
    });
  }

  // Erreurs de base de données
  if (error.code === "P2002") {
    // Prisma unique constraint
    return res.status(409).json({
      success: false,
      error: "DUPLICATE_ENTRY",
      message: "Cette ressource existe déjà",
    });
  }

  // Erreur générique
  res.status(error.status || 500).json({
    success: false,
    error: error.code || "INTERNAL_ERROR",
    message:
      process.env.NODE_ENV === "production"
        ? "Une erreur est survenue"
        : error.message,
    timestamp: new Date().toISOString(),
  });
});

// Route 404 pour les endpoints non trouvés
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "ENDPOINT_NOT_FOUND",
    message: `Endpoint ${req.method} ${req.originalUrl} non trouvé`,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

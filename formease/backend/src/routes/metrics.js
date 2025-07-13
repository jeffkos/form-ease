// Routes des métriques différenciées par plan pour FormEase
const express = require("express");
const router = express.Router();
const metricsController = require("../controllers/metricsController");
const { default: auth } = require("../middleware/auth");
const quota = require("../middleware/quota");
const {
  validateRequest,
  paginationValidation,
} = require("../middleware/validation");
const { apiLimiter, securityLogger } = require("../middleware/security");

// Middleware de sécurité pour toutes les routes
router.use(securityLogger);

/**
 * @swagger
 * /api/metrics/dashboard:
 *   get:
 *     summary: Métriques du dashboard (différenciées par plan)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métriques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan:
 *                   type: string
 *                   enum: [free, premium]
 *                 analyticsRange:
 *                   type: object
 *                   properties:
 *                     days:
 *                       type: number
 *                     startDate:
 *                       type: string
 *                     endDate:
 *                       type: string
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalForms:
 *                       type: number
 *                     activeForms:
 *                       type: number
 *                     totalSubmissions:
 *                       type: number
 *                     recentSubmissions:
 *                       type: number
 *                     conversionRate:
 *                       type: number
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  "/dashboard",
  auth,
  apiLimiter,
  metricsController.getDashboardMetrics
);

/**
 * @swagger
 * /api/metrics/form/{formId}/engagement:
 *   get:
 *     summary: Métriques d'engagement pour un formulaire spécifique
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du formulaire
 *     responses:
 *       200:
 *         description: Métriques d'engagement récupérées
 *       404:
 *         description: Formulaire non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  "/form/:formId/engagement",
  auth,
  apiLimiter,
  validateRequest([
    require("express-validator")
      .param("formId")
      .notEmpty()
      .withMessage("ID formulaire requis"),
  ]),
  metricsController.getFormEngagementMetrics
);

/**
 * @swagger
 * /api/metrics/comparison:
 *   get:
 *     summary: Métriques de comparaison (PREMIUM uniquement)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d]
 *           default: 30d
 *         description: Période de comparaison
 *     responses:
 *       200:
 *         description: Métriques de comparaison récupérées
 *       403:
 *         description: Fonctionnalité PREMIUM requise
 *       500:
 *         description: Erreur serveur
 */
router.get(
  "/comparison",
  auth,
  apiLimiter,
  quota.checkFeatureAccess("advanced_analytics"),
  metricsController.getComparisonMetrics
);

/**
 * @swagger
 * /api/metrics/export:
 *   get:
 *     summary: Export des métriques (CSV/PDF selon le plan)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *           default: csv
 *         description: Format d'export
 *     responses:
 *       200:
 *         description: Export généré avec succès
 *       403:
 *         description: Quota d'export dépassé ou format non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  "/export",
  auth,
  apiLimiter,
  quota.checkExportQuota,
  metricsController.exportMetrics
);

/**
 * @swagger
 * /api/metrics/quota-status:
 *   get:
 *     summary: Statut des quotas utilisateur
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut des quotas récupéré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan:
 *                   type: string
 *                 quotas:
 *                   type: object
 *                 usage:
 *                   type: object
 *                 percentages:
 *                   type: object
 *                 warnings:
 *                   type: object
 *       500:
 *         description: Erreur serveur
 */
router.get("/quota-status", auth, apiLimiter, quota.getQuotaStatus);

module.exports = router;

const express = require("express");
const router = express.Router();
const monitoringController = require("../controllers/monitoringController");
const alertController = require("../controllers/alertController");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Routes pour les métriques business (SUPERADMIN uniquement)
router.get(
  "/conversion",
  requireRole("SUPERADMIN"),
  monitoringController.getConversionMetrics
);
router.get(
  "/churn",
  requireRole("SUPERADMIN"),
  monitoringController.getChurnMetrics
);
router.get(
  "/ltv",
  requireRole("SUPERADMIN"),
  monitoringController.getLTVMetrics
);
router.get(
  "/revenue",
  requireRole("SUPERADMIN"),
  monitoringController.getRevenueMetrics
);
router.get(
  "/engagement",
  requireRole("SUPERADMIN"),
  monitoringController.getEngagementMetrics
);

// Route pour le rapport business complet
router.get(
  "/business-report",
  requireRole("SUPERADMIN"),
  monitoringController.getBusinessMetricsReport
);

// Routes pour les alertes et dashboard
router.get(
  "/alerts",
  requireRole("SUPERADMIN"),
  monitoringController.checkAlerts
);
router.get(
  "/dashboard",
  requireRole("SUPERADMIN"),
  monitoringController.getMonitoringDashboard
);

// Route pour les métriques système
router.get(
  "/system",
  requireRole("SUPERADMIN"),
  monitoringController.getSystemMetrics
);

// Routes pour les alertes automatiques
router.get(
  "/alerts/check",
  requireRole("SUPERADMIN"),
  alertController.checkAlerts
);
router.get(
  "/alerts/history",
  requireRole("SUPERADMIN"),
  alertController.getAlertHistory
);
router.get(
  "/alerts/stats",
  requireRole("SUPERADMIN"),
  alertController.getAlertStats
);
router.post(
  "/alerts/:alertId/resolve",
  requireRole("SUPERADMIN"),
  alertController.resolveAlert
);

// Routes pour la gestion des règles d'alerte
router.get(
  "/alerts/rules",
  requireRole("SUPERADMIN"),
  alertController.getAlertRules
);
router.put(
  "/alerts/rules/:ruleId",
  requireRole("SUPERADMIN"),
  alertController.updateAlertRule
);
router.patch(
  "/alerts/rules/:ruleId/toggle",
  requireRole("SUPERADMIN"),
  alertController.toggleAlertRule
);

// Routes pour les tests et configuration
router.post(
  "/alerts/test",
  requireRole("SUPERADMIN"),
  alertController.testAlert
);
router.get(
  "/alerts/channels",
  requireRole("SUPERADMIN"),
  alertController.getNotificationChannels
);

module.exports = router;

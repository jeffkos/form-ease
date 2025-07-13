/**
 * 📱 ROUTES SMS - FormEase (Version Simplifiée)
 * Gestion des endpoints SMS
 */

const express = require("express");
const router = express.Router();
const smsController = require("../controllers/smsController");
const { default: authMiddleware } = require("../middleware/auth");

/**
 * 📨 Envoyer un SMS unique
 * POST /api/sms/send
 */
router.post("/send", authMiddleware, (req, res) =>
  smsController.sendSMS(req, res)
);

/**
 * 📨 Envoyer des SMS en lot
 * POST /api/sms/bulk
 */
router.post("/bulk", authMiddleware, (req, res) =>
  smsController.sendBulkSMS(req, res)
);

/**
 * 📊 Obtenir les statistiques SMS
 * GET /api/sms/stats
 */
router.get("/stats", authMiddleware, (req, res) =>
  smsController.getSMSStats(req, res)
);

/**
 * 📋 Obtenir l'historique SMS
 * GET /api/sms/history
 */
router.get("/history", authMiddleware, (req, res) =>
  smsController.getSMSHistory(req, res)
);

/**
 * 🧪 Tester la configuration SMS
 * POST /api/sms/test
 */
router.post("/test", authMiddleware, (req, res) =>
  smsController.testSMSConfiguration(req, res)
);

/**
 * 🔧 Obtenir la configuration SMS
 * GET /api/sms/config
 */
router.get("/config", authMiddleware, (req, res) =>
  smsController.getSMSConfig(req, res)
);

/**
 * 📋 Obtenir les réponses de formulaire avec numéros de téléphone
 * GET /api/sms/form-responses/:formId
 */
router.get("/form-responses/:formId", authMiddleware, (req, res) =>
  smsController.getFormResponsesWithPhone(req, res)
);

module.exports = router;

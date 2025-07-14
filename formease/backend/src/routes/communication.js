const express = require("express");
const router = express.Router();
const communicationController = require("../controllers/communicationController");
const { authenticateToken } = require("../middleware/auth");

// Routes protégées par authentification
router.use(authenticateToken);

// Gestion des participants
router.get("/participants", communicationController.getParticipants);

// Gestion des campagnes
router.get("/campaigns", communicationController.getCampaigns);
router.post("/campaigns", communicationController.createCampaign);
router.get(
  "/campaigns/:campaignId/stats",
  communicationController.getCampaignStats
);
router.post(
  "/campaigns/:campaignId/retry",
  communicationController.retryCommunication
);

// Routes publiques pour le tracking (sans authentification)
router.get(
  "/tracking/email/open/:trackingId",
  communicationController.trackEmailOpen
);
router.get(
  "/tracking/email/click/:trackingId",
  communicationController.trackEmailClick
);

// Webhooks (sans authentification)
router.post("/webhooks/twilio", communicationController.handleTwilioWebhook);

module.exports = router;

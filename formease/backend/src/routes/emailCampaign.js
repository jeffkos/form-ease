const express = require("express");
const router = express.Router();
const emailCampaignController = require("../controllers/emailCampaignController");
const { default: auth } = require("../middleware/auth");
const { checkEmailQuota } = require("../middleware/quota");

/**
 * @swagger
 * tags:
 *   name: Email Campaigns
 *   description: Gestion des campagnes d'emailing
 */

/**
 * @swagger
 * /api/email-campaigns:
 *   get:
 *     summary: Liste des campagnes d'emailing
 *     tags: [Email Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des campagnes
 *   post:
 *     summary: Créer une campagne d'emailing
 *     tags: [Email Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               recipient_type:
 *                 type: string
 *                 enum: [all, filtered, selected]
 *               filters:
 *                 type: object
 *               selected_contacts:
 *                 type: array
 *                 items:
 *                   type: integer
 *               schedule_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Campagne créée
 *       400:
 *         description: Erreur de validation
 *       403:
 *         description: Quota dépassé
 */

/**
 * @swagger
 * /api/email-campaigns/{id}:
 *   get:
 *     summary: Détails d'une campagne
 *     tags: [Email Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails de la campagne
 *       404:
 *         description: Campagne non trouvée
 */

/**
 * @swagger
 * /api/email-campaigns/bulk-send:
 *   post:
 *     summary: Envoi groupé d'emails
 *     tags: [Email Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               contacts:
 *                 type: array
 *                 items:
 *                   type: integer
 *               schedule_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Emails envoyés
 *       400:
 *         description: Erreur de validation
 *       403:
 *         description: Quota dépassé
 */

/**
 * @swagger
 * /api/email-campaigns/stats:
 *   get:
 *     summary: Statistiques d'emailing
 *     tags: [Email Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques d'emailing
 */

// Routes protégées par authentification
router.get("/", auth, emailCampaignController.getCampaigns);
router.post("/", auth, checkEmailQuota, emailCampaignController.createCampaign);
router.get("/stats", auth, emailCampaignController.getEmailStats);
router.post(
  "/bulk-send",
  auth,
  checkEmailQuota,
  emailCampaignController.sendBulkEmail
);
router.get("/:id", auth, emailCampaignController.getCampaignDetails);

module.exports = router;

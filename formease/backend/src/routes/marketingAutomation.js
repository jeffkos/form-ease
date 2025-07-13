const express = require("express");
const router = express.Router();
const marketingAutomationController = require("../controllers/marketingAutomationController");
const { default: auth } = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

/**
 * @swagger
 * tags:
 *   name: Marketing Automation
 *   description: Gestion de l'automation marketing
 */

/**
 * @swagger
 * /api/marketing-automation:
 *   get:
 *     summary: Liste des automations marketing
 *     tags: [Marketing Automation]
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
 *         description: Liste des automations
 *   post:
 *     summary: Créer une automation marketing
 *     tags: [Marketing Automation]
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
 *               description:
 *                 type: string
 *               trigger_type:
 *                 type: string
 *                 enum: [form_submission, contact_created, email_opened, email_clicked, time_based, manual]
 *               trigger_config:
 *                 type: object
 *               actions:
 *                 type: array
 *                 items:
 *                   type: object
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Automation créée
 *       400:
 *         description: Erreur de validation
 */

/**
 * @swagger
 * /api/marketing-automation/{id}:
 *   get:
 *     summary: Détails d'une automation
 *     tags: [Marketing Automation]
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
 *         description: Détails de l'automation
 *       404:
 *         description: Automation non trouvée
 *   put:
 *     summary: Mettre à jour une automation
 *     tags: [Marketing Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Automation mise à jour
 *       404:
 *         description: Automation non trouvée
 *   delete:
 *     summary: Supprimer une automation
 *     tags: [Marketing Automation]
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
 *         description: Automation supprimée
 *       404:
 *         description: Automation non trouvée
 */

/**
 * @swagger
 * /api/marketing-automation/{id}/toggle:
 *   post:
 *     summary: Activer/désactiver une automation
 *     tags: [Marketing Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Statut changé
 *       404:
 *         description: Automation non trouvée
 */

/**
 * @swagger
 * /api/marketing-automation/{id}/trigger:
 *   post:
 *     summary: Déclencher manuellement une automation
 *     tags: [Marketing Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contact_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               test_mode:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Automation déclenchée
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Automation non trouvée
 */

/**
 * @swagger
 * /api/marketing-automation/stats:
 *   get:
 *     summary: Statistiques d'automation marketing
 *     tags: [Marketing Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         description: Période des statistiques
 *     responses:
 *       200:
 *         description: Statistiques d'automation
 */

// Routes protégées par authentification
router.get("/", auth, marketingAutomationController.getAutomations);
router.post("/", auth, marketingAutomationController.createAutomation);
router.get("/stats", auth, marketingAutomationController.getAutomationStats);
router.get("/:id", auth, marketingAutomationController.getAutomationDetails);
router.put("/:id", auth, marketingAutomationController.updateAutomation);
router.delete("/:id", auth, marketingAutomationController.deleteAutomation);
router.post(
  "/:id/toggle",
  auth,
  marketingAutomationController.toggleAutomation
);
router.post(
  "/:id/trigger",
  auth,
  marketingAutomationController.triggerAutomation
);

module.exports = router;

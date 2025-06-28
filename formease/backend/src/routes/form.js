// Routes des formulaires pour FormEase
const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/forms:
 *   get:
 *     summary: Lister les formulaires de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des formulaires
 *   post:
 *     summary: Créer un formulaire
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               config:
 *                 type: object
 *     responses:
 *       201:
 *         description: Formulaire créé
 */

// Créer un formulaire (authentifié)
router.post('/', auth, formController.createForm);
// Lister les formulaires de l'utilisateur (authentifié)
router.get('/', auth, formController.listForms);
// Soumettre une inscription (public)
router.post('/submit', formController.submit);
// Lister les inscrits d'un formulaire (authentifié)
router.get('/:formId/submissions', auth, formController.listSubmissions);

module.exports = router;

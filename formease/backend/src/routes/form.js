// Routes des formulaires pour FormEase
const express = require('express');
const { param } = require('express-validator');
const router = express.Router();
const formController = require('../controllers/formController');
const auth = require('../middleware/auth');
const { 
  validateRequest, 
  createFormValidation, 
  updateFormValidation,
  submitFormValidation,
  paginationValidation
} = require('../middleware/validation');
const { 
  apiLimiter, 
  securityLogger 
} = require('../middleware/security');

// Middleware de sécurité pour toutes les routes
router.use(securityLogger);

/**
 * @swagger
 * /api/forms:
 *   get:
 *     summary: Lister les formulaires de l'utilisateur
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
 *               fields:
 *                 type: array
 *               settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Formulaire créé
 */

// Créer un formulaire (authentifié)
router.post('/', 
  auth, 
  validateRequest(createFormValidation), 
  formController.createForm
);

// Lister les formulaires de l'utilisateur (authentifié)
router.get('/', 
  auth, 
  validateRequest(paginationValidation), 
  formController.listForms
);

// Récupérer un formulaire spécifique (authentifié)
router.get('/:id', 
  auth, 
  validateRequest([
    param('id').isInt({ min: 1 }).withMessage('ID de formulaire invalide')
  ]), 
  formController.getForm
);

// Mettre à jour un formulaire (authentifié)
router.put('/:id', 
  auth, 
  validateRequest(updateFormValidation), 
  formController.updateForm
);

// Supprimer un formulaire (authentifié)
router.delete('/:id', 
  auth, 
  validateRequest([
    param('id').isInt({ min: 1 }).withMessage('ID de formulaire invalide')
  ]), 
  formController.deleteForm
);

// Soumettre une réponse à un formulaire (public, avec rate limiting)
router.post('/:formId/submit', 
  apiLimiter,
  validateRequest(submitFormValidation), 
  formController.submit
);

// Lister les soumissions d'un formulaire (authentifié)
router.get('/:formId/submissions', 
  auth, 
  validateRequest([
    param('formId').isInt({ min: 1 }).withMessage('ID de formulaire invalide'),
    ...paginationValidation
  ]), 
  formController.listSubmissions
);

module.exports = router;

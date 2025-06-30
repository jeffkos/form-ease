// Routes des inscriptions (submissions) pour FormEase
const express = require('express');
const { param } = require('express-validator');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const auth = require('../middleware/auth');
const captcha = require('../middleware/captcha');
const quota = require('../middleware/quota');
const { 
  validateRequest, 
  submitFormValidation,
  paginationValidation
} = require('../middleware/validation');
const { 
  apiLimiter, 
  strictLimiter,
  securityLogger 
} = require('../middleware/security');

// Middleware de sécurité pour toutes les routes
router.use(securityLogger);

/**
 * @swagger
 * /api/submissions/form/{formId}:
 *   post:
 *     summary: Créer une inscription
 *     parameters:
 *       - in: path
 *         name: formId
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
 *               email:
 *                 type: string
 *               nom:
 *                 type: string
 *               langue:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inscription créée
 */
// Création d'une inscription (publique, avec captcha et quota)
router.post('/form/:formId', 
  strictLimiter, // Rate limiting strict pour les soumissions
  captcha, 
  quota.checkSubmissionQuota, 
  validateRequest([
    param('formId').isInt({ min: 1 }).withMessage('ID de formulaire invalide'),
    // Validation générique, la validation spécifique sera faite côté contrôleur
  ]),
  submissionController.createSubmission
);

/**
 * @swagger
 * /api/submissions/{submissionId}/validate:
 *   post:
 *     summary: Valider une inscription (déclenche l'envoi d'email)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inscription validée et notification envoyée
 */
// Valider une inscription
router.post('/:submissionId/validate', 
  auth, 
  validateRequest([
    param('submissionId').isInt({ min: 1 }).withMessage('ID de soumission invalide')
  ]),
  submissionController.validateSubmission
);

// Mettre à la corbeille
router.post('/:submissionId/trash', 
  auth, 
  validateRequest([
    param('submissionId').isInt({ min: 1 }).withMessage('ID de soumission invalide')
  ]),
  submissionController.trashSubmission
);

// Supprimer définitivement
router.delete('/:submissionId', 
  auth, 
  validateRequest([
    param('submissionId').isInt({ min: 1 }).withMessage('ID de soumission invalide')
  ]),
  submissionController.deleteSubmission
);

// Export CSV (quota export)
router.get('/form/:formId/export/csv', 
  auth, 
  quota.checkExportQuota, 
  validateRequest([
    param('formId').isInt({ min: 1 }).withMessage('ID de formulaire invalide')
  ]),
  submissionController.exportSubmissionsCSV
);

// Export PDF (quota export)
router.get('/form/:formId/export/pdf', 
  auth, 
  quota.checkExportQuota, 
  validateRequest([
    param('formId').isInt({ min: 1 }).withMessage('ID de formulaire invalide')
  ]),
  submissionController.exportSubmissionsPDF
);

module.exports = router;

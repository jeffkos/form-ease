// Routes des inscriptions (submissions) pour FormEase
const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const auth = require('../middleware/auth');
const captcha = require('../middleware/captcha');
const quota = require('../middleware/quota');

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
router.post('/form/:formId', captcha, quota.checkSubmissionQuota, submissionController.createSubmission);

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
router.post('/:submissionId/validate', auth, submissionController.validateSubmission);
// Mettre à la corbeille
router.post('/:submissionId/trash', auth, submissionController.trashSubmission);
// Supprimer définitivement
router.delete('/:submissionId', auth, submissionController.deleteSubmission);
// Export CSV (quota export)
router.get('/form/:formId/export/csv', auth, quota.checkExportQuota, submissionController.exportSubmissionsCSV);
// Export PDF (quota export)
router.get('/form/:formId/export/pdf', auth, quota.checkExportQuota, submissionController.exportSubmissionsPDF);

module.exports = router;

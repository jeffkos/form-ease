// Routes CRUD des templates d'email (admin/superadmin)
const express = require('express');
const router = express.Router();
const controller = require('../controllers/emailTemplateController');
const { default: auth } = require('../middleware/auth');

router.use(auth);

/**
 * @swagger
 * /api/email-templates:
 *   get:
 *     summary: Lister les templates d'email
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des templates
 *   post:
 *     summary: Créer un template d'email
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
 *               type:
 *                 type: string
 *               subject:
 *                 type: string
 *               html:
 *                 type: string
 *               language:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Template créé
 */
router.post('/', controller.createTemplate);
router.get('/', controller.listTemplates);
router.get('/:id', controller.getTemplate);
router.put('/:id', controller.updateTemplate);
router.delete('/:id', controller.deleteTemplate);
router.post('/:id/preview', controller.previewTemplate);

module.exports = router;

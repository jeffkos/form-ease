const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { default: auth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

/**
 * @swagger
 * tags:
 *   name: Contacts
 *   description: Gestion des contacts
 */

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: Liste tous les contacts
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des contacts
 *   post:
 *     summary: Crée un contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Contact créé
 *       400:
 *         description: Erreur de validation
 */

/**
 * @swagger
 * /api/contacts/{id}:
 *   put:
 *     summary: Met à jour un contact
 *     tags: [Contacts]
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
 *         description: Contact mis à jour
 *       400:
 *         description: Erreur de validation
 *   delete:
 *     summary: Supprime un contact (ADMIN seulement)
 *     tags: [Contacts]
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
 *         description: Contact supprimé
 *       403:
 *         description: Accès refusé
 */

// Toutes les routes sont protégées par auth
router.get('/', auth, contactController.getContacts);
router.post('/', auth, contactController.createContact);
router.put('/:id', auth, contactController.updateContact);
// Suppression réservée aux ADMIN
router.delete('/:id', auth, requireRole('ADMIN'), contactController.deleteContact);

module.exports = router;

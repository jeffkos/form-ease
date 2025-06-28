// Route d'authentification pour FormEase
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const captcha = require('../middleware/captcha');
const { validate } = require('../middleware/validation');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé
 */
router.post('/register', validate('register'), authController.register);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 */
router.post('/login', validate('login'), authController.login);

// Route pour récupérer le profil utilisateur
router.get('/profile', auth, authController.getProfile);
// Route pour mettre à jour le profil utilisateur
router.put('/profile', auth, validate('updateProfile'), authController.updateProfile);

module.exports = router;

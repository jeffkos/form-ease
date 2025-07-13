// Route d'authentification pour FormEase
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { default: auth } = require("../middleware/auth");
const {
  validateRequest,
  registerValidation,
  loginValidation,
  updateProfileValidation,
} = require("../middleware/validation");
const {
  authLimiter,
  strictLimiter,
  securityLogger,
} = require("../middleware/security");

// Middleware de sécurité pour toutes les routes d'auth
router.use(securityLogger);

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
router.post(
  "/register",
  strictLimiter,
  validateRequest(registerValidation),
  authController.register
);

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
router.post(
  "/login",
  authLimiter,
  validateRequest(loginValidation),
  authController.login
);

// Route pour récupérer le profil utilisateur
router.get("/profile", auth, authController.getProfile);

// Route pour récupérer le profil utilisateur (alias pour compatibilité frontend)
router.get("/me", auth, authController.getProfile);

// Route pour mettre à jour le profil utilisateur
router.put(
  "/profile",
  auth,
  validateRequest(updateProfileValidation),
  authController.updateProfile
);

module.exports = router;

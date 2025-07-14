// Routes d'administration pour FormEase
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { default: auth } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administration système (SUPERADMIN uniquement)
 */

// Middleware pour vérifier l'authentification et le rôle SUPERADMIN
router.use(auth);
router.use(adminController.requireSuperAdmin);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Statistiques du dashboard administrateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques globales du système
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         free:
 *                           type: number
 *                         premium:
 *                           type: number
 *                         newThisMonth:
 *                           type: number
 *                         conversionRate:
 *                           type: number
 *                     forms:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         active:
 *                           type: number
 *                         submissions:
 *                           type: number
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         monthly:
 *                           type: number
 *                         activeSubscriptions:
 *                           type: number
 *       403:
 *         description: Accès refusé
 */
router.get("/dashboard", adminController.getDashboardStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Liste des utilisateurs avec pagination et filtres
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche par nom ou email
 *       - in: query
 *         name: plan
 *         schema:
 *           type: string
 *           enum: [free, premium]
 *         description: Filtrer par plan
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, PREMIUM, SUPERADMIN]
 *         description: Filtrer par rôle
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                           first_name:
 *                             type: string
 *                           last_name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                           plan:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         total:
 *                           type: number
 *                         pages:
 *                           type: number
 */
router.get("/users", adminController.getUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Mettre à jour un utilisateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, PREMIUM, SUPERADMIN]
 *               plan:
 *                 type: string
 *                 enum: [free, premium]
 *               plan_expiration:
 *                 type: string
 *                 format: date-time
 *               is_suspended:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put("/users/:id", adminController.updateUser);

/**
 * @swagger
 * /api/admin/users/{id}/suspension:
 *   post:
 *     summary: Suspendre/Réactiver un utilisateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Raison de la suspension
 *     responses:
 *       200:
 *         description: Statut de suspension modifié
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post("/users/:id/suspension", adminController.toggleUserSuspension);

/**
 * @swagger
 * /api/admin/reports/financial:
 *   get:
 *     summary: Rapports financiers détaillés
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, month]
 *           default: month
 *         description: Période de groupement
 *     responses:
 *       200:
 *         description: Rapports financiers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: number
 *                         totalTransactions:
 *                           type: number
 *                         averageOrderValue:
 *                           type: number
 *                     revenueByPeriod:
 *                       type: object
 *                     recentTransactions:
 *                       type: array
 */
router.get("/reports/financial", adminController.getFinancialReports);

/**
 * @swagger
 * /api/admin/metrics/business:
 *   get:
 *     summary: Métriques business avancées
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métriques business
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     acquisition:
 *                       type: object
 *                       properties:
 *                         newUsersThisMonth:
 *                           type: number
 *                         growthRate:
 *                           type: number
 *                     conversion:
 *                       type: object
 *                       properties:
 *                         conversionRate:
 *                           type: number
 *                         premiumConversionRate:
 *                           type: number
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         monthlyRecurringRevenue:
 *                           type: number
 *                         estimatedCLV:
 *                           type: number
 */
router.get("/metrics/business", adminController.getBusinessMetrics);

/**
 * @swagger
 * /api/admin/moderation:
 *   get:
 *     summary: File de modération - formulaires et utilisateurs suspects
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Éléments à modérer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     suspiciousForms:
 *                       type: array
 *                       items:
 *                         type: object
 *                     suspiciousUsers:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get("/moderation", adminController.getModerationQueue);

/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     summary: Logs d'audit système
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filtrer par action
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filtrer par utilisateur
 *     responses:
 *       200:
 *         description: Logs d'audit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                           action:
 *                             type: string
 *                           details:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                             properties:
 *                               first_name:
 *                                 type: string
 *                               last_name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                     pagination:
 *                       type: object
 */
router.get("/audit-logs", adminController.getAuditLogs);

module.exports = router;

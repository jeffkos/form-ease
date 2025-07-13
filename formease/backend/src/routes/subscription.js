// Routes pour la gestion des abonnements FormEase
const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const { default: auth } = require("../middleware/auth");
const quotaMiddleware = require("../middleware/quota");

/**
 * @swagger
 * components:
 *   schemas:
 *     SubscriptionInfo:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             email:
 *               type: string
 *             memberSince:
 *               type: string
 *               format: date-time
 *         subscription:
 *           type: object
 *           properties:
 *             plan:
 *               type: string
 *               enum: [free, premium]
 *             planName:
 *               type: string
 *             price:
 *               type: number
 *             currency:
 *               type: string
 *             interval:
 *               type: string
 *             expiration:
 *               type: string
 *               format: date-time
 *             isActive:
 *               type: boolean
 *             features:
 *               type: array
 *               items:
 *                 type: string
 *             limits:
 *               type: object
 *             nextBillingDate:
 *               type: string
 *               format: date-time
 *     PaymentHistory:
 *       type: object
 *       properties:
 *         payments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               status:
 *                 type: string
 *               provider:
 *                 type: string
 *               transaction_ref:
 *                 type: string
 *               created_at:
 *                 type: string
 *                 format: date-time
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             pages:
 *               type: integer
 *     UsageStats:
 *       type: object
 *       properties:
 *         plan:
 *           type: string
 *         limits:
 *           type: object
 *         usage:
 *           type: object
 *           properties:
 *             forms:
 *               type: object
 *               properties:
 *                 used:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 percentage:
 *                   type: integer
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/subscription/info:
 *   get:
 *     summary: Obtenir les informations d'abonnement de l'utilisateur
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations d'abonnement récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionInfo'
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get("/info", auth, subscriptionController.getSubscriptionInfo);

/**
 * @swagger
 * /api/subscription/payments:
 *   get:
 *     summary: Obtenir l'historique des paiements
 *     tags: [Subscription]
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
 *           default: 10
 *           maximum: 50
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Historique des paiements récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentHistory'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get("/payments", auth, subscriptionController.getPaymentHistory);

/**
 * @swagger
 * /api/subscription/create:
 *   post:
 *     summary: Créer un abonnement premium
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planType:
 *                 type: string
 *                 enum: [premium]
 *                 default: premium
 *               successUrl:
 *                 type: string
 *                 description: URL de redirection après succès
 *               cancelUrl:
 *                 type: string
 *                 description: URL de redirection après annulation
 *     responses:
 *       200:
 *         description: Session de paiement créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *                 url:
 *                   type: string
 *                 planType:
 *                   type: string
 *                 planName:
 *                   type: string
 *                 price:
 *                   type: number
 *       400:
 *         description: Requête invalide ou abonnement déjà actif
 *       401:
 *         description: Non autorisé
 *       503:
 *         description: Service de paiement indisponible
 *       500:
 *         description: Erreur serveur
 */
router.post("/create", auth, subscriptionController.createSubscription);

/**
 * @swagger
 * /api/subscription/cancel:
 *   post:
 *     summary: Annuler un abonnement
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Abonnement annulé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 cancelAt:
 *                   type: string
 *                   format: date-time
 *                 remainingDays:
 *                   type: integer
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Aucun abonnement trouvé
 *       503:
 *         description: Service de paiement indisponible
 *       500:
 *         description: Erreur serveur
 */
router.post("/cancel", auth, subscriptionController.cancelSubscription);

/**
 * @swagger
 * /api/subscription/reactivate:
 *   post:
 *     summary: Réactiver un abonnement annulé
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Abonnement réactivé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 nextBillingDate:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Abonnement non programmé pour annulation
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Aucun abonnement trouvé
 *       503:
 *         description: Service de paiement indisponible
 *       500:
 *         description: Erreur serveur
 */
router.post("/reactivate", auth, subscriptionController.reactivateSubscription);

/**
 * @swagger
 * /api/subscription/payment-methods:
 *   get:
 *     summary: Obtenir les méthodes de paiement de l'utilisateur
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Méthodes de paiement récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentMethods:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       card:
 *                         type: object
 *                         properties:
 *                           brand:
 *                             type: string
 *                           last4:
 *                             type: string
 *                           expMonth:
 *                             type: integer
 *                           expYear:
 *                             type: integer
 *                           country:
 *                             type: string
 *                       created:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Non autorisé
 *       503:
 *         description: Service de paiement indisponible
 *       500:
 *         description: Erreur serveur
 */
router.get("/payment-methods", auth, subscriptionController.getPaymentMethods);

/**
 * @swagger
 * /api/subscription/payment-methods/{paymentMethodId}:
 *   delete:
 *     summary: Supprimer une méthode de paiement
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethodId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la méthode de paiement Stripe
 *     responses:
 *       200:
 *         description: Méthode de paiement supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Méthode de paiement non autorisée
 *       404:
 *         description: Utilisateur non trouvé
 *       503:
 *         description: Service de paiement indisponible
 *       500:
 *         description: Erreur serveur
 */
router.delete(
  "/payment-methods/:paymentMethodId",
  auth,
  subscriptionController.deletePaymentMethod
);

/**
 * @swagger
 * /api/subscription/setup-payment:
 *   post:
 *     summary: Créer une session pour ajouter une méthode de paiement
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session de configuration créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *                 url:
 *                   type: string
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur non trouvé
 *       503:
 *         description: Service de paiement indisponible
 *       500:
 *         description: Erreur serveur
 */
router.post("/setup-payment", auth, subscriptionController.createSetupSession);

/**
 * @swagger
 * /api/subscription/usage:
 *   get:
 *     summary: Obtenir les statistiques d'utilisation
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques d'utilisation récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsageStats'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get("/usage", auth, subscriptionController.getUsageStats);

/**
 * @swagger
 * /api/subscription/plans:
 *   get:
 *     summary: Obtenir les plans disponibles
 *     tags: [Subscription]
 *     responses:
 *       200:
 *         description: Plans disponibles récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       interval:
 *                         type: string
 *                       features:
 *                         type: array
 *                         items:
 *                           type: string
 *                       limits:
 *                         type: object
 *                       recommended:
 *                         type: boolean
 *       500:
 *         description: Erreur serveur
 */
router.get("/plans", subscriptionController.getAvailablePlans);

module.exports = router;

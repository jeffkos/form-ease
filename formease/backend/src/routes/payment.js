// Routes de paiement pour FormEase avec Stripe
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const quotaMiddleware = require('../middleware/quota');
const { default: auth } = require('../middleware/auth');

// === ABONNEMENTS PREMIUM ===
// Créer une session de paiement Stripe pour abonnement (authentifié)
router.post('/create-checkout-session', auth, paymentController.createCheckoutSession);

// Webhook Stripe (non authentifié - vérifié par signature)
router.post('/stripe-webhook', express.raw({type: 'application/json'}), paymentController.stripeWebhook);

// Valider un paiement manuellement (admin seulement)
router.post('/validate', auth, paymentController.validatePayment);

// Lister les paiements de l'utilisateur
router.get('/history', auth, paymentController.listPayments);

// === QUOTAS ET STATUS ===
// Obtenir le statut des quotas de l'utilisateur
router.get('/quota-status', auth, quotaMiddleware.getQuotaStatus);

// === FORMULAIRES PAYANTS ===
// Créer un paiement pour un formulaire payant (public)
router.post('/form-payment/:formId', paymentController.handleFormPayment);

// === STATISTIQUES REVENUS ===
// Obtenir les statistiques de revenus (user/admin)
router.get('/revenue-stats', auth, paymentController.getRevenueStats);

module.exports = router;

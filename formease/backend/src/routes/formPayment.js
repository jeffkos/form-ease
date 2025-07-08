// Routes pour la gestion des formulaires payants
const express = require('express');
const router = express.Router();
const formPaymentController = require('../controllers/formPaymentController');
const auth = require('../middleware/auth');

// Configurer le paiement pour un formulaire (propriétaire uniquement)
router.post('/:formId/configure', auth, formPaymentController.configureFormPayment);

// Obtenir la configuration de paiement d'un formulaire (public/propriétaire)
router.get('/:formId/config', formPaymentController.getFormPaymentConfig);

// Lister les transactions d'un formulaire (propriétaire uniquement)
router.get('/:formId/transactions', auth, formPaymentController.getFormTransactions);

// Statistiques des revenus par formulaire (propriétaire uniquement)
router.get('/revenue-stats', auth, formPaymentController.getFormRevenueStats);

module.exports = router;

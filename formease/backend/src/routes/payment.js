// Routes de paiement pour FormEase
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// Initier un paiement (authentifié)
router.post('/initiate', auth, paymentController.initiatePayment);
// Valider un paiement (callback ou admin)
router.post('/validate', auth, paymentController.validatePayment);

module.exports = router;

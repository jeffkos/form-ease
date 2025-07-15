/**
 * 📱 ROUTES SMS - FormEase
 * Routes API pour la gestion des SMS
 */

const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');
const authMiddleware = require('../middleware/auth');
const rateLimitMiddleware = require('../middleware/rateLimiting');

/**
 * 📨 Envoyer un SMS unique
 * POST /api/sms/send
 */
router.post('/send',
    authMiddleware.authenticateToken,
    rateLimitMiddleware.smsLimit,
    smsController.validateSendSMS(),
    smsController.sendSMS
);

/**
 * 📨 Envoyer des SMS en lot
 * POST /api/sms/bulk
 */
router.post('/bulk',
    authMiddleware.authenticateToken,
    rateLimitMiddleware.smsBulkLimit,
    smsController.validateBulkSMS(),
    smsController.sendBulkSMS
);

/**
 * 📊 Obtenir les statistiques SMS
 * GET /api/sms/stats
 */
router.get('/stats',
    authMiddleware.authenticateToken,
    smsController.getSMSStats
);

/**
 * 📋 Obtenir l'historique SMS
 * GET /api/sms/history
 */
router.get('/history',
    authMiddleware.authenticateToken,
    smsController.getSMSHistory
);

/**
 * 🔍 Obtenir un SMS spécifique
 * GET /api/sms/:smsId
 */
router.get('/:smsId',
    authMiddleware.authenticateToken,
    smsController.getSMSById
);

/**
 * 🧪 Tester la configuration SMS
 * POST /api/sms/test
 */
router.post('/test',
    authMiddleware.authenticateToken,
    smsController.testSMSConfiguration
);

/**
 * 🔧 Obtenir la configuration SMS
 * GET /api/sms/config
 */
router.get('/config',
    authMiddleware.authenticateToken,
    smsController.getSMSConfig
);

module.exports = router;

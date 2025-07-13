// Routes RGPD pour l'utilisateur connecté
const express = require('express');
const router = express.Router();
const controller = require('../controllers/rgpdController');
const { default: auth } = require('../middleware/auth');

router.use(auth);

// Export des données utilisateur
router.get('/export', controller.exportUserData);
// Suppression complète du compte
router.delete('/delete', controller.deleteUserAccount);

module.exports = router;

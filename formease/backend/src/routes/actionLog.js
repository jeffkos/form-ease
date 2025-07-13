// Routes pour consulter les logs d'action admin (audit trail)
const express = require('express');
const router = express.Router();
const controller = require('../controllers/actionLogController');
const { default: auth } = require('../middleware/auth');

router.use(auth);

// Lister les logs d'action (admin/superadmin)
router.get('/', controller.listActionLogs);

module.exports = router;

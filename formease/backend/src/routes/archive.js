// Routes d'archivage avancé pour FormEase
const express = require('express');
const router = express.Router();
const controller = require('../controllers/archiveController');
const auth = require('../middleware/auth');

router.use(auth);

// Lister les archives
router.get('/', controller.listArchives);
// Archiver une entité
router.post('/:type/:id/archive', controller.archiveEntity);
// Restaurer une archive
router.post('/:type/:id/restore', controller.restoreEntity);
// Supprimer définitivement une archive
router.delete('/:type/:id', controller.deleteEntity);
// Lister les logs d'archivage
router.get('/logs/all', controller.listArchiveLogs);

module.exports = router;

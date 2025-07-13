// Routes des statistiques pour FormEase
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { default: auth } = require('../middleware/auth');

// Statistiques globales (admin)
router.get('/overview', auth, statsController.getOverviewStats);
// Statistiques utilisateur connecté
router.get('/user', auth, statsController.getUserStats);
// Statistiques d'inscriptions par période
router.get('/submissions', auth, statsController.getSubmissionsByPeriod);
// Stats détaillées par formulaire
router.get('/forms', auth, statsController.getFormStats);
// Evolution des soumissions (par jour)
router.get('/evolution', auth, statsController.getSubmissionsEvolution);
// Stats par plan utilisateur
router.get('/plans', auth, statsController.getPlanStats);
// Stats par champ (distribution des réponses)
router.get('/field', auth, statsController.getFieldStats);
// Stats sur période personnalisée
router.get('/period', auth, statsController.getStatsByPeriod);
// Top utilisateurs
router.get('/top-users', auth, statsController.getTopUsers);

module.exports = router;

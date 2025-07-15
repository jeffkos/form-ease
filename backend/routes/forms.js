/**
 * Routes API pour la gestion des formulaires (backoffice)
 */

const express = require('express');
const router = express.Router();

// GET /api/forms - Liste des formulaires
router.get('/', async (req, res) => {
    try {
        // TODO: Implémenter la récupération des formulaires
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/forms/:id - Détails d'un formulaire
router.get('/:id', async (req, res) => {
    try {
        const formId = req.params.id;
        // TODO: Implémenter la récupération d'un formulaire
        res.json({
            success: true,
            data: { id: formId }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

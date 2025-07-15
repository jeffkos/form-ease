/**
 * Routes API pour la gestion des utilisateurs
 */

const express = require('express');
const router = express.Router();

// GET /api/users/profile
router.get('/profile', async (req, res) => {
    try {
        // TODO: Implémenter la récupération du profil
        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

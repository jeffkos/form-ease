/**
 * Routes API pour les analytics
 */

const express = require('express');
const router = express.Router();

// GET /api/analytics - Analytics générales
router.get('/', async (req, res) => {
    try {
        // TODO: Implémenter les analytics
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

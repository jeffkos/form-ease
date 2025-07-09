// Routes du tableau de bord FormEase
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Route pour obtenir les statistiques du dashboard
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Compter les formulaires de l'utilisateur
    const totalForms = await prisma.form.count({
      where: { userId: userId }
    });

    // Compter les réponses totales
    const totalResponses = await prisma.submission.count({
      where: {
        form: {
          userId: userId
        }
      }
    });

    // Compter les formulaires actifs
    const activeForms = await prisma.form.count({
      where: { 
        userId: userId,
        status: 'active'
      }
    });

    // Calculer le taux de conversion (simplifiė)
    const conversionRate = totalForms > 0 ? Math.round((totalResponses / totalForms) * 100) : 0;

    res.json({
      totalForms,
      totalResponses,
      activeForms,
      conversionRate
    });

  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du chargement des statistiques',
      totalForms: 0,
      totalResponses: 0,
      activeForms: 0,
      conversionRate: 0
    });
  }
});

module.exports = router;

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const { default: auth } = require('../middleware/auth');
const prisma = new PrismaClient();

// Pixel de suivi pour l'ouverture des emails
router.get('/:emailId/track', async (req, res) => {
  try {
    const { emailId } = req.params;
    
    await prisma.emailTrack.update({
      where: { id: emailId },
      data: {
        openedAt: new Date(),
        status: 'opened'
      }
    });

    // Renvoyer un pixel transparent
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.setHeader('Content-Type', 'image/gif');
    res.send(pixel);
  } catch (error) {
    console.error('Erreur de tracking:', error);
    res.status(500).end();
  }
});

// Statut d'un email spécifique
router.get('/:emailId/status', auth, async (req, res) => {
  try {
    const { emailId } = req.params;
    
    const emailStatus = await prisma.emailTrack.findUnique({
      where: { id: emailId }
    });

    if (!emailStatus) {
      return res.status(404).json({ error: 'Email non trouvé' });
    }

    res.json(emailStatus);
  } catch (error) {
    console.error('Erreur de récupération du statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Liste des statuts d'emails avec filtres
router.get('/status', auth, async (req, res) => {
  try {
    const { startDate, endDate, status, recipientEmail } = req.query;
    const userId = req.user.id;

    const where = {
      userId,
      ...(startDate && endDate ? {
        sentAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      } : {}),
      ...(status ? { status } : {}),
      ...(recipientEmail ? { recipientEmail } : {})
    };

    const emailStatuses = await prisma.emailTrack.findMany({
      where,
      orderBy: { sentAt: 'desc' }
    });

    res.json(emailStatuses);
  } catch (error) {
    console.error('Erreur de récupération des statuts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques des emails
router.post('/statistics', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.user.id;

    const stats = await prisma.emailTrack.groupBy({
      by: ['status'],
      where: {
        userId,
        sentAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      _count: true
    });

    const total = stats.reduce((acc, curr) => acc + curr._count, 0);
    const opened = stats.find(s => s.status === 'opened')?._count || 0;
    const clicked = stats.find(s => s.status === 'clicked')?._count || 0;
    const bounced = stats.find(s => s.status === 'bounced')?._count || 0;
    const delivered = stats.find(s => s.status === 'delivered')?._count || 0;

    res.json({
      total,
      delivered,
      opened,
      clicked,
      bounced,
      failed: total - delivered,
      openRate: total ? opened / total : 0,
      clickRate: total ? clicked / total : 0
    });
  } catch (error) {
    console.error('Erreur de calcul des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

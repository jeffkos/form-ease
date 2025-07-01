const express = require('express');
const path = require('path');
const QRCodeService = require('../services/qrcodeService');

const router = express.Router();
const qrCodeService = new QRCodeService();

/**
 * Route pour générer un QR code pour un formulaire
 * POST /api/qrcodes/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { formId, formUrl, options = {} } = req.body;

    // Validation des paramètres
    if (!formId || !formUrl) {
      return res.status(400).json({
        success: false,
        error: 'formId et formUrl sont requis'
      });
    }

    // Validation de l'URL
    try {
      new URL(formUrl);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'URL du formulaire invalide'
      });
    }

    // Génération du QR code
    const result = await qrCodeService.generateQRCode(formId, formUrl, options);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Erreur lors de la génération du QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

/**
 * Route pour générer un QR code personnalisé
 * POST /api/qrcodes/custom
 */
router.post('/custom', async (req, res) => {
  try {
    const { formUrl, format = 'dataUrl', options = {} } = req.body;

    if (!formUrl) {
      return res.status(400).json({
        success: false,
        error: 'formUrl est requis'
      });
    }

    const qrCode = await qrCodeService.generateCustomQRCode(formUrl, format, options);

    // Pour les formats buffer, envoyer le contenu approprié
    if (format === 'png') {
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="qrcode.png"'
      });
      return res.send(qrCode);
    }

    if (format === 'svg') {
      res.set('Content-Type', 'image/svg+xml');
      return res.send(qrCode);
    }

    // Pour dataUrl, retourner JSON
    res.json({
      success: true,
      data: {
        qrCode,
        format,
        formUrl
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du QR code personnalisé:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Route pour télécharger un fichier QR code
 * GET /api/qrcodes/download/:filename
 */
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    // Validation du nom de fichier (sécurité)
    if (!filename || !/^qrcode-[\w\-]+\.png$/.test(filename)) {
      return res.status(400).json({
        success: false,
        error: 'Nom de fichier invalide'
      });
    }

    const exists = await qrCodeService.qrCodeExists(filename);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'Fichier QR code non trouvé'
      });
    }

    const filepath = qrCodeService.getQRCodePath(filename);
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    
    res.sendFile(filepath);
  } catch (error) {
    console.error('Erreur lors du téléchargement du QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du téléchargement'
    });
  }
});

/**
 * Route pour supprimer un QR code
 * DELETE /api/qrcodes/:filename
 */
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    // Validation du nom de fichier
    if (!filename || !/^qrcode-[\w\-]+\.png$/.test(filename)) {
      return res.status(400).json({
        success: false,
        error: 'Nom de fichier invalide'
      });
    }

    const deleted = await qrCodeService.deleteQRCode(filename);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'QR code supprimé avec succès'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'QR code non trouvé ou déjà supprimé'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression'
    });
  }
});

/**
 * Route pour nettoyer les anciens QR codes
 * POST /api/qrcodes/cleanup
 */
router.post('/cleanup', async (req, res) => {
  try {
    const deletedCount = await qrCodeService.cleanupOldQRCodes();
    
    res.json({
      success: true,
      message: `${deletedCount} fichiers QR codes supprimés`
    });
  } catch (error) {
    console.error('Erreur lors du nettoyage des QR codes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du nettoyage'
    });
  }
});

/**
 * Route pour obtenir les statistiques des QR codes
 * GET /api/qrcodes/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const qrCodesPath = path.join(__dirname, '../uploads/qrcodes');
    
    try {
      const files = await fs.readdir(qrCodesPath);
      const stats = {
        totalQRCodes: files.length,
        recentQRCodes: 0,
        oldQRCodes: 0
      };

      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

      for (const file of files) {
        const filepath = path.join(qrCodesPath, file);
        const fileStat = await fs.stat(filepath);
        
        if (fileStat.mtime.getTime() > sevenDaysAgo) {
          stats.recentQRCodes++;
        } else if (fileStat.mtime.getTime() < thirtyDaysAgo) {
          stats.oldQRCodes++;
        }
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      // Répertoire n'existe pas encore
      res.json({
        success: true,
        data: {
          totalQRCodes: 0,
          recentQRCodes: 0,
          oldQRCodes: 0
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des stats QR codes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;

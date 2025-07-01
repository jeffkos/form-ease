const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

/**
 * Service de génération et gestion des QR codes pour les formulaires
 */
class QRCodeService {
  constructor() {
    this.qrCodesPath = path.join(__dirname, '../uploads/qrcodes');
    this.ensureDirectoryExists();
  }

  /**
   * Assure que le répertoire des QR codes existe
   */
  async ensureDirectoryExists() {
    try {
      await fs.access(this.qrCodesPath);
    } catch (error) {
      await fs.mkdir(this.qrCodesPath, { recursive: true });
    }
  }

  /**
   * Génère un QR code pour un formulaire
   * @param {string} formId - ID du formulaire
   * @param {string} formUrl - URL du formulaire
   * @param {Object} options - Options de génération
   * @returns {Promise<Object>} Données du QR code généré
   */
  async generateQRCode(formId, formUrl, options = {}) {
    try {
      const defaultOptions = {
        width: 256,
        margin: 2,
        color: {
          dark: '#2563eb', // Bleu FormEase
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M',
        type: 'png'
      };

      const qrOptions = { ...defaultOptions, ...options };
      
      // Générer le QR code en base64
      const qrDataUrl = await QRCode.toDataURL(formUrl, qrOptions);
      
      // Générer également le fichier PNG pour téléchargement
      const filename = `qrcode-${formId}-${Date.now()}.png`;
      const filepath = path.join(this.qrCodesPath, filename);
      
      await QRCode.toFile(filepath, formUrl, qrOptions);

      return {
        success: true,
        data: {
          formId,
          formUrl,
          qrDataUrl,
          filename,
          filepath,
          downloadUrl: `/api/qrcodes/download/${filename}`,
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Erreur lors de la génération du QR code:', error);
      return {
        success: false,
        error: 'Erreur lors de la génération du QR code'
      };
    }
  }

  /**
   * Récupère le chemin d'un fichier QR code
   * @param {string} filename - Nom du fichier
   * @returns {string} Chemin complet du fichier
   */
  getQRCodePath(filename) {
    return path.join(this.qrCodesPath, filename);
  }

  /**
   * Vérifie si un fichier QR code existe
   * @param {string} filename - Nom du fichier
   * @returns {Promise<boolean>} True si le fichier existe
   */
  async qrCodeExists(filename) {
    try {
      await fs.access(this.getQRCodePath(filename));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Supprime un fichier QR code
   * @param {string} filename - Nom du fichier
   * @returns {Promise<boolean>} True si supprimé avec succès
   */
  async deleteQRCode(filename) {
    try {
      await fs.unlink(this.getQRCodePath(filename));
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du QR code:', error);
      return false;
    }
  }

  /**
   * Nettoie les anciens fichiers QR codes (plus de 30 jours)
   * @returns {Promise<number>} Nombre de fichiers supprimés
   */
  async cleanupOldQRCodes() {
    try {
      const files = await fs.readdir(this.qrCodesPath);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const file of files) {
        const filepath = path.join(this.qrCodesPath, file);
        const stats = await fs.stat(filepath);
        
        if (stats.mtime.getTime() < thirtyDaysAgo) {
          await fs.unlink(filepath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Erreur lors du nettoyage des QR codes:', error);
      return 0;
    }
  }

  /**
   * Génère un QR code avec des options personnalisées pour différents formats
   * @param {string} formUrl - URL du formulaire
   * @param {string} format - Format souhaité ('dataUrl', 'svg', 'png')
   * @param {Object} customOptions - Options personnalisées
   * @returns {Promise<string>} QR code dans le format demandé
   */
  async generateCustomQRCode(formUrl, format = 'dataUrl', customOptions = {}) {
    try {
      const baseOptions = {
        width: 256,
        margin: 2,
        color: {
          dark: '#2563eb',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      };

      const options = { ...baseOptions, ...customOptions };

      switch (format) {
        case 'svg':
          return await QRCode.toString(formUrl, { ...options, type: 'svg' });
        case 'png':
          return await QRCode.toBuffer(formUrl, { ...options, type: 'png' });
        case 'dataUrl':
        default:
          return await QRCode.toDataURL(formUrl, options);
      }
    } catch (error) {
      throw new Error(`Erreur lors de la génération du QR code format ${format}: ${error.message}`);
    }
  }
}

module.exports = QRCodeService;

const QRCodeService = require('../src/services/qrcodeService');
const fs = require('fs').promises;
const path = require('path');

// Mock du module fs pour les tests
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    promises: {
      access: jest.fn(),
      mkdir: jest.fn(),
      readdir: jest.fn(),
      stat: jest.fn(),
      unlink: jest.fn()
    }
  };
});

describe('QRCodeService', () => {
  let qrCodeService;

  beforeEach(() => {
    qrCodeService = new QRCodeService();
    jest.clearAllMocks();
  });

  describe('generateQRCode', () => {
    test('devrait générer un QR code avec succès', async () => {
      const formId = 'test-form-123';
      const formUrl = 'https://formease.com/form/test-form-123';

      const result = await qrCodeService.generateQRCode(formId, formUrl);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        formId,
        formUrl,
        qrDataUrl: expect.stringContaining('data:image/png;base64,'),
        filename: expect.stringMatching(/^qrcode-test-form-123-\d+\.png$/),
        downloadUrl: expect.stringContaining('/api/qrcodes/download/'),
        createdAt: expect.any(String)
      });
    });

    test('devrait utiliser les options personnalisées', async () => {
      const formId = 'test-form-456';
      const formUrl = 'https://formease.com/form/test-form-456';
      const customOptions = {
        width: 128,
        color: {
          dark: '#ff0000',
          light: '#ffffff'
        }
      };

      const result = await qrCodeService.generateQRCode(formId, formUrl, customOptions);

      expect(result.success).toBe(true);
      expect(result.data.qrDataUrl).toContain('data:image/png;base64,');
    });
  });

  describe('generateCustomQRCode', () => {
    test('devrait générer un QR code au format dataUrl', async () => {
      const formUrl = 'https://formease.com/form/custom-test';

      const result = await qrCodeService.generateCustomQRCode(formUrl, 'dataUrl');

      expect(result).toContain('data:image/png;base64,');
    });

    test('devrait générer un QR code au format SVG', async () => {
      const formUrl = 'https://formease.com/form/custom-test';

      const result = await qrCodeService.generateCustomQRCode(formUrl, 'svg');

      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
    });

    test('devrait générer un QR code au format PNG buffer', async () => {
      const formUrl = 'https://formease.com/form/custom-test';

      const result = await qrCodeService.generateCustomQRCode(formUrl, 'png');

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    test('devrait gérer les erreurs', async () => {
      const invalidUrl = '';

      await expect(
        qrCodeService.generateCustomQRCode(invalidUrl)
      ).rejects.toThrow();
    });
  });

  describe('qrCodeExists', () => {
    test('devrait retourner true si le fichier existe', async () => {
      const filename = 'qrcode-test-123.png';
      fs.access.mockResolvedValue();

      const result = await qrCodeService.qrCodeExists(filename);

      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith(
        expect.stringContaining(filename)
      );
    });

    test('devrait retourner false si le fichier n\'existe pas', async () => {
      const filename = 'qrcode-nonexistent.png';
      fs.access.mockRejectedValue(new Error('File not found'));

      const result = await qrCodeService.qrCodeExists(filename);

      expect(result).toBe(false);
    });
  });

  describe('deleteQRCode', () => {
    test('devrait supprimer un fichier avec succès', async () => {
      const filename = 'qrcode-test-123.png';
      fs.unlink.mockResolvedValue();

      const result = await qrCodeService.deleteQRCode(filename);

      expect(result).toBe(true);
      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining(filename)
      );
    });

    test('devrait gérer les erreurs de suppression', async () => {
      const filename = 'qrcode-test-123.png';
      fs.unlink.mockRejectedValue(new Error('Delete failed'));

      const result = await qrCodeService.deleteQRCode(filename);

      expect(result).toBe(false);
    });
  });

  describe('cleanupOldQRCodes', () => {
    test('devrait nettoyer les anciens fichiers', async () => {
      const mockFiles = ['qrcode-old-123.png', 'qrcode-new-456.png'];
      const thirtyDaysAgo = new Date(Date.now() - (31 * 24 * 60 * 60 * 1000));
      const recentDate = new Date();

      fs.readdir.mockResolvedValue(mockFiles);
      fs.stat
        .mockResolvedValueOnce({ mtime: thirtyDaysAgo })
        .mockResolvedValueOnce({ mtime: recentDate });
      fs.unlink.mockResolvedValue();

      const result = await qrCodeService.cleanupOldQRCodes();

      expect(result).toBe(1);
      expect(fs.unlink).toHaveBeenCalledTimes(1);
    });

    test('devrait gérer les erreurs de nettoyage', async () => {
      fs.readdir.mockRejectedValue(new Error('Directory read failed'));

      const result = await qrCodeService.cleanupOldQRCodes();

      expect(result).toBe(0);
    });
  });

  describe('getQRCodePath', () => {
    test('devrait retourner le chemin correct', () => {
      const filename = 'qrcode-test-123.png';
      
      const result = qrCodeService.getQRCodePath(filename);

      expect(result).toContain(filename);
      expect(path.isAbsolute(result)).toBe(true);
    });
  });
});

/**
 * 📱 CONTRÔLEUR SMS - FormEase
 * Gestion des API SMS pour l'envoi de messages
 */

const smsService = require('../services/smsService');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');

class SMSController {
    /**
     * 📨 Envoyer un SMS unique
     */
    async sendSMS(req, res) {
        try {
            // Validation des erreurs
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Données invalides',
                    details: errors.array()
                });
            }

            const { to, message, formId, metadata = {} } = req.body;
            const userId = req.user?.id;

            const result = await smsService.sendSMS({
                to,
                message,
                formId,
                userId,
                metadata
            });

            logger.info(`SMS envoyé avec succès`, {
                userId,
                to,
                smsId: result.smsId
            });

            res.status(200).json(result);

        } catch (error) {
            logger.error('Erreur lors de l\'envoi SMS:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de l\'envoi du SMS',
                message: error.message
            });
        }
    }

    /**
     * 📨 Envoyer des SMS en lot
     */
    async sendBulkSMS(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Données invalides',
                    details: errors.array()
                });
            }

            const { recipients, message, formId, metadata = {} } = req.body;
            const userId = req.user?.id;

            // Limitation pour éviter l'abus
            if (recipients.length > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Trop de destinataires (max 100 par batch)'
                });
            }

            const result = await smsService.sendBulkSMS({
                recipients,
                message,
                formId,
                userId,
                metadata
            });

            logger.info(`SMS en lot envoyé`, {
                userId,
                totalRecipients: recipients.length,
                totalSent: result.totalSent,
                totalFailed: result.totalFailed
            });

            res.status(200).json(result);

        } catch (error) {
            logger.error('Erreur lors de l\'envoi SMS en lot:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de l\'envoi des SMS en lot',
                message: error.message
            });
        }
    }

    /**
     * 📊 Obtenir les statistiques SMS
     */
    async getSMSStats(req, res) {
        try {
            const { period = '30d', formId } = req.query;
            const userId = req.user?.id;

            const stats = await smsService.getSMSStats(userId, formId, period);

            res.status(200).json({
                success: true,
                stats
            });

        } catch (error) {
            logger.error('Erreur lors de la récupération des stats SMS:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des statistiques',
                message: error.message
            });
        }
    }

    /**
     * 📋 Obtenir l'historique SMS
     */
    async getSMSHistory(req, res) {
        try {
            const {
                page = 1,
                limit = 25,
                formId,
                status,
                startDate,
                endDate
            } = req.query;

            const userId = req.user?.id;

            const result = await smsService.getSMSHistory({
                page: parseInt(page),
                limit: parseInt(limit),
                formId,
                userId,
                status,
                startDate,
                endDate
            });

            res.status(200).json({
                success: true,
                ...result
            });

        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'historique SMS:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération de l\'historique',
                message: error.message
            });
        }
    }

    /**
     * 🔍 Obtenir un SMS spécifique
     */
    async getSMSById(req, res) {
        try {
            const { smsId } = req.params;
            const userId = req.user?.id;

            const sms = await prisma.sMS.findFirst({
                where: {
                    id: smsId,
                    userId
                },
                include: {
                    form: {
                        select: { id: true, title: true }
                    }
                }
            });

            if (!sms) {
                return res.status(404).json({
                    success: false,
                    error: 'SMS non trouvé'
                });
            }

            res.status(200).json({
                success: true,
                sms
            });

        } catch (error) {
            logger.error('Erreur lors de la récupération du SMS:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération du SMS',
                message: error.message
            });
        }
    }

    /**
     * ✅ Validation pour l'envoi SMS
     */
    static validateSendSMS() {
        return [
            body('to')
                .notEmpty()
                .withMessage('Numéro de téléphone requis')
                .isMobilePhone(['fr-FR'])
                .withMessage('Format de numéro de téléphone invalide'),
            body('message')
                .notEmpty()
                .withMessage('Message requis')
                .isLength({ max: 160 })
                .withMessage('Message trop long (max 160 caractères)'),
            body('formId')
                .optional()
                .isUUID()
                .withMessage('ID de formulaire invalide')
        ];
    }

    /**
     * ✅ Validation pour l'envoi SMS en lot
     */
    static validateBulkSMS() {
        return [
            body('recipients')
                .isArray({ min: 1, max: 100 })
                .withMessage('Liste de destinataires requise (1-100 max)'),
            body('recipients.*.phone')
                .isMobilePhone(['fr-FR'])
                .withMessage('Format de numéro de téléphone invalide'),
            body('message')
                .notEmpty()
                .withMessage('Message requis')
                .isLength({ max: 160 })
                .withMessage('Message trop long (max 160 caractères)'),
            body('formId')
                .optional()
                .isUUID()
                .withMessage('ID de formulaire invalide')
        ];
    }

    /**
     * 🧪 Tester la configuration SMS
     */
    async testSMSConfiguration(req, res) {
        try {
            const testNumber = process.env.SMS_TEST_NUMBER;
            
            if (!testNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Numéro de test non configuré'
                });
            }

            const result = await smsService.sendSMS({
                to: testNumber,
                message: 'Test SMS FormEase - Configuration OK ✅',
                userId: req.user?.id,
                metadata: { isTest: true }
            });

            res.status(200).json({
                success: true,
                message: 'SMS de test envoyé avec succès',
                smsId: result.smsId
            });

        } catch (error) {
            logger.error('Erreur lors du test SMS:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors du test SMS',
                message: error.message
            });
        }
    }

    /**
     * 🔧 Obtenir la configuration SMS
     */
    async getSMSConfig(req, res) {
        try {
            const config = {
                provider: process.env.SMS_PROVIDER || 'twilio',
                isConfigured: {
                    twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
                    mailersend: !!process.env.MAILERSEND_SMS_API_KEY,
                    freemobile: !!(process.env.FREE_MOBILE_USER && process.env.FREE_MOBILE_PASS)
                },
                limits: {
                    maxRecipients: 100,
                    maxMessageLength: 160
                }
            };

            res.status(200).json({
                success: true,
                config
            });

        } catch (error) {
            logger.error('Erreur lors de la récupération de la config SMS:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération de la configuration',
                message: error.message
            });
        }
    }
}

module.exports = new SMSController();

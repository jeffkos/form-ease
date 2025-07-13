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

    /**
     * 📋 Récupérer les réponses de formulaire avec numéros de téléphone
     */
    async getFormResponsesWithPhone(req, res) {
        try {
            const { formId } = req.params;
            const userId = req.user.id;

            // Vérifier que le formulaire appartient à l'utilisateur
            const form = await prisma.form.findFirst({
                where: {
                    id: formId,
                    user_id: userId
                }
            });

            if (!form) {
                return res.status(404).json({
                    success: false,
                    message: 'Formulaire non trouvé'
                });
            }

            // Récupérer les soumissions avec les champs contenant des numéros de téléphone
            const submissions = await prisma.submission.findMany({
                where: {
                    form_id: formId
                },
                include: {
                    form: {
                        include: {
                            fields: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            });

            // Traiter les réponses pour extraire les numéros de téléphone
            const responsesWithPhone = submissions.map(submission => {
                const responseData = JSON.parse(submission.response_data || '{}');
                
                // Chercher un numéro de téléphone dans les réponses
                let phone = null;
                let name = null;
                let email = null;

                // Chercher dans les champs de téléphone
                const phoneFields = submission.form.fields.filter(field => 
                    field.type === 'tel' || 
                    field.label_fr?.toLowerCase().includes('téléphone') ||
                    field.label_fr?.toLowerCase().includes('phone')
                );

                if (phoneFields.length > 0) {
                    phone = responseData[phoneFields[0].id] || responseData[phoneFields[0].label_fr];
                }

                // Si pas trouvé, chercher dans toutes les valeurs
                if (!phone) {
                    for (const [key, value] of Object.entries(responseData)) {
                        if (typeof value === 'string' && this.isPhoneNumber(value)) {
                            phone = value;
                            break;
                        }
                    }
                }

                // Extraire nom et email
                const nameFields = submission.form.fields.filter(field => 
                    field.type === 'text' && (
                        field.label_fr?.toLowerCase().includes('nom') ||
                        field.label_fr?.toLowerCase().includes('prénom') ||
                        field.label_fr?.toLowerCase().includes('name')
                    )
                );

                const emailFields = submission.form.fields.filter(field => 
                    field.type === 'email'
                );

                if (nameFields.length > 0) {
                    name = responseData[nameFields[0].id] || responseData[nameFields[0].label_fr];
                }

                if (emailFields.length > 0) {
                    email = responseData[emailFields[0].id] || responseData[emailFields[0].label_fr];
                }

                return {
                    id: submission.id,
                    phone: phone,
                    name: name || 'Utilisateur anonyme',
                    email: email || '',
                    submittedAt: submission.created_at,
                    responseData: responseData,
                    hasPhone: !!phone
                };
            });

            // Filtrer seulement ceux qui ont un numéro de téléphone
            const withPhoneOnly = responsesWithPhone.filter(response => response.hasPhone);

            res.json({
                success: true,
                totalResponses: submissions.length,
                responsesWithPhone: withPhoneOnly.length,
                responses: responsesWithPhone,
                form: {
                    id: form.id,
                    title: form.title,
                    description: form.description
                }
            });

        } catch (error) {
            logger.error('Erreur lors de la récupération des réponses avec téléphone:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des réponses',
                message: error.message
            });
        }
    }

    /**
     * Helper: Détecter si une chaîne est un numéro de téléphone
     */
    isPhoneNumber(text) {
        if (!text || typeof text !== 'string') return false;
        
        // Nettoyer le texte
        const cleanText = text.replace(/[\s\-\.\(\)]/g, '');
        
        // Regex pour numéros français et internationaux
        const phoneRegex = /^(\+33|0)[1-9]\d{8}$|^(\+\d{1,3})\d{4,14}$/;
        
        return phoneRegex.test(cleanText);
    }
}

module.exports = new SMSController();

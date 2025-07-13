/**
 * 📱 SERVICE SMS - FormEase
 * Gestion complète de l'envoi de SMS
 * Supporté: Twilio, MailerSend SMS, Free Mobile
 */

const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class SMSService {
    constructor() {
        this.providers = {
            twilio: null,
            mailersend: null,
            freemobile: null
        };
        
        this.activeProvider = process.env.SMS_PROVIDER || 'twilio';
        this.initializeProviders();
    }

    /**
     * 🔧 Initialisation des fournisseurs SMS
     */
    initializeProviders() {
        try {
            // Configuration Twilio
            if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
                const twilio = require('twilio');
                this.providers.twilio = twilio(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );
                logger.info('Twilio SMS provider initialized');
            }

            // Configuration MailerSend SMS
            if (process.env.MAILERSEND_SMS_API_KEY) {
                this.providers.mailersend = {
                    apiKey: process.env.MAILERSEND_SMS_API_KEY,
                    baseUrl: 'https://api.mailersend.com/v1'
                };
                logger.info('MailerSend SMS provider initialized');
            }

            // Configuration Free Mobile
            if (process.env.FREE_MOBILE_USER && process.env.FREE_MOBILE_PASS) {
                this.providers.freemobile = {
                    user: process.env.FREE_MOBILE_USER,
                    pass: process.env.FREE_MOBILE_PASS,
                    baseUrl: 'https://smsapi.free-mobile.fr'
                };
                logger.info('Free Mobile SMS provider initialized');
            }

        } catch (error) {
            logger.error('Erreur lors de l\'initialisation des providers SMS:', error);
        }
    }

    /**
     * 📨 Envoyer un SMS unique
     */
    async sendSMS({ to, message, formId = null, userId = null, metadata = {} }) {
        try {
            // Validation des données
            const validation = this.validateSMSData({ to, message });
            if (!validation.isValid) {
                throw new Error(`Données SMS invalides: ${validation.errors.join(', ')}`);
            }

            // Normaliser le numéro de téléphone
            const normalizedPhone = this.normalizePhoneNumber(to);
            
            // Envoyer selon le provider actif
            let result;
            switch (this.activeProvider) {
                case 'twilio':
                    result = await this.sendViaTwilio(normalizedPhone, message);
                    break;
                case 'mailersend':
                    result = await this.sendViaMailerSend(normalizedPhone, message);
                    break;
                case 'freemobile':
                    result = await this.sendViaFreeMobile(normalizedPhone, message);
                    break;
                default:
                    throw new Error(`Provider SMS non supporté: ${this.activeProvider}`);
            }

            // Enregistrer en base de données
            const smsRecord = await this.saveSMSRecord({
                to: normalizedPhone,
                message,
                formId,
                userId,
                provider: this.activeProvider,
                providerId: result.sid || result.id,
                status: 'sent',
                metadata
            });

            logger.info(`SMS envoyé avec succès à ${normalizedPhone}`, {
                smsId: smsRecord.id,
                provider: this.activeProvider
            });

            return {
                success: true,
                smsId: smsRecord.id,
                providerId: result.sid || result.id,
                message: 'SMS envoyé avec succès'
            };

        } catch (error) {
            logger.error('Erreur lors de l\'envoi SMS:', error);
            
            // Enregistrer l'échec en base
            if (to && message) {
                await this.saveSMSRecord({
                    to: this.normalizePhoneNumber(to),
                    message,
                    formId,
                    userId,
                    provider: this.activeProvider,
                    status: 'failed',
                    error: error.message,
                    metadata
                }).catch(dbError => {
                    logger.error('Erreur lors de l\'enregistrement de l\'échec SMS:', dbError);
                });
            }

            throw error;
        }
    }

    /**
     * 📨 Envoyer des SMS en lot
     */
    async sendBulkSMS({ recipients, message, formId = null, userId = null, metadata = {} }) {
        const results = [];
        const errors = [];

        logger.info(`Début d'envoi SMS en lot pour ${recipients.length} destinataires`);

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            
            try {
                // Personnaliser le message avec les variables
                const personalizedMessage = this.personalizeMessage(message, recipient);
                
                const result = await this.sendSMS({
                    to: recipient.phone,
                    message: personalizedMessage,
                    formId,
                    userId,
                    metadata: {
                        ...metadata,
                        bulkIndex: i,
                        bulkTotal: recipients.length,
                        recipientData: recipient
                    }
                });

                results.push({
                    phone: recipient.phone,
                    success: true,
                    smsId: result.smsId,
                    providerId: result.providerId
                });

            } catch (error) {
                errors.push({
                    phone: recipient.phone,
                    success: false,
                    error: error.message
                });

                logger.error(`Erreur SMS pour ${recipient.phone}:`, error);
            }

            // Pause entre les envois pour éviter le rate limiting
            if (i < recipients.length - 1) {
                await this.delay(100); // 100ms de pause
            }
        }

        logger.info(`Envoi SMS en lot terminé: ${results.length} succès, ${errors.length} échecs`);

        return {
            success: errors.length === 0,
            totalSent: results.length,
            totalFailed: errors.length,
            results,
            errors
        };
    }

    /**
     * 📱 Envoyer via Twilio
     */
    async sendViaTwilio(to, message) {
        if (!this.providers.twilio) {
            throw new Error('Twilio non configuré');
        }

        const result = await this.providers.twilio.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });

        return result;
    }

    /**
     * 📱 Envoyer via MailerSend SMS
     */
    async sendViaMailerSend(to, message) {
        if (!this.providers.mailersend) {
            throw new Error('MailerSend SMS non configuré');
        }

        const fetch = require('node-fetch');
        
        const response = await fetch(`${this.providers.mailersend.baseUrl}/sms`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.providers.mailersend.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.MAILERSEND_SMS_FROM,
                to: [to],
                text: message
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`MailerSend SMS Error: ${error}`);
        }

        return await response.json();
    }

    /**
     * 📱 Envoyer via Free Mobile
     */
    async sendViaFreeMobile(to, message) {
        if (!this.providers.freemobile) {
            throw new Error('Free Mobile non configuré');
        }

        const fetch = require('node-fetch');
        const { user, pass, baseUrl } = this.providers.freemobile;
        
        const params = new URLSearchParams({
            user,
            pass,
            msg: message
        });

        const response = await fetch(`${baseUrl}/sendmsg?${params}`);
        
        if (!response.ok) {
            throw new Error(`Free Mobile Error: ${response.status}`);
        }

        return {
            id: `freemobile_${Date.now()}`,
            status: 'sent'
        };
    }

    /**
     * 🔧 Validation des données SMS
     */
    validateSMSData({ to, message }) {
        const errors = [];

        if (!to) {
            errors.push('Numéro de téléphone requis');
        } else if (!this.isValidPhoneNumber(to)) {
            errors.push('Format de numéro de téléphone invalide');
        }

        if (!message) {
            errors.push('Message requis');
        } else if (message.length > 160) {
            errors.push('Message trop long (max 160 caractères)');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 📞 Normaliser le numéro de téléphone
     */
    normalizePhoneNumber(phone) {
        // Supprimer tous les caractères non numériques sauf le +
        let normalized = phone.replace(/[^\d+]/g, '');
        
        // Si commence par 0, remplacer par +33
        if (normalized.startsWith('0')) {
            normalized = '+33' + normalized.slice(1);
        }
        
        // Si ne commence pas par +, ajouter +33
        if (!normalized.startsWith('+')) {
            normalized = '+33' + normalized;
        }

        return normalized;
    }

    /**
     * ✅ Validation du format de téléphone
     */
    isValidPhoneNumber(phone) {
        const normalized = this.normalizePhoneNumber(phone);
        // Validation basique pour les numéros français
        return /^\+33[1-9]\d{8}$/.test(normalized);
    }

    /**
     * 🎭 Personnaliser le message avec les variables
     */
    personalizeMessage(template, data) {
        let message = template;
        
        // Variables disponibles
        const variables = {
            '{{nom}}': data.name || data.nom || '',
            '{{prenom}}': data.firstName || data.prenom || '',
            '{{email}}': data.email || '',
            '{{entreprise}}': data.company || data.entreprise || '',
            '{{date}}': new Date().toLocaleDateString('fr-FR'),
            '{{heure}}': new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };

        // Remplacer toutes les variables
        Object.entries(variables).forEach(([variable, value]) => {
            message = message.replace(new RegExp(variable, 'g'), value);
        });

        return message;
    }

    /**
     * 💾 Enregistrer le SMS en base de données
     */
    async saveSMSRecord(data) {
        try {
            return await prisma.sMS.create({
                data: {
                    to: data.to,
                    message: data.message,
                    formId: data.formId,
                    userId: data.userId,
                    provider: data.provider,
                    providerId: data.providerId,
                    status: data.status,
                    error: data.error,
                    metadata: data.metadata || {},
                    sentAt: data.status === 'sent' ? new Date() : null
                }
            });
        } catch (error) {
            logger.error('Erreur lors de l\'enregistrement SMS:', error);
            throw error;
        }
    }

    /**
     * 📊 Obtenir les statistiques SMS
     */
    async getSMSStats(userId = null, formId = null, period = '30d') {
        try {
            const dateFilter = this.getDateFilter(period);
            const whereClause = {
                createdAt: dateFilter,
                ...(userId && { userId }),
                ...(formId && { formId })
            };

            const stats = await prisma.sMS.groupBy({
                by: ['status'],
                where: whereClause,
                _count: {
                    id: true
                }
            });

            const totalSent = stats.find(s => s.status === 'sent')?._count.id || 0;
            const totalFailed = stats.find(s => s.status === 'failed')?._count.id || 0;
            const totalPending = stats.find(s => s.status === 'pending')?._count.id || 0;

            return {
                totalSent,
                totalFailed,
                totalPending,
                total: totalSent + totalFailed + totalPending,
                successRate: totalSent + totalFailed > 0 ? (totalSent / (totalSent + totalFailed)) * 100 : 0
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des stats SMS:', error);
            throw error;
        }
    }

    /**
     * 📅 Filtre de date selon la période
     */
    getDateFilter(period) {
        const now = new Date();
        const periodMap = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '1y': 365
        };

        const days = periodMap[period] || 30;
        const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

        return {
            gte: startDate,
            lte: now
        };
    }

    /**
     * ⏱️ Fonction de délai
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 📋 Obtenir l'historique SMS
     */
    async getSMSHistory(filters = {}) {
        try {
            const { page = 1, limit = 25, formId, userId, status, startDate, endDate } = filters;
            
            const whereClause = {
                ...(formId && { formId }),
                ...(userId && { userId }),
                ...(status && { status }),
                ...(startDate || endDate) && {
                    createdAt: {
                        ...(startDate && { gte: new Date(startDate) }),
                        ...(endDate && { lte: new Date(endDate) })
                    }
                }
            };

            const [sms, total] = await Promise.all([
                prisma.sMS.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                    include: {
                        form: {
                            select: { id: true, title: true }
                        },
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }),
                prisma.sMS.count({ where: whereClause })
            ]);

            return {
                sms,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'historique SMS:', error);
            throw error;
        }
    }
}

module.exports = new SMSService();

/**
 * 📢 NotificationRouter.js - FormEase Sprint 3 Phase 2
 * 
 * Routage intelligent et multi-canal des notifications
 * Gestion centralisée de tous les types de notifications
 * 
 * Fonctionnalités :
 * - Routage multi-canal (email, SMS, Slack, Push, etc.)
 * - Templates de notifications dynamiques
 * - Règles de routage intelligentes
 * - Gestion des préférences utilisateur
 * - Files d'attente et retry automatique
 * - Analytics et tracking des notifications
 * 
 * @version 3.0.0
 * @author FormEase Team
 * @since Sprint 3 Phase 2
 */

class NotificationRouter {
    constructor() {
        this.channels = new Map();
        this.templates = new Map();
        this.routingRules = new Map();
        this.userPreferences = new Map();
        this.notificationQueue = [];
        this.sentNotifications = [];
        
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            queueMaxSize: 1000,
            batchSize: 10,
            processingInterval: 5000,
            deliveryTimeout: 30000
        };
        
        this.metrics = {
            totalSent: 0,
            totalFailed: 0,
            totalQueued: 0,
            channelStats: {},
            averageDeliveryTime: 0,
            deliveryRate: 0
        };
        
        this.channels_types = {
            email: 'email',
            sms: 'sms',
            slack: 'slack',
            push: 'push',
            webhook: 'webhook',
            inapp: 'inapp',
            teams: 'teams',
            discord: 'discord'
        };
        
        this.priority_levels = {
            critical: 1,
            high: 2,
            normal: 3,
            low: 4
        };
        
        this.init();
    }
    
    /**
     * Initialisation du routeur de notifications
     */
    init() {
        this.setupChannels();
        this.setupTemplates();
        this.setupRoutingRules();
        this.startQueueProcessor();
        this.loadUserPreferences();
        console.log('📢 NotificationRouter v3.0 initialisé');
    }
    
    /**
     * Configuration des canaux de notification
     */
    setupChannels() {
        // Canal Email
        this.channels.set('email', {
            id: 'email',
            name: 'Email',
            type: 'email',
            enabled: true,
            config: {
                smtp: {
                    host: 'smtp.formease.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER || 'notifications@formease.com',
                        pass: process.env.SMTP_PASS || 'password'
                    }
                },
                from: 'FormEase <noreply@formease.com>',
                templates: {
                    base: 'email-base.html',
                    header: 'email-header.html',
                    footer: 'email-footer.html'
                }
            },
            limits: {
                rateLimit: 100, // par minute
                dailyLimit: 10000
            },
            metrics: {
                sent: 0,
                failed: 0,
                bounced: 0,
                opened: 0,
                clicked: 0
            }
        });
        
        // Canal SMS
        this.channels.set('sms', {
            id: 'sms',
            name: 'SMS',
            type: 'sms',
            enabled: true,
            config: {
                provider: 'twilio',
                apiKey: process.env.TWILIO_API_KEY || '',
                apiSecret: process.env.TWILIO_API_SECRET || '',
                from: '+33123456789'
            },
            limits: {
                rateLimit: 10, // par minute
                dailyLimit: 1000,
                messageLength: 160
            },
            metrics: {
                sent: 0,
                failed: 0,
                delivered: 0
            }
        });
        
        // Canal Slack
        this.channels.set('slack', {
            id: 'slack',
            name: 'Slack',
            type: 'slack',
            enabled: true,
            config: {
                webhook: process.env.SLACK_WEBHOOK || '',
                botToken: process.env.SLACK_BOT_TOKEN || '',
                defaultChannel: '#general',
                username: 'FormEase Bot',
                iconEmoji: ':robot_face:'
            },
            limits: {
                rateLimit: 1, // par seconde
                dailyLimit: 5000
            },
            metrics: {
                sent: 0,
                failed: 0
            }
        });
        
        // Canal Push (navigateur)
        this.channels.set('push', {
            id: 'push',
            name: 'Push Notification',
            type: 'push',
            enabled: true,
            config: {
                vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
                vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
                vapidEmail: 'admin@formease.com'
            },
            limits: {
                rateLimit: 50, // par minute
                dailyLimit: 5000
            },
            metrics: {
                sent: 0,
                failed: 0,
                clicked: 0
            }
        });
        
        // Canal Webhook
        this.channels.set('webhook', {
            id: 'webhook',
            name: 'Webhook',
            type: 'webhook',
            enabled: true,
            config: {
                timeout: 10000,
                retryAttempts: 3,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'FormEase-NotificationRouter/3.0'
                }
            },
            limits: {
                rateLimit: 100, // par minute
                dailyLimit: 10000
            },
            metrics: {
                sent: 0,
                failed: 0,
                timeout: 0
            }
        });
        
        // Canal In-App
        this.channels.set('inapp', {
            id: 'inapp',
            name: 'In-App Notification',
            type: 'inapp',
            enabled: true,
            config: {
                displayDuration: 5000,
                position: 'top-right',
                animation: 'slide'
            },
            limits: {
                rateLimit: 20, // par minute
                dailyLimit: 1000
            },
            metrics: {
                sent: 0,
                dismissed: 0,
                clicked: 0
            }
        });
        
        console.log('📡 Canaux de notification configurés :', this.channels.size);
    }
    
    /**
     * Configuration des templates de notification
     */
    setupTemplates() {
        // Template : Bienvenue utilisateur
        this.templates.set('user-welcome', {
            id: 'user-welcome',
            name: 'Bienvenue Utilisateur',
            description: 'Message de bienvenue pour nouveaux utilisateurs',
            channels: {
                email: {
                    subject: 'Bienvenue sur FormEase, {{user.firstName}} !',
                    html: `
                        <h1>Bienvenue sur FormEase !</h1>
                        <p>Bonjour {{user.firstName}},</p>
                        <p>Nous sommes ravis de vous accueillir sur FormEase, la plateforme de gestion de formulaires intelligente.</p>
                        
                        <div class="features">
                            <h2>🚀 Commencez dès maintenant :</h2>
                            <ul>
                                <li>📝 Créez votre premier formulaire</li>
                                <li>🤖 Utilisez l'IA pour générer automatiquement</li>
                                <li>📊 Suivez vos statistiques en temps réel</li>
                            </ul>
                        </div>
                        
                        <a href="{{app.url}}/dashboard" class="button">Accéder à mon tableau de bord</a>
                        
                        <p>L'équipe FormEase</p>
                    `,
                    text: 'Bienvenue sur FormEase, {{user.firstName}} ! Commencez dès maintenant : {{app.url}}/dashboard'
                },
                inapp: {
                    title: 'Bienvenue !',
                    message: 'Découvrez FormEase et créez votre premier formulaire.',
                    action: {
                        text: 'Commencer',
                        url: '/dashboard'
                    }
                }
            },
            variables: ['user.firstName', 'user.email', 'app.url']
        });
        
        // Template : Formulaire soumis
        this.templates.set('form-submitted', {
            id: 'form-submitted',
            name: 'Formulaire Soumis',
            description: 'Notification de soumission de formulaire',
            channels: {
                email: {
                    subject: 'Nouveau formulaire soumis : {{form.title}}',
                    html: `
                        <h1>Nouveau formulaire reçu</h1>
                        <p>Un nouveau formulaire a été soumis :</p>
                        
                        <div class="form-info">
                            <h2>📋 {{form.title}}</h2>
                            <p><strong>Soumis par :</strong> {{submitter.name}} ({{submitter.email}})</p>
                            <p><strong>Date :</strong> {{submission.date}}</p>
                            <p><strong>Priorité :</strong> {{submission.priority}}</p>
                        </div>
                        
                        <a href="{{app.url}}/forms/{{form.id}}/submission/{{submission.id}}" class="button">
                            Voir la soumission
                        </a>
                    `,
                    text: 'Nouveau formulaire soumis : {{form.title}} par {{submitter.name}}'
                },
                slack: {
                    text: '📝 Nouveau formulaire soumis',
                    blocks: [
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: '*Nouveau formulaire reçu*\n\n*Formulaire :* {{form.title}}\n*Soumis par :* {{submitter.name}}\n*Priorité :* {{submission.priority}}'
                            }
                        },
                        {
                            type: 'actions',
                            elements: [
                                {
                                    type: 'button',
                                    text: {
                                        type: 'plain_text',
                                        text: 'Voir'
                                    },
                                    url: '{{app.url}}/forms/{{form.id}}/submission/{{submission.id}}'
                                }
                            ]
                        }
                    ]
                },
                sms: {
                    message: 'FormEase: Nouveau formulaire "{{form.title}}" reçu de {{submitter.name}}. Priorité: {{submission.priority}}'
                }
            }
        });
        
        // Template : Rappel d'échéance
        this.templates.set('deadline-reminder', {
            id: 'deadline-reminder',
            name: 'Rappel Échéance',
            description: 'Rappel avant échéance importante',
            channels: {
                email: {
                    subject: '⚠️ Rappel : Échéance {{task.title}} dans {{deadline.daysLeft}} jour(s)',
                    html: `
                        <h1>⚠️ Rappel d'échéance</h1>
                        <p>Bonjour {{user.firstName}},</p>
                        
                        <div class="reminder-box">
                            <h2>📅 {{task.title}}</h2>
                            <p><strong>Échéance :</strong> {{deadline.date}}</p>
                            <p><strong>Temps restant :</strong> {{deadline.daysLeft}} jour(s)</p>
                            <p><strong>Priorité :</strong> {{task.priority}}</p>
                        </div>
                        
                        <p>{{task.description}}</p>
                        
                        <a href="{{app.url}}/tasks/{{task.id}}" class="button urgent">
                            Traiter maintenant
                        </a>
                    `
                },
                push: {
                    title: 'Échéance proche',
                    body: '{{task.title}} - {{deadline.daysLeft}} jour(s) restant(s)',
                    icon: '/icons/reminder.png',
                    data: {
                        taskId: '{{task.id}}',
                        url: '/tasks/{{task.id}}'
                    }
                }
            }
        });
        
        // Template : Erreur système
        this.templates.set('system-error', {
            id: 'system-error',
            name: 'Erreur Système',
            description: 'Notification d\'erreur système critique',
            channels: {
                slack: {
                    text: '🚨 Erreur système détectée',
                    blocks: [
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: '*🚨 ERREUR SYSTÈME*\n\n*Type :* {{error.type}}\n*Message :* {{error.message}}\n*Composant :* {{error.component}}\n*Heure :* {{error.timestamp}}'
                            }
                        }
                    ]
                },
                webhook: {
                    payload: {
                        level: 'error',
                        source: 'FormEase',
                        error: {
                            type: '{{error.type}}',
                            message: '{{error.message}}',
                            component: '{{error.component}}',
                            timestamp: '{{error.timestamp}}',
                            stack: '{{error.stack}}'
                        }
                    }
                }
            }
        });
        
        console.log('📄 Templates de notification chargés :', this.templates.size);
    }
    
    /**
     * Configuration des règles de routage
     */
    setupRoutingRules() {
        // Règle : Notifications utilisateur
        this.routingRules.set('user-notifications', {
            id: 'user-notifications',
            name: 'Notifications Utilisateur',
            conditions: {
                audience: 'user',
                priority: ['normal', 'high']
            },
            routing: {
                primary: 'email',
                fallback: 'inapp',
                channels: ['email', 'inapp']
            },
            schedule: {
                respectQuietHours: true,
                quietStart: '22:00',
                quietEnd: '08:00',
                timezone: 'Europe/Paris'
            }
        });
        
        // Règle : Notifications critiques
        this.routingRules.set('critical-alerts', {
            id: 'critical-alerts',
            name: 'Alertes Critiques',
            conditions: {
                priority: 'critical'
            },
            routing: {
                primary: 'sms',
                secondary: 'slack',
                channels: ['sms', 'slack', 'email', 'push']
            },
            schedule: {
                respectQuietHours: false,
                immediate: true
            }
        });
        
        // Règle : Notifications équipe
        this.routingRules.set('team-notifications', {
            id: 'team-notifications',
            name: 'Notifications Équipe',
            conditions: {
                audience: 'team',
                types: ['form-submitted', 'workflow-completed']
            },
            routing: {
                primary: 'slack',
                secondary: 'email',
                channels: ['slack', 'email']
            },
            schedule: {
                respectQuietHours: true,
                workingHoursOnly: true,
                workingStart: '09:00',
                workingEnd: '18:00'
            }
        });
        
        // Règle : Notifications système
        this.routingRules.set('system-notifications', {
            id: 'system-notifications',
            name: 'Notifications Système',
            conditions: {
                audience: 'admin',
                types: ['system-error', 'maintenance', 'security-alert']
            },
            routing: {
                primary: 'slack',
                secondary: 'webhook',
                channels: ['slack', 'webhook', 'email']
            },
            schedule: {
                respectQuietHours: false,
                immediate: true
            }
        });
        
        console.log('📋 Règles de routage configurées :', this.routingRules.size);
    }
    
    /**
     * Chargement des préférences utilisateur
     */
    loadUserPreferences() {
        try {
            const savedPreferences = localStorage.getItem('formease-notification-preferences');
            if (savedPreferences) {
                const preferences = JSON.parse(savedPreferences);
                preferences.forEach(pref => {
                    this.userPreferences.set(pref.userId, pref);
                });
                console.log(`👤 Préférences chargées pour ${preferences.length} utilisateur(s)`);
            }
        } catch (error) {
            console.error('Erreur chargement préférences :', error);
        }
    }
    
    /**
     * Démarrage du processeur de file d'attente
     */
    startQueueProcessor() {
        setInterval(() => {
            this.processQueue();
        }, this.config.processingInterval);
        
        console.log('⚙️ Processeur de file d\'attente démarré');
    }
    
    /**
     * Envoi d'une notification
     */
    async sendNotification(notificationConfig) {
        const notification = {
            id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            status: 'pending',
            attempts: 0,
            ...notificationConfig
        };
        
        // Validation
        if (!this.validateNotification(notification)) {
            throw new Error('Configuration de notification invalide');
        }
        
        // Détermination du routage
        const routing = this.determineRouting(notification);
        notification.routing = routing;
        
        // Préparation des canaux
        notification.channels = await this.prepareChannels(notification, routing);
        
        // Ajout à la file d'attente
        this.addToQueue(notification);
        
        console.log(`📢 Notification ajoutée à la file : ${notification.id}`);
        return notification;
    }
    
    /**
     * Validation d'une notification
     */
    validateNotification(notification) {
        // Vérifications de base
        if (!notification.template && !notification.message) {
            console.error('Template ou message requis');
            return false;
        }
        
        if (!notification.recipients || notification.recipients.length === 0) {
            console.error('Destinataires requis');
            return false;
        }
        
        if (!notification.priority) {
            notification.priority = 'normal';
        }
        
        return true;
    }
    
    /**
     * Détermination du routage
     */
    determineRouting(notification) {
        // Trouver les règles applicables
        const applicableRules = Array.from(this.routingRules.values())
            .filter(rule => this.ruleMatches(rule, notification));
        
        if (applicableRules.length === 0) {
            // Routage par défaut
            return {
                channels: ['email'],
                priority: notification.priority
            };
        }
        
        // Prendre la première règle qui match
        const rule = applicableRules[0];
        return {
            ...rule.routing,
            schedule: rule.schedule,
            priority: notification.priority
        };
    }
    
    /**
     * Vérification de correspondance de règle
     */
    ruleMatches(rule, notification) {
        const conditions = rule.conditions;
        
        // Vérifier l'audience
        if (conditions.audience && notification.audience !== conditions.audience) {
            return false;
        }
        
        // Vérifier la priorité
        if (conditions.priority) {
            const priorities = Array.isArray(conditions.priority) ? conditions.priority : [conditions.priority];
            if (!priorities.includes(notification.priority)) {
                return false;
            }
        }
        
        // Vérifier le type
        if (conditions.types) {
            if (!conditions.types.includes(notification.type)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Préparation des canaux pour une notification
     */
    async prepareChannels(notification, routing) {
        const channels = [];
        
        for (const channelId of routing.channels) {
            const channel = this.channels.get(channelId);
            if (!channel || !channel.enabled) {
                continue;
            }
            
            // Vérifier les limites du canal
            if (!this.checkChannelLimits(channel)) {
                console.warn(`Canal ${channelId} limité, passage au suivant`);
                continue;
            }
            
            // Préparer le contenu pour ce canal
            const content = await this.prepareContent(notification, channelId);
            if (content) {
                channels.push({
                    id: channelId,
                    channel: channel,
                    content: content,
                    status: 'pending'
                });
            }
        }
        
        return channels;
    }
    
    /**
     * Vérification des limites de canal
     */
    checkChannelLimits(channel) {
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000);
        
        // Vérifier le rate limit
        const recentSent = this.sentNotifications.filter(
            notif => notif.timestamp > oneMinuteAgo && 
                    notif.channels.some(ch => ch.id === channel.id)
        ).length;
        
        if (recentSent >= channel.limits.rateLimit) {
            return false;
        }
        
        // Vérifier la limite quotidienne
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const dailySent = this.sentNotifications.filter(
            notif => notif.timestamp > oneDayAgo && 
                    notif.channels.some(ch => ch.id === channel.id)
        ).length;
        
        if (dailySent >= channel.limits.dailyLimit) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Préparation du contenu pour un canal
     */
    async prepareContent(notification, channelId) {
        let content = null;
        
        if (notification.template) {
            // Utiliser un template
            const template = this.templates.get(notification.template);
            if (template && template.channels[channelId]) {
                content = this.renderTemplate(template.channels[channelId], notification.variables || {});
            }
        } else if (notification.content && notification.content[channelId]) {
            // Contenu personnalisé pour ce canal
            content = notification.content[channelId];
        } else if (notification.message) {
            // Message générique adapté au canal
            content = this.adaptMessageToChannel(notification.message, channelId);
        }
        
        return content;
    }
    
    /**
     * Rendu d'un template avec variables
     */
    renderTemplate(template, variables) {
        let rendered = { ...template };
        
        // Remplacer les variables dans tous les champs
        const replaceVariables = (obj) => {
            if (typeof obj === 'string') {
                return obj.replace(/\{\{(.*?)\}\}/g, (match, key) => {
                    const value = this.getNestedValue(variables, key.trim());
                    return value !== undefined ? value : match;
                });
            } else if (typeof obj === 'object' && obj !== null) {
                const result = {};
                for (const [key, value] of Object.entries(obj)) {
                    result[key] = replaceVariables(value);
                }
                return result;
            }
            return obj;
        };
        
        return replaceVariables(rendered);
    }
    
    /**
     * Obtention de valeur imbriquée
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
    
    /**
     * Adaptation d'un message à un canal
     */
    adaptMessageToChannel(message, channelId) {
        switch (channelId) {
            case 'email':
                return {
                    subject: 'Notification FormEase',
                    html: `<p>${message}</p>`,
                    text: message
                };
            case 'sms':
                return {
                    message: message.substring(0, 160) // Limite SMS
                };
            case 'slack':
                return {
                    text: message
                };
            case 'push':
                return {
                    title: 'FormEase',
                    body: message
                };
            case 'inapp':
                return {
                    title: 'Notification',
                    message: message
                };
            default:
                return { message: message };
        }
    }
    
    /**
     * Ajout à la file d'attente
     */
    addToQueue(notification) {
        // Vérifier la taille de la file
        if (this.notificationQueue.length >= this.config.queueMaxSize) {
            console.warn('File d\'attente pleine, suppression des anciennes notifications');
            this.notificationQueue = this.notificationQueue.slice(-this.config.queueMaxSize * 0.8);
        }
        
        // Insérer selon la priorité
        const priority = this.priority_levels[notification.priority] || 3;
        let insertIndex = 0;
        
        for (let i = 0; i < this.notificationQueue.length; i++) {
            const queuedPriority = this.priority_levels[this.notificationQueue[i].priority] || 3;
            if (priority < queuedPriority) {
                insertIndex = i;
                break;
            }
            insertIndex = i + 1;
        }
        
        this.notificationQueue.splice(insertIndex, 0, notification);
        this.metrics.totalQueued++;
    }
    
    /**
     * Traitement de la file d'attente
     */
    async processQueue() {
        if (this.notificationQueue.length === 0) {
            return;
        }
        
        const batch = this.notificationQueue.splice(0, this.config.batchSize);
        
        const promises = batch.map(notification => this.processNotification(notification));
        
        try {
            await Promise.allSettled(promises);
        } catch (error) {
            console.error('Erreur traitement batch :', error);
        }
    }
    
    /**
     * Traitement d'une notification
     */
    async processNotification(notification) {
        const startTime = Date.now();
        
        try {
            notification.status = 'processing';
            notification.attempts++;
            
            // Vérifier les heures de silence
            if (!this.shouldSendNow(notification)) {
                // Remettre en file d'attente pour plus tard
                this.scheduleForLater(notification);
                return;
            }
            
            // Envoyer sur tous les canaux
            const results = await Promise.allSettled(
                notification.channels.map(channelConfig => 
                    this.sendToChannel(channelConfig, notification)
                )
            );
            
            // Analyser les résultats
            let successCount = 0;
            let failureCount = 0;
            
            results.forEach((result, index) => {
                const channelConfig = notification.channels[index];
                
                if (result.status === 'fulfilled' && result.value.success) {
                    channelConfig.status = 'sent';
                    channelConfig.result = result.value;
                    successCount++;
                } else {
                    channelConfig.status = 'failed';
                    channelConfig.error = result.reason || result.value?.error;
                    failureCount++;
                }
            });
            
            // Déterminer le statut final
            if (successCount > 0) {
                notification.status = failureCount > 0 ? 'partial' : 'sent';
                this.metrics.totalSent++;
            } else {
                notification.status = 'failed';
                this.metrics.totalFailed++;
                
                // Retry si possible
                if (notification.attempts < this.config.maxRetries) {
                    setTimeout(() => {
                        this.addToQueue(notification);
                    }, this.config.retryDelay * notification.attempts);
                    return;
                }
            }
            
            // Enregistrer dans l'historique
            notification.completedAt = new Date();
            notification.deliveryTime = Date.now() - startTime;
            this.sentNotifications.push(notification);
            
            // Mettre à jour les métriques
            this.updateDeliveryMetrics(notification.deliveryTime);
            
            console.log(`📬 Notification ${notification.id} ${notification.status} (${successCount}/${notification.channels.length} canaux)`);
            
        } catch (error) {
            console.error(`Erreur traitement notification ${notification.id}:`, error);
            notification.status = 'failed';
            this.metrics.totalFailed++;
        }
    }
    
    /**
     * Vérification si on doit envoyer maintenant
     */
    shouldSendNow(notification) {
        const routing = notification.routing;
        
        if (!routing.schedule) {
            return true;
        }
        
        const now = new Date();
        const currentHour = now.getHours();
        
        // Vérifier les heures de silence
        if (routing.schedule.respectQuietHours && routing.schedule.quietStart && routing.schedule.quietEnd) {
            const quietStart = parseInt(routing.schedule.quietStart.split(':')[0]);
            const quietEnd = parseInt(routing.schedule.quietEnd.split(':')[0]);
            
            if (quietStart < quietEnd) {
                // Même jour
                if (currentHour >= quietStart && currentHour < quietEnd) {
                    return false;
                }
            } else {
                // Traversée de minuit
                if (currentHour >= quietStart || currentHour < quietEnd) {
                    return false;
                }
            }
        }
        
        // Vérifier les heures de travail
        if (routing.schedule.workingHoursOnly) {
            const workingStart = parseInt(routing.schedule.workingStart?.split(':')[0] || '9');
            const workingEnd = parseInt(routing.schedule.workingEnd?.split(':')[0] || '18');
            
            if (currentHour < workingStart || currentHour >= workingEnd) {
                return false;
            }
            
            // Vérifier le week-end
            const dayOfWeek = now.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) { // Dimanche ou Samedi
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Planification pour plus tard
     */
    scheduleForLater(notification) {
        const routing = notification.routing;
        let nextSendTime = new Date();
        
        if (routing.schedule.workingHoursOnly) {
            // Programmer pour le prochain jour ouvrable
            nextSendTime = this.getNextWorkingDay(nextSendTime);
            const workingStart = routing.schedule.workingStart?.split(':') || ['9', '0'];
            nextSendTime.setHours(parseInt(workingStart[0]), parseInt(workingStart[1]), 0, 0);
        } else if (routing.schedule.respectQuietHours) {
            // Programmer pour la fin des heures de silence
            const quietEnd = routing.schedule.quietEnd?.split(':') || ['8', '0'];
            nextSendTime.setHours(parseInt(quietEnd[0]), parseInt(quietEnd[1]), 0, 0);
            
            if (nextSendTime <= new Date()) {
                nextSendTime.setDate(nextSendTime.getDate() + 1);
            }
        }
        
        // Programmer l'envoi
        const delay = nextSendTime.getTime() - Date.now();
        setTimeout(() => {
            this.addToQueue(notification);
        }, delay);
        
        console.log(`⏰ Notification ${notification.id} programmée pour ${nextSendTime}`);
    }
    
    /**
     * Obtention du prochain jour ouvrable
     */
    getNextWorkingDay(date) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        // Vérifier si c'est un week-end
        while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
            nextDay.setDate(nextDay.getDate() + 1);
        }
        
        return nextDay;
    }
    
    /**
     * Envoi vers un canal spécifique
     */
    async sendToChannel(channelConfig, notification) {
        const { channel, content } = channelConfig;
        
        try {
            switch (channel.type) {
                case 'email':
                    return await this.sendEmail(content, channel.config);
                case 'sms':
                    return await this.sendSMS(content, channel.config);
                case 'slack':
                    return await this.sendSlack(content, channel.config);
                case 'push':
                    return await this.sendPush(content, channel.config);
                case 'webhook':
                    return await this.sendWebhook(content, channel.config);
                case 'inapp':
                    return await this.sendInApp(content, channel.config);
                default:
                    throw new Error(`Canal non supporté : ${channel.type}`);
            }
        } catch (error) {
            console.error(`Erreur envoi ${channel.type}:`, error);
            throw error;
        }
    }
    
    /**
     * Envoi d'email
     */
    async sendEmail(content, config) {
        // Simulation d'envoi email
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        
        return {
            success: true,
            messageId: 'email_' + Date.now(),
            channel: 'email',
            timestamp: new Date()
        };
    }
    
    /**
     * Envoi de SMS
     */
    async sendSMS(content, config) {
        // Simulation d'envoi SMS
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
        
        return {
            success: true,
            messageId: 'sms_' + Date.now(),
            channel: 'sms',
            timestamp: new Date()
        };
    }
    
    /**
     * Envoi Slack
     */
    async sendSlack(content, config) {
        // Simulation d'envoi Slack
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        
        return {
            success: true,
            messageId: 'slack_' + Date.now(),
            channel: 'slack',
            timestamp: new Date()
        };
    }
    
    /**
     * Envoi notification push
     */
    async sendPush(content, config) {
        // Simulation d'envoi push
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
        
        return {
            success: true,
            messageId: 'push_' + Date.now(),
            channel: 'push',
            timestamp: new Date()
        };
    }
    
    /**
     * Envoi webhook
     */
    async sendWebhook(content, config) {
        // Simulation d'appel webhook
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
        
        return {
            success: true,
            messageId: 'webhook_' + Date.now(),
            channel: 'webhook',
            status: 200,
            timestamp: new Date()
        };
    }
    
    /**
     * Affichage notification in-app
     */
    async sendInApp(content, config) {
        // Affichage direct dans l'interface
        this.displayInAppNotification(content, config);
        
        return {
            success: true,
            messageId: 'inapp_' + Date.now(),
            channel: 'inapp',
            timestamp: new Date()
        };
    }
    
    /**
     * Affichage d'une notification in-app
     */
    displayInAppNotification(content, config) {
        const notification = document.createElement('div');
        notification.className = 'formease-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>${content.title || 'Notification'}</h4>
                <p>${content.message}</p>
                ${content.action ? `<button onclick="window.location.href='${content.action.url}'">${content.action.text}</button>` : ''}
                <button class="close-btn" onclick="this.closest('.formease-notification').remove()">×</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-suppression
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, config.displayDuration || 5000);
        
        console.log('📱 Notification in-app affichée');
    }
    
    /**
     * Mise à jour des métriques de livraison
     */
    updateDeliveryMetrics(deliveryTime) {
        const alpha = 0.1; // Facteur de lissage
        this.metrics.averageDeliveryTime = Math.round(
            this.metrics.averageDeliveryTime * (1 - alpha) + deliveryTime * alpha
        );
        
        // Calcul du taux de livraison
        const totalAttempts = this.metrics.totalSent + this.metrics.totalFailed;
        this.metrics.deliveryRate = totalAttempts > 0 ? 
            Math.round((this.metrics.totalSent / totalAttempts) * 100) : 0;
    }
    
    /**
     * Configuration des préférences utilisateur
     */
    setUserPreferences(userId, preferences) {
        this.userPreferences.set(userId, {
            userId: userId,
            ...preferences,
            updatedAt: new Date()
        });
        
        // Persistance
        this.saveUserPreferences();
        
        console.log(`👤 Préférences mises à jour pour l'utilisateur ${userId}`);
    }
    
    /**
     * Sauvegarde des préférences utilisateur
     */
    saveUserPreferences() {
        try {
            const preferences = Array.from(this.userPreferences.values());
            localStorage.setItem('formease-notification-preferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('Erreur sauvegarde préférences :', error);
        }
    }
    
    /**
     * Obtention des métriques
     */
    getMetrics() {
        return {
            ...this.metrics,
            queueSize: this.notificationQueue.length,
            channels: Object.fromEntries(
                Array.from(this.channels.entries()).map(([id, channel]) => [id, channel.metrics])
            )
        };
    }
    
    /**
     * Obtention de l'historique des notifications
     */
    getNotificationHistory(limit = 100) {
        return this.sentNotifications
            .slice(-limit)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    
    /**
     * Obtention des templates disponibles
     */
    getTemplates() {
        return Array.from(this.templates.values());
    }
    
    /**
     * Obtention des canaux disponibles
     */
    getChannels() {
        return Array.from(this.channels.values());
    }
    
    /**
     * Test d'un canal
     */
    async testChannel(channelId, testMessage = 'Test FormEase') {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error(`Canal ${channelId} introuvable`);
        }
        
        const testNotification = {
            id: 'test_' + Date.now(),
            message: testMessage,
            recipients: ['test@formease.com'],
            priority: 'normal',
            channels: [{
                id: channelId,
                channel: channel,
                content: this.adaptMessageToChannel(testMessage, channelId),
                status: 'pending'
            }]
        };
        
        const result = await this.sendToChannel(testNotification.channels[0], testNotification);
        console.log(`🧪 Test du canal ${channelId} :`, result.success ? 'Succès' : 'Échec');
        
        return result;
    }
}

// Export pour compatibilité navigateur
window.NotificationRouter = NotificationRouter;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.notificationRouter) {
        window.notificationRouter = new NotificationRouter();
        console.log('📢 NotificationRouter initialisé globalement');
    }
});

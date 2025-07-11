/**
 * 🔔 NotificationRouter.js - FormEase Sprint 4 Phase 4
 * 
 * Système de notification et routage intelligent
 * Gestionnaire de notifications enterprise-grade pour FormEase
 * 
 * Fonctionnalités :
 * - Notifications temps réel multi-canaux
 * - Routage intelligent et personnalisé
 * - Templates et personnalisation avancée
 * - Gestion des préférences utilisateur
 * - Intégrations externes (email, SMS, push)
 * - Analytics et tracking des notifications
 * - Rate limiting et anti-spam
 * - Notifications contextuelles intelligentes
 * 
 * @version 4.0.0
 * @author FormEase Collaboration Team
 * @since Sprint 4 Phase 4
 */

class NotificationRouter {
    constructor() {
        this.notifications = new Map();
        this.templates = new Map();
        this.preferences = new Map();
        this.channels = new Map();
        this.subscriptions = new Map();
        this.analytics = new Map();
        this.rateLimits = new Map();
        
        this.config = {
            channels: {
                inApp: { enabled: true, priority: 1, realtime: true },
                email: { enabled: true, priority: 2, realtime: false },
                sms: { enabled: false, priority: 3, realtime: true },
                push: { enabled: true, priority: 1, realtime: true },
                desktop: { enabled: true, priority: 1, realtime: true },
                webhook: { enabled: false, priority: 4, realtime: true }
            },
            delivery: {
                retryAttempts: 3,
                retryDelay: 1000, // 1 seconde
                batchSize: 50,
                queueLimit: 1000,
                timeout: 30000, // 30 secondes
                fallbackChannel: 'inApp'
            },
            rateLimiting: {
                enabled: true,
                globalLimit: 100, // par heure
                perUserLimit: 20, // par heure
                perChannelLimit: 50, // par heure
                burstLimit: 5, // en 1 minute
                throttleDelay: 60000 // 1 minute
            },
            personalization: {
                enabled: true,
                aiRecommendations: true,
                contextualTiming: true,
                contentOptimization: true,
                behaviorAnalysis: true
            },
            privacy: {
                anonymizeData: false,
                encryptContent: true,
                retentionPeriod: 90, // jours
                gdprCompliant: true
            }
        };
        
        this.notificationTypes = {
            system: 'system',
            collaboration: 'collaboration',
            security: 'security',
            workflow: 'workflow',
            social: 'social',
            marketing: 'marketing',
            emergency: 'emergency'
        };
        
        this.priorities = {
            low: 1,
            normal: 2,
            high: 3,
            urgent: 4,
            critical: 5
        };
        
        this.statuses = {
            pending: 'pending',
            sent: 'sent',
            delivered: 'delivered',
            read: 'read',
            failed: 'failed',
            expired: 'expired',
            cancelled: 'cancelled'
        };
        
        this.deliveryQueue = [];
        this.pendingNotifications = new Map();
        this.failedNotifications = [];
        
        this.init();
    }
    
    /**
     * Initialisation du routeur de notifications
     */
    init() {
        this.initializeChannels();
        this.setupTemplates();
        this.initializePreferences();
        this.setupRateLimiting();
        this.startDeliveryEngine();
        this.initializeAnalytics();
        this.setupEventHandlers();
        this.loadUserPreferences();
        console.log('🔔 NotificationRouter v4.0 initialisé - Mode ENTERPRISE');
    }
    
    /**
     * Initialisation des canaux de notification
     */
    initializeChannels() {
        // Canal In-App
        this.channels.set('inApp', {
            id: 'inApp',
            name: 'In-App Notifications',
            type: 'realtime',
            enabled: this.config.channels.inApp.enabled,
            priority: this.config.channels.inApp.priority,
            
            async send(notification) {
                try {
                    // Afficher la notification dans l'interface
                    this.displayInAppNotification(notification);
                    
                    // Émettre un événement
                    const event = new CustomEvent('inAppNotification', {
                        detail: notification
                    });
                    document.dispatchEvent(event);
                    
                    return { success: true, deliveredAt: new Date() };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            },
            
            displayInAppNotification(notification) {
                // Créer l'élément de notification
                const notificationElement = document.createElement('div');
                notificationElement.className = `notification notification-${notification.priority}`;
                notificationElement.innerHTML = `
                    <div class="notification-header">
                        <span class="notification-icon">${this.getIconForType(notification.type)}</span>
                        <span class="notification-title">${notification.title}</span>
                        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="notification-body">
                        ${notification.content}
                    </div>
                    <div class="notification-footer">
                        <span class="notification-time">${this.formatTime(notification.timestamp)}</span>
                        ${notification.actions ? this.renderActions(notification.actions) : ''}
                    </div>
                `;
                
                // Ajouter au container de notifications
                let container = document.getElementById('notification-container');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'notification-container';
                    container.className = 'notification-container';
                    document.body.appendChild(container);
                }
                
                container.appendChild(notificationElement);
                
                // Auto-suppression pour les notifications non critiques
                if (notification.priority < this.priorities.urgent) {
                    setTimeout(() => {
                        if (notificationElement.parentNode) {
                            notificationElement.remove();
                        }
                    }, notification.autoHide || 5000);
                }
                
                // Marquer comme affichée
                notification.displayedAt = new Date();
            },
            
            getIconForType(type) {
                const icons = {
                    system: '⚙️',
                    collaboration: '🤝',
                    security: '🔒',
                    workflow: '📋',
                    social: '👥',
                    marketing: '📢',
                    emergency: '🚨'
                };
                return icons[type] || '📄';
            },
            
            formatTime(timestamp) {
                return new Date(timestamp).toLocaleTimeString();
            },
            
            renderActions(actions) {
                return actions.map(action => 
                    `<button class="notification-action" onclick="${action.handler}">${action.label}</button>`
                ).join('');
            }
        });
        
        // Canal Email
        this.channels.set('email', {
            id: 'email',
            name: 'Email Notifications',
            type: 'async',
            enabled: this.config.channels.email.enabled,
            
            async send(notification) {
                try {
                    // Simulation d'envoi email
                    const emailData = {
                        to: notification.recipient.email,
                        subject: notification.title,
                        html: this.renderEmailTemplate(notification),
                        text: notification.content
                    };
                    
                    // En production, utiliser un service email réel
                    await this.sendEmail(emailData);
                    
                    return { success: true, deliveredAt: new Date() };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            },
            
            renderEmailTemplate(notification) {
                return `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>${notification.title}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                            .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
                            .content { padding: 20px; }
                            .footer { background: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>FormEase</h1>
                        </div>
                        <div class="content">
                            <h2>${notification.title}</h2>
                            <p>${notification.content}</p>
                            ${notification.actions ? this.renderEmailActions(notification.actions) : ''}
                        </div>
                        <div class="footer">
                            <p>FormEase - Collaborative Form Builder</p>
                            <p>Ne plus recevoir ces notifications : <a href="#">Se désabonner</a></p>
                        </div>
                    </body>
                    </html>
                `;
            },
            
            renderEmailActions(actions) {
                return actions.map(action => 
                    `<a href="${action.url}" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; margin: 5px;">${action.label}</a>`
                ).join('');
            },
            
            async sendEmail(emailData) {
                // Simulation - en production, utiliser SendGrid, AWS SES, etc.
                console.log('📧 Email envoyé:', emailData.subject);
                return Promise.resolve();
            }
        });
        
        // Canal Push (Navigateur)
        this.channels.set('push', {
            id: 'push',
            name: 'Browser Push Notifications',
            type: 'realtime',
            enabled: this.config.channels.push.enabled,
            
            async send(notification) {
                try {
                    if (!('Notification' in window)) {
                        throw new Error('Ce navigateur ne supporte pas les notifications push');
                    }
                    
                    if (Notification.permission !== 'granted') {
                        const permission = await Notification.requestPermission();
                        if (permission !== 'granted') {
                            throw new Error('Permission de notification refusée');
                        }
                    }
                    
                    const pushNotification = new Notification(notification.title, {
                        body: notification.content,
                        icon: notification.icon || '/favicon.ico',
                        badge: notification.badge || '/badge.png',
                        tag: notification.id,
                        data: notification.data,
                        requireInteraction: notification.priority >= this.priorities.urgent
                    });
                    
                    // Gérer les clics
                    pushNotification.onclick = (event) => {
                        event.preventDefault();
                        window.focus();
                        pushNotification.close();
                        
                        if (notification.clickAction) {
                            notification.clickAction();
                        }
                    };
                    
                    return { success: true, deliveredAt: new Date() };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }
        });
        
        // Canal Desktop
        this.channels.set('desktop', {
            id: 'desktop',
            name: 'Desktop System Notifications',
            type: 'realtime',
            enabled: this.config.channels.desktop.enabled,
            
            async send(notification) {
                try {
                    // Utiliser l'API Notification du navigateur
                    return await this.channels.get('push').send(notification);
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }
        });
        
        // Canal Webhook
        this.channels.set('webhook', {
            id: 'webhook',
            name: 'Webhook Notifications',
            type: 'async',
            enabled: this.config.channels.webhook.enabled,
            
            async send(notification) {
                try {
                    const webhookUrl = notification.recipient.webhookUrl;
                    if (!webhookUrl) {
                        throw new Error('URL webhook non configurée');
                    }
                    
                    const payload = {
                        id: notification.id,
                        type: notification.type,
                        title: notification.title,
                        content: notification.content,
                        timestamp: notification.timestamp,
                        data: notification.data
                    };
                    
                    const response = await fetch(webhookUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-FormEase-Signature': this.generateSignature(payload)
                        },
                        body: JSON.stringify(payload)
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Webhook failed: ${response.status}`);
                    }
                    
                    return { success: true, deliveredAt: new Date() };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            },
            
            generateSignature(payload) {
                // En production, utiliser HMAC avec une clé secrète
                return 'sha256=' + btoa(JSON.stringify(payload)).substring(0, 32);
            }
        });
        
        console.log('📢 Canaux de notification initialisés:', this.channels.size);
    }
    
    /**
     * Configuration des templates de notification
     */
    setupTemplates() {
        // Template système
        this.templates.set('system', {
            id: 'system',
            name: 'Notification Système',
            channels: ['inApp', 'email'],
            priority: this.priorities.normal,
            template: {
                title: '{{title}}',
                content: '{{content}}',
                icon: '⚙️'
            },
            variables: ['title', 'content', 'action_url']
        });
        
        // Template collaboration
        this.templates.set('collaboration', {
            id: 'collaboration',
            name: 'Notification Collaboration',
            channels: ['inApp', 'push'],
            priority: this.priorities.normal,
            template: {
                title: '{{user_name}} {{action}} {{document_name}}',
                content: '{{user_name}} a {{action_description}} le document "{{document_name}}"',
                icon: '🤝'
            },
            variables: ['user_name', 'action', 'action_description', 'document_name', 'document_url']
        });
        
        // Template mention
        this.templates.set('mention', {
            id: 'mention',
            name: 'Notification Mention',
            channels: ['inApp', 'push', 'email'],
            priority: this.priorities.high,
            template: {
                title: '{{user_name}} vous a mentionné',
                content: '{{user_name}} vous a mentionné dans un commentaire : "{{comment_preview}}"',
                icon: '@️⃣'
            },
            variables: ['user_name', 'comment_preview', 'comment_url']
        });
        
        // Template sécurité
        this.templates.set('security-alert', {
            id: 'security-alert',
            name: 'Alerte de Sécurité',
            channels: ['inApp', 'push', 'email'],
            priority: this.priorities.critical,
            template: {
                title: '🚨 Alerte de Sécurité',
                content: 'Activité suspecte détectée : {{threat_description}}',
                icon: '🔒'
            },
            variables: ['threat_description', 'threat_level', 'action_required']
        });
        
        // Template workflow
        this.templates.set('workflow', {
            id: 'workflow',
            name: 'Notification Workflow',
            channels: ['inApp', 'email'],
            priority: this.priorities.normal,
            template: {
                title: 'Workflow : {{workflow_name}}',
                content: '{{action_description}} - {{workflow_name}}',
                icon: '📋'
            },
            variables: ['workflow_name', 'action_description', 'status', 'next_step']
        });
        
        // Template commentaire
        this.templates.set('comment', {
            id: 'comment',
            name: 'Nouveau Commentaire',
            channels: ['inApp', 'push'],
            priority: this.priorities.normal,
            template: {
                title: 'Nouveau commentaire de {{user_name}}',
                content: '{{user_name}} a ajouté un commentaire : "{{comment_preview}}"',
                icon: '💬'
            },
            variables: ['user_name', 'comment_preview', 'document_name', 'comment_url']
        });
        
        console.log('📝 Templates de notification configurés:', this.templates.size);
    }
    
    /**
     * Envoi d'une notification
     */
    async sendNotification(notificationData) {
        try {
            // Générer un ID unique
            const notificationId = this.generateNotificationId();
            
            // Créer l'objet notification
            const notification = {
                id: notificationId,
                type: notificationData.type || this.notificationTypes.system,
                template: notificationData.template,
                recipient: notificationData.recipient,
                title: notificationData.title,
                content: notificationData.content,
                data: notificationData.data || {},
                variables: notificationData.variables || {},
                channels: notificationData.channels || this.getDefaultChannels(notificationData.type),
                priority: notificationData.priority || this.priorities.normal,
                timestamp: new Date(),
                status: this.statuses.pending,
                attempts: 0,
                metadata: {
                    source: notificationData.source || 'system',
                    category: notificationData.category,
                    tags: notificationData.tags || [],
                    context: notificationData.context
                },
                delivery: {
                    immediate: notificationData.immediate !== false,
                    scheduledFor: notificationData.scheduledFor,
                    expiresAt: notificationData.expiresAt,
                    retryPolicy: notificationData.retryPolicy || 'default'
                },
                tracking: {
                    created: new Date(),
                    sent: null,
                    delivered: null,
                    read: null,
                    clicked: null
                }
            };
            
            // Vérifier les préférences utilisateur
            if (!this.checkUserPreferences(notification)) {
                console.log('🚫 Notification bloquée par préférences utilisateur:', notificationId);
                return { success: false, reason: 'user_preferences' };
            }
            
            // Vérifier le rate limiting
            if (!this.checkRateLimit(notification)) {
                console.log('🚫 Notification bloquée par rate limiting:', notificationId);
                return { success: false, reason: 'rate_limited' };
            }
            
            // Traiter le template si spécifié
            if (notification.template) {
                this.processTemplate(notification);
            }
            
            // Sauvegarder la notification
            this.notifications.set(notificationId, notification);
            
            // Ajouter à la file de livraison
            if (notification.delivery.immediate) {
                this.addToDeliveryQueue(notification);
            } else if (notification.delivery.scheduledFor) {
                this.scheduleNotification(notification);
            }
            
            // Enregistrer l'activité
            this.recordActivity('notification_created', {
                notificationId: notificationId,
                type: notification.type,
                recipient: notification.recipient.id,
                channels: notification.channels
            });
            
            console.log('🔔 Notification créée:', notificationId);
            return { success: true, notificationId: notificationId };
            
        } catch (error) {
            console.error('Erreur envoi notification:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Traitement d'un template
     */
    processTemplate(notification) {
        const template = this.templates.get(notification.template);
        if (!template) {
            console.warn('Template introuvable:', notification.template);
            return;
        }
        
        // Remplacer les variables dans le title
        if (template.template.title) {
            notification.title = this.replaceVariables(template.template.title, notification.variables);
        }
        
        // Remplacer les variables dans le content
        if (template.template.content) {
            notification.content = this.replaceVariables(template.template.content, notification.variables);
        }
        
        // Appliquer l'icône du template
        if (template.template.icon) {
            notification.icon = template.template.icon;
        }
        
        // Utiliser les canaux du template si non spécifiés
        if (!notification.channels || notification.channels.length === 0) {
            notification.channels = template.channels;
        }
        
        // Utiliser la priorité du template si non spécifiée
        if (notification.priority === this.priorities.normal && template.priority) {
            notification.priority = template.priority;
        }
    }
    
    /**
     * Remplacement des variables dans un template
     */
    replaceVariables(template, variables) {
        let result = template;
        
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value);
        }
        
        return result;
    }
    
    /**
     * Démarrage du moteur de livraison
     */
    startDeliveryEngine() {
        // Traitement de la file de livraison
        setInterval(() => {
            this.processDeliveryQueue();
        }, 1000); // Chaque seconde
        
        // Nettoyage des notifications expirées
        setInterval(() => {
            this.cleanupExpiredNotifications();
        }, 60000); // Chaque minute
        
        // Retry des notifications échouées
        setInterval(() => {
            this.retryFailedNotifications();
        }, 300000); // Chaque 5 minutes
        
        console.log('🚀 Moteur de livraison démarré');
    }
    
    /**
     * Traitement de la file de livraison
     */
    async processDeliveryQueue() {
        if (this.deliveryQueue.length === 0) return;
        
        const batch = this.deliveryQueue.splice(0, this.config.delivery.batchSize);
        
        for (const notification of batch) {
            try {
                await this.deliverNotification(notification);
            } catch (error) {
                console.error('Erreur livraison notification:', error);
                this.handleDeliveryFailure(notification, error);
            }
        }
    }
    
    /**
     * Livraison d'une notification
     */
    async deliverNotification(notification) {
        notification.status = this.statuses.sent;
        notification.tracking.sent = new Date();
        notification.attempts++;
        
        const results = [];
        
        for (const channelId of notification.channels) {
            const channel = this.channels.get(channelId);
            
            if (!channel || !channel.enabled) {
                console.warn(`Canal ${channelId} non disponible`);
                continue;
            }
            
            try {
                const result = await channel.send(notification);
                results.push({
                    channel: channelId,
                    ...result
                });
                
                if (result.success) {
                    console.log(`✅ Notification ${notification.id} livrée via ${channelId}`);
                } else {
                    console.warn(`❌ Échec livraison ${notification.id} via ${channelId}:`, result.error);
                }
                
            } catch (error) {
                console.error(`Erreur canal ${channelId}:`, error);
                results.push({
                    channel: channelId,
                    success: false,
                    error: error.message
                });
            }
        }
        
        // Mettre à jour le statut
        const hasSuccess = results.some(r => r.success);
        const hasFailure = results.some(r => !r.success);
        
        if (hasSuccess && !hasFailure) {
            notification.status = this.statuses.delivered;
            notification.tracking.delivered = new Date();
        } else if (!hasSuccess) {
            notification.status = this.statuses.failed;
            this.failedNotifications.push(notification);
        }
        
        // Enregistrer les résultats
        notification.deliveryResults = results;
        
        // Analytics
        this.recordDelivery(notification, results);
        
        return results;
    }
    
    /**
     * Configuration du rate limiting
     */
    setupRateLimiting() {
        this.rateLimiter = {
            limits: new Map(),
            windows: new Map(),
            
            checkLimit(key, limit, windowMs = 3600000) { // 1 heure par défaut
                const now = Date.now();
                const windowStart = now - windowMs;
                
                if (!this.windows.has(key)) {
                    this.windows.set(key, []);
                }
                
                const window = this.windows.get(key);
                
                // Nettoyer les anciens événements
                while (window.length > 0 && window[0] < windowStart) {
                    window.shift();
                }
                
                // Vérifier la limite
                if (window.length >= limit) {
                    return false;
                }
                
                // Ajouter l'événement actuel
                window.push(now);
                return true;
            },
            
            addEvent(key) {
                if (!this.windows.has(key)) {
                    this.windows.set(key, []);
                }
                this.windows.get(key).push(Date.now());
            }
        };
    }
    
    /**
     * Vérification du rate limiting
     */
    checkRateLimit(notification) {
        if (!this.config.rateLimiting.enabled) {
            return true;
        }
        
        const userId = notification.recipient.id;
        const type = notification.type;
        
        // Limite globale
        if (!this.rateLimiter.checkLimit('global', this.config.rateLimiting.globalLimit)) {
            return false;
        }
        
        // Limite par utilisateur
        if (!this.rateLimiter.checkLimit(`user:${userId}`, this.config.rateLimiting.perUserLimit)) {
            return false;
        }
        
        // Limite par canal
        for (const channel of notification.channels) {
            if (!this.rateLimiter.checkLimit(`channel:${channel}`, this.config.rateLimiting.perChannelLimit)) {
                return false;
            }
        }
        
        // Limite burst (1 minute)
        if (!this.rateLimiter.checkLimit(`burst:${userId}`, this.config.rateLimiting.burstLimit, 60000)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Vérification des préférences utilisateur
     */
    checkUserPreferences(notification) {
        const userId = notification.recipient.id;
        const preferences = this.preferences.get(userId);
        
        if (!preferences) {
            return true; // Autoriser par défaut
        }
        
        // Vérifier si le type est activé
        if (preferences.types && !preferences.types[notification.type]) {
            return false;
        }
        
        // Vérifier les canaux
        if (preferences.channels) {
            notification.channels = notification.channels.filter(channel => 
                preferences.channels[channel] !== false
            );
            
            if (notification.channels.length === 0) {
                return false;
            }
        }
        
        // Vérifier les heures de silence
        if (preferences.quietHours) {
            const now = new Date();
            const hour = now.getHours();
            
            if (hour >= preferences.quietHours.start || hour < preferences.quietHours.end) {
                // Seulement les notifications urgentes
                return notification.priority >= this.priorities.urgent;
            }
        }
        
        return true;
    }
    
    /**
     * Initialisation des préférences
     */
    initializePreferences() {
        // Préférences par défaut
        const defaultPreferences = {
            types: {
                system: true,
                collaboration: true,
                security: true,
                workflow: true,
                social: true,
                marketing: false,
                emergency: true
            },
            channels: {
                inApp: true,
                email: true,
                push: false,
                desktop: false,
                sms: false,
                webhook: false
            },
            quietHours: {
                enabled: false,
                start: 22, // 22h
                end: 8     // 8h
            },
            frequency: {
                immediate: true,
                digest: false,
                digestFrequency: 'daily' // daily, weekly
            }
        };
        
        // Charger les préférences utilisateur
        this.loadUserPreferences();
        
        console.log('⚙️ Préférences de notification initialisées');
    }
    
    /**
     * Initialisation de l'analytics
     */
    initializeAnalytics() {
        this.analyticsEngine = {
            metrics: new Map(),
            events: [],
            
            track(event, data) {
                const eventData = {
                    id: this.generateEventId(),
                    type: event,
                    data: data,
                    timestamp: new Date(),
                    session: this.getSessionId()
                };
                
                this.events.push(eventData);
                
                // Mettre à jour les métriques
                this.updateMetrics(event, data);
                
                // Limiter la taille du log
                if (this.events.length > 10000) {
                    this.events = this.events.slice(-5000);
                }
            },
            
            updateMetrics(event, data) {
                const metric = this.metrics.get(event) || {
                    count: 0,
                    lastUpdated: new Date(),
                    data: {}
                };
                
                metric.count++;
                metric.lastUpdated = new Date();
                
                // Agrégations spécifiques par type d'événement
                switch (event) {
                    case 'notification_sent':
                        metric.byChannel = metric.byChannel || {};
                        metric.byType = metric.byType || {};
                        
                        if (data.channel) {
                            metric.byChannel[data.channel] = (metric.byChannel[data.channel] || 0) + 1;
                        }
                        if (data.type) {
                            metric.byType[data.type] = (metric.byType[data.type] || 0) + 1;
                        }
                        break;
                        
                    case 'notification_delivered':
                        metric.successRate = this.calculateSuccessRate();
                        break;
                        
                    case 'notification_clicked':
                        metric.clickRate = this.calculateClickRate();
                        break;
                }
                
                this.metrics.set(event, metric);
            },
            
            getMetrics(event) {
                return this.metrics.get(event);
            },
            
            getAllMetrics() {
                const summary = {};
                
                for (const [event, metric] of this.metrics.entries()) {
                    summary[event] = metric;
                }
                
                return summary;
            },
            
            calculateSuccessRate() {
                const sent = this.metrics.get('notification_sent')?.count || 0;
                const delivered = this.metrics.get('notification_delivered')?.count || 0;
                
                return sent > 0 ? (delivered / sent) * 100 : 0;
            },
            
            calculateClickRate() {
                const delivered = this.metrics.get('notification_delivered')?.count || 0;
                const clicked = this.metrics.get('notification_clicked')?.count || 0;
                
                return delivered > 0 ? (clicked / delivered) * 100 : 0;
            },
            
            generateEventId() {
                return `event_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            },
            
            getSessionId() {
                return 'session_' + Date.now();
            }
        };
        
        console.log('📊 Analytics initialisées');
    }
    
    /**
     * API publique
     */
    
    // Marquer une notification comme lue
    markAsRead(notificationId, userId) {
        const notification = this.notifications.get(notificationId);
        if (!notification || notification.recipient.id !== userId) {
            return false;
        }
        
        notification.tracking.read = new Date();
        notification.status = this.statuses.read;
        
        // Analytics
        this.analyticsEngine.track('notification_read', {
            notificationId: notificationId,
            type: notification.type,
            timeTo: notification.tracking.read - notification.tracking.delivered
        });
        
        return true;
    }
    
    // Marquer une notification comme cliquée
    markAsClicked(notificationId, userId, action = null) {
        const notification = this.notifications.get(notificationId);
        if (!notification || notification.recipient.id !== userId) {
            return false;
        }
        
        notification.tracking.clicked = new Date();
        
        if (action) {
            notification.clickedAction = action;
        }
        
        // Analytics
        this.analyticsEngine.track('notification_clicked', {
            notificationId: notificationId,
            type: notification.type,
            action: action,
            timeTo: notification.tracking.clicked - notification.tracking.delivered
        });
        
        return true;
    }
    
    // Obtenir les notifications d'un utilisateur
    getUserNotifications(userId, filters = {}) {
        const userNotifications = Array.from(this.notifications.values())
            .filter(notification => notification.recipient.id === userId);
        
        // Appliquer les filtres
        let filtered = userNotifications;
        
        if (filters.unreadOnly) {
            filtered = filtered.filter(notification => !notification.tracking.read);
        }
        
        if (filters.type) {
            filtered = filtered.filter(notification => notification.type === filters.type);
        }
        
        if (filters.priority) {
            filtered = filtered.filter(notification => notification.priority >= filters.priority);
        }
        
        if (filters.since) {
            filtered = filtered.filter(notification => notification.timestamp >= filters.since);
        }
        
        // Trier par date décroissante
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        
        return filtered;
    }
    
    // Mettre à jour les préférences utilisateur
    updateUserPreferences(userId, preferences) {
        const currentPreferences = this.preferences.get(userId) || {};
        const updatedPreferences = { ...currentPreferences, ...preferences };
        
        this.preferences.set(userId, updatedPreferences);
        this.saveUserPreferences(userId, updatedPreferences);
        
        console.log(`⚙️ Préférences mises à jour pour ${userId}`);
        return updatedPreferences;
    }
    
    // Obtenir les préférences utilisateur
    getUserPreferences(userId) {
        return this.preferences.get(userId);
    }
    
    // Annuler une notification programmée
    cancelNotification(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (!notification) {
            return false;
        }
        
        notification.status = this.statuses.cancelled;
        
        // Retirer de la file de livraison
        this.deliveryQueue = this.deliveryQueue.filter(n => n.id !== notificationId);
        
        return true;
    }
    
    /**
     * Fonctions utilitaires
     */
    generateNotificationId() {
        return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    
    getDefaultChannels(type) {
        const defaults = {
            system: ['inApp'],
            collaboration: ['inApp', 'push'],
            security: ['inApp', 'push', 'email'],
            workflow: ['inApp', 'email'],
            social: ['inApp', 'push'],
            marketing: ['email'],
            emergency: ['inApp', 'push', 'email']
        };
        
        return defaults[type] || ['inApp'];
    }
    
    addToDeliveryQueue(notification) {
        this.deliveryQueue.push(notification);
        
        // Trier par priorité (plus haute d'abord)
        this.deliveryQueue.sort((a, b) => b.priority - a.priority);
        
        // Limiter la taille de la file
        if (this.deliveryQueue.length > this.config.delivery.queueLimit) {
            this.deliveryQueue = this.deliveryQueue.slice(0, this.config.delivery.queueLimit);
        }
    }
    
    scheduleNotification(notification) {
        const delay = notification.delivery.scheduledFor.getTime() - Date.now();
        
        if (delay > 0) {
            setTimeout(() => {
                this.addToDeliveryQueue(notification);
            }, delay);
        } else {
            // Déjà en retard, livrer immédiatement
            this.addToDeliveryQueue(notification);
        }
    }
    
    handleDeliveryFailure(notification, error) {
        notification.lastError = error.message;
        notification.lastAttempt = new Date();
        
        if (notification.attempts < this.config.delivery.retryAttempts) {
            // Programmer un retry
            const delay = this.config.delivery.retryDelay * Math.pow(2, notification.attempts - 1);
            
            setTimeout(() => {
                this.addToDeliveryQueue(notification);
            }, delay);
        } else {
            // Échec définitif
            notification.status = this.statuses.failed;
            console.error(`❌ Échec définitif pour notification ${notification.id}`);
        }
    }
    
    retryFailedNotifications() {
        const now = Date.now();
        const retryableNotifications = this.failedNotifications.filter(notification => {
            const timeSinceLastAttempt = now - notification.lastAttempt?.getTime();
            return timeSinceLastAttempt > this.config.delivery.retryDelay && 
                   notification.attempts < this.config.delivery.retryAttempts;
        });
        
        for (const notification of retryableNotifications) {
            this.addToDeliveryQueue(notification);
        }
        
        // Nettoyer les notifications qui ne peuvent plus être retentées
        this.failedNotifications = this.failedNotifications.filter(notification => 
            notification.attempts < this.config.delivery.retryAttempts
        );
    }
    
    cleanupExpiredNotifications() {
        const now = new Date();
        let cleaned = 0;
        
        for (const [notificationId, notification] of this.notifications.entries()) {
            if (notification.delivery.expiresAt && notification.delivery.expiresAt < now) {
                notification.status = this.statuses.expired;
                this.notifications.delete(notificationId);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} notifications expirées nettoyées`);
        }
    }
    
    recordActivity(action, data) {
        console.log(`📝 [NOTIFICATION] ${action}:`, data);
    }
    
    recordDelivery(notification, results) {
        this.analyticsEngine.track('notification_sent', {
            notificationId: notification.id,
            type: notification.type,
            channels: notification.channels,
            priority: notification.priority,
            results: results
        });
        
        if (results.some(r => r.success)) {
            this.analyticsEngine.track('notification_delivered', {
                notificationId: notification.id,
                successfulChannels: results.filter(r => r.success).map(r => r.channel)
            });
        }
    }
    
    async loadUserPreferences() {
        // En production, charger depuis la base de données
        console.log('📥 Chargement des préférences utilisateur...');
    }
    
    async saveUserPreferences(userId, preferences) {
        // En production, sauvegarder en base de données
        console.log('💾 Sauvegarde des préférences pour', userId);
    }
    
    setupEventHandlers() {
        // Écouter les événements de collaboration
        document.addEventListener('userJoined', (event) => {
            this.sendNotification({
                type: this.notificationTypes.collaboration,
                template: 'collaboration',
                recipient: { id: 'all' }, // Broadcast
                variables: {
                    user_name: event.detail.user.name,
                    action: 'a rejoint',
                    action_description: 'rejoint la session',
                    document_name: event.detail.documentName
                }
            });
        });
        
        // Écouter les mentions
        document.addEventListener('mentionTriggered', (event) => {
            this.sendNotification({
                type: this.notificationTypes.social,
                template: 'mention',
                recipient: { id: event.detail.mentionedUserId },
                priority: this.priorities.high,
                variables: {
                    user_name: event.detail.userName,
                    comment_preview: event.detail.commentPreview,
                    comment_url: event.detail.commentUrl
                }
            });
        });
    }
    
    /**
     * API de statut et analytics
     */
    getNotificationStats() {
        return {
            total: this.notifications.size,
            pending: Array.from(this.notifications.values()).filter(n => n.status === this.statuses.pending).length,
            sent: Array.from(this.notifications.values()).filter(n => n.status === this.statuses.sent).length,
            delivered: Array.from(this.notifications.values()).filter(n => n.status === this.statuses.delivered).length,
            failed: Array.from(this.notifications.values()).filter(n => n.status === this.statuses.failed).length,
            queueSize: this.deliveryQueue.length,
            analytics: this.analyticsEngine.getAllMetrics()
        };
    }
    
    getChannelStatus() {
        const status = {};
        
        for (const [channelId, channel] of this.channels.entries()) {
            status[channelId] = {
                enabled: channel.enabled,
                type: channel.type,
                priority: channel.priority
            };
        }
        
        return status;
    }
}

// Export pour compatibilité navigateur
window.NotificationRouter = NotificationRouter;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.notificationRouter) {
        window.notificationRouter = new NotificationRouter();
        console.log('🔔 NotificationRouter initialisé globalement');
    }
});

/**
 * 🎯 TriggerManager.js - FormEase Sprint 3 Phase 2
 * 
 * Gestionnaire central de déclencheurs pour automatisations
 * Surveillance en temps réel et exécution des triggers
 * 
 * Fonctionnalités :
 * - Surveillance continue des événements
 * - Déclenchement automatique des workflows
 * - Gestion des conditions et filtres
 * - Planification temporelle avancée
 * - Monitoring et analytics des déclenchements
 * - Système de priorités et throttling
 * 
 * @version 3.0.0
 * @author FormEase Team
 * @since Sprint 3 Phase 2
 */

class TriggerManager {
    constructor() {
        this.activeTriggers = new Map();
        this.eventListeners = new Map();
        this.scheduledTriggers = new Map();
        this.triggerHistory = [];
        this.webhookEndpoints = new Map();
        
        this.metrics = {
            totalTriggers: 0,
            activeTriggers: 0,
            triggersExecuted: 0,
            triggersSuccessful: 0,
            triggersFailed: 0,
            averageResponseTime: 0,
            lastExecution: null
        };
        
        this.config = {
            maxConcurrentTriggers: 50,
            historyRetentionDays: 30,
            throttleWindow: 1000, // ms
            maxTriggersPerSecond: 10,
            retryAttempts: 3,
            retryDelay: 1000
        };
        
        this.eventTypes = {
            form: ['submitted', 'updated', 'approved', 'rejected', 'deleted'],
            user: ['login', 'logout', 'registered', 'updated', 'inactive'],
            system: ['startup', 'shutdown', 'error', 'maintenance'],
            data: ['threshold', 'anomaly', 'sync'],
            external: ['webhook', 'api-call', 'file-upload'],
            time: ['scheduled', 'deadline', 'reminder']
        };
        
        this.priorityLevels = {
            critical: 1,
            high: 2,
            normal: 3,
            low: 4,
            background: 5
        };
        
        this.init();
    }
    
    /**
     * Initialisation du gestionnaire de déclencheurs
     */
    init() {
        this.setupEventListeners();
        this.initializeScheduler();
        this.setupWebhookServer();
        this.startMonitoring();
        this.loadPersistedTriggers();
        console.log('🎯 TriggerManager v3.0 initialisé');
    }
    
    /**
     * Configuration des écouteurs d'événements
     */
    setupEventListeners() {
        // Événements de formulaires
        document.addEventListener('formSubmitted', (event) => {
            this.handleEvent('form.submitted', event.detail);
        });
        
        document.addEventListener('formUpdated', (event) => {
            this.handleEvent('form.updated', event.detail);
        });
        
        document.addEventListener('formApproved', (event) => {
            this.handleEvent('form.approved', event.detail);
        });
        
        // Événements utilisateur
        document.addEventListener('userLogin', (event) => {
            this.handleEvent('user.login', event.detail);
        });
        
        document.addEventListener('userRegistered', (event) => {
            this.handleEvent('user.registered', event.detail);
        });
        
        // Événements système
        window.addEventListener('beforeunload', () => {
            this.handleEvent('system.shutdown', { timestamp: new Date() });
        });
        
        document.addEventListener('DOMContentLoaded', () => {
            this.handleEvent('system.startup', { timestamp: new Date() });
        });
        
        // Surveillance des erreurs globales
        window.addEventListener('error', (event) => {
            this.handleEvent('system.error', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                timestamp: new Date()
            });
        });
        
        console.log('👂 Écouteurs d\'événements configurés');
    }
    
    /**
     * Initialisation du planificateur
     */
    initializeScheduler() {
        // Vérification des déclencheurs planifiés toutes les minutes
        setInterval(() => {
            this.checkScheduledTriggers();
        }, 60000);
        
        // Nettoyage de l'historique quotidien
        setInterval(() => {
            this.cleanupHistory();
        }, 24 * 60 * 60 * 1000);
        
        console.log('⏰ Planificateur initialisé');
    }
    
    /**
     * Configuration du serveur webhook
     */
    setupWebhookServer() {
        // En environnement réel, ceci serait un vrai serveur HTTP
        // Ici on simule avec des endpoints en mémoire
        
        this.webhookEndpoints.set('default', {
            path: '/webhook',
            authentication: 'none',
            triggers: []
        });
        
        console.log('🔗 Serveur webhook configuré');
    }
    
    /**
     * Démarrage du monitoring
     */
    startMonitoring() {
        // Collecte de métriques toutes les 30 secondes
        setInterval(() => {
            this.updateMetrics();
        }, 30000);
        
        // Monitoring de performance
        setInterval(() => {
            this.monitorPerformance();
        }, 5000);
        
        console.log('📊 Monitoring démarré');
    }
    
    /**
     * Chargement des déclencheurs persistés
     */
    loadPersistedTriggers() {
        try {
            const savedTriggers = localStorage.getItem('formease-triggers');
            if (savedTriggers) {
                const triggers = JSON.parse(savedTriggers);
                triggers.forEach(trigger => {
                    this.registerTrigger(trigger);
                });
                console.log(`🔄 ${triggers.length} déclencheurs chargés depuis le stockage`);
            }
        } catch (error) {
            console.error('Erreur chargement déclencheurs :', error);
        }
    }
    
    /**
     * Enregistrement d'un déclencheur
     */
    registerTrigger(triggerConfig) {
        const triggerId = triggerConfig.id || 'trigger_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const trigger = {
            id: triggerId,
            type: triggerConfig.type,
            event: triggerConfig.event,
            conditions: triggerConfig.conditions || {},
            actions: triggerConfig.actions || [],
            priority: triggerConfig.priority || 'normal',
            enabled: triggerConfig.enabled !== false,
            throttle: triggerConfig.throttle || 0,
            cooldown: triggerConfig.cooldown || 0,
            maxExecutions: triggerConfig.maxExecutions || null,
            schedule: triggerConfig.schedule || null,
            webhook: triggerConfig.webhook || null,
            metadata: {
                created: new Date(),
                lastTriggered: null,
                executionCount: 0,
                successCount: 0,
                failureCount: 0,
                averageExecutionTime: 0
            },
            ...triggerConfig
        };
        
        this.activeTriggers.set(triggerId, trigger);
        
        // Configuration spéciale selon le type
        switch (trigger.type) {
            case 'scheduled':
                this.scheduleTimeTrigger(trigger);
                break;
            case 'webhook':
                this.setupWebhookTrigger(trigger);
                break;
            case 'data-threshold':
                this.setupDataMonitoring(trigger);
                break;
        }
        
        this.metrics.totalTriggers++;
        this.metrics.activeTriggers = this.activeTriggers.size;
        
        // Persistance
        this.persistTriggers();
        
        console.log('✅ Déclencheur enregistré :', triggerId, trigger.type);
        return trigger;
    }
    
    /**
     * Gestion des événements
     */
    async handleEvent(eventType, eventData) {
        const startTime = Date.now();
        
        try {
            // Trouver les déclencheurs correspondants
            const matchingTriggers = this.findMatchingTriggers(eventType, eventData);
            
            if (matchingTriggers.length === 0) {
                return;
            }
            
            console.log(`🎯 Événement ${eventType} - ${matchingTriggers.length} déclencheur(s) trouvé(s)`);
            
            // Trier par priorité
            matchingTriggers.sort((a, b) => this.priorityLevels[a.priority] - this.priorityLevels[b.priority]);
            
            // Exécuter les déclencheurs
            const results = await Promise.allSettled(
                matchingTriggers.map(trigger => this.executeTrigger(trigger, eventData))
            );
            
            // Traiter les résultats
            let successCount = 0;
            let failureCount = 0;
            
            results.forEach((result, index) => {
                const trigger = matchingTriggers[index];
                
                if (result.status === 'fulfilled') {
                    successCount++;
                    trigger.metadata.successCount++;
                } else {
                    failureCount++;
                    trigger.metadata.failureCount++;
                    console.error(`Erreur déclencheur ${trigger.id}:`, result.reason);
                }
                
                trigger.metadata.lastTriggered = new Date();
                trigger.metadata.executionCount++;
            });
            
            // Mise à jour des métriques
            this.metrics.triggersExecuted += matchingTriggers.length;
            this.metrics.triggersSuccessful += successCount;
            this.metrics.triggersFailed += failureCount;
            this.metrics.lastExecution = new Date();
            this.metrics.averageResponseTime = this.calculateAverageResponseTime(Date.now() - startTime);
            
            // Historique
            this.addToHistory({
                eventType,
                eventData,
                triggersExecuted: matchingTriggers.length,
                successCount,
                failureCount,
                timestamp: new Date(),
                duration: Date.now() - startTime
            });
            
        } catch (error) {
            console.error('Erreur gestion événement :', error);
            this.metrics.triggersFailed++;
        }
    }
    
    /**
     * Recherche des déclencheurs correspondants
     */
    findMatchingTriggers(eventType, eventData) {
        const matchingTriggers = [];
        
        for (const trigger of this.activeTriggers.values()) {
            if (!trigger.enabled) continue;
            
            // Vérifier le type d'événement
            if (trigger.event !== eventType) continue;
            
            // Vérifier le throttling
            if (trigger.throttle > 0 && trigger.metadata.lastTriggered) {
                const timeSinceLastTrigger = Date.now() - trigger.metadata.lastTriggered.getTime();
                if (timeSinceLastTrigger < trigger.throttle) continue;
            }
            
            // Vérifier le nombre maximum d'exécutions
            if (trigger.maxExecutions && trigger.metadata.executionCount >= trigger.maxExecutions) {
                continue;
            }
            
            // Vérifier les conditions
            if (this.evaluateConditions(trigger.conditions, eventData)) {
                matchingTriggers.push(trigger);
            }
        }
        
        return matchingTriggers;
    }
    
    /**
     * Évaluation des conditions de déclenchement
     */
    evaluateConditions(conditions, eventData) {
        if (!conditions || Object.keys(conditions).length === 0) {
            return true;
        }
        
        try {
            // Conditions simples
            for (const [key, expectedValue] of Object.entries(conditions)) {
                if (key === 'script') {
                    // Évaluation de script personnalisé
                    return this.evaluateScript(expectedValue, eventData);
                }
                
                const actualValue = this.getNestedValue(eventData, key);
                
                if (typeof expectedValue === 'object' && expectedValue.operator) {
                    // Conditions avec opérateurs
                    if (!this.evaluateOperatorCondition(actualValue, expectedValue)) {
                        return false;
                    }
                } else {
                    // Comparaison directe
                    if (actualValue !== expectedValue) {
                        return false;
                    }
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('Erreur évaluation conditions :', error);
            return false;
        }
    }
    
    /**
     * Évaluation des conditions avec opérateurs
     */
    evaluateOperatorCondition(actualValue, condition) {
        const { operator, value } = condition;
        
        switch (operator) {
            case 'equals':
                return actualValue === value;
            case 'not_equals':
                return actualValue !== value;
            case 'greater_than':
                return actualValue > value;
            case 'less_than':
                return actualValue < value;
            case 'greater_equal':
                return actualValue >= value;
            case 'less_equal':
                return actualValue <= value;
            case 'contains':
                return String(actualValue).toLowerCase().includes(String(value).toLowerCase());
            case 'not_contains':
                return !String(actualValue).toLowerCase().includes(String(value).toLowerCase());
            case 'starts_with':
                return String(actualValue).toLowerCase().startsWith(String(value).toLowerCase());
            case 'ends_with':
                return String(actualValue).toLowerCase().endsWith(String(value).toLowerCase());
            case 'regex':
                return new RegExp(value).test(String(actualValue));
            case 'in':
                return Array.isArray(value) && value.includes(actualValue);
            case 'not_in':
                return Array.isArray(value) && !value.includes(actualValue);
            default:
                return false;
        }
    }
    
    /**
     * Évaluation de script personnalisé
     */
    evaluateScript(script, eventData) {
        try {
            const func = new Function('data', 'event', `
                "use strict";
                ${script}
            `);
            return Boolean(func(eventData, eventData));
        } catch (error) {
            console.error('Erreur évaluation script :', error);
            return false;
        }
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
     * Exécution d'un déclencheur
     */
    async executeTrigger(trigger, eventData) {
        const startTime = Date.now();
        
        try {
            console.log(`🚀 Exécution déclencheur ${trigger.id} (${trigger.type})`);
            
            // Préparation du contexte d'exécution
            const executionContext = {
                triggerId: trigger.id,
                eventType: trigger.event,
                eventData: eventData,
                timestamp: new Date(),
                metadata: trigger.metadata
            };
            
            // Exécution des actions du déclencheur
            const results = [];
            
            for (const action of trigger.actions) {
                try {
                    const actionResult = await this.executeAction(action, executionContext);
                    results.push(actionResult);
                } catch (actionError) {
                    console.error(`Erreur action ${action.type}:`, actionError);
                    results.push({
                        success: false,
                        error: actionError.message,
                        action: action.type
                    });
                }
            }
            
            // Mise à jour des métriques du déclencheur
            const executionTime = Date.now() - startTime;
            trigger.metadata.averageExecutionTime = this.calculateAverageExecutionTime(
                trigger.metadata.averageExecutionTime,
                executionTime,
                trigger.metadata.executionCount
            );
            
            return {
                success: true,
                results: results,
                executionTime: executionTime,
                timestamp: new Date()
            };
            
        } catch (error) {
            console.error(`Erreur exécution déclencheur ${trigger.id}:`, error);
            throw error;
        }
    }
    
    /**
     * Exécution d'une action
     */
    async executeAction(action, context) {
        const startTime = Date.now();
        
        switch (action.type) {
            case 'start-workflow':
                return await this.executeWorkflowAction(action, context);
                
            case 'send-notification':
                return await this.executeNotificationAction(action, context);
                
            case 'webhook-call':
                return await this.executeWebhookAction(action, context);
                
            case 'data-transform':
                return await this.executeDataTransformAction(action, context);
                
            case 'log-event':
                return await this.executeLogAction(action, context);
                
            default:
                throw new Error(`Type d'action non supporté : ${action.type}`);
        }
    }
    
    /**
     * Exécution d'action workflow
     */
    async executeWorkflowAction(action, context) {
        try {
            if (window.workflowEngine) {
                const result = await window.workflowEngine.startWorkflow(
                    action.workflowId,
                    {
                        trigger: context,
                        eventData: context.eventData
                    }
                );
                
                return {
                    success: true,
                    workflowId: action.workflowId,
                    executionId: result.id,
                    message: 'Workflow démarré avec succès'
                };
            } else {
                throw new Error('WorkflowEngine non disponible');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                workflowId: action.workflowId
            };
        }
    }
    
    /**
     * Exécution d'action notification
     */
    async executeNotificationAction(action, context) {
        try {
            // Simulation d'envoi de notification
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return {
                success: true,
                type: action.notificationType || 'email',
                recipients: action.recipients || [],
                message: 'Notification envoyée'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Exécution d'action webhook
     */
    async executeWebhookAction(action, context) {
        try {
            // Simulation d'appel webhook
            await new Promise(resolve => setTimeout(resolve, 200));
            
            return {
                success: true,
                url: action.url,
                method: action.method || 'POST',
                status: 200,
                message: 'Webhook appelé avec succès'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                url: action.url
            };
        }
    }
    
    /**
     * Exécution d'action transformation de données
     */
    async executeDataTransformAction(action, context) {
        try {
            const transformedData = { ...context.eventData };
            
            // Application des transformations
            if (action.transformations) {
                for (const transform of action.transformations) {
                    switch (transform.type) {
                        case 'map':
                            transformedData[transform.target] = transformedData[transform.source];
                            break;
                        case 'format':
                            if (transform.format === 'uppercase') {
                                transformedData[transform.field] = String(transformedData[transform.field]).toUpperCase();
                            }
                            break;
                        case 'calculate':
                            // Calculs simples
                            break;
                    }
                }
            }
            
            return {
                success: true,
                originalData: context.eventData,
                transformedData: transformedData,
                message: 'Données transformées'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Exécution d'action log
     */
    async executeLogAction(action, context) {
        const logEntry = {
            timestamp: new Date(),
            level: action.level || 'info',
            message: action.message || 'Déclencheur exécuté',
            context: context,
            data: context.eventData
        };
        
        console.log(`[${logEntry.level.toUpperCase()}] Trigger Log:`, logEntry.message);
        
        return {
            success: true,
            logged: true,
            level: logEntry.level,
            message: logEntry.message
        };
    }
    
    /**
     * Planification de déclencheur temporel
     */
    scheduleTimeTrigger(trigger) {
        if (!trigger.schedule) return;
        
        const schedule = trigger.schedule;
        let nextExecution = null;
        
        switch (schedule.type) {
            case 'interval':
                nextExecution = new Date(Date.now() + schedule.interval);
                break;
            case 'daily':
                nextExecution = this.getNextDailyExecution(schedule.time);
                break;
            case 'weekly':
                nextExecution = this.getNextWeeklyExecution(schedule.day, schedule.time);
                break;
            case 'monthly':
                nextExecution = this.getNextMonthlyExecution(schedule.date, schedule.time);
                break;
        }
        
        if (nextExecution) {
            this.scheduledTriggers.set(trigger.id, {
                trigger: trigger,
                nextExecution: nextExecution,
                schedule: schedule
            });
            
            console.log(`⏰ Déclencheur planifié ${trigger.id} pour ${nextExecution}`);
        }
    }
    
    /**
     * Calcul de la prochaine exécution quotidienne
     */
    getNextDailyExecution(time) {
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        
        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }
        
        return next;
    }
    
    /**
     * Calcul de la prochaine exécution hebdomadaire
     */
    getNextWeeklyExecution(dayName, time) {
        const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const targetDay = days.indexOf(dayName.toLowerCase());
        
        if (targetDay === -1) return null;
        
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        
        const daysUntilTarget = (targetDay - now.getDay() + 7) % 7;
        if (daysUntilTarget === 0 && next <= now) {
            next.setDate(next.getDate() + 7);
        } else {
            next.setDate(next.getDate() + daysUntilTarget);
        }
        
        return next;
    }
    
    /**
     * Calcul de la prochaine exécution mensuelle
     */
    getNextMonthlyExecution(date, time) {
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const next = new Date(now.getFullYear(), now.getMonth(), date, hours, minutes);
        
        if (next <= now) {
            next.setMonth(next.getMonth() + 1);
        }
        
        return next;
    }
    
    /**
     * Vérification des déclencheurs planifiés
     */
    checkScheduledTriggers() {
        const now = new Date();
        
        for (const [triggerId, scheduled] of this.scheduledTriggers) {
            if (now >= scheduled.nextExecution) {
                // Exécuter le déclencheur
                this.handleEvent(scheduled.trigger.event, {
                    scheduled: true,
                    triggerId: triggerId,
                    executionTime: now
                });
                
                // Programmer la prochaine exécution
                this.rescheduleTimeTrigger(scheduled);
            }
        }
    }
    
    /**
     * Reprogrammation d'un déclencheur temporel
     */
    rescheduleTimeTrigger(scheduled) {
        const schedule = scheduled.schedule;
        let nextExecution = null;
        
        switch (schedule.type) {
            case 'interval':
                nextExecution = new Date(Date.now() + schedule.interval);
                break;
            case 'daily':
                nextExecution = this.getNextDailyExecution(schedule.time);
                break;
            case 'weekly':
                nextExecution = this.getNextWeeklyExecution(schedule.day, schedule.time);
                break;
            case 'monthly':
                nextExecution = this.getNextMonthlyExecution(schedule.date, schedule.time);
                break;
        }
        
        if (nextExecution) {
            scheduled.nextExecution = nextExecution;
            console.log(`⏰ Déclencheur reprogrammé ${scheduled.trigger.id} pour ${nextExecution}`);
        } else {
            this.scheduledTriggers.delete(scheduled.trigger.id);
        }
    }
    
    /**
     * Configuration d'un déclencheur webhook
     */
    setupWebhookTrigger(trigger) {
        const endpoint = trigger.webhook.endpoint || '/webhook/' + trigger.id;
        
        this.webhookEndpoints.set(endpoint, {
            triggerId: trigger.id,
            authentication: trigger.webhook.authentication,
            methods: trigger.webhook.methods || ['POST'],
            trigger: trigger
        });
        
        console.log(`🔗 Webhook configuré : ${endpoint} -> ${trigger.id}`);
    }
    
    /**
     * Configuration de surveillance de données
     */
    setupDataMonitoring(trigger) {
        const dataSource = trigger.dataSource;
        const threshold = trigger.threshold;
        
        // Surveillance périodique des données
        const interval = setInterval(() => {
            this.checkDataThreshold(trigger, dataSource, threshold);
        }, dataSource.checkInterval || 300000); // 5 minutes par défaut
        
        trigger.metadata.monitoringInterval = interval;
        console.log(`📊 Surveillance de données configurée pour ${trigger.id}`);
    }
    
    /**
     * Vérification de seuil de données
     */
    async checkDataThreshold(trigger, dataSource, threshold) {
        try {
            // Simulation de récupération de données
            const currentValue = await this.getCurrentDataValue(dataSource);
            
            let thresholdMet = false;
            
            switch (threshold.operator) {
                case 'greater_than':
                    thresholdMet = currentValue > threshold.value;
                    break;
                case 'less_than':
                    thresholdMet = currentValue < threshold.value;
                    break;
                case 'equals':
                    thresholdMet = currentValue === threshold.value;
                    break;
            }
            
            if (thresholdMet) {
                this.handleEvent('data.threshold', {
                    triggerId: trigger.id,
                    dataSource: dataSource.name,
                    currentValue: currentValue,
                    threshold: threshold,
                    timestamp: new Date()
                });
            }
            
        } catch (error) {
            console.error(`Erreur vérification seuil ${trigger.id}:`, error);
        }
    }
    
    /**
     * Récupération de valeur de données (simulation)
     */
    async getCurrentDataValue(dataSource) {
        // Simulation - en réalité, ceci ferait un appel à une API ou BDD
        await new Promise(resolve => setTimeout(resolve, 100));
        
        switch (dataSource.name) {
            case 'forms_submitted_today':
                return Math.floor(Math.random() * 100) + 50;
            case 'active_users':
                return Math.floor(Math.random() * 500) + 200;
            case 'error_rate':
                return Math.random() * 5;
            default:
                return Math.random() * 1000;
        }
    }
    
    /**
     * Mise à jour des métriques
     */
    updateMetrics() {
        this.metrics.activeTriggers = this.activeTriggers.size;
        
        // Calcul du temps de réponse moyen
        const recentExecutions = this.triggerHistory
            .filter(entry => Date.now() - entry.timestamp.getTime() < 3600000) // Dernière heure
            .map(entry => entry.duration)
            .filter(duration => duration !== undefined);
        
        if (recentExecutions.length > 0) {
            this.metrics.averageResponseTime = Math.round(
                recentExecutions.reduce((sum, duration) => sum + duration, 0) / recentExecutions.length
            );
        }
    }
    
    /**
     * Monitoring de performance
     */
    monitorPerformance() {
        const activeTriggerCount = this.activeTriggers.size;
        const memoryUsage = this.estimateMemoryUsage();
        
        // Alerte si trop de déclencheurs actifs
        if (activeTriggerCount > this.config.maxConcurrentTriggers) {
            console.warn(`⚠️ Nombre élevé de déclencheurs actifs : ${activeTriggerCount}`);
        }
        
        // Alerte si utilisation mémoire élevée
        if (memoryUsage > 50) { // MB
            console.warn(`⚠️ Utilisation mémoire élevée : ${memoryUsage}MB`);
        }
    }
    
    /**
     * Estimation de l'utilisation mémoire
     */
    estimateMemoryUsage() {
        // Estimation approximative
        const triggerSize = this.activeTriggers.size * 2; // KB par déclencheur
        const historySize = this.triggerHistory.length * 1; // KB par entrée
        const webhookSize = this.webhookEndpoints.size * 0.5; // KB par webhook
        
        return Math.round((triggerSize + historySize + webhookSize) / 1024); // MB
    }
    
    /**
     * Ajout à l'historique
     */
    addToHistory(entry) {
        this.triggerHistory.push(entry);
        
        // Limite de l'historique
        if (this.triggerHistory.length > 10000) {
            this.triggerHistory = this.triggerHistory.slice(-5000);
        }
    }
    
    /**
     * Nettoyage de l'historique
     */
    cleanupHistory() {
        const retentionDate = new Date();
        retentionDate.setDate(retentionDate.getDate() - this.config.historyRetentionDays);
        
        const beforeCount = this.triggerHistory.length;
        this.triggerHistory = this.triggerHistory.filter(
            entry => entry.timestamp > retentionDate
        );
        const afterCount = this.triggerHistory.length;
        
        if (beforeCount !== afterCount) {
            console.log(`🧹 Historique nettoyé : ${beforeCount - afterCount} entrées supprimées`);
        }
    }
    
    /**
     * Calcul du temps d'exécution moyen
     */
    calculateAverageExecutionTime(currentAverage, newTime, executionCount) {
        if (executionCount <= 1) return newTime;
        return Math.round((currentAverage * (executionCount - 1) + newTime) / executionCount);
    }
    
    /**
     * Calcul du temps de réponse moyen
     */
    calculateAverageResponseTime(newResponseTime) {
        const alpha = 0.1; // Facteur de lissage
        return Math.round(this.metrics.averageResponseTime * (1 - alpha) + newResponseTime * alpha);
    }
    
    /**
     * Persistance des déclencheurs
     */
    persistTriggers() {
        try {
            const triggersToSave = Array.from(this.activeTriggers.values())
                .map(trigger => ({
                    ...trigger,
                    // Exclure les propriétés non sérialisables
                    metadata: {
                        ...trigger.metadata,
                        monitoringInterval: undefined
                    }
                }));
            
            localStorage.setItem('formease-triggers', JSON.stringify(triggersToSave));
        } catch (error) {
            console.error('Erreur sauvegarde déclencheurs :', error);
        }
    }
    
    /**
     * Suppression d'un déclencheur
     */
    unregisterTrigger(triggerId) {
        const trigger = this.activeTriggers.get(triggerId);
        if (!trigger) {
            throw new Error(`Déclencheur ${triggerId} introuvable`);
        }
        
        // Nettoyage des intervalles
        if (trigger.metadata.monitoringInterval) {
            clearInterval(trigger.metadata.monitoringInterval);
        }
        
        // Suppression des webhooks
        for (const [endpoint, config] of this.webhookEndpoints) {
            if (config.triggerId === triggerId) {
                this.webhookEndpoints.delete(endpoint);
            }
        }
        
        // Suppression des planifications
        this.scheduledTriggers.delete(triggerId);
        
        // Suppression du déclencheur
        this.activeTriggers.delete(triggerId);
        
        this.metrics.activeTriggers = this.activeTriggers.size;
        this.persistTriggers();
        
        console.log('🗑️ Déclencheur supprimé :', triggerId);
    }
    
    /**
     * Activation/désactivation d'un déclencheur
     */
    toggleTrigger(triggerId, enabled) {
        const trigger = this.activeTriggers.get(triggerId);
        if (!trigger) {
            throw new Error(`Déclencheur ${triggerId} introuvable`);
        }
        
        trigger.enabled = enabled;
        this.persistTriggers();
        
        console.log(`${enabled ? '✅' : '⏸️'} Déclencheur ${triggerId} ${enabled ? 'activé' : 'désactivé'}`);
    }
    
    /**
     * Obtenir les métriques
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Obtenir l'historique
     */
    getHistory(limit = 100) {
        return this.triggerHistory
            .slice(-limit)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    
    /**
     * Obtenir les déclencheurs actifs
     */
    getActiveTriggers() {
        return Array.from(this.activeTriggers.values());
    }
    
    /**
     * Obtenir les déclencheurs planifiés
     */
    getScheduledTriggers() {
        return Array.from(this.scheduledTriggers.values());
    }
    
    /**
     * Obtenir les endpoints webhook
     */
    getWebhookEndpoints() {
        return Array.from(this.webhookEndpoints.entries());
    }
}

// Export pour compatibilité navigateur
window.TriggerManager = TriggerManager;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.triggerManager) {
        window.triggerManager = new TriggerManager();
        console.log('🎯 TriggerManager initialisé globalement');
    }
});

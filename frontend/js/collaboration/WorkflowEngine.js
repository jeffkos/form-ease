/**
 * 🔗 WorkflowEngine.js - FormEase Sprint 4 Phase 4
 * 
 * Moteur de workflow et automatisation avancé
 * Système de workflow enterprise-grade pour FormEase
 * 
 * Fonctionnalités :
 * - Workflows configurables et automatisés
 * - Approbations et révisions multi-niveaux
 * - Déclencheurs intelligents et conditions
 * - Intégrations externes et webhooks
 * - Suivi et audit complet des processus
 * - Workflows conditionnels et parallèles
 * - Templates et réutilisabilité
 * - Analytics et optimisation des processus
 * 
 * @version 4.0.0
 * @author FormEase Collaboration Team
 * @since Sprint 4 Phase 4
 */

class WorkflowEngine {
    constructor() {
        this.workflows = new Map();
        this.instances = new Map();
        this.templates = new Map();
        this.triggers = new Map();
        this.actions = new Map();
        this.approvals = new Map();
        this.integrations = new Map();
        this.analytics = new Map();
        
        this.config = {
            execution: {
                maxConcurrentInstances: 100,
                defaultTimeout: 30 * 60 * 1000, // 30 minutes
                retryAttempts: 3,
                retryDelay: 5000, // 5 secondes
                batchSize: 10
            },
            approvals: {
                defaultExpiration: 7 * 24 * 60 * 60 * 1000, // 7 jours
                reminderInterval: 24 * 60 * 60 * 1000, // 24 heures
                escalationEnabled: true,
                parallelApprovals: true
            },
            integrations: {
                webhookTimeout: 30000, // 30 secondes
                maxRetries: 3,
                rateLimitEnabled: true,
                securityEnabled: true
            },
            audit: {
                enabled: true,
                detailLevel: 'full', // basic, full, verbose
                retention: 365, // jours
                encryption: true
            }
        };
        
        this.workflowStates = {
            draft: 'draft',
            active: 'active',
            paused: 'paused',
            completed: 'completed',
            failed: 'failed',
            cancelled: 'cancelled',
            expired: 'expired'
        };
        
        this.stepTypes = {
            approval: 'approval',
            notification: 'notification',
            transformation: 'transformation',
            validation: 'validation',
            integration: 'integration',
            condition: 'condition',
            parallel: 'parallel',
            wait: 'wait',
            webhook: 'webhook',
            script: 'script'
        };
        
        this.triggerTypes = {
            manual: 'manual',
            schedule: 'schedule',
            event: 'event',
            webhook: 'webhook',
            change: 'change',
            approval: 'approval',
            completion: 'completion'
        };
        
        this.approvalStates = {
            pending: 'pending',
            approved: 'approved',
            rejected: 'rejected',
            expired: 'expired',
            escalated: 'escalated'
        };
        
        this.executionQueue = [];
        this.runningInstances = new Map();
        this.scheduledTasks = new Map();
        
        this.init();
    }
    
    /**
     * Initialisation du moteur de workflow
     */
    init() {
        this.initializeDefaultActions();
        this.setupTriggerSystem();
        this.initializeTemplates();
        this.setupIntegrations();
        this.startExecutionEngine();
        this.initializeApprovalSystem();
        this.setupAnalytics();
        this.loadWorkflows();
        console.log('🔗 WorkflowEngine v4.0 initialisé - Mode ENTERPRISE');
    }
    
    /**
     * Création d'un workflow
     */
    async createWorkflow(workflowData) {
        try {
            // Validation du workflow
            const validationResult = this.validateWorkflow(workflowData);
            if (!validationResult.valid) {
                throw new Error(validationResult.errors.join(', '));
            }
            
            const workflowId = this.generateWorkflowId();
            
            const workflow = {
                id: workflowId,
                name: workflowData.name,
                description: workflowData.description,
                version: workflowData.version || '1.0.0',
                category: workflowData.category || 'general',
                tags: workflowData.tags || [],
                
                // Configuration
                settings: {
                    enabled: workflowData.enabled !== false,
                    timeout: workflowData.timeout || this.config.execution.defaultTimeout,
                    retryPolicy: workflowData.retryPolicy || 'default',
                    priority: workflowData.priority || 'normal',
                    concurrent: workflowData.concurrent !== false
                },
                
                // Déclencheurs
                triggers: workflowData.triggers || [],
                
                // Étapes du workflow
                steps: workflowData.steps || [],
                
                // Variables et contexte
                variables: workflowData.variables || {},
                context: workflowData.context || {},
                
                // Métadonnées
                metadata: {
                    created: new Date(),
                    createdBy: workflowData.createdBy,
                    modified: new Date(),
                    modifiedBy: workflowData.createdBy,
                    instances: 0,
                    successRate: 0,
                    averageExecutionTime: 0
                },
                
                // Permissions
                permissions: workflowData.permissions || {
                    execute: ['all'],
                    modify: ['owner', 'admin'],
                    view: ['all']
                }
            };
            
            // Compiler le workflow
            await this.compileWorkflow(workflow);
            
            // Sauvegarder
            this.workflows.set(workflowId, workflow);
            
            // Configurer les déclencheurs
            await this.setupWorkflowTriggers(workflow);
            
            // Enregistrer l'activité
            this.logActivity('workflow_created', {
                workflowId: workflowId,
                name: workflow.name,
                createdBy: workflow.metadata.createdBy
            });
            
            console.log('🔗 Workflow créé:', workflowId);
            return workflow;
            
        } catch (error) {
            console.error('Erreur création workflow:', error);
            throw error;
        }
    }
    
    /**
     * Exécution d'un workflow
     */
    async executeWorkflow(workflowId, inputs = {}, options = {}) {
        try {
            const workflow = this.workflows.get(workflowId);
            if (!workflow) {
                throw new Error('Workflow introuvable');
            }
            
            if (!workflow.settings.enabled) {
                throw new Error('Workflow désactivé');
            }
            
            // Vérifier les permissions
            if (!this.checkExecutionPermission(workflow, options.userId)) {
                throw new Error('Permissions insuffisantes');
            }
            
            // Créer une instance
            const instanceId = this.generateInstanceId();
            
            const instance = {
                id: instanceId,
                workflowId: workflowId,
                state: this.workflowStates.active,
                
                // Données
                inputs: inputs,
                outputs: {},
                variables: { ...workflow.variables, ...inputs },
                context: { ...workflow.context, ...options.context },
                
                // Exécution
                currentStep: 0,
                executedSteps: [],
                pendingSteps: [...workflow.steps],
                failedSteps: [],
                
                // Métadonnées
                metadata: {
                    started: new Date(),
                    startedBy: options.userId,
                    lastActivity: new Date(),
                    executionTime: 0,
                    retryCount: 0
                },
                
                // Configuration
                settings: {
                    timeout: options.timeout || workflow.settings.timeout,
                    priority: options.priority || workflow.settings.priority,
                    notificationEnabled: options.notifications !== false
                },
                
                // Historique
                history: [],
                
                // État des approbations
                approvals: new Map(),
                
                // Journalisation
                logs: []
            };
            
            // Sauvegarder l'instance
            this.instances.set(instanceId, instance);
            this.runningInstances.set(instanceId, instance);
            
            // Ajouter à la file d'exécution
            this.executionQueue.push(instance);
            
            // Mettre à jour les statistiques
            workflow.metadata.instances++;
            
            // Enregistrer l'activité
            this.logActivity('workflow_started', {
                workflowId: workflowId,
                instanceId: instanceId,
                startedBy: options.userId
            });
            
            console.log('🚀 Workflow démarré:', instanceId);
            return instance;
            
        } catch (error) {
            console.error('Erreur exécution workflow:', error);
            throw error;
        }
    }
    
    /**
     * Traitement d'une étape de workflow
     */
    async executeStep(instance, step) {
        try {
            this.logStep(instance, 'step_started', step);
            
            const startTime = Date.now();
            let result = null;
            
            switch (step.type) {
                case this.stepTypes.approval:
                    result = await this.executeApprovalStep(instance, step);
                    break;
                    
                case this.stepTypes.notification:
                    result = await this.executeNotificationStep(instance, step);
                    break;
                    
                case this.stepTypes.transformation:
                    result = await this.executeTransformationStep(instance, step);
                    break;
                    
                case this.stepTypes.validation:
                    result = await this.executeValidationStep(instance, step);
                    break;
                    
                case this.stepTypes.integration:
                    result = await this.executeIntegrationStep(instance, step);
                    break;
                    
                case this.stepTypes.condition:
                    result = await this.executeConditionStep(instance, step);
                    break;
                    
                case this.stepTypes.parallel:
                    result = await this.executeParallelStep(instance, step);
                    break;
                    
                case this.stepTypes.wait:
                    result = await this.executeWaitStep(instance, step);
                    break;
                    
                case this.stepTypes.webhook:
                    result = await this.executeWebhookStep(instance, step);
                    break;
                    
                case this.stepTypes.script:
                    result = await this.executeScriptStep(instance, step);
                    break;
                    
                default:
                    throw new Error(`Type d'étape non supporté: ${step.type}`);
            }
            
            const executionTime = Date.now() - startTime;
            
            // Enregistrer le résultat
            const stepResult = {
                stepId: step.id,
                type: step.type,
                name: step.name,
                status: result.success ? 'completed' : 'failed',
                result: result,
                executionTime: executionTime,
                timestamp: new Date()
            };
            
            instance.executedSteps.push(stepResult);
            instance.metadata.lastActivity = new Date();
            
            this.logStep(instance, 'step_completed', step, stepResult);
            
            return result;
            
        } catch (error) {
            this.logStep(instance, 'step_failed', step, { error: error.message });
            
            const stepResult = {
                stepId: step.id,
                type: step.type,
                name: step.name,
                status: 'failed',
                error: error.message,
                timestamp: new Date()
            };
            
            instance.failedSteps.push(stepResult);
            throw error;
        }
    }
    
    /**
     * Exécution d'une étape d'approbation
     */
    async executeApprovalStep(instance, step) {
        const approvalId = this.generateApprovalId();
        
        const approval = {
            id: approvalId,
            instanceId: instance.id,
            stepId: step.id,
            type: step.approvalType || 'single',
            
            // Configuration
            approvers: step.approvers || [],
            requiredApprovals: step.requiredApprovals || 1,
            allowParallel: step.allowParallel !== false,
            
            // État
            state: this.approvalStates.pending,
            responses: new Map(),
            
            // Contenu
            title: this.replaceVariables(step.title, instance.variables),
            description: this.replaceVariables(step.description, instance.variables),
            data: step.data || {},
            
            // Métadonnées
            metadata: {
                created: new Date(),
                expiresAt: new Date(Date.now() + (step.expiration || this.config.approvals.defaultExpiration)),
                reminderSent: false,
                escalated: false
            }
        };
        
        // Sauvegarder l'approbation
        this.approvals.set(approvalId, approval);
        instance.approvals.set(step.id, approvalId);
        
        // Envoyer les notifications d'approbation
        await this.sendApprovalNotifications(approval);
        
        // Si c'est une approbation bloquante, mettre en pause
        if (step.blocking !== false) {
            instance.state = 'waiting_approval';
            return { success: true, waiting: true, approvalId: approvalId };
        }
        
        return { success: true, approvalId: approvalId };
    }
    
    /**
     * Traitement d'une réponse d'approbation
     */
    async processApprovalResponse(approvalId, userId, response, comment = '') {
        try {
            const approval = this.approvals.get(approvalId);
            if (!approval) {
                throw new Error('Approbation introuvable');
            }
            
            // Vérifier les permissions
            if (!approval.approvers.includes(userId)) {
                throw new Error('Utilisateur non autorisé à approuver');
            }
            
            // Vérifier si déjà répondu
            if (approval.responses.has(userId)) {
                throw new Error('Approbation déjà donnée par cet utilisateur');
            }
            
            // Enregistrer la réponse
            approval.responses.set(userId, {
                response: response, // 'approved' ou 'rejected'
                comment: comment,
                timestamp: new Date(),
                userId: userId
            });
            
            // Évaluer l'état global de l'approbation
            await this.evaluateApproval(approval);
            
            // Reprendre le workflow si nécessaire
            if (approval.state !== this.approvalStates.pending) {
                await this.resumeWorkflowAfterApproval(approval);
            }
            
            console.log(`✅ Réponse d'approbation traitée: ${response}`);
            return { success: true, approvalState: approval.state };
            
        } catch (error) {
            console.error('Erreur traitement approbation:', error);
            throw error;
        }
    }
    
    /**
     * Évaluation de l'état d'une approbation
     */
    async evaluateApproval(approval) {
        const responses = Array.from(approval.responses.values());
        const approvedCount = responses.filter(r => r.response === 'approved').length;
        const rejectedCount = responses.filter(r => r.response === 'rejected').length;
        
        // Vérifier les rejets
        if (rejectedCount > 0 && approval.type !== 'majority') {
            approval.state = this.approvalStates.rejected;
            return;
        }
        
        // Vérifier les approbations selon le type
        switch (approval.type) {
            case 'single':
                if (approvedCount >= 1) {
                    approval.state = this.approvalStates.approved;
                }
                break;
                
            case 'unanimous':
                if (approvedCount === approval.approvers.length) {
                    approval.state = this.approvalStates.approved;
                } else if (rejectedCount > 0) {
                    approval.state = this.approvalStates.rejected;
                }
                break;
                
            case 'majority':
                const totalResponses = responses.length;
                const required = Math.ceil(approval.approvers.length / 2);
                
                if (approvedCount >= required) {
                    approval.state = this.approvalStates.approved;
                } else if (rejectedCount >= required) {
                    approval.state = this.approvalStates.rejected;
                }
                break;
                
            case 'quorum':
                if (approvedCount >= approval.requiredApprovals) {
                    approval.state = this.approvalStates.approved;
                }
                break;
        }
        
        // Envoyer des notifications si terminé
        if (approval.state !== this.approvalStates.pending) {
            await this.sendApprovalCompletionNotifications(approval);
        }
    }
    
    /**
     * Démarrage du moteur d'exécution
     */
    startExecutionEngine() {
        // Traitement de la file d'exécution
        setInterval(() => {
            this.processExecutionQueue();
        }, 1000); // Chaque seconde
        
        // Surveillance des timeouts
        setInterval(() => {
            this.checkTimeouts();
        }, 60000); // Chaque minute
        
        // Nettoyage des instances terminées
        setInterval(() => {
            this.cleanupCompletedInstances();
        }, 300000); // Chaque 5 minutes
        
        // Traitement des rappels d'approbation
        setInterval(() => {
            this.sendApprovalReminders();
        }, 3600000); // Chaque heure
        
        console.log('⚙️ Moteur d\'exécution démarré');
    }
    
    /**
     * Traitement de la file d'exécution
     */
    async processExecutionQueue() {
        if (this.executionQueue.length === 0) return;
        
        const batch = this.executionQueue.splice(0, this.config.execution.batchSize);
        
        for (const instance of batch) {
            try {
                await this.processInstance(instance);
            } catch (error) {
                console.error('Erreur traitement instance:', error);
                await this.handleInstanceFailure(instance, error);
            }
        }
    }
    
    /**
     * Traitement d'une instance de workflow
     */
    async processInstance(instance) {
        if (instance.state !== this.workflowStates.active) {
            return;
        }
        
        // Vérifier s'il y a des étapes à exécuter
        if (instance.pendingSteps.length === 0) {
            await this.completeWorkflow(instance);
            return;
        }
        
        // Prendre la prochaine étape
        const nextStep = instance.pendingSteps[0];
        
        try {
            const result = await this.executeStep(instance, nextStep);
            
            if (result.success) {
                // Retirer l'étape de la file
                instance.pendingSteps.shift();
                instance.currentStep++;
                
                // Si l'étape n'est pas en attente, continuer
                if (!result.waiting) {
                    // Remettre dans la file pour la prochaine étape
                    this.executionQueue.push(instance);
                }
            } else {
                // Échec de l'étape
                await this.handleStepFailure(instance, nextStep, result.error);
            }
            
        } catch (error) {
            await this.handleStepFailure(instance, nextStep, error);
        }
    }
    
    /**
     * Configuration du système de déclencheurs
     */
    setupTriggerSystem() {
        this.triggerSystem = {
            handlers: new Map(),
            scheduledTriggers: new Map(),
            
            // Déclencheur manuel
            manual: {
                register(workflow, trigger) {
                    // Rien à faire, déjà disponible via executeWorkflow
                    console.log(`🔧 Déclencheur manuel configuré pour ${workflow.id}`);
                }
            },
            
            // Déclencheur programmé
            schedule: {
                register(workflow, trigger) {
                    const cronExpression = trigger.schedule;
                    
                    // Simulation cron - en production utiliser node-cron
                    const interval = this.parseCronExpression(cronExpression);
                    
                    const scheduledTask = setInterval(async () => {
                        try {
                            await this.executeWorkflow(workflow.id, trigger.inputs || {}, {
                                userId: 'system',
                                context: { trigger: 'schedule' }
                            });
                        } catch (error) {
                            console.error('Erreur déclencheur programmé:', error);
                        }
                    }, interval);
                    
                    this.scheduledTriggers.set(`${workflow.id}_${trigger.id}`, scheduledTask);
                    console.log(`⏰ Déclencheur programmé configuré pour ${workflow.id}`);
                },
                
                parseCronExpression(cron) {
                    // Simulation simple - en production utiliser une vraie lib cron
                    const presets = {
                        '@hourly': 60 * 60 * 1000,
                        '@daily': 24 * 60 * 60 * 1000,
                        '@weekly': 7 * 24 * 60 * 60 * 1000
                    };
                    
                    return presets[cron] || 60 * 60 * 1000; // 1 heure par défaut
                }
            },
            
            // Déclencheur d'événement
            event: {
                register(workflow, trigger) {
                    const eventType = trigger.eventType;
                    
                    document.addEventListener(eventType, async (event) => {
                        try {
                            // Vérifier les conditions
                            if (this.checkTriggerConditions(trigger, event.detail)) {
                                await this.executeWorkflow(workflow.id, {
                                    eventData: event.detail
                                }, {
                                    userId: 'system',
                                    context: { trigger: 'event', eventType: eventType }
                                });
                            }
                        } catch (error) {
                            console.error('Erreur déclencheur événement:', error);
                        }
                    });
                    
                    console.log(`📡 Déclencheur d'événement configuré: ${eventType}`);
                },
                
                checkTriggerConditions(trigger, eventData) {
                    if (!trigger.conditions) return true;
                    
                    for (const condition of trigger.conditions) {
                        if (!this.evaluateCondition(condition, eventData)) {
                            return false;
                        }
                    }
                    
                    return true;
                },
                
                evaluateCondition(condition, data) {
                    const value = this.getNestedValue(data, condition.field);
                    
                    switch (condition.operator) {
                        case 'equals': return value === condition.value;
                        case 'not_equals': return value !== condition.value;
                        case 'contains': return value && value.includes(condition.value);
                        case 'greater_than': return value > condition.value;
                        case 'less_than': return value < condition.value;
                        default: return true;
                    }
                },
                
                getNestedValue(obj, path) {
                    return path.split('.').reduce((current, key) => current && current[key], obj);
                }
            },
            
            // Déclencheur webhook
            webhook: {
                register(workflow, trigger) {
                    // En production, enregistrer l'endpoint webhook
                    const webhookUrl = `/api/workflows/${workflow.id}/webhook/${trigger.id}`;
                    
                    console.log(`🔗 Webhook configuré: ${webhookUrl}`);
                    
                    // Simulation - en production, configurer le serveur
                    this.handlers.set(webhookUrl, async (data) => {
                        await this.executeWorkflow(workflow.id, data, {
                            userId: 'system',
                            context: { trigger: 'webhook' }
                        });
                    });
                }
            }
        };
    }
    
    /**
     * Initialisation des templates de workflow
     */
    initializeTemplates() {
        // Template d'approbation simple
        this.templates.set('simple-approval', {
            id: 'simple-approval',
            name: 'Approbation Simple',
            description: 'Workflow d\'approbation basique à un niveau',
            category: 'approval',
            steps: [
                {
                    id: 'approval_step',
                    type: this.stepTypes.approval,
                    name: 'Approbation',
                    approvers: ['{{approver}}'],
                    title: 'Approbation requise',
                    description: 'Veuillez approuver cette demande'
                },
                {
                    id: 'notification_step',
                    type: this.stepTypes.notification,
                    name: 'Notification',
                    template: 'workflow',
                    recipients: ['{{requester}}'],
                    message: 'Votre demande a été {{approval_result}}'
                }
            ]
        });
        
        // Template de révision collaborative
        this.templates.set('collaborative-review', {
            id: 'collaborative-review',
            name: 'Révision Collaborative',
            description: 'Processus de révision avec plusieurs réviseurs',
            category: 'review',
            steps: [
                {
                    id: 'assignment_step',
                    type: this.stepTypes.notification,
                    name: 'Attribution',
                    template: 'review_assignment',
                    recipients: ['{{reviewers}}'],
                    message: 'Un nouveau document est prêt pour révision'
                },
                {
                    id: 'review_step',
                    type: this.stepTypes.approval,
                    name: 'Révision',
                    approvers: ['{{reviewers}}'],
                    type: 'majority',
                    allowParallel: true,
                    title: 'Révision de document',
                    description: 'Veuillez réviser le document et donner votre avis'
                },
                {
                    id: 'completion_step',
                    type: this.stepTypes.notification,
                    name: 'Finalisation',
                    template: 'review_completed',
                    recipients: ['{{author}}'],
                    message: 'La révision de votre document est terminée'
                }
            ]
        });
        
        // Template de publication
        this.templates.set('publication-workflow', {
            id: 'publication-workflow',
            name: 'Workflow de Publication',
            description: 'Processus complet de publication avec validation',
            category: 'publication',
            steps: [
                {
                    id: 'validation_step',
                    type: this.stepTypes.validation,
                    name: 'Validation',
                    rules: [
                        { field: 'title', required: true },
                        { field: 'content', minLength: 100 }
                    ]
                },
                {
                    id: 'approval_step',
                    type: this.stepTypes.approval,
                    name: 'Approbation Publication',
                    approvers: ['{{editor}}'],
                    title: 'Approbation de publication',
                    description: 'Veuillez approuver la publication de ce contenu'
                },
                {
                    id: 'publication_step',
                    type: this.stepTypes.integration,
                    name: 'Publication',
                    integration: 'publish_service',
                    action: 'publish',
                    parameters: {
                        content: '{{content}}',
                        metadata: '{{metadata}}'
                    }
                }
            ]
        });
        
        console.log('📋 Templates de workflow initialisés:', this.templates.size);
    }
    
    /**
     * API publique
     */
    
    // Obtenir les workflows
    getWorkflows(filters = {}) {
        let workflows = Array.from(this.workflows.values());
        
        if (filters.category) {
            workflows = workflows.filter(w => w.category === filters.category);
        }
        
        if (filters.enabled !== undefined) {
            workflows = workflows.filter(w => w.settings.enabled === filters.enabled);
        }
        
        if (filters.createdBy) {
            workflows = workflows.filter(w => w.metadata.createdBy === filters.createdBy);
        }
        
        return workflows;
    }
    
    // Obtenir les instances
    getInstances(filters = {}) {
        let instances = Array.from(this.instances.values());
        
        if (filters.workflowId) {
            instances = instances.filter(i => i.workflowId === filters.workflowId);
        }
        
        if (filters.state) {
            instances = instances.filter(i => i.state === filters.state);
        }
        
        if (filters.startedBy) {
            instances = instances.filter(i => i.metadata.startedBy === filters.startedBy);
        }
        
        return instances;
    }
    
    // Obtenir les approbations en attente
    getPendingApprovals(userId) {
        return Array.from(this.approvals.values())
            .filter(approval => 
                approval.state === this.approvalStates.pending &&
                approval.approvers.includes(userId) &&
                !approval.responses.has(userId)
            );
    }
    
    // Mettre en pause un workflow
    pauseWorkflow(instanceId, userId) {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            return false;
        }
        
        instance.state = this.workflowStates.paused;
        instance.metadata.pausedBy = userId;
        instance.metadata.pausedAt = new Date();
        
        // Retirer de la file d'exécution
        this.executionQueue = this.executionQueue.filter(i => i.id !== instanceId);
        this.runningInstances.delete(instanceId);
        
        return true;
    }
    
    // Reprendre un workflow
    resumeWorkflow(instanceId, userId) {
        const instance = this.instances.get(instanceId);
        if (!instance || instance.state !== this.workflowStates.paused) {
            return false;
        }
        
        instance.state = this.workflowStates.active;
        instance.metadata.resumedBy = userId;
        instance.metadata.resumedAt = new Date();
        
        // Remettre dans la file d'exécution
        this.executionQueue.push(instance);
        this.runningInstances.set(instanceId, instance);
        
        return true;
    }
    
    // Annuler un workflow
    cancelWorkflow(instanceId, userId, reason = '') {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            return false;
        }
        
        instance.state = this.workflowStates.cancelled;
        instance.metadata.cancelledBy = userId;
        instance.metadata.cancelledAt = new Date();
        instance.metadata.cancellationReason = reason;
        
        // Retirer de la file d'exécution
        this.executionQueue = this.executionQueue.filter(i => i.id !== instanceId);
        this.runningInstances.delete(instanceId);
        
        // Annuler les approbations en attente
        for (const approvalId of instance.approvals.values()) {
            const approval = this.approvals.get(approvalId);
            if (approval && approval.state === this.approvalStates.pending) {
                approval.state = 'cancelled';
            }
        }
        
        return true;
    }
    
    /**
     * Fonctions utilitaires
     */
    generateWorkflowId() {
        return `workflow_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }
    
    generateInstanceId() {
        return `instance_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    
    generateApprovalId() {
        return `approval_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    }
    
    validateWorkflow(workflowData) {
        const errors = [];
        
        if (!workflowData.name || workflowData.name.trim().length === 0) {
            errors.push('Le nom du workflow est requis');
        }
        
        if (!workflowData.steps || workflowData.steps.length === 0) {
            errors.push('Le workflow doit contenir au moins une étape');
        }
        
        // Valider chaque étape
        if (workflowData.steps) {
            for (let i = 0; i < workflowData.steps.length; i++) {
                const step = workflowData.steps[i];
                
                if (!step.type) {
                    errors.push(`Étape ${i + 1}: Type requis`);
                }
                
                if (!step.id) {
                    errors.push(`Étape ${i + 1}: ID requis`);
                }
                
                // Validation spécifique par type
                if (step.type === this.stepTypes.approval && !step.approvers) {
                    errors.push(`Étape ${i + 1}: Approbateurs requis`);
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    checkExecutionPermission(workflow, userId) {
        if (!workflow.permissions || !workflow.permissions.execute) {
            return true;
        }
        
        return workflow.permissions.execute.includes('all') || 
               workflow.permissions.execute.includes(userId);
    }
    
    replaceVariables(template, variables) {
        if (!template) return template;
        
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value);
        }
        
        return result;
    }
    
    async compileWorkflow(workflow) {
        // Valider et optimiser le workflow
        for (const step of workflow.steps) {
            if (!step.id) {
                step.id = `step_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            }
        }
        
        console.log(`📋 Workflow compilé: ${workflow.id}`);
    }
    
    async setupWorkflowTriggers(workflow) {
        for (const trigger of workflow.triggers) {
            const triggerHandler = this.triggerSystem[trigger.type];
            
            if (triggerHandler && triggerHandler.register) {
                await triggerHandler.register(workflow, trigger);
            } else {
                console.warn(`Type de déclencheur non supporté: ${trigger.type}`);
            }
        }
    }
    
    logActivity(action, data) {
        console.log(`📝 [WORKFLOW] ${action}:`, data);
    }
    
    logStep(instance, action, step, data = {}) {
        const logEntry = {
            timestamp: new Date(),
            action: action,
            stepId: step.id,
            stepType: step.type,
            data: data
        };
        
        instance.logs.push(logEntry);
        
        console.log(`🔗 [${instance.id}] ${action}:`, step.name);
    }
    
    async loadWorkflows() {
        // En production, charger depuis la base de données
        console.log('📥 Chargement des workflows...');
    }
    
    /**
     * API de statut et analytics
     */
    getWorkflowStats() {
        return {
            totalWorkflows: this.workflows.size,
            activeWorkflows: Array.from(this.workflows.values()).filter(w => w.settings.enabled).length,
            runningInstances: this.runningInstances.size,
            pendingApprovals: Array.from(this.approvals.values()).filter(a => a.state === this.approvalStates.pending).length,
            queueSize: this.executionQueue.length
        };
    }
    
    getInstanceStatus(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            return null;
        }
        
        return {
            id: instance.id,
            workflowId: instance.workflowId,
            state: instance.state,
            currentStep: instance.currentStep,
            totalSteps: instance.executedSteps.length + instance.pendingSteps.length,
            progress: (instance.currentStep / (instance.executedSteps.length + instance.pendingSteps.length)) * 100,
            executionTime: Date.now() - instance.metadata.started.getTime(),
            lastActivity: instance.metadata.lastActivity
        };
    }
}

// Export pour compatibilité navigateur
window.WorkflowEngine = WorkflowEngine;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.workflowEngine) {
        window.workflowEngine = new WorkflowEngine();
        console.log('🔗 WorkflowEngine initialisé globalement');
    }
});

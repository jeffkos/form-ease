/**
 * ⚡ AutomationBuilder.js - FormEase Sprint 3 Phase 2
 * 
 * Constructeur d'automations avec interface visuelle
 * Permet de créer facilement des automations sans code
 * 
 * Fonctionnalités :
 * - Interface drag & drop pour création d'automations
 * - Bibliothèque de déclencheurs prédéfinis
 * - Actions automatisées configurables
 * - Tests et prévisualisation en temps réel
 * - Gestion des variables et conditions dynamiques
 * - Templates d'automatisation sectoriels
 * 
 * @version 3.0.0
 * @author FormEase Team
 * @since Sprint 3 Phase 2
 */

class AutomationBuilder {
    constructor() {
        this.automations = new Map();
        this.triggerLibrary = new Map();
        this.actionLibrary = new Map();
        this.templates = new Map();
        this.variables = new Map();
        
        this.builderState = {
            currentAutomation: null,
            selectedElement: null,
            draggedElement: null,
            mode: 'design', // design, test, preview
            zoom: 1,
            grid: { enabled: true, size: 20 }
        };
        
        this.categories = {
            triggers: ['form', 'time', 'user', 'data', 'external'],
            actions: ['notification', 'data', 'integration', 'workflow', 'ai'],
            templates: ['onboarding', 'approval', 'notification', 'data-processing', 'analytics']
        };
        
        this.init();
    }
    
    /**
     * Initialisation du constructeur d'automations
     */
    init() {
        this.setupTriggerLibrary();
        this.setupActionLibrary();
        this.setupTemplates();
        this.initializeBuilder();
        console.log('⚡ AutomationBuilder v3.0 initialisé');
    }
    
    /**
     * Configuration de la bibliothèque de déclencheurs
     */
    setupTriggerLibrary() {
        // Déclencheurs de formulaires
        this.triggerLibrary.set('form-submitted', {
            id: 'form-submitted',
            category: 'form',
            name: 'Formulaire Soumis',
            description: 'Se déclenche quand un formulaire est soumis',
            icon: '📝',
            config: {
                formId: { type: 'select', label: 'Formulaire', required: true },
                conditions: { type: 'conditions', label: 'Conditions additionnelles' }
            },
            example: 'Quand le formulaire "Contact" est soumis avec priorité "Haute"'
        });
        
        this.triggerLibrary.set('form-updated', {
            id: 'form-updated',
            category: 'form',
            name: 'Formulaire Modifié',
            description: 'Se déclenche quand un formulaire est modifié',
            icon: '✏️',
            config: {
                formId: { type: 'select', label: 'Formulaire', required: true },
                fields: { type: 'multiselect', label: 'Champs surveillés' }
            }
        });
        
        this.triggerLibrary.set('form-approved', {
            id: 'form-approved',
            category: 'form',
            name: 'Formulaire Approuvé',
            description: 'Se déclenche quand un formulaire est approuvé',
            icon: '✅',
            config: {
                formId: { type: 'select', label: 'Formulaire', required: true },
                approver: { type: 'select', label: 'Approbateur' }
            }
        });
        
        // Déclencheurs temporels
        this.triggerLibrary.set('schedule-daily', {
            id: 'schedule-daily',
            category: 'time',
            name: 'Planification Quotidienne',
            description: 'Se déclenche tous les jours à une heure précise',
            icon: '⏰',
            config: {
                time: { type: 'time', label: 'Heure', required: true },
                timezone: { type: 'select', label: 'Fuseau horaire', default: 'Europe/Paris' }
            }
        });
        
        this.triggerLibrary.set('schedule-weekly', {
            id: 'schedule-weekly',
            category: 'time',
            name: 'Planification Hebdomadaire',
            description: 'Se déclenche chaque semaine à un moment précis',
            icon: '📅',
            config: {
                day: { type: 'select', label: 'Jour', options: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] },
                time: { type: 'time', label: 'Heure', required: true }
            }
        });
        
        this.triggerLibrary.set('deadline-approaching', {
            id: 'deadline-approaching',
            category: 'time',
            name: 'Échéance Approchante',
            description: 'Se déclenche avant une échéance importante',
            icon: '⚠️',
            config: {
                beforeDays: { type: 'number', label: 'Jours avant échéance', default: 3 },
                forms: { type: 'multiselect', label: 'Formulaires concernés' }
            }
        });
        
        // Déclencheurs utilisateur
        this.triggerLibrary.set('user-login', {
            id: 'user-login',
            category: 'user',
            name: 'Connexion Utilisateur',
            description: 'Se déclenche quand un utilisateur se connecte',
            icon: '👤',
            config: {
                userRole: { type: 'select', label: 'Rôle utilisateur' },
                firstTime: { type: 'boolean', label: 'Première connexion uniquement' }
            }
        });
        
        this.triggerLibrary.set('user-inactive', {
            id: 'user-inactive',
            category: 'user',
            name: 'Utilisateur Inactif',
            description: 'Se déclenche quand un utilisateur est inactif',
            icon: '😴',
            config: {
                inactiveDays: { type: 'number', label: 'Jours d\'inactivité', default: 30 },
                userRole: { type: 'select', label: 'Rôle utilisateur' }
            }
        });
        
        // Déclencheurs de données
        this.triggerLibrary.set('data-threshold', {
            id: 'data-threshold',
            category: 'data',
            name: 'Seuil de Données',
            description: 'Se déclenche quand un seuil est atteint',
            icon: '📊',
            config: {
                metric: { type: 'select', label: 'Métrique', options: ['Formulaires soumis', 'Utilisateurs actifs', 'Taux de conversion'] },
                threshold: { type: 'number', label: 'Seuil', required: true },
                comparison: { type: 'select', label: 'Comparaison', options: ['>', '<', '>=', '<=', '='] }
            }
        });
        
        // Déclencheurs externes
        this.triggerLibrary.set('webhook-received', {
            id: 'webhook-received',
            category: 'external',
            name: 'Webhook Reçu',
            description: 'Se déclenche quand un webhook est reçu',
            icon: '🔗',
            config: {
                source: { type: 'text', label: 'Source webhook' },
                authentication: { type: 'select', label: 'Authentification', options: ['Aucune', 'API Key', 'Bearer Token'] }
            }
        });
        
        console.log('🎯 Bibliothèque de déclencheurs chargée :', this.triggerLibrary.size);
    }
    
    /**
     * Configuration de la bibliothèque d'actions
     */
    setupActionLibrary() {
        // Actions de notification
        this.actionLibrary.set('send-email', {
            id: 'send-email',
            category: 'notification',
            name: 'Envoyer Email',
            description: 'Envoie un email à des destinataires',
            icon: '📧',
            config: {
                recipients: { type: 'textarea', label: 'Destinataires (un par ligne)', required: true },
                subject: { type: 'text', label: 'Sujet', required: true },
                template: { type: 'select', label: 'Template email' },
                attachments: { type: 'multiselect', label: 'Pièces jointes' }
            },
            example: 'Envoie un email de bienvenue aux nouveaux utilisateurs'
        });
        
        this.actionLibrary.set('send-slack', {
            id: 'send-slack',
            category: 'notification',
            name: 'Message Slack',
            description: 'Envoie un message sur Slack',
            icon: '💬',
            config: {
                channel: { type: 'text', label: 'Canal Slack', required: true },
                message: { type: 'textarea', label: 'Message', required: true },
                mentions: { type: 'text', label: 'Mentions (@user)' }
            }
        });
        
        this.actionLibrary.set('send-sms', {
            id: 'send-sms',
            category: 'notification',
            name: 'Envoyer SMS',
            description: 'Envoie un SMS à un numéro',
            icon: '📱',
            config: {
                phoneNumber: { type: 'text', label: 'Numéro de téléphone', required: true },
                message: { type: 'textarea', label: 'Message SMS', required: true, maxLength: 160 }
            }
        });
        
        // Actions de données
        this.actionLibrary.set('save-to-database', {
            id: 'save-to-database',
            category: 'data',
            name: 'Sauvegarder en Base',
            description: 'Sauvegarde les données en base',
            icon: '💾',
            config: {
                table: { type: 'select', label: 'Table de destination', required: true },
                mapping: { type: 'mapping', label: 'Correspondance des champs' },
                duplicateAction: { type: 'select', label: 'Si doublon', options: ['Ignorer', 'Mettre à jour', 'Créer nouveau'] }
            }
        });
        
        this.actionLibrary.set('export-csv', {
            id: 'export-csv',
            category: 'data',
            name: 'Exporter CSV',
            description: 'Exporte les données au format CSV',
            icon: '📊',
            config: {
                filename: { type: 'text', label: 'Nom du fichier', required: true },
                fields: { type: 'multiselect', label: 'Champs à exporter' },
                destination: { type: 'select', label: 'Destination', options: ['Email', 'Dropbox', 'Google Drive', 'Serveur FTP'] }
            }
        });
        
        this.actionLibrary.set('transform-data', {
            id: 'transform-data',
            category: 'data',
            name: 'Transformer Données',
            description: 'Applique des transformations aux données',
            icon: '🔄',
            config: {
                transformations: { type: 'code', label: 'Script de transformation (JavaScript)' },
                outputFormat: { type: 'select', label: 'Format de sortie', options: ['JSON', 'XML', 'CSV'] }
            }
        });
        
        // Actions d'intégration
        this.actionLibrary.set('call-webhook', {
            id: 'call-webhook',
            category: 'integration',
            name: 'Appeler Webhook',
            description: 'Fait un appel HTTP vers un webhook',
            icon: '🔗',
            config: {
                url: { type: 'url', label: 'URL du webhook', required: true },
                method: { type: 'select', label: 'Méthode HTTP', options: ['GET', 'POST', 'PUT', 'DELETE'], default: 'POST' },
                headers: { type: 'keyvalue', label: 'En-têtes HTTP' },
                payload: { type: 'code', label: 'Données à envoyer (JSON)' }
            }
        });
        
        this.actionLibrary.set('sync-crm', {
            id: 'sync-crm',
            category: 'integration',
            name: 'Synchroniser CRM',
            description: 'Synchronise les données avec le CRM',
            icon: '🤝',
            config: {
                crmSystem: { type: 'select', label: 'Système CRM', options: ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho'] },
                operation: { type: 'select', label: 'Opération', options: ['Créer contact', 'Mettre à jour contact', 'Créer opportunité'] },
                mapping: { type: 'mapping', label: 'Correspondance des champs' }
            }
        });
        
        // Actions de workflow
        this.actionLibrary.set('start-workflow', {
            id: 'start-workflow',
            category: 'workflow',
            name: 'Démarrer Workflow',
            description: 'Démarre un autre workflow',
            icon: '🔄',
            config: {
                workflowId: { type: 'select', label: 'Workflow à démarrer', required: true },
                parameters: { type: 'keyvalue', label: 'Paramètres à passer' },
                wait: { type: 'boolean', label: 'Attendre la fin du workflow' }
            }
        });
        
        this.actionLibrary.set('assign-task', {
            id: 'assign-task',
            category: 'workflow',
            name: 'Assigner Tâche',
            description: 'Assigne une tâche à un utilisateur',
            icon: '📋',
            config: {
                assignee: { type: 'select', label: 'Assigné à', required: true },
                title: { type: 'text', label: 'Titre de la tâche', required: true },
                description: { type: 'textarea', label: 'Description' },
                dueDate: { type: 'date', label: 'Date d\'échéance' },
                priority: { type: 'select', label: 'Priorité', options: ['Basse', 'Normale', 'Haute', 'Urgente'] }
            }
        });
        
        // Actions IA
        this.actionLibrary.set('ai-analyze', {
            id: 'ai-analyze',
            category: 'ai',
            name: 'Analyse IA',
            description: 'Analyse les données avec l\'IA FormEase',
            icon: '🤖',
            config: {
                analysisType: { type: 'select', label: 'Type d\'analyse', options: ['Sentiment', 'Classification', 'Extraction entités', 'Résumé'] },
                inputField: { type: 'select', label: 'Champ à analyser', required: true },
                outputField: { type: 'text', label: 'Champ de résultat' }
            }
        });
        
        this.actionLibrary.set('ai-generate-response', {
            id: 'ai-generate-response',
            category: 'ai',
            name: 'Générer Réponse IA',
            description: 'Génère une réponse automatique avec l\'IA',
            icon: '💭',
            config: {
                prompt: { type: 'textarea', label: 'Prompt pour l\'IA', required: true },
                tone: { type: 'select', label: 'Ton de la réponse', options: ['Professionnel', 'Amical', 'Formel', 'Décontracté'] },
                language: { type: 'select', label: 'Langue', default: 'Français' }
            }
        });
        
        console.log('⚙️ Bibliothèque d\'actions chargée :', this.actionLibrary.size);
    }
    
    /**
     * Configuration des templates d'automatisation
     */
    setupTemplates() {
        // Template : Onboarding utilisateur
        this.templates.set('user-onboarding', {
            id: 'user-onboarding',
            name: 'Onboarding Utilisateur',
            description: 'Séquence d\'accueil pour nouveaux utilisateurs',
            category: 'onboarding',
            automation: {
                trigger: {
                    type: 'user-login',
                    config: { firstTime: true }
                },
                actions: [
                    {
                        type: 'send-email',
                        config: {
                            recipients: '{{user.email}}',
                            subject: 'Bienvenue sur FormEase !',
                            template: 'welcome-email'
                        },
                        delay: 0
                    },
                    {
                        type: 'assign-task',
                        config: {
                            assignee: '{{user.id}}',
                            title: 'Complétez votre profil',
                            description: 'Renseignez vos informations personnelles'
                        },
                        delay: 3600000 // 1 heure
                    },
                    {
                        type: 'send-email',
                        config: {
                            recipients: '{{user.email}}',
                            subject: 'Découvrez FormEase en 5 minutes',
                            template: 'tutorial-email'
                        },
                        delay: 86400000 // 24 heures
                    }
                ]
            }
        });
        
        // Template : Notification formulaire urgent
        this.templates.set('urgent-form-notification', {
            id: 'urgent-form-notification',
            name: 'Notification Formulaire Urgent',
            description: 'Alerte immédiate pour formulaires prioritaires',
            category: 'notification',
            automation: {
                trigger: {
                    type: 'form-submitted',
                    config: {
                        conditions: 'priority === "urgent"'
                    }
                },
                actions: [
                    {
                        type: 'send-slack',
                        config: {
                            channel: '#urgent',
                            message: '🚨 Formulaire urgent soumis : {{form.title}}\nPar : {{form.submitter}}\nLien : {{form.url}}',
                            mentions: '@here'
                        },
                        delay: 0
                    },
                    {
                        type: 'send-sms',
                        config: {
                            phoneNumber: '{{manager.phone}}',
                            message: 'Formulaire urgent reçu. Consultez Slack pour détails.'
                        },
                        delay: 0
                    },
                    {
                        type: 'assign-task',
                        config: {
                            assignee: '{{manager.id}}',
                            title: 'Traiter formulaire urgent',
                            priority: 'Urgente'
                        },
                        delay: 0
                    }
                ]
            }
        });
        
        // Template : Rappel échéance
        this.templates.set('deadline-reminder', {
            id: 'deadline-reminder',
            name: 'Rappel d\'Échéance',
            description: 'Rappels automatiques avant échéances',
            category: 'notification',
            automation: {
                trigger: {
                    type: 'deadline-approaching',
                    config: { beforeDays: 3 }
                },
                actions: [
                    {
                        type: 'send-email',
                        config: {
                            recipients: '{{assignee.email}}',
                            subject: 'Rappel : Échéance dans 3 jours',
                            template: 'deadline-reminder'
                        },
                        delay: 0
                    },
                    {
                        type: 'send-email',
                        config: {
                            recipients: '{{assignee.email}}',
                            subject: 'URGENT : Échéance demain !',
                            template: 'urgent-deadline'
                        },
                        delay: 172800000 // 2 jours plus tard (J-1)
                    }
                ]
            }
        });
        
        // Template : Analyse et export hebdomadaire
        this.templates.set('weekly-analytics', {
            id: 'weekly-analytics',
            name: 'Analyse Hebdomadaire',
            description: 'Rapport analytique automatique chaque semaine',
            category: 'analytics',
            automation: {
                trigger: {
                    type: 'schedule-weekly',
                    config: { day: 'Lundi', time: '09:00' }
                },
                actions: [
                    {
                        type: 'export-csv',
                        config: {
                            filename: 'rapport-hebdomadaire-{{date}}.csv',
                            fields: ['date', 'formulaires_soumis', 'utilisateurs_actifs'],
                            destination: 'Email'
                        },
                        delay: 0
                    },
                    {
                        type: 'ai-analyze',
                        config: {
                            analysisType: 'Résumé',
                            inputField: 'weekly_data'
                        },
                        delay: 0
                    },
                    {
                        type: 'send-email',
                        config: {
                            recipients: 'management@formease.com',
                            subject: 'Rapport hebdomadaire FormEase',
                            template: 'weekly-report'
                        },
                        delay: 300000 // 5 minutes après
                    }
                ]
            }
        });
        
        console.log('📋 Templates d\'automatisation chargés :', this.templates.size);
    }
    
    /**
     * Initialisation de l'interface de construction
     */
    initializeBuilder() {
        this.canvas = {
            element: null,
            width: 1200,
            height: 800,
            grid: { size: 20, visible: true },
            zoom: 1,
            pan: { x: 0, y: 0 }
        };
        
        this.palette = {
            triggers: Array.from(this.triggerLibrary.values()),
            actions: Array.from(this.actionLibrary.values())
        };
        
        this.clipboard = {
            elements: [],
            mode: null // copy, cut
        };
    }
    
    /**
     * Création d'une nouvelle automatisation
     */
    createAutomation(config = {}) {
        const automationId = 'auto_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const automation = {
            id: automationId,
            name: config.name || `Automatisation ${automationId}`,
            description: config.description || '',
            status: 'draft', // draft, active, paused, archived
            created: new Date(),
            modified: new Date(),
            trigger: config.trigger || null,
            actions: config.actions || [],
            conditions: config.conditions || [],
            variables: config.variables || {},
            settings: {
                enabled: false,
                retryAttempts: 3,
                retryDelay: 1000,
                timeout: 30000,
                logLevel: 'info',
                ...config.settings
            },
            metrics: {
                executions: 0,
                successes: 0,
                failures: 0,
                lastExecution: null,
                averageExecutionTime: 0
            }
        };
        
        this.automations.set(automationId, automation);
        this.builderState.currentAutomation = automation;
        
        console.log('✅ Automatisation créée :', automationId);
        return automation;
    }
    
    /**
     * Création d'automatisation depuis template
     */
    createFromTemplate(templateId, customConfig = {}) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template ${templateId} introuvable`);
        }
        
        const automation = this.createAutomation({
            name: customConfig.name || template.name,
            description: customConfig.description || template.description,
            trigger: { ...template.automation.trigger, ...customConfig.trigger },
            actions: template.automation.actions.map(action => ({
                ...action,
                ...customConfig.actions?.find(a => a.type === action.type) || {}
            })),
            variables: { ...template.automation.variables, ...customConfig.variables }
        });
        
        console.log('📋 Automatisation créée depuis template :', templateId);
        return automation;
    }
    
    /**
     * Ajout d'un déclencheur
     */
    addTrigger(automationId, triggerConfig) {
        const automation = this.automations.get(automationId);
        if (!automation) {
            throw new Error(`Automatisation ${automationId} introuvable`);
        }
        
        const triggerTemplate = this.triggerLibrary.get(triggerConfig.type);
        if (!triggerTemplate) {
            throw new Error(`Type de déclencheur ${triggerConfig.type} non supporté`);
        }
        
        automation.trigger = {
            id: 'trigger_' + Date.now(),
            type: triggerConfig.type,
            config: { ...triggerTemplate.config, ...triggerConfig.config },
            position: triggerConfig.position || { x: 100, y: 100 }
        };
        
        automation.modified = new Date();
        console.log('🎯 Déclencheur ajouté :', triggerConfig.type);
        
        return automation.trigger;
    }
    
    /**
     * Ajout d'une action
     */
    addAction(automationId, actionConfig) {
        const automation = this.automations.get(automationId);
        if (!automation) {
            throw new Error(`Automatisation ${automationId} introuvable`);
        }
        
        const actionTemplate = this.actionLibrary.get(actionConfig.type);
        if (!actionTemplate) {
            throw new Error(`Type d'action ${actionConfig.type} non supporté`);
        }
        
        const action = {
            id: 'action_' + Date.now(),
            type: actionConfig.type,
            config: { ...actionTemplate.config, ...actionConfig.config },
            position: actionConfig.position || { x: 300, y: 100 },
            delay: actionConfig.delay || 0,
            conditions: actionConfig.conditions || [],
            retryConfig: {
                attempts: actionConfig.retryAttempts || 3,
                delay: actionConfig.retryDelay || 1000
            }
        };
        
        automation.actions.push(action);
        automation.modified = new Date();
        
        console.log('⚙️ Action ajoutée :', actionConfig.type);
        return action;
    }
    
    /**
     * Test d'une automatisation
     */
    async testAutomation(automationId, testData = {}) {
        const automation = this.automations.get(automationId);
        if (!automation) {
            throw new Error(`Automatisation ${automationId} introuvable`);
        }
        
        console.log('🧪 Test de l\'automatisation :', automation.name);
        
        const testResult = {
            id: 'test_' + Date.now(),
            automationId: automationId,
            startTime: new Date(),
            endTime: null,
            status: 'running',
            steps: [],
            data: { ...testData },
            logs: [],
            errors: []
        };
        
        try {
            // Test du déclencheur
            if (automation.trigger) {
                const triggerResult = await this.testTrigger(automation.trigger, testData);
                testResult.steps.push({
                    type: 'trigger',
                    id: automation.trigger.id,
                    status: triggerResult.success ? 'success' : 'failed',
                    result: triggerResult,
                    duration: triggerResult.duration || 0
                });
            }
            
            // Test des actions séquentiellement
            for (const action of automation.actions) {
                const actionResult = await this.testAction(action, testResult.data);
                testResult.steps.push({
                    type: 'action',
                    id: action.id,
                    status: actionResult.success ? 'success' : 'failed',
                    result: actionResult,
                    duration: actionResult.duration || 0
                });
                
                // Appliquer le délai si spécifié
                if (action.delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, Math.min(action.delay, 5000))); // Max 5s en test
                }
            }
            
            testResult.status = 'completed';
            testResult.endTime = new Date();
            
        } catch (error) {
            testResult.status = 'failed';
            testResult.endTime = new Date();
            testResult.errors.push({
                message: error.message,
                timestamp: new Date()
            });
        }
        
        console.log('🧪 Test terminé :', testResult.status);
        return testResult;
    }
    
    /**
     * Test d'un déclencheur
     */
    async testTrigger(trigger, testData) {
        const startTime = Date.now();
        
        try {
            // Simulation du test selon le type de déclencheur
            switch (trigger.type) {
                case 'form-submitted':
                    return {
                        success: true,
                        message: 'Déclencheur form-submitted simulé',
                        data: { ...testData, formSubmitted: true },
                        duration: Date.now() - startTime
                    };
                    
                case 'schedule-daily':
                case 'schedule-weekly':
                    return {
                        success: true,
                        message: 'Déclencheur planifié simulé',
                        data: { ...testData, scheduled: true },
                        duration: Date.now() - startTime
                    };
                    
                default:
                    return {
                        success: true,
                        message: `Déclencheur ${trigger.type} simulé`,
                        data: testData,
                        duration: Date.now() - startTime
                    };
            }
        } catch (error) {
            return {
                success: false,
                message: `Erreur test déclencheur : ${error.message}`,
                duration: Date.now() - startTime
            };
        }
    }
    
    /**
     * Test d'une action
     */
    async testAction(action, testData) {
        const startTime = Date.now();
        
        try {
            // Simulation de latence
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300));
            
            // Simulation selon le type d'action
            switch (action.type) {
                case 'send-email':
                    return {
                        success: true,
                        message: 'Email simulé envoyé',
                        data: { emailSent: true, recipients: action.config.recipients },
                        duration: Date.now() - startTime
                    };
                    
                case 'send-slack':
                    return {
                        success: true,
                        message: 'Message Slack simulé',
                        data: { slackSent: true, channel: action.config.channel },
                        duration: Date.now() - startTime
                    };
                    
                case 'save-to-database':
                    return {
                        success: true,
                        message: 'Données simulées sauvegardées',
                        data: { saved: true, table: action.config.table },
                        duration: Date.now() - startTime
                    };
                    
                default:
                    return {
                        success: true,
                        message: `Action ${action.type} simulée`,
                        data: testData,
                        duration: Date.now() - startTime
                    };
            }
        } catch (error) {
            return {
                success: false,
                message: `Erreur test action : ${error.message}`,
                duration: Date.now() - startTime
            };
        }
    }
    
    /**
     * Activation d'une automatisation
     */
    activateAutomation(automationId) {
        const automation = this.automations.get(automationId);
        if (!automation) {
            throw new Error(`Automatisation ${automationId} introuvable`);
        }
        
        automation.status = 'active';
        automation.settings.enabled = true;
        automation.modified = new Date();
        
        console.log('✅ Automatisation activée :', automation.name);
        return automation;
    }
    
    /**
     * Désactivation d'une automatisation
     */
    deactivateAutomation(automationId) {
        const automation = this.automations.get(automationId);
        if (!automation) {
            throw new Error(`Automatisation ${automationId} introuvable`);
        }
        
        automation.status = 'paused';
        automation.settings.enabled = false;
        automation.modified = new Date();
        
        console.log('⏸️ Automatisation désactivée :', automation.name);
        return automation;
    }
    
    /**
     * Export d'une automatisation
     */
    exportAutomation(automationId) {
        const automation = this.automations.get(automationId);
        if (!automation) {
            throw new Error(`Automatisation ${automationId} introuvable`);
        }
        
        const exportData = {
            ...automation,
            exportedAt: new Date(),
            version: '3.0.0'
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    /**
     * Import d'une automatisation
     */
    importAutomation(jsonData) {
        try {
            const importedAutomation = JSON.parse(jsonData);
            
            // Générer nouveau ID
            const newId = 'auto_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            importedAutomation.id = newId;
            importedAutomation.created = new Date();
            importedAutomation.modified = new Date();
            importedAutomation.status = 'draft';
            
            this.automations.set(newId, importedAutomation);
            
            console.log('📥 Automatisation importée :', newId);
            return importedAutomation;
            
        } catch (error) {
            throw new Error(`Erreur import automatisation : ${error.message}`);
        }
    }
    
    /**
     * Duplication d'une automatisation
     */
    duplicateAutomation(automationId) {
        const automation = this.automations.get(automationId);
        if (!automation) {
            throw new Error(`Automatisation ${automationId} introuvable`);
        }
        
        const exportData = this.exportAutomation(automationId);
        const duplicated = this.importAutomation(exportData);
        duplicated.name = `${automation.name} (Copie)`;
        
        console.log('📋 Automatisation dupliquée :', duplicated.id);
        return duplicated;
    }
    
    /**
     * Obtenir les métriques d'automatisation
     */
    getMetrics() {
        const automations = Array.from(this.automations.values());
        
        return {
            total: automations.length,
            active: automations.filter(a => a.status === 'active').length,
            draft: automations.filter(a => a.status === 'draft').length,
            paused: automations.filter(a => a.status === 'paused').length,
            totalExecutions: automations.reduce((sum, a) => sum + a.metrics.executions, 0),
            totalSuccesses: automations.reduce((sum, a) => sum + a.metrics.successes, 0),
            totalFailures: automations.reduce((sum, a) => sum + a.metrics.failures, 0),
            averageSuccessRate: this.calculateAverageSuccessRate(automations)
        };
    }
    
    /**
     * Calcul du taux de succès moyen
     */
    calculateAverageSuccessRate(automations) {
        const activeAutomations = automations.filter(a => a.metrics.executions > 0);
        if (activeAutomations.length === 0) return 0;
        
        const totalRate = activeAutomations.reduce((sum, a) => {
            const rate = a.metrics.executions > 0 ? (a.metrics.successes / a.metrics.executions) * 100 : 0;
            return sum + rate;
        }, 0);
        
        return Math.round(totalRate / activeAutomations.length);
    }
    
    /**
     * Obtenir toutes les automatisations
     */
    getAutomations() {
        return Array.from(this.automations.values());
    }
    
    /**
     * Obtenir les templates disponibles
     */
    getTemplates() {
        return Array.from(this.templates.values());
    }
    
    /**
     * Obtenir la bibliothèque de déclencheurs
     */
    getTriggerLibrary() {
        return Array.from(this.triggerLibrary.values());
    }
    
    /**
     * Obtenir la bibliothèque d'actions
     */
    getActionLibrary() {
        return Array.from(this.actionLibrary.values());
    }
}

// Export pour compatibilité navigateur
window.AutomationBuilder = AutomationBuilder;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.automationBuilder) {
        window.automationBuilder = new AutomationBuilder();
        console.log('⚡ AutomationBuilder initialisé globalement');
    }
});

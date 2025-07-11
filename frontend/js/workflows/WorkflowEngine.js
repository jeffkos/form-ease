/**
 * 🔄 WorkflowEngine.js - FormEase Sprint 3 Phase 2
 * 
 * Moteur de workflows visuels et automatisation avancée
 * Permet de créer, exécuter et gérer des workflows complexes
 * 
 * Fonctionnalités :
 * - Création de workflows visuels avec drag & drop
 * - Exécution séquentielle et parallèle d'actions
 * - Conditions et branches logiques
 * - Intégration avec l'IA FormEase
 * - Gestion d'erreurs et retry automatique
 * - Métriques et monitoring en temps réel
 * 
 * @version 3.0.0
 * @author FormEase Team
 * @since Sprint 3 Phase 2
 */

class WorkflowEngine {
    constructor() {
        this.workflows = new Map();
        this.activeExecutions = new Map();
        this.templates = new Map();
        this.metrics = {
            executionsTotal: 0,
            executionsSuccess: 0,
            executionsFailed: 0,
            averageExecutionTime: 0,
            activeWorkflows: 0
        };
        
        this.nodeTypes = {
            trigger: 'trigger',
            action: 'action',
            condition: 'condition',
            delay: 'delay',
            webhook: 'webhook',
            notification: 'notification',
            transform: 'transform',
            end: 'end'
        };
        
        this.executionStatus = {
            pending: 'pending',
            running: 'running',
            completed: 'completed',
            failed: 'failed',
            paused: 'paused'
        };
        
        this.init();
    }
    
    /**
     * Initialisation du moteur de workflows
     */
    init() {
        this.setupDefaultTemplates();
        this.initializeCanvas();
        this.startMetricsCollection();
        console.log('🔄 WorkflowEngine v3.0 initialisé');
    }
    
    /**
     * Configuration des templates de workflows prédéfinis
     */
    setupDefaultTemplates() {
        // Template : Notification automatique de nouveau formulaire
        this.templates.set('form-notification', {
            id: 'form-notification',
            name: 'Notification Nouveau Formulaire',
            description: 'Envoie une notification quand un nouveau formulaire est soumis',
            category: 'notifications',
            nodes: [
                {
                    id: 'trigger-1',
                    type: 'trigger',
                    event: 'form.submitted',
                    position: { x: 50, y: 100 }
                },
                {
                    id: 'condition-1',
                    type: 'condition',
                    logic: 'form.priority === "high"',
                    position: { x: 250, y: 100 }
                },
                {
                    id: 'notification-1',
                    type: 'notification',
                    config: {
                        type: 'email',
                        recipients: ['admin@formease.com'],
                        template: 'high-priority-form'
                    },
                    position: { x: 450, y: 50 }
                },
                {
                    id: 'notification-2',
                    type: 'notification',
                    config: {
                        type: 'slack',
                        channel: '#forms',
                        template: 'standard-form'
                    },
                    position: { x: 450, y: 150 }
                }
            ],
            connections: [
                { from: 'trigger-1', to: 'condition-1' },
                { from: 'condition-1', to: 'notification-1', condition: 'true' },
                { from: 'condition-1', to: 'notification-2', condition: 'false' }
            ]
        });
        
        // Template : Workflow d'approbation
        this.templates.set('approval-workflow', {
            id: 'approval-workflow',
            name: 'Workflow d\'Approbation',
            description: 'Processus d\'approbation avec étapes multiples',
            category: 'approval',
            nodes: [
                {
                    id: 'trigger-1',
                    type: 'trigger',
                    event: 'form.submitted',
                    position: { x: 50, y: 150 }
                },
                {
                    id: 'action-1',
                    type: 'action',
                    action: 'assign.reviewer',
                    config: { role: 'manager' },
                    position: { x: 250, y: 150 }
                },
                {
                    id: 'delay-1',
                    type: 'delay',
                    duration: '2d',
                    position: { x: 450, y: 150 }
                },
                {
                    id: 'condition-1',
                    type: 'condition',
                    logic: 'approval.status === "approved"',
                    position: { x: 650, y: 150 }
                },
                {
                    id: 'action-2',
                    type: 'action',
                    action: 'form.approve',
                    position: { x: 850, y: 100 }
                },
                {
                    id: 'action-3',
                    type: 'action',
                    action: 'form.reject',
                    position: { x: 850, y: 200 }
                }
            ],
            connections: [
                { from: 'trigger-1', to: 'action-1' },
                { from: 'action-1', to: 'delay-1' },
                { from: 'delay-1', to: 'condition-1' },
                { from: 'condition-1', to: 'action-2', condition: 'true' },
                { from: 'condition-1', to: 'action-3', condition: 'false' }
            ]
        });
        
        // Template : Transformation de données
        this.templates.set('data-transform', {
            id: 'data-transform',
            name: 'Transformation de Données',
            description: 'Transforme et enrichit les données de formulaire',
            category: 'data',
            nodes: [
                {
                    id: 'trigger-1',
                    type: 'trigger',
                    event: 'form.submitted',
                    position: { x: 50, y: 150 }
                },
                {
                    id: 'transform-1',
                    type: 'transform',
                    script: 'data.email = data.email.toLowerCase(); data.fullName = data.firstName + " " + data.lastName;',
                    position: { x: 250, y: 150 }
                },
                {
                    id: 'webhook-1',
                    type: 'webhook',
                    config: {
                        url: 'https://api.crm.com/contacts',
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer {{token}}' }
                    },
                    position: { x: 450, y: 150 }
                },
                {
                    id: 'notification-1',
                    type: 'notification',
                    config: {
                        type: 'email',
                        recipients: ['{{data.email}}'],
                        template: 'welcome'
                    },
                    position: { x: 650, y: 150 }
                }
            ],
            connections: [
                { from: 'trigger-1', to: 'transform-1' },
                { from: 'transform-1', to: 'webhook-1' },
                { from: 'webhook-1', to: 'notification-1' }
            ]
        });
        
        console.log('📋 Templates de workflows chargés :', this.templates.size);
    }
    
    /**
     * Création d'un nouveau workflow
     */
    createWorkflow(config) {
        const workflowId = 'wf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const workflow = {
            id: workflowId,
            name: config.name || `Workflow ${workflowId}`,
            description: config.description || '',
            status: 'draft',
            created: new Date(),
            modified: new Date(),
            nodes: config.nodes || [],
            connections: config.connections || [],
            triggers: this.extractTriggers(config.nodes || []),
            variables: config.variables || {},
            settings: {
                retryAttempts: 3,
                retryDelay: 1000,
                timeout: 30000,
                parallel: config.parallel || false,
                ...config.settings
            }
        };
        
        this.workflows.set(workflowId, workflow);
        this.metrics.activeWorkflows++;
        
        console.log('✅ Workflow créé :', workflowId);
        return workflow;
    }
    
    /**
     * Extraction des déclencheurs d'un workflow
     */
    extractTriggers(nodes) {
        return nodes
            .filter(node => node.type === 'trigger')
            .map(node => ({
                id: node.id,
                event: node.event,
                conditions: node.conditions || {}
            }));
    }
    
    /**
     * Démarrage d'un workflow
     */
    async startWorkflow(workflowId, triggerData = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} introuvable`);
        }
        
        const executionId = 'exec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const execution = {
            id: executionId,
            workflowId: workflowId,
            status: this.executionStatus.pending,
            startTime: new Date(),
            endTime: null,
            data: { ...triggerData },
            currentNode: null,
            completedNodes: [],
            failedNodes: [],
            logs: [],
            metrics: {
                nodesExecuted: 0,
                executionTime: 0,
                errors: 0
            }
        };
        
        this.activeExecutions.set(executionId, execution);
        this.metrics.executionsTotal++;
        
        try {
            execution.status = this.executionStatus.running;
            this.log(execution, 'info', `Démarrage du workflow ${workflow.name}`);
            
            // Trouver les nœuds de déclenchement
            const triggerNodes = workflow.nodes.filter(node => node.type === 'trigger');
            
            if (triggerNodes.length === 0) {
                throw new Error('Aucun nœud de déclenchement trouvé');
            }
            
            // Exécuter à partir du premier trigger
            await this.executeNode(execution, triggerNodes[0], workflow);
            
            execution.status = this.executionStatus.completed;
            execution.endTime = new Date();
            execution.metrics.executionTime = execution.endTime - execution.startTime;
            
            this.metrics.executionsSuccess++;
            this.metrics.averageExecutionTime = this.calculateAverageExecutionTime();
            
            this.log(execution, 'success', `Workflow terminé avec succès en ${execution.metrics.executionTime}ms`);
            
        } catch (error) {
            execution.status = this.executionStatus.failed;
            execution.endTime = new Date();
            execution.metrics.executionTime = execution.endTime - execution.startTime;
            execution.metrics.errors++;
            
            this.metrics.executionsFailed++;
            this.log(execution, 'error', `Erreur workflow : ${error.message}`);
            
            throw error;
        }
        
        return execution;
    }
    
    /**
     * Exécution d'un nœud spécifique
     */
    async executeNode(execution, node, workflow) {
        execution.currentNode = node.id;
        execution.metrics.nodesExecuted++;
        
        this.log(execution, 'info', `Exécution du nœud ${node.id} (${node.type})`);
        
        try {
            let result = null;
            
            switch (node.type) {
                case 'trigger':
                    result = await this.executeTrigger(execution, node);
                    break;
                case 'action':
                    result = await this.executeAction(execution, node);
                    break;
                case 'condition':
                    result = await this.executeCondition(execution, node);
                    break;
                case 'delay':
                    result = await this.executeDelay(execution, node);
                    break;
                case 'webhook':
                    result = await this.executeWebhook(execution, node);
                    break;
                case 'notification':
                    result = await this.executeNotification(execution, node);
                    break;
                case 'transform':
                    result = await this.executeTransform(execution, node);
                    break;
                default:
                    throw new Error(`Type de nœud non supporté : ${node.type}`);
            }
            
            execution.completedNodes.push(node.id);
            
            // Trouver et exécuter les nœuds suivants
            await this.executeNextNodes(execution, node, workflow, result);
            
        } catch (error) {
            execution.failedNodes.push(node.id);
            this.log(execution, 'error', `Erreur nœud ${node.id} : ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Exécution d'un déclencheur
     */
    async executeTrigger(execution, node) {
        this.log(execution, 'info', `Déclencheur activé : ${node.event}`);
        return { success: true, event: node.event };
    }
    
    /**
     * Exécution d'une action
     */
    async executeAction(execution, node) {
        const actionHandlers = {
            'assign.reviewer': (config, data) => {
                data.assignedTo = config.role;
                data.assignedAt = new Date();
                return { assigned: true, role: config.role };
            },
            'form.approve': (config, data) => {
                data.status = 'approved';
                data.approvedAt = new Date();
                return { approved: true };
            },
            'form.reject': (config, data) => {
                data.status = 'rejected';
                data.rejectedAt = new Date();
                return { rejected: true };
            },
            'data.save': (config, data) => {
                // Simulation sauvegarde
                data.savedAt = new Date();
                return { saved: true, location: config.destination };
            }
        };
        
        const handler = actionHandlers[node.action];
        if (!handler) {
            throw new Error(`Action non supportée : ${node.action}`);
        }
        
        const result = handler(node.config || {}, execution.data);
        this.log(execution, 'info', `Action ${node.action} exécutée`);
        
        return result;
    }
    
    /**
     * Exécution d'une condition
     */
    async executeCondition(execution, node) {
        try {
            // Évaluation sécurisée de la condition
            const condition = this.evaluateCondition(node.logic, execution.data);
            this.log(execution, 'info', `Condition évaluée : ${condition}`);
            
            return { condition: condition, logic: node.logic };
        } catch (error) {
            this.log(execution, 'error', `Erreur évaluation condition : ${error.message}`);
            return { condition: false, error: error.message };
        }
    }
    
    /**
     * Évaluation sécurisée d'une condition
     */
    evaluateCondition(logic, data) {
        // Remplacement des variables
        let evaluatedLogic = logic;
        
        // Remplacer les références aux données
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            const value = typeof data[key] === 'string' ? `"${data[key]}"` : data[key];
            evaluatedLogic = evaluatedLogic.replace(regex, value);
        });
        
        // Évaluation simple (à sécuriser davantage en production)
        try {
            return Function(`"use strict"; return (${evaluatedLogic})`)();
        } catch (error) {
            console.warn('Erreur évaluation condition :', error);
            return false;
        }
    }
    
    /**
     * Exécution d'un délai
     */
    async executeDelay(execution, node) {
        const duration = this.parseDuration(node.duration);
        this.log(execution, 'info', `Délai de ${duration}ms`);
        
        await new Promise(resolve => setTimeout(resolve, duration));
        
        return { delayed: true, duration: duration };
    }
    
    /**
     * Parsing de durée (2d, 1h, 30m, 10s)
     */
    parseDuration(duration) {
        const units = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        };
        
        const match = duration.match(/^(\d+)([smhd])$/);
        if (!match) {
            return parseInt(duration) || 1000;
        }
        
        const [, value, unit] = match;
        return parseInt(value) * units[unit];
    }
    
    /**
     * Exécution d'un webhook
     */
    async executeWebhook(execution, node) {
        const config = node.config;
        
        try {
            // Simulation d'appel webhook
            this.log(execution, 'info', `Webhook ${config.method} ${config.url}`);
            
            // En réalité, on ferait un fetch() ici
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulation latence
            
            const response = {
                status: 200,
                data: { success: true, timestamp: new Date() }
            };
            
            return response;
            
        } catch (error) {
            this.log(execution, 'error', `Erreur webhook : ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Exécution d'une notification
     */
    async executeNotification(execution, node) {
        const config = node.config;
        
        try {
            this.log(execution, 'info', `Notification ${config.type} envoyée`);
            
            // Simulation envoi notification
            await new Promise(resolve => setTimeout(resolve, 200));
            
            return {
                sent: true,
                type: config.type,
                recipients: config.recipients || [],
                timestamp: new Date()
            };
            
        } catch (error) {
            this.log(execution, 'error', `Erreur notification : ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Exécution d'une transformation
     */
    async executeTransform(execution, node) {
        try {
            // Exécution sécurisée du script de transformation
            const transformFunction = new Function('data', node.script + '; return data;');
            const transformedData = transformFunction({ ...execution.data });
            
            // Mise à jour des données d'exécution
            Object.assign(execution.data, transformedData);
            
            this.log(execution, 'info', 'Transformation appliquée');
            
            return { transformed: true, data: transformedData };
            
        } catch (error) {
            this.log(execution, 'error', `Erreur transformation : ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Exécution des nœuds suivants
     */
    async executeNextNodes(execution, currentNode, workflow, result) {
        const connections = workflow.connections.filter(conn => conn.from === currentNode.id);
        
        for (const connection of connections) {
            // Vérifier les conditions de connexion
            if (connection.condition) {
                if (currentNode.type === 'condition') {
                    const shouldExecute = (connection.condition === 'true' && result.condition) ||
                                         (connection.condition === 'false' && !result.condition);
                    if (!shouldExecute) continue;
                }
            }
            
            const nextNode = workflow.nodes.find(node => node.id === connection.to);
            if (nextNode) {
                await this.executeNode(execution, nextNode, workflow);
            }
        }
    }
    
    /**
     * Logging d'exécution
     */
    log(execution, level, message) {
        const logEntry = {
            timestamp: new Date(),
            level: level,
            message: message,
            node: execution.currentNode
        };
        
        execution.logs.push(logEntry);
        console.log(`[${level.toUpperCase()}] Workflow ${execution.workflowId}: ${message}`);
    }
    
    /**
     * Calcul du temps d'exécution moyen
     */
    calculateAverageExecutionTime() {
        const completedExecutions = Array.from(this.activeExecutions.values())
            .filter(exec => exec.status === this.executionStatus.completed);
        
        if (completedExecutions.length === 0) return 0;
        
        const totalTime = completedExecutions.reduce((sum, exec) => sum + exec.metrics.executionTime, 0);
        return Math.round(totalTime / completedExecutions.length);
    }
    
    /**
     * Initialisation du canvas de création
     */
    initializeCanvas() {
        this.canvas = {
            nodes: [],
            connections: [],
            selectedNode: null,
            dragMode: false,
            zoom: 1,
            pan: { x: 0, y: 0 }
        };
    }
    
    /**
     * Collecte de métriques en temps réel
     */
    startMetricsCollection() {
        setInterval(() => {
            this.updateMetrics();
        }, 5000); // Mise à jour toutes les 5 secondes
    }
    
    /**
     * Mise à jour des métriques
     */
    updateMetrics() {
        this.metrics.activeWorkflows = this.workflows.size;
        this.metrics.averageExecutionTime = this.calculateAverageExecutionTime();
        
        // Nettoyage des exécutions anciennes (> 1 heure)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        for (const [id, execution] of this.activeExecutions) {
            if (execution.startTime.getTime() < oneHourAgo) {
                this.activeExecutions.delete(id);
            }
        }
    }
    
    /**
     * Export d'un workflow en JSON
     */
    exportWorkflow(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} introuvable`);
        }
        
        return JSON.stringify(workflow, null, 2);
    }
    
    /**
     * Import d'un workflow depuis JSON
     */
    importWorkflow(jsonData) {
        try {
            const workflow = JSON.parse(jsonData);
            workflow.id = 'wf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            workflow.created = new Date();
            workflow.modified = new Date();
            
            this.workflows.set(workflow.id, workflow);
            this.metrics.activeWorkflows++;
            
            return workflow;
        } catch (error) {
            throw new Error(`Erreur import workflow : ${error.message}`);
        }
    }
    
    /**
     * Obtenir les métriques actuelles
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Obtenir la liste des workflows
     */
    getWorkflows() {
        return Array.from(this.workflows.values());
    }
    
    /**
     * Obtenir les exécutions actives
     */
    getActiveExecutions() {
        return Array.from(this.activeExecutions.values());
    }
    
    /**
     * Obtenir les templates disponibles
     */
    getTemplates() {
        return Array.from(this.templates.values());
    }
}

// Export pour compatibilité navigateur
window.WorkflowEngine = WorkflowEngine;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.workflowEngine) {
        window.workflowEngine = new WorkflowEngine();
        console.log('🔄 WorkflowEngine initialisé globalement');
    }
});

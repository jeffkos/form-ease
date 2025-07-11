/**
 * 🛡️ PermissionSystem.js - FormEase Sprint 4 Phase 1
 * 
 * Système de permissions granulaires et contrôle d'accès avancé
 * Gestion des autorisations avec contexte et conditions dynamiques
 * 
 * Fonctionnalités :
 * - Permissions granulaires par ressource
 * - Conditions contextuelles (temps, IP, device)
 * - Permissions temporaires et programmées
 * - Héritage et délégation de permissions
 * - Matrice de permissions complexe
 * - Permissions basées sur les attributs (ABAC)
 * - Workflow d'approbation
 * - Audit et conformité
 * 
 * @version 4.0.0
 * @author FormEase Security Team
 * @since Sprint 4 Phase 1
 */

class PermissionSystem {
    constructor(authController) {
        this.auth = authController || window.authController;
        this.permissions = new Map();
        this.resourceTypes = new Map();
        this.permissionSets = new Map();
        this.temporaryPermissions = new Map();
        this.permissionRequests = new Map();
        this.conditionEvaluators = new Map();
        this.permissionCache = new Map();
        
        this.config = {
            cacheTimeout: 5 * 60 * 1000, // 5 minutes
            maxTemporaryDuration: 24 * 60 * 60 * 1000, // 24 heures
            approvalRequired: true,
            auditAllChecks: true,
            enableContextualPermissions: true,
            enableAttributeBasedAccess: true
        };
        
        this.accessModels = {
            rbac: 'role_based',        // Role-Based Access Control
            abac: 'attribute_based',   // Attribute-Based Access Control
            pbac: 'policy_based',      // Policy-Based Access Control
            dac: 'discretionary',      // Discretionary Access Control
            mac: 'mandatory'           // Mandatory Access Control
        };
        
        this.permissionTypes = {
            system: 'system',
            resource: 'resource',
            action: 'action',
            data: 'data',
            contextual: 'contextual',
            temporal: 'temporal'
        };
        
        this.accessLevels = {
            none: 0,
            read: 10,
            write: 20,
            modify: 30,
            delete: 40,
            admin: 50,
            owner: 60,
            superadmin: 100
        };
        
        this.contextualFactors = {
            time: 'time',
            location: 'location',
            device: 'device',
            network: 'network',
            session: 'session',
            risk: 'risk',
            workload: 'workload'
        };
        
        this.init();
    }
    
    /**
     * Initialisation du système de permissions
     */
    init() {
        this.setupResourceTypes();
        this.setupDefaultPermissions();
        this.setupConditionEvaluators();
        this.setupPermissionSets();
        this.startPermissionManagement();
        console.log('🛡️ PermissionSystem v4.0 initialisé - Contrôle d\'accès granulaire');
    }
    
    /**
     * Configuration des types de ressources
     */
    setupResourceTypes() {
        // Système
        this.resourceTypes.set('system', {
            id: 'system',
            name: 'Système',
            description: 'Ressources système globales',
            actions: ['read', 'update', 'configure', 'monitor', 'backup', 'restore'],
            attributes: ['level', 'module', 'component'],
            inheritanceRules: [],
            defaultDeny: true
        });
        
        // Organisation
        this.resourceTypes.set('organization', {
            id: 'organization',
            name: 'Organisation',
            description: 'Gestion organisationnelle',
            actions: ['create', 'read', 'update', 'delete', 'admin', 'billing'],
            attributes: ['id', 'tier', 'size', 'region'],
            inheritanceRules: ['admin_inherits_all'],
            defaultDeny: false
        });
        
        // Projet
        this.resourceTypes.set('project', {
            id: 'project',
            name: 'Projet',
            description: 'Projets et espaces de travail',
            actions: ['create', 'read', 'update', 'delete', 'share', 'collaborate', 'publish'],
            attributes: ['id', 'owner', 'visibility', 'status', 'type'],
            inheritanceRules: ['owner_has_all', 'collaborator_read_write'],
            defaultDeny: false
        });
        
        // Formulaire
        this.resourceTypes.set('form', {
            id: 'form',
            name: 'Formulaire',
            description: 'Formulaires et templates',
            actions: ['create', 'read', 'update', 'delete', 'publish', 'unpublish', 'duplicate', 'export'],
            attributes: ['id', 'projectId', 'owner', 'status', 'visibility', 'template'],
            inheritanceRules: ['project_permissions', 'owner_has_all'],
            defaultDeny: false
        });
        
        // Données
        this.resourceTypes.set('data', {
            id: 'data',
            name: 'Données',
            description: 'Données et soumissions',
            actions: ['read', 'export', 'delete', 'anonymize', 'purge'],
            attributes: ['formId', 'sensitivity', 'classification', 'retention'],
            inheritanceRules: ['form_permissions', 'data_sensitivity'],
            defaultDeny: true
        });
        
        // Analytics
        this.resourceTypes.set('analytics', {
            id: 'analytics',
            name: 'Analytics',
            description: 'Rapports et analyses',
            actions: ['read', 'create', 'update', 'delete', 'export', 'schedule', 'share'],
            attributes: ['scope', 'level', 'sensitivity'],
            inheritanceRules: ['data_access_required'],
            defaultDeny: false
        });
        
        // Intégrations
        this.resourceTypes.set('integration', {
            id: 'integration',
            name: 'Intégration',
            description: 'Connecteurs et APIs',
            actions: ['read', 'create', 'update', 'delete', 'execute', 'test', 'deploy'],
            attributes: ['type', 'provider', 'scope', 'security'],
            inheritanceRules: ['admin_approval_required'],
            defaultDeny: true
        });
        
        // Workflows
        this.resourceTypes.set('workflow', {
            id: 'workflow',
            name: 'Workflow',
            description: 'Processus automatisés',
            actions: ['read', 'create', 'update', 'delete', 'execute', 'approve', 'publish'],
            attributes: ['type', 'complexity', 'impact', 'approval'],
            inheritanceRules: ['approval_based_on_impact'],
            defaultDeny: false
        });
        
        console.log('📋 Types de ressources configurés :', this.resourceTypes.size);
    }
    
    /**
     * Configuration des permissions par défaut
     */
    setupDefaultPermissions() {
        // Permissions système critiques
        this.addPermission('system.admin', {
            type: this.permissionTypes.system,
            resourceType: 'system',
            action: 'admin',
            level: this.accessLevels.superadmin,
            description: 'Administration système complète',
            conditions: {
                mfaRequired: true,
                ipRestrictions: true,
                timeRestrictions: 'business_hours',
                auditLevel: 'FULL'
            },
            approvalRequired: true,
            maxDuration: 4 * 60 * 60 * 1000 // 4 heures max
        });
        
        // Permissions d'organisation
        this.addPermission('organization.admin', {
            type: this.permissionTypes.resource,
            resourceType: 'organization',
            action: 'admin',
            level: this.accessLevels.admin,
            description: 'Administration organisation',
            conditions: {
                mfaRequired: true,
                auditLevel: 'HIGH'
            },
            attributes: {
                'organization.id': 'required',
                'user.level': '>=manager'
            }
        });
        
        // Permissions de projet
        this.addPermission('project.create', {
            type: this.permissionTypes.resource,
            resourceType: 'project',
            action: 'create',
            level: this.accessLevels.write,
            description: 'Création de projets',
            conditions: {
                'organization.plan': ['pro', 'enterprise'],
                'user.verified': true
            }
        });
        
        this.addPermission('project.admin', {
            type: this.permissionTypes.resource,
            resourceType: 'project',
            action: 'admin',
            level: this.accessLevels.admin,
            description: 'Administration projet',
            attributes: {
                'project.owner': 'self',
                'project.collaborator': 'admin_role'
            }
        });
        
        // Permissions de formulaire
        this.addPermission('form.create', {
            type: this.permissionTypes.resource,
            resourceType: 'form',
            action: 'create',
            level: this.accessLevels.write,
            description: 'Création de formulaires',
            inheritFrom: 'project.write'
        });
        
        this.addPermission('form.publish', {
            type: this.permissionTypes.action,
            resourceType: 'form',
            action: 'publish',
            level: this.accessLevels.modify,
            description: 'Publication de formulaires',
            conditions: {
                'form.validated': true,
                'form.approved': true
            },
            approvalWorkflow: 'form_publication'
        });
        
        // Permissions de données sensibles
        this.addPermission('data.export', {
            type: this.permissionTypes.data,
            resourceType: 'data',
            action: 'export',
            level: this.accessLevels.read,
            description: 'Export de données',
            conditions: {
                'data.classification': ['public', 'internal'],
                mfaRequired: true,
                auditLevel: 'FULL'
            },
            rateLimit: {
                requests: 10,
                window: 60 * 60 * 1000 // 1 heure
            }
        });
        
        this.addPermission('data.delete', {
            type: this.permissionTypes.data,
            resourceType: 'data',
            action: 'delete',
            level: this.accessLevels.delete,
            description: 'Suppression de données',
            conditions: {
                mfaRequired: true,
                approvalRequired: true,
                'data.retention_period': 'expired'
            },
            approvalWorkflow: 'data_deletion',
            irreversible: true
        });
        
        console.log('🔒 Permissions par défaut configurées');
    }
    
    /**
     * Configuration des évaluateurs de conditions
     */
    setupConditionEvaluators() {
        // Évaluateur de temps
        this.conditionEvaluators.set('time', (condition, context) => {
            const now = new Date();
            
            switch (condition) {
                case 'business_hours':
                    const hour = now.getHours();
                    return hour >= 8 && hour < 18; // 8h-18h
                    
                case 'weekend':
                    const day = now.getDay();
                    return day === 0 || day === 6;
                    
                case 'after_hours':
                    const h = now.getHours();
                    return h < 8 || h >= 18;
                    
                default:
                    return true;
            }
        });
        
        // Évaluateur de localisation
        this.conditionEvaluators.set('location', (condition, context) => {
            const userLocation = context.location || 'unknown';
            
            if (condition.allowedCountries) {
                return condition.allowedCountries.includes(userLocation.country);
            }
            
            if (condition.blockedCountries) {
                return !condition.blockedCountries.includes(userLocation.country);
            }
            
            return true;
        });
        
        // Évaluateur de device/appareil
        this.conditionEvaluators.set('device', (condition, context) => {
            const device = context.device || {};
            
            if (condition.trustedDevices && !device.trusted) {
                return false;
            }
            
            if (condition.allowedTypes && !condition.allowedTypes.includes(device.type)) {
                return false;
            }
            
            if (condition.blockedTypes && condition.blockedTypes.includes(device.type)) {
                return false;
            }
            
            return true;
        });
        
        // Évaluateur de réseau
        this.conditionEvaluators.set('network', (condition, context) => {
            const network = context.network || {};
            
            if (condition.allowedNetworks) {
                return condition.allowedNetworks.some(net => 
                    network.ip && network.ip.startsWith(net)
                );
            }
            
            if (condition.blockedNetworks) {
                return !condition.blockedNetworks.some(net => 
                    network.ip && network.ip.startsWith(net)
                );
            }
            
            if (condition.vpnRequired && !network.vpn) {
                return false;
            }
            
            return true;
        });
        
        // Évaluateur de risque
        this.conditionEvaluators.set('risk', (condition, context) => {
            const riskScore = context.riskScore || 0;
            
            if (condition.maxRiskScore && riskScore > condition.maxRiskScore) {
                return false;
            }
            
            if (condition.minRiskScore && riskScore < condition.minRiskScore) {
                return false;
            }
            
            return true;
        });
        
        console.log('⚙️ Évaluateurs de conditions configurés');
    }
    
    /**
     * Configuration des ensembles de permissions
     */
    setupPermissionSets() {
        // Ensemble administrateur système
        this.permissionSets.set('system-admin', {
            id: 'system-admin',
            name: 'Administrateur Système',
            description: 'Permissions complètes d\'administration système',
            permissions: [
                'system.*',
                'organization.*',
                'project.*',
                'form.*',
                'data.*',
                'analytics.*',
                'integration.*',
                'workflow.*'
            ],
            conditions: {
                mfaRequired: true,
                maxSessionDuration: 4 * 60 * 60 * 1000,
                ipRestrictions: true
            },
            requireApproval: true
        });
        
        // Ensemble manager
        this.permissionSets.set('manager', {
            id: 'manager',
            name: 'Manager',
            description: 'Permissions de gestion d\'équipe',
            permissions: [
                'project.*',
                'form.*',
                'data.read',
                'data.export',
                'analytics.*',
                'workflow.read',
                'workflow.execute'
            ],
            conditions: {
                'organization.member': true
            }
        });
        
        // Ensemble utilisateur standard
        this.permissionSets.set('standard-user', {
            id: 'standard-user',
            name: 'Utilisateur Standard',
            description: 'Permissions utilisateur de base',
            permissions: [
                'form.create',
                'form.read',
                'form.update',
                'data.read',
                'analytics.read',
                'workflow.execute'
            ]
        });
        
        // Ensemble API
        this.permissionSets.set('api-access', {
            id: 'api-access',
            name: 'Accès API',
            description: 'Permissions pour accès programmatique',
            permissions: [
                'form.read',
                'form.create',
                'data.read',
                'data.create',
                'integration.execute'
            ],
            conditions: {
                rateLimit: true,
                ipRestrictions: true
            }
        });
        
        console.log('📦 Ensembles de permissions configurés');
    }
    
    /**
     * Vérification de permission avec contexte
     */
    async checkPermission(userId, permission, resourceId = null, context = {}) {
        try {
            // Vérifier le cache
            const cacheKey = this.generateCacheKey(userId, permission, resourceId, context);
            const cached = this.permissionCache.get(cacheKey);
            
            if (cached && !this.isCacheExpired(cached)) {
                return cached.result;
            }
            
            // Construire le contexte complet
            const fullContext = await this.buildContext(userId, context);
            
            // Évaluer la permission
            const result = await this.evaluatePermission(userId, permission, resourceId, fullContext);
            
            // Mettre en cache
            this.permissionCache.set(cacheKey, {
                result,
                timestamp: Date.now(),
                ttl: this.config.cacheTimeout
            });
            
            // Audit si requis
            if (this.config.auditAllChecks) {
                this.auditPermissionCheck(userId, permission, resourceId, result, fullContext);
            }
            
            return result;
            
        } catch (error) {
            console.error('Erreur vérification permission :', error);
            
            // En cas d'erreur, refuser par défaut (fail-secure)
            this.auditPermissionCheck(userId, permission, resourceId, {
                granted: false,
                reason: 'SYSTEM_ERROR',
                error: error.message
            }, context);
            
            return {
                granted: false,
                reason: 'SYSTEM_ERROR',
                error: error.message
            };
        }
    }
    
    /**
     * Évaluation complète d'une permission
     */
    async evaluatePermission(userId, permission, resourceId, context) {
        const evaluation = {
            granted: false,
            reason: null,
            conditions: [],
            restrictions: [],
            metadata: {}
        };
        
        // 1. Vérifier la permission de base via AuthController
        const hasBasePermission = await this.auth.checkUserPermission(userId, permission);
        if (!hasBasePermission) {
            evaluation.reason = 'PERMISSION_DENIED';
            return evaluation;
        }
        
        // 2. Récupérer la définition de la permission
        const permissionDef = this.permissions.get(permission);
        if (!permissionDef) {
            evaluation.reason = 'PERMISSION_NOT_DEFINED';
            return evaluation;
        }
        
        // 3. Vérifier les conditions contextuelles
        const conditionsResult = await this.evaluateConditions(permissionDef.conditions, context);
        if (!conditionsResult.valid) {
            evaluation.reason = 'CONDITIONS_NOT_MET';
            evaluation.conditions = conditionsResult.failed;
            return evaluation;
        }
        
        // 4. Vérifier les attributs de ressource
        if (resourceId && permissionDef.attributes) {
            const attributesResult = await this.evaluateAttributes(permissionDef.attributes, resourceId, userId, context);
            if (!attributesResult.valid) {
                evaluation.reason = 'ATTRIBUTES_NOT_SATISFIED';
                evaluation.restrictions = attributesResult.failed;
                return evaluation;
            }
        }
        
        // 5. Vérifier l'approbation si requise
        if (permissionDef.approvalRequired) {
            const approvalResult = await this.checkApproval(userId, permission, resourceId);
            if (!approvalResult.approved) {
                evaluation.reason = 'APPROVAL_REQUIRED';
                evaluation.metadata.approvalWorkflow = permissionDef.approvalWorkflow;
                return evaluation;
            }
        }
        
        // 6. Vérifier les limites de taux
        if (permissionDef.rateLimit) {
            const rateLimitResult = await this.checkRateLimit(userId, permission, permissionDef.rateLimit);
            if (!rateLimitResult.allowed) {
                evaluation.reason = 'RATE_LIMIT_EXCEEDED';
                evaluation.metadata.retryAfter = rateLimitResult.retryAfter;
                return evaluation;
            }
        }
        
        // 7. Vérifier les permissions temporaires
        const temporaryResult = await this.checkTemporaryPermissions(userId, permission, resourceId);
        if (temporaryResult.hasTemporary) {
            evaluation.metadata.temporary = true;
            evaluation.metadata.expires = temporaryResult.expires;
        }
        
        // 8. Appliquer l'héritage de permissions
        const inheritanceResult = await this.applyInheritance(permission, resourceId, userId, context);
        evaluation.metadata.inherited = inheritanceResult.inherited;
        
        // Permission accordée
        evaluation.granted = true;
        evaluation.reason = 'GRANTED';
        evaluation.metadata.evaluatedAt = new Date();
        
        return evaluation;
    }
    
    /**
     * Évaluation des conditions
     */
    async evaluateConditions(conditions, context) {
        const result = {
            valid: true,
            failed: []
        };
        
        if (!conditions) return result;
        
        for (const [conditionType, conditionValue] of Object.entries(conditions)) {
            const evaluator = this.conditionEvaluators.get(conditionType);
            
            if (evaluator) {
                const isValid = await evaluator(conditionValue, context);
                if (!isValid) {
                    result.valid = false;
                    result.failed.push({
                        type: conditionType,
                        value: conditionValue,
                        context: context[conditionType]
                    });
                }
            } else if (conditionType in context) {
                // Comparaison directe si pas d'évaluateur spécialisé
                const isValid = this.compareValues(context[conditionType], conditionValue);
                if (!isValid) {
                    result.valid = false;
                    result.failed.push({
                        type: conditionType,
                        expected: conditionValue,
                        actual: context[conditionType]
                    });
                }
            }
        }
        
        return result;
    }
    
    /**
     * Évaluation des attributs de ressource
     */
    async evaluateAttributes(attributes, resourceId, userId, context) {
        const result = {
            valid: true,
            failed: []
        };
        
        // Récupérer les métadonnées de la ressource
        const resourceData = await this.getResourceData(resourceId);
        
        for (const [attribute, requirement] of Object.entries(attributes)) {
            const [resourceType, attributeName] = attribute.split('.');
            
            let actualValue;
            if (resourceType === 'user') {
                actualValue = context.user ? context.user[attributeName] : null;
            } else {
                actualValue = resourceData ? resourceData[attributeName] : null;
            }
            
            const isValid = this.evaluateAttributeRequirement(actualValue, requirement, userId, context);
            
            if (!isValid) {
                result.valid = false;
                result.failed.push({
                    attribute,
                    requirement,
                    actualValue
                });
            }
        }
        
        return result;
    }
    
    /**
     * Demande de permission temporaire
     */
    async requestTemporaryPermission(userId, permission, resourceId, duration, justification) {
        try {
            const requestId = this.generateId('perm_req');
            
            const request = {
                id: requestId,
                userId: userId,
                permission: permission,
                resourceId: resourceId,
                duration: Math.min(duration, this.config.maxTemporaryDuration),
                justification: justification,
                status: 'pending',
                created: new Date(),
                expires: new Date(Date.now() + duration),
                approver: null,
                approved: null,
                metadata: {
                    userAgent: navigator.userAgent,
                    ip: this.getClientIP()
                }
            };
            
            this.permissionRequests.set(requestId, request);
            
            // Déclencher le workflow d'approbation
            await this.triggerApprovalWorkflow(request);
            
            this.auditPermissionEvent('temporary_permission_requested', {
                requestId,
                userId,
                permission,
                duration,
                justification
            });
            
            return request;
            
        } catch (error) {
            console.error('Erreur demande permission temporaire :', error);
            throw error;
        }
    }
    
    /**
     * Approbation de permission
     */
    async approvePermissionRequest(requestId, approverId, decision, comments = '') {
        try {
            const request = this.permissionRequests.get(requestId);
            if (!request) {
                throw new Error('Demande de permission introuvable');
            }
            
            if (request.status !== 'pending') {
                throw new Error('Demande déjà traitée');
            }
            
            // Vérifier que l'approbateur a les droits
            const canApprove = await this.canApprovePermission(approverId, request.permission);
            if (!canApprove) {
                throw new Error('Droits d\'approbation insuffisants');
            }
            
            request.status = decision ? 'approved' : 'rejected';
            request.approver = approverId;
            request.approved = new Date();
            request.comments = comments;
            
            if (decision) {
                // Créer la permission temporaire
                await this.createTemporaryPermission(request);
            }
            
            this.auditPermissionEvent('permission_request_processed', {
                requestId,
                approverId,
                decision,
                permission: request.permission
            });
            
            return request;
            
        } catch (error) {
            console.error('Erreur approbation permission :', error);
            throw error;
        }
    }
    
    /**
     * Création de permission temporaire
     */
    async createTemporaryPermission(request) {
        const tempPermId = this.generateId('temp_perm');
        
        const temporaryPermission = {
            id: tempPermId,
            userId: request.userId,
            permission: request.permission,
            resourceId: request.resourceId,
            created: new Date(),
            expires: request.expires,
            active: true,
            requestId: request.id,
            approver: request.approver,
            metadata: {
                justification: request.justification,
                autoRevoke: true
            }
        };
        
        this.temporaryPermissions.set(tempPermId, temporaryPermission);
        
        // Programmer la révocation automatique
        setTimeout(() => {
            this.revokeTemporaryPermission(tempPermId);
        }, request.duration);
        
        this.auditPermissionEvent('temporary_permission_granted', {
            tempPermId,
            userId: request.userId,
            permission: request.permission,
            duration: request.duration
        });
    }
    
    /**
     * Matrice de permissions
     */
    generatePermissionMatrix(organizationId) {
        const matrix = {
            roles: {},
            permissions: {},
            assignments: {},
            inheritance: {},
            conflicts: []
        };
        
        // Récupérer tous les rôles
        const roles = this.auth.getRoles();
        for (const role of roles) {
            matrix.roles[role.id] = {
                name: role.name,
                level: role.level,
                permissions: role.permissions
            };
        }
        
        // Récupérer toutes les permissions
        for (const [id, permission] of this.permissions.entries()) {
            matrix.permissions[id] = {
                type: permission.type,
                level: permission.level,
                description: permission.description
            };
        }
        
        // Analyser l'héritage
        for (const [roleId, inheritedRoles] of Object.entries(this.auth.roleHierarchy)) {
            matrix.inheritance[roleId] = inheritedRoles;
        }
        
        // Détecter les conflits
        matrix.conflicts = this.detectPermissionConflicts(matrix);
        
        return matrix;
    }
    
    /**
     * Fonctions utilitaires
     */
    addPermission(id, definition) {
        this.permissions.set(id, {
            id,
            created: new Date(),
            ...definition
        });
    }
    
    async buildContext(userId, providedContext = {}) {
        const context = {
            ...providedContext,
            timestamp: new Date(),
            user: await this.getUserContext(userId),
            session: await this.getSessionContext(userId),
            device: await this.getDeviceContext(),
            network: await this.getNetworkContext(),
            location: await this.getLocationContext(),
            risk: await this.getRiskContext(userId)
        };
        
        return context;
    }
    
    generateCacheKey(userId, permission, resourceId, context) {
        const contextHash = this.hashObject({
            userId,
            permission,
            resourceId,
            // Inclure seulement les éléments de contexte pertinents
            time: Math.floor(Date.now() / (5 * 60 * 1000)), // 5 minutes de granularité
            device: context.device?.id,
            network: context.network?.subnet
        });
        
        return `perm_${contextHash}`;
    }
    
    isCacheExpired(cached) {
        return Date.now() - cached.timestamp > cached.ttl;
    }
    
    compareValues(actual, expected) {
        if (Array.isArray(expected)) {
            return expected.includes(actual);
        }
        
        if (typeof expected === 'string' && expected.startsWith('>=')) {
            const threshold = parseFloat(expected.substring(2));
            return parseFloat(actual) >= threshold;
        }
        
        if (typeof expected === 'string' && expected.startsWith('<=')) {
            const threshold = parseFloat(expected.substring(2));
            return parseFloat(actual) <= threshold;
        }
        
        return actual === expected;
    }
    
    evaluateAttributeRequirement(actualValue, requirement, userId, context) {
        switch (requirement) {
            case 'required':
                return actualValue !== null && actualValue !== undefined;
                
            case 'self':
                return actualValue === userId;
                
            case 'admin_role':
                return context.user?.roles?.includes('admin');
                
            default:
                return this.compareValues(actualValue, requirement);
        }
    }
    
    async getResourceData(resourceId) {
        // Simulation - en production, récupérer depuis la base de données
        return {
            id: resourceId,
            owner: 'user-123',
            status: 'active',
            visibility: 'public',
            classification: 'internal'
        };
    }
    
    async checkApproval(userId, permission, resourceId) {
        // Vérifier si une approbation existe et est valide
        for (const request of this.permissionRequests.values()) {
            if (request.userId === userId && 
                request.permission === permission && 
                request.resourceId === resourceId && 
                request.status === 'approved' &&
                new Date() < request.expires) {
                return { approved: true, request };
            }
        }
        
        return { approved: false };
    }
    
    async checkRateLimit(userId, permission, rateLimit) {
        // Simulation de vérification de limite de taux
        const key = `rate_${userId}_${permission}`;
        const now = Date.now();
        
        // En production, utiliser Redis ou un système de cache distribué
        return {
            allowed: true,
            remaining: rateLimit.requests - 1,
            retryAfter: null
        };
    }
    
    async checkTemporaryPermissions(userId, permission, resourceId) {
        for (const tempPerm of this.temporaryPermissions.values()) {
            if (tempPerm.userId === userId && 
                tempPerm.permission === permission && 
                tempPerm.resourceId === resourceId && 
                tempPerm.active && 
                new Date() < tempPerm.expires) {
                return { 
                    hasTemporary: true, 
                    expires: tempPerm.expires,
                    permission: tempPerm 
                };
            }
        }
        
        return { hasTemporary: false };
    }
    
    async applyInheritance(permission, resourceId, userId, context) {
        // Simulation d'héritage de permissions
        return { inherited: false };
    }
    
    async triggerApprovalWorkflow(request) {
        // Déclencher le workflow d'approbation approprié
        console.log(`🔄 Workflow d'approbation déclenché pour la demande ${request.id}`);
    }
    
    async canApprovePermission(approverId, permission) {
        // Vérifier si l'approbateur a les droits pour approuver cette permission
        return await this.auth.checkUserPermission(approverId, 'system:admin');
    }
    
    revokeTemporaryPermission(tempPermId) {
        const tempPerm = this.temporaryPermissions.get(tempPermId);
        if (tempPerm) {
            tempPerm.active = false;
            this.auditPermissionEvent('temporary_permission_revoked', {
                tempPermId,
                userId: tempPerm.userId,
                permission: tempPerm.permission
            });
        }
    }
    
    detectPermissionConflicts(matrix) {
        const conflicts = [];
        
        // Détecter les conflits entre permissions
        // Exemple : un utilisateur avec 'read' et 'no_read' en même temps
        
        return conflicts;
    }
    
    auditPermissionCheck(userId, permission, resourceId, result, context) {
        const auditEvent = {
            type: 'permission_check',
            userId,
            permission,
            resourceId,
            granted: result.granted,
            reason: result.reason,
            timestamp: new Date(),
            context: {
                ip: context.network?.ip,
                device: context.device?.type,
                session: context.session?.id
            }
        };
        
        console.log('📋 [AUDIT] Permission check:', auditEvent);
    }
    
    auditPermissionEvent(type, details) {
        console.log(`📋 [AUDIT] ${type}:`, details);
    }
    
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getClientIP() {
        return '192.168.1.100'; // Simulation
    }
    
    hashObject(obj) {
        const str = JSON.stringify(obj);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    
    // Méthodes de contexte (simulation)
    async getUserContext(userId) {
        return {
            id: userId,
            roles: ['user'],
            level: 'standard',
            verified: true
        };
    }
    
    async getSessionContext(userId) {
        return {
            id: 'session-123',
            created: new Date(),
            mfaVerified: false
        };
    }
    
    async getDeviceContext() {
        return {
            id: 'device-123',
            type: 'desktop',
            trusted: true,
            os: 'Windows'
        };
    }
    
    async getNetworkContext() {
        return {
            ip: '192.168.1.100',
            subnet: '192.168.1.0/24',
            vpn: false,
            trusted: true
        };
    }
    
    async getLocationContext() {
        return {
            country: 'FR',
            city: 'Paris',
            timezone: 'Europe/Paris'
        };
    }
    
    async getRiskContext(userId) {
        return {
            score: 25,
            level: 'low',
            factors: ['location', 'device', 'time']
        };
    }
    
    /**
     * Démarrage de la gestion des permissions
     */
    startPermissionManagement() {
        // Nettoyage périodique du cache
        setInterval(() => {
            this.cleanupPermissionCache();
        }, this.config.cacheTimeout);
        
        // Nettoyage des permissions temporaires expirées
        setInterval(() => {
            this.cleanupExpiredTemporaryPermissions();
        }, 60000); // Chaque minute
        
        // Nettoyage des demandes anciennes
        setInterval(() => {
            this.cleanupOldRequests();
        }, 24 * 60 * 60 * 1000); // Chaque jour
        
        console.log('⏰ Gestion des permissions démarrée');
    }
    
    cleanupPermissionCache() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, cached] of this.permissionCache.entries()) {
            if (now - cached.timestamp > cached.ttl) {
                this.permissionCache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} entrées de cache nettoyées`);
        }
    }
    
    cleanupExpiredTemporaryPermissions() {
        const now = new Date();
        let cleaned = 0;
        
        for (const [id, tempPerm] of this.temporaryPermissions.entries()) {
            if (now > tempPerm.expires) {
                tempPerm.active = false;
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} permissions temporaires expirées`);
        }
    }
    
    cleanupOldRequests() {
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 jours
        let cleaned = 0;
        
        for (const [id, request] of this.permissionRequests.entries()) {
            if (request.created < cutoff) {
                this.permissionRequests.delete(id);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} demandes anciennes nettoyées`);
        }
    }
    
    /**
     * API publique
     */
    getPermissionStatus() {
        return {
            permissions: this.permissions.size,
            resourceTypes: this.resourceTypes.size,
            permissionSets: this.permissionSets.size,
            temporaryPermissions: this.temporaryPermissions.size,
            pendingRequests: Array.from(this.permissionRequests.values())
                .filter(r => r.status === 'pending').length,
            cacheSize: this.permissionCache.size
        };
    }
    
    getPermissions() {
        return Array.from(this.permissions.values());
    }
    
    getResourceTypes() {
        return Array.from(this.resourceTypes.values());
    }
    
    getPermissionSets() {
        return Array.from(this.permissionSets.values());
    }
    
    getPendingRequests() {
        return Array.from(this.permissionRequests.values())
            .filter(r => r.status === 'pending');
    }
}

// Export pour compatibilité navigateur
window.PermissionSystem = PermissionSystem;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.permissionSystem && window.authController) {
        window.permissionSystem = new PermissionSystem(window.authController);
        console.log('🛡️ PermissionSystem initialisé globalement');
    }
});

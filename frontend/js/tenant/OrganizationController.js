/**
 * 🏛️ OrganizationController.js - FormEase Sprint 4 Phase 2
 * 
 * Contrôleur de gestion des organisations multi-tenant
 * Hiérarchie organisationnelle complète avec délégation
 * 
 * Fonctionnalités :
 * - Hiérarchie organisationnelle multi-niveaux
 * - Gestion des départements et équipes
 * - Délégation de permissions par unité
 * - Workflow d'approbation hiérarchique
 * - Reporting consolidé par organisation
 * - Budgets et coûts par département
 * - Politiques organisationnelles
 * - Audit et conformité par unité
 * 
 * @version 4.0.0
 * @author FormEase Organization Team
 * @since Sprint 4 Phase 2
 */

class OrganizationController {
    constructor() {
        this.organizations = new Map();
        this.organizationHierarchy = new Map();
        this.organizationUsers = new Map();
        this.organizationPolicies = new Map();
        this.organizationBudgets = new Map();
        this.organizationWorkflows = new Map();
        this.organizationReports = new Map();
        
        this.config = {
            maxHierarchyDepth: 10,
            maxUsersPerOrg: 10000,
            maxDepartmentsPerOrg: 100,
            maxTeamsPerDepartment: 50,
            defaultPolicies: true,
            auditRetention: 2555, // 7 ans
            budgetTrackingEnabled: true,
            workflowApprovalsEnabled: true
        };
        
        this.organizationTypes = {
            root: 'root',                    // Organisation racine
            division: 'division',            // Division
            department: 'department',        // Département
            team: 'team',                   // Équipe
            project: 'project',             // Projet
            workgroup: 'workgroup'          // Groupe de travail
        };
        
        this.organizationRoles = {
            owner: 'owner',                 // Propriétaire
            admin: 'admin',                 // Administrateur
            manager: 'manager',             // Manager
            supervisor: 'supervisor',       // Superviseur
            member: 'member',               // Membre
            viewer: 'viewer',               // Observateur
            guest: 'guest'                  // Invité
        };
        
        this.organizationStatus = {
            active: 'active',
            inactive: 'inactive',
            suspended: 'suspended',
            archived: 'archived',
            migrating: 'migrating',
            maintenance: 'maintenance'
        };
        
        this.budgetCategories = {
            personnel: 'personnel',
            technology: 'technology',
            operations: 'operations',
            marketing: 'marketing',
            travel: 'travel',
            training: 'training',
            facilities: 'facilities',
            external: 'external'
        };
        
        this.policyTypes = {
            security: 'security',
            privacy: 'privacy',
            compliance: 'compliance',
            workflow: 'workflow',
            approval: 'approval',
            access: 'access',
            data: 'data',
            retention: 'retention'
        };
        
        this.workflowSteps = {
            draft: 'draft',
            review: 'review',
            approval: 'approval',
            approved: 'approved',
            rejected: 'rejected',
            published: 'published'
        };
        
        this.init();
    }
    
    /**
     * Initialisation du contrôleur d'organisation
     */
    init() {
        this.setupDefaultPolicies();
        this.initializeWorkflowEngine();
        this.startOrganizationMonitoring();
        this.setupBudgetTracking();
        this.initializeReporting();
        console.log('🏛️ OrganizationController v4.0 initialisé - Multi-Tenant Organizations');
    }
    
    /**
     * Création d'une organisation
     */
    async createOrganization(tenantId, orgData) {
        try {
            const orgId = this.generateOrganizationId();
            
            // Vérifier les permissions du tenant
            await this.validateTenantPermissions(tenantId, 'create_organization');
            
            const organization = {
                id: orgId,
                tenantId: tenantId,
                name: orgData.name,
                description: orgData.description || '',
                type: orgData.type || this.organizationTypes.department,
                status: this.organizationStatus.active,
                
                // Hiérarchie
                parentId: orgData.parentId || null,
                children: [],
                level: 0,
                path: '',
                
                // Métadonnées
                created: new Date(),
                createdBy: orgData.createdBy,
                lastModified: new Date(),
                modifiedBy: orgData.createdBy,
                
                // Configuration
                config: {
                    maxUsers: orgData.maxUsers || this.config.maxUsersPerOrg,
                    maxSubOrgs: orgData.maxSubOrgs || this.config.maxDepartmentsPerOrg,
                    allowSubOrgs: orgData.allowSubOrgs !== false,
                    inheritPolicies: orgData.inheritPolicies !== false,
                    enableBudgetTracking: orgData.enableBudgetTracking !== false,
                    enableWorkflows: orgData.enableWorkflows !== false
                },
                
                // Utilisateurs et rôles
                users: new Map(),
                roles: new Map(),
                
                // Budgets
                budget: orgData.enableBudgetTracking ? {
                    annual: orgData.annualBudget || 0,
                    allocated: 0,
                    spent: 0,
                    remaining: 0,
                    categories: new Map(),
                    approvals: []
                } : null,
                
                // Métriques
                metrics: {
                    totalUsers: 0,
                    activeUsers: 0,
                    totalForms: 0,
                    totalSubmissions: 0,
                    totalWorkflows: 0,
                    avgResponseTime: 0
                },
                
                // Contact
                contact: {
                    email: orgData.contactEmail,
                    phone: orgData.contactPhone,
                    address: orgData.address,
                    manager: orgData.managerId
                },
                
                // Intégrations
                integrations: {
                    ldap: null,
                    saml: null,
                    scim: null,
                    custom: []
                }
            };
            
            // Calculer la hiérarchie
            if (organization.parentId) {
                await this.updateOrganizationHierarchy(organization);
            }
            
            // Appliquer les politiques par défaut
            await this.applyDefaultPolicies(organization);
            
            // Initialiser le budget si activé
            if (organization.budget) {
                await this.initializeOrganizationBudget(organization);
            }
            
            // Configurer les workflows
            if (organization.config.enableWorkflows) {
                await this.setupOrganizationWorkflows(organization);
            }
            
            // Sauvegarder
            this.organizations.set(orgId, organization);
            
            // Mettre à jour la hiérarchie globale
            await this.updateHierarchyMaps(organization);
            
            // Journaliser
            await this.logOrganizationEvent(orgId, 'organization_created', {
                name: organization.name,
                type: organization.type,
                parentId: organization.parentId,
                createdBy: organization.createdBy
            });
            
            console.log(`✅ Organisation créée : ${orgId} (${organization.name})`);
            return organization;
            
        } catch (error) {
            console.error('Erreur création organisation :', error);
            throw error;
        }
    }
    
    /**
     * Ajout d'un utilisateur à une organisation
     */
    async addUserToOrganization(orgId, userId, role = this.organizationRoles.member, options = {}) {
        try {
            const organization = this.organizations.get(orgId);
            if (!organization) {
                throw new Error(`Organisation ${orgId} introuvable`);
            }
            
            // Vérifier les quotas
            if (organization.users.size >= organization.config.maxUsers) {
                throw new Error(`Quota d'utilisateurs atteint pour ${orgId}`);
            }
            
            // Vérifier si l'utilisateur existe déjà
            if (organization.users.has(userId)) {
                throw new Error(`Utilisateur ${userId} déjà membre de ${orgId}`);
            }
            
            const membership = {
                userId: userId,
                orgId: orgId,
                role: role,
                joinedAt: new Date(),
                addedBy: options.addedBy,
                status: 'active',
                
                // Permissions spécifiques
                permissions: options.permissions || [],
                
                // Délégation
                delegatedFrom: options.delegatedFrom || null,
                delegatedUntil: options.delegatedUntil || null,
                
                // Budget
                budgetAccess: options.budgetAccess || false,
                budgetLimit: options.budgetLimit || 0,
                
                // Notifications
                notifications: {
                    email: options.emailNotifications !== false,
                    push: options.pushNotifications !== false,
                    digest: options.digestNotifications !== false
                },
                
                // Métadonnées
                metadata: options.metadata || {}
            };
            
            // Appliquer les permissions du rôle
            await this.applyRolePermissions(membership, role);
            
            // Ajouter à l'organisation
            organization.users.set(userId, membership);
            
            // Mettre à jour les métriques
            organization.metrics.totalUsers = organization.users.size;
            organization.metrics.activeUsers = Array.from(organization.users.values())
                .filter(u => u.status === 'active').length;
            
            // Notifier l'utilisateur
            if (membership.notifications.email) {
                await this.notifyUserAdded(userId, organization, role);
            }
            
            // Journaliser
            await this.logOrganizationEvent(orgId, 'user_added', {
                userId,
                role,
                addedBy: options.addedBy
            });
            
            console.log(`👤 Utilisateur ${userId} ajouté à ${orgId} (${role})`);
            return membership;
            
        } catch (error) {
            console.error('Erreur ajout utilisateur :', error);
            throw error;
        }
    }
    
    /**
     * Gestion hiérarchique des organisations
     */
    async updateOrganizationHierarchy(organization) {
        if (!organization.parentId) {
            organization.level = 0;
            organization.path = organization.id;
            return;
        }
        
        const parent = this.organizations.get(organization.parentId);
        if (!parent) {
            throw new Error(`Organisation parent ${organization.parentId} introuvable`);
        }
        
        // Vérifier la profondeur maximale
        if (parent.level >= this.config.maxHierarchyDepth) {
            throw new Error('Profondeur hiérarchique maximale atteinte');
        }
        
        // Mettre à jour la hiérarchie
        organization.level = parent.level + 1;
        organization.path = `${parent.path}/${organization.id}`;
        
        // Ajouter aux enfants du parent
        if (!parent.children.includes(organization.id)) {
            parent.children.push(organization.id);
        }
        
        console.log(`🌳 Hiérarchie mise à jour : ${organization.path} (niveau ${organization.level})`);
    }
    
    /**
     * Application des politiques par défaut
     */
    async applyDefaultPolicies(organization) {
        const policies = new Map();
        
        // Politique de sécurité
        policies.set('security', {
            type: this.policyTypes.security,
            name: 'Politique de Sécurité par Défaut',
            rules: {
                passwordPolicy: {
                    minLength: 8,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: true
                },
                sessionTimeout: 3600, // 1 heure
                maxFailedLogins: 5,
                twoFactorRequired: false,
                ipRestrictions: []
            },
            inherited: organization.parentId ? true : false,
            enforced: true,
            createdAt: new Date()
        });
        
        // Politique de confidentialité
        policies.set('privacy', {
            type: this.policyTypes.privacy,
            name: 'Politique de Confidentialité',
            rules: {
                dataRetention: 2555, // 7 ans
                dataEncryption: true,
                dataSharing: false,
                consentRequired: true,
                rightToForget: true,
                dataPortability: true
            },
            inherited: organization.parentId ? true : false,
            enforced: true,
            createdAt: new Date()
        });
        
        // Politique de conformité
        policies.set('compliance', {
            type: this.policyTypes.compliance,
            name: 'Politique de Conformité',
            rules: {
                auditTrail: true,
                documentRetention: 2555,
                regulatoryCompliance: ['GDPR', 'SOC2', 'ISO27001'],
                dataClassification: true,
                accessLogging: true,
                changeManagement: true
            },
            inherited: organization.parentId ? true : false,
            enforced: true,
            createdAt: new Date()
        });
        
        // Politique d'approbation
        policies.set('approval', {
            type: this.policyTypes.approval,
            name: 'Workflow d\'Approbation',
            rules: {
                requireApproval: true,
                approvalLevels: 2,
                approvalTimeout: 72, // 72 heures
                escalationEnabled: true,
                parallelApprovals: false,
                budgetThreshold: 1000
            },
            inherited: organization.parentId ? true : false,
            enforced: false,
            createdAt: new Date()
        });
        
        this.organizationPolicies.set(organization.id, policies);
        console.log(`📋 Politiques appliquées pour ${organization.id}`);
    }
    
    /**
     * Initialisation du budget organisationnel
     */
    async initializeOrganizationBudget(organization) {
        if (!organization.budget) return;
        
        const budget = organization.budget;
        const categories = new Map();
        
        // Catégories de budget par défaut
        for (const [category, name] of Object.entries(this.budgetCategories)) {
            categories.set(category, {
                name: name,
                allocated: 0,
                spent: 0,
                remaining: 0,
                percentage: 0,
                threshold: 90, // Alerte à 90%
                approvals: [],
                transactions: []
            });
        }
        
        budget.categories = categories;
        budget.remaining = budget.annual;
        
        // Créer le tableau de bord budgétaire
        await this.createBudgetDashboard(organization);
        
        console.log(`💰 Budget initialisé pour ${organization.id} : ${budget.annual}€`);
    }
    
    /**
     * Configuration des workflows organisationnels
     */
    async setupOrganizationWorkflows(organization) {
        const workflows = new Map();
        
        // Workflow d'approbation de formulaire
        workflows.set('form_approval', {
            id: 'form_approval',
            name: 'Approbation de Formulaire',
            description: 'Workflow d\'approbation pour les nouveaux formulaires',
            steps: [
                {
                    id: 'draft',
                    name: 'Brouillon',
                    type: 'start',
                    assignee: 'creator',
                    actions: ['submit_for_review', 'save_draft', 'delete']
                },
                {
                    id: 'review',
                    name: 'Révision',
                    type: 'review',
                    assignee: 'supervisor',
                    timeout: 48, // 48 heures
                    actions: ['approve', 'reject', 'request_changes']
                },
                {
                    id: 'final_approval',
                    name: 'Approbation Finale',
                    type: 'approval',
                    assignee: 'manager',
                    timeout: 24, // 24 heures
                    actions: ['approve', 'reject'],
                    conditions: ['budget_check', 'compliance_check']
                },
                {
                    id: 'published',
                    name: 'Publié',
                    type: 'end',
                    actions: ['archive', 'update']
                }
            ],
            triggers: {
                onApprove: 'next_step',
                onReject: 'back_to_draft',
                onTimeout: 'escalate'
            },
            notifications: {
                email: true,
                push: true,
                dashboard: true
            }
        });
        
        // Workflow d'approbation budgétaire
        workflows.set('budget_approval', {
            id: 'budget_approval',
            name: 'Approbation Budgétaire',
            description: 'Workflow d\'approbation pour les dépenses budgétaires',
            steps: [
                {
                    id: 'request',
                    name: 'Demande',
                    type: 'start',
                    assignee: 'requester',
                    actions: ['submit_request']
                },
                {
                    id: 'manager_approval',
                    name: 'Approbation Manager',
                    type: 'approval',
                    assignee: 'manager',
                    timeout: 24,
                    actions: ['approve', 'reject', 'request_info'],
                    conditions: ['budget_available', 'within_limit']
                },
                {
                    id: 'finance_approval',
                    name: 'Approbation Finance',
                    type: 'approval',
                    assignee: 'finance',
                    timeout: 48,
                    actions: ['approve', 'reject'],
                    conditions: ['amount_over_threshold']
                },
                {
                    id: 'approved',
                    name: 'Approuvé',
                    type: 'end',
                    actions: ['execute_payment']
                }
            ],
            conditions: {
                amount_over_threshold: (amount) => amount > 5000,
                budget_available: (amount, budget) => budget.remaining >= amount,
                within_limit: (amount, user) => amount <= user.budgetLimit
            }
        });
        
        this.organizationWorkflows.set(organization.id, workflows);
        console.log(`⚙️ Workflows configurés pour ${organization.id}`);
    }
    
    /**
     * Gestion des approbations hiérarchiques
     */
    async requestApproval(orgId, workflowType, requestData) {
        try {
            const organization = this.organizations.get(orgId);
            if (!organization) {
                throw new Error(`Organisation ${orgId} introuvable`);
            }
            
            const workflows = this.organizationWorkflows.get(orgId);
            const workflow = workflows?.get(workflowType);
            
            if (!workflow) {
                throw new Error(`Workflow ${workflowType} non configuré pour ${orgId}`);
            }
            
            const approvalId = this.generateApprovalId();
            
            const approval = {
                id: approvalId,
                orgId: orgId,
                workflowType: workflowType,
                requestData: requestData,
                
                // État
                status: 'pending',
                currentStep: workflow.steps[0].id,
                stepIndex: 0,
                
                // Demandeur
                requester: requestData.requesterId,
                createdAt: new Date(),
                
                // Historique
                history: [{
                    step: workflow.steps[0].id,
                    action: 'initiated',
                    actor: requestData.requesterId,
                    timestamp: new Date(),
                    comment: requestData.comment || ''
                }],
                
                // Assignations
                assignments: new Map(),
                
                // Échéances
                deadlines: new Map(),
                
                // Notifications envoyées
                notifications: []
            };
            
            // Assigner la première étape
            await this.assignApprovalStep(approval, workflow);
            
            // Envoyer les notifications
            await this.sendApprovalNotifications(approval, workflow);
            
            // Sauvegarder
            const orgApprovals = this.organizationWorkflows.get(orgId) || new Map();
            if (!orgApprovals.has('active_approvals')) {
                orgApprovals.set('active_approvals', new Map());
            }
            
            orgApprovals.get('active_approvals').set(approvalId, approval);
            this.organizationWorkflows.set(orgId, orgApprovals);
            
            await this.logOrganizationEvent(orgId, 'approval_requested', {
                approvalId,
                workflowType,
                requester: requestData.requesterId
            });
            
            console.log(`📋 Demande d'approbation ${approvalId} créée pour ${orgId}`);
            return approval;
            
        } catch (error) {
            console.error('Erreur demande approbation :', error);
            throw error;
        }
    }
    
    /**
     * Traitement d'une approbation
     */
    async processApproval(approvalId, action, actorId, comment = '') {
        try {
            const approval = this.findApproval(approvalId);
            if (!approval) {
                throw new Error(`Approbation ${approvalId} introuvable`);
            }
            
            const organization = this.organizations.get(approval.orgId);
            const workflows = this.organizationWorkflows.get(approval.orgId);
            const workflow = workflows.get(approval.workflowType);
            const currentStep = workflow.steps[approval.stepIndex];
            
            // Vérifier les permissions
            await this.validateApprovalPermissions(approval, actorId, action);
            
            // Enregistrer l'action
            approval.history.push({
                step: currentStep.id,
                action: action,
                actor: actorId,
                timestamp: new Date(),
                comment: comment
            });
            
            // Traiter l'action
            switch (action) {
                case 'approve':
                    await this.processApprove(approval, workflow);
                    break;
                    
                case 'reject':
                    await this.processReject(approval, workflow);
                    break;
                    
                case 'request_changes':
                    await this.processRequestChanges(approval, workflow);
                    break;
                    
                case 'escalate':
                    await this.processEscalate(approval, workflow);
                    break;
                    
                default:
                    throw new Error(`Action ${action} non supportée`);
            }
            
            // Envoyer les notifications
            await this.sendApprovalUpdateNotifications(approval, workflow, action, actorId);
            
            await this.logOrganizationEvent(approval.orgId, 'approval_processed', {
                approvalId,
                action,
                actor: actorId,
                step: currentStep.id
            });
            
            console.log(`✅ Approbation ${approvalId} traitée : ${action} par ${actorId}`);
            return approval;
            
        } catch (error) {
            console.error('Erreur traitement approbation :', error);
            throw error;
        }
    }
    
    /**
     * Gestion des budgets organisationnels
     */
    async allocateBudget(orgId, category, amount, options = {}) {
        try {
            const organization = this.organizations.get(orgId);
            if (!organization || !organization.budget) {
                throw new Error(`Budget non configuré pour ${orgId}`);
            }
            
            const budget = organization.budget;
            const categoryBudget = budget.categories.get(category);
            
            if (!categoryBudget) {
                throw new Error(`Catégorie ${category} inexistante`);
            }
            
            // Vérifier la disponibilité
            const totalAllocated = Array.from(budget.categories.values())
                .reduce((sum, cat) => sum + cat.allocated, 0);
            
            if (totalAllocated + amount > budget.annual) {
                throw new Error('Allocation dépasse le budget annuel');
            }
            
            // Alloquer le budget
            categoryBudget.allocated += amount;
            categoryBudget.remaining = categoryBudget.allocated - categoryBudget.spent;
            categoryBudget.percentage = (categoryBudget.allocated / budget.annual) * 100;
            
            // Mettre à jour le budget global
            budget.allocated = totalAllocated + amount;
            budget.remaining = budget.annual - budget.allocated;
            
            // Enregistrer la transaction
            const transaction = {
                id: this.generateTransactionId(),
                type: 'allocation',
                category: category,
                amount: amount,
                description: options.description || 'Allocation budgétaire',
                date: new Date(),
                allocatedBy: options.allocatedBy,
                approvalId: options.approvalId
            };
            
            categoryBudget.transactions.push(transaction);
            
            // Vérifier les seuils d'alerte
            if (categoryBudget.percentage >= categoryBudget.threshold) {
                await this.sendBudgetAlert(orgId, category, categoryBudget);
            }
            
            await this.logOrganizationEvent(orgId, 'budget_allocated', {
                category,
                amount,
                allocatedBy: options.allocatedBy
            });
            
            console.log(`💰 Budget alloué pour ${orgId}/${category} : ${amount}€`);
            return transaction;
            
        } catch (error) {
            console.error('Erreur allocation budget :', error);
            throw error;
        }
    }
    
    /**
     * Reporting organisationnel
     */
    async generateOrganizationReport(orgId, reportType, period = 'monthly') {
        try {
            const organization = this.organizations.get(orgId);
            if (!organization) {
                throw new Error(`Organisation ${orgId} introuvable`);
            }
            
            const reportId = this.generateReportId();
            const startDate = this.getReportPeriodStart(period);
            const endDate = new Date();
            
            let reportData = {};
            
            switch (reportType) {
                case 'activity':
                    reportData = await this.generateActivityReport(organization, startDate, endDate);
                    break;
                    
                case 'budget':
                    reportData = await this.generateBudgetReport(organization, startDate, endDate);
                    break;
                    
                case 'compliance':
                    reportData = await this.generateComplianceReport(organization, startDate, endDate);
                    break;
                    
                case 'performance':
                    reportData = await this.generatePerformanceReport(organization, startDate, endDate);
                    break;
                    
                case 'consolidation':
                    reportData = await this.generateConsolidatedReport(organization, startDate, endDate);
                    break;
                    
                default:
                    throw new Error(`Type de rapport ${reportType} non supporté`);
            }
            
            const report = {
                id: reportId,
                orgId: orgId,
                type: reportType,
                period: period,
                startDate: startDate,
                endDate: endDate,
                generatedAt: new Date(),
                generatedBy: 'system',
                data: reportData,
                format: 'json',
                status: 'completed'
            };
            
            // Sauvegarder le rapport
            let orgReports = this.organizationReports.get(orgId);
            if (!orgReports) {
                orgReports = new Map();
                this.organizationReports.set(orgId, orgReports);
            }
            
            orgReports.set(reportId, report);
            
            await this.logOrganizationEvent(orgId, 'report_generated', {
                reportId,
                reportType,
                period
            });
            
            console.log(`📊 Rapport ${reportType} généré pour ${orgId}`);
            return report;
            
        } catch (error) {
            console.error('Erreur génération rapport :', error);
            throw error;
        }
    }
    
    /**
     * Démarrage du monitoring organisationnel
     */
    startOrganizationMonitoring() {
        // Monitoring des métriques organisationnelles
        setInterval(() => {
            this.collectOrganizationMetrics();
        }, 300000); // Chaque 5 minutes
        
        // Vérification des budgets
        setInterval(() => {
            this.checkOrganizationBudgets();
        }, 3600000); // Chaque heure
        
        // Monitoring des approbations en attente
        setInterval(() => {
            this.checkPendingApprovals();
        }, 1800000); // Chaque 30 minutes
        
        // Nettoyage périodique
        setInterval(() => {
            this.performOrganizationCleanup();
        }, 86400000); // Chaque jour
        
        console.log('📊 Monitoring organisationnel démarré');
    }
    
    /**
     * Fonctions utilitaires
     */
    generateOrganizationId() {
        return `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateApprovalId() {
        return `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateTransactionId() {
        return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateReportId() {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    async validateTenantPermissions(tenantId, action) {
        // Simulation de validation des permissions tenant
        if (!tenantId) {
            throw new Error('Tenant ID requis');
        }
        
        return true;
    }
    
    async applyRolePermissions(membership, role) {
        const rolePermissions = {
            [this.organizationRoles.owner]: [
                'manage_organization', 'manage_users', 'manage_budget',
                'manage_policies', 'view_reports', 'manage_integrations'
            ],
            [this.organizationRoles.admin]: [
                'manage_users', 'view_budget', 'manage_workflows',
                'view_reports', 'manage_forms'
            ],
            [this.organizationRoles.manager]: [
                'manage_team', 'view_budget', 'approve_workflows',
                'view_reports', 'create_forms'
            ],
            [this.organizationRoles.supervisor]: [
                'manage_team', 'view_budget', 'view_reports', 'create_forms'
            ],
            [this.organizationRoles.member]: [
                'view_organization', 'create_forms', 'submit_forms'
            ],
            [this.organizationRoles.viewer]: [
                'view_organization', 'view_forms'
            ],
            [this.organizationRoles.guest]: [
                'view_public'
            ]
        };
        
        membership.permissions = rolePermissions[role] || [];
    }
    
    async notifyUserAdded(userId, organization, role) {
        console.log(`📧 Notification envoyée à ${userId} pour ${organization.name} (${role})`);
    }
    
    async updateHierarchyMaps(organization) {
        // Mettre à jour les cartes de hiérarchie
        this.organizationHierarchy.set(organization.id, {
            parentId: organization.parentId,
            children: organization.children,
            level: organization.level,
            path: organization.path
        });
    }
    
    findApproval(approvalId) {
        for (const [orgId, workflows] of this.organizationWorkflows) {
            const activeApprovals = workflows.get('active_approvals');
            if (activeApprovals && activeApprovals.has(approvalId)) {
                return activeApprovals.get(approvalId);
            }
        }
        return null;
    }
    
    async validateApprovalPermissions(approval, actorId, action) {
        // Simulation de validation des permissions d'approbation
        return true;
    }
    
    async processApprove(approval, workflow) {
        // Passer à l'étape suivante
        if (approval.stepIndex < workflow.steps.length - 1) {
            approval.stepIndex++;
            approval.currentStep = workflow.steps[approval.stepIndex].id;
            
            if (approval.stepIndex === workflow.steps.length - 1) {
                approval.status = 'approved';
            }
        } else {
            approval.status = 'approved';
        }
    }
    
    async processReject(approval, workflow) {
        approval.status = 'rejected';
    }
    
    async processRequestChanges(approval, workflow) {
        approval.status = 'changes_requested';
        // Retour au début du workflow
        approval.stepIndex = 0;
        approval.currentStep = workflow.steps[0].id;
    }
    
    async processEscalate(approval, workflow) {
        approval.status = 'escalated';
        // Logique d'escalade à implémenter
    }
    
    async sendApprovalNotifications(approval, workflow) {
        console.log(`📧 Notifications d'approbation envoyées pour ${approval.id}`);
    }
    
    async sendApprovalUpdateNotifications(approval, workflow, action, actorId) {
        console.log(`📧 Notifications de mise à jour envoyées pour ${approval.id}`);
    }
    
    async assignApprovalStep(approval, workflow) {
        const currentStep = workflow.steps[approval.stepIndex];
        approval.assignments.set(currentStep.id, {
            assignee: currentStep.assignee,
            assignedAt: new Date(),
            timeout: currentStep.timeout
        });
    }
    
    async createBudgetDashboard(organization) {
        console.log(`📊 Tableau de bord budgétaire créé pour ${organization.id}`);
    }
    
    async sendBudgetAlert(orgId, category, categoryBudget) {
        console.log(`🚨 Alerte budget pour ${orgId}/${category} : ${categoryBudget.percentage}%`);
    }
    
    getReportPeriodStart(period) {
        const now = new Date();
        switch (period) {
            case 'daily':
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            case 'weekly':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                return weekStart;
            case 'monthly':
                return new Date(now.getFullYear(), now.getMonth(), 1);
            case 'quarterly':
                const quarter = Math.floor(now.getMonth() / 3);
                return new Date(now.getFullYear(), quarter * 3, 1);
            case 'yearly':
                return new Date(now.getFullYear(), 0, 1);
            default:
                return new Date(now.getFullYear(), now.getMonth(), 1);
        }
    }
    
    async generateActivityReport(organization, startDate, endDate) {
        return {
            totalUsers: organization.metrics.totalUsers,
            activeUsers: organization.metrics.activeUsers,
            totalForms: organization.metrics.totalForms,
            totalSubmissions: organization.metrics.totalSubmissions,
            period: { startDate, endDate }
        };
    }
    
    async generateBudgetReport(organization, startDate, endDate) {
        if (!organization.budget) return { message: 'Aucun budget configuré' };
        
        return {
            annual: organization.budget.annual,
            allocated: organization.budget.allocated,
            spent: organization.budget.spent,
            remaining: organization.budget.remaining,
            categories: Array.from(organization.budget.categories.entries()),
            period: { startDate, endDate }
        };
    }
    
    async generateComplianceReport(organization, startDate, endDate) {
        const policies = this.organizationPolicies.get(organization.id);
        return {
            totalPolicies: policies ? policies.size : 0,
            enforcedPolicies: policies ? Array.from(policies.values()).filter(p => p.enforced).length : 0,
            period: { startDate, endDate }
        };
    }
    
    async generatePerformanceReport(organization, startDate, endDate) {
        return {
            avgResponseTime: organization.metrics.avgResponseTime,
            totalWorkflows: organization.metrics.totalWorkflows,
            period: { startDate, endDate }
        };
    }
    
    async generateConsolidatedReport(organization, startDate, endDate) {
        // Rapport consolidé incluant les sous-organisations
        const childReports = [];
        
        for (const childId of organization.children) {
            const childOrg = this.organizations.get(childId);
            if (childOrg) {
                const childReport = await this.generateActivityReport(childOrg, startDate, endDate);
                childReports.push({ orgId: childId, name: childOrg.name, data: childReport });
            }
        }
        
        return {
            organization: await this.generateActivityReport(organization, startDate, endDate),
            children: childReports,
            period: { startDate, endDate }
        };
    }
    
    collectOrganizationMetrics() {
        for (const [orgId, organization] of this.organizations) {
            // Simulation de collecte de métriques
            organization.metrics.activeUsers = Math.floor(organization.metrics.totalUsers * 0.8);
        }
    }
    
    checkOrganizationBudgets() {
        for (const [orgId, organization] of this.organizations) {
            if (organization.budget) {
                // Vérification des budgets
                for (const [category, categoryBudget] of organization.budget.categories) {
                    if (categoryBudget.percentage >= categoryBudget.threshold) {
                        this.sendBudgetAlert(orgId, category, categoryBudget);
                    }
                }
            }
        }
    }
    
    checkPendingApprovals() {
        for (const [orgId, workflows] of this.organizationWorkflows) {
            const activeApprovals = workflows.get('active_approvals');
            if (activeApprovals) {
                for (const [approvalId, approval] of activeApprovals) {
                    if (approval.status === 'pending') {
                        // Vérifier les timeouts
                        console.log(`⏰ Vérification timeout pour approbation ${approvalId}`);
                    }
                }
            }
        }
    }
    
    performOrganizationCleanup() {
        console.log('🧹 Nettoyage organisationnel...');
        // Simulation de nettoyage
    }
    
    async logOrganizationEvent(orgId, event, details) {
        if (window.auditLogger) {
            await window.auditLogger.log(
                window.auditLogger.logLevels.info,
                'organization_management',
                event,
                { orgId, ...details },
                { orgId }
            );
        }
        
        console.log(`🏛️ [ORG-${orgId}] ${event}:`, details);
    }
    
    /**
     * API publique
     */
    getOrganizationStatus() {
        return {
            totalOrganizations: this.organizations.size,
            activeOrganizations: Array.from(this.organizations.values()).filter(o => o.status === this.organizationStatus.active).length,
            maxHierarchyDepth: Math.max(...Array.from(this.organizations.values()).map(o => o.level), 0),
            totalUsers: Array.from(this.organizations.values()).reduce((sum, org) => sum + org.metrics.totalUsers, 0),
            totalBudget: Array.from(this.organizations.values()).reduce((sum, org) => sum + (org.budget?.annual || 0), 0)
        };
    }
    
    getOrganizations(tenantId) {
        return Array.from(this.organizations.values()).filter(org => org.tenantId === tenantId);
    }
    
    getOrganizationHierarchy(tenantId) {
        const orgs = this.getOrganizations(tenantId);
        return this.buildHierarchyTree(orgs);
    }
    
    buildHierarchyTree(organizations) {
        const orgMap = new Map(organizations.map(org => [org.id, { ...org, children: [] }]));
        const roots = [];
        
        for (const org of orgMap.values()) {
            if (org.parentId && orgMap.has(org.parentId)) {
                orgMap.get(org.parentId).children.push(org);
            } else {
                roots.push(org);
            }
        }
        
        return roots;
    }
    
    getOrganization(orgId) {
        return this.organizations.get(orgId);
    }
    
    getOrganizationPolicies(orgId) {
        return this.organizationPolicies.get(orgId);
    }
    
    getOrganizationWorkflows(orgId) {
        return this.organizationWorkflows.get(orgId);
    }
    
    getOrganizationReports(orgId) {
        return this.organizationReports.get(orgId);
    }
}

// Export pour compatibilité navigateur
window.OrganizationController = OrganizationController;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.organizationController) {
        window.organizationController = new OrganizationController();
        console.log('🏛️ OrganizationController initialisé globalement');
    }
});

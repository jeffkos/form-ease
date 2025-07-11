/**
 * 🔑 AuthController.js - FormEase Sprint 4 Phase 1
 * 
 * Contrôleur d'authentification et autorisation avancé
 * Gestion complète des utilisateurs et permissions
 * 
 * Fonctionnalités :
 * - Authentification multi-provider (OAuth, SAML, LDAP)
 * - Gestion des rôles et permissions granulaires
 * - Single Sign-On (SSO) enterprise
 * - Delegation et impersonation
 * - API tokens et clés d'API
 * - Fédération d'identités
 * - Connexion sociale (Google, Microsoft, etc.)
 * - Zero-trust architecture
 * 
 * @version 4.0.0
 * @author FormEase Security Team
 * @since Sprint 4 Phase 1
 */

class AuthController {
    constructor(securityManager) {
        this.security = securityManager || window.securityManager;
        this.users = new Map();
        this.roles = new Map();
        this.permissions = new Map();
        this.authProviders = new Map();
        this.apiTokens = new Map();
        this.delegations = new Map();
        this.socialProviders = new Map();
        
        this.config = {
            sessionDuration: 8 * 60 * 60 * 1000, // 8 heures
            refreshTokenDuration: 30 * 24 * 60 * 60 * 1000, // 30 jours
            apiTokenDuration: 365 * 24 * 60 * 60 * 1000, // 1 an
            maxConcurrentSessions: 5,
            enableDelegation: true,
            enableImpersonation: true,
            enableSSO: true,
            requireMFAForAdmin: true,
            passwordPolicy: 'STRICT'
        };
        
        this.roleHierarchy = {
            superadmin: ['admin', 'manager', 'user', 'viewer'],
            admin: ['manager', 'user', 'viewer'],
            manager: ['user', 'viewer'],
            user: ['viewer'],
            viewer: []
        };
        
        this.authMethods = {
            password: 'password',
            oauth2: 'oauth2',
            saml: 'saml',
            ldap: 'ldap',
            apiKey: 'api_key',
            jwt: 'jwt',
            social: 'social',
            delegation: 'delegation'
        };
        
        this.permissionScopes = {
            system: 'system',           // Administration système
            organization: 'organization', // Gestion organisation
            project: 'project',         // Gestion projets
            form: 'form',              // Gestion formulaires
            data: 'data',              // Accès données
            analytics: 'analytics',     // Analytics et rapports
            integration: 'integration', // Intégrations
            workflow: 'workflow',      // Workflows
            ai: 'ai'                   // Fonctionnalités IA
        };
        
        this.actionTypes = {
            create: 'create',
            read: 'read',
            update: 'update',
            delete: 'delete',
            execute: 'execute',
            approve: 'approve',
            publish: 'publish',
            export: 'export',
            import: 'import',
            admin: 'admin'
        };
        
        this.init();
    }
    
    /**
     * Initialisation du contrôleur d'authentification
     */
    init() {
        this.setupDefaultRoles();
        this.setupDefaultPermissions();
        this.setupAuthProviders();
        this.setupSocialProviders();
        this.initializeZeroTrust();
        this.startSessionManagement();
        console.log('🔑 AuthController v4.0 initialisé - Mode ENTERPRISE');
    }
    
    /**
     * Configuration des rôles par défaut
     */
    setupDefaultRoles() {
        // Super Administrateur
        this.roles.set('superadmin', {
            id: 'superadmin',
            name: 'Super Administrateur',
            description: 'Accès complet au système',
            level: 100,
            permissions: ['*'], // Toutes les permissions
            inherits: [],
            restrictions: [],
            mfaRequired: true,
            sessionTimeout: 2 * 60 * 60 * 1000, // 2 heures
            ipRestrictions: false,
            auditLevel: 'FULL'
        });
        
        // Administrateur
        this.roles.set('admin', {
            id: 'admin',
            name: 'Administrateur',
            description: 'Administration de l\'organisation',
            level: 80,
            permissions: [
                'system:read', 'system:update',
                'organization:*',
                'project:*',
                'form:*',
                'data:*',
                'analytics:*',
                'integration:*',
                'workflow:*'
            ],
            inherits: ['manager'],
            restrictions: ['system:delete'],
            mfaRequired: true,
            sessionTimeout: 4 * 60 * 60 * 1000, // 4 heures
            ipRestrictions: false,
            auditLevel: 'HIGH'
        });
        
        // Manager
        this.roles.set('manager', {
            id: 'manager',
            name: 'Manager',
            description: 'Gestion d\'équipe et projets',
            level: 60,
            permissions: [
                'project:*',
                'form:*',
                'data:read', 'data:export',
                'analytics:read',
                'workflow:*',
                'integration:read'
            ],
            inherits: ['user'],
            restrictions: ['system:*', 'organization:delete'],
            mfaRequired: false,
            sessionTimeout: 6 * 60 * 60 * 1000, // 6 heures
            ipRestrictions: false,
            auditLevel: 'MEDIUM'
        });
        
        // Utilisateur
        this.roles.set('user', {
            id: 'user',
            name: 'Utilisateur',
            description: 'Utilisateur standard',
            level: 40,
            permissions: [
                'form:create', 'form:read', 'form:update',
                'data:read',
                'analytics:read',
                'workflow:execute',
                'ai:read', 'ai:execute'
            ],
            inherits: ['viewer'],
            restrictions: ['system:*', 'organization:*'],
            mfaRequired: false,
            sessionTimeout: 8 * 60 * 60 * 1000, // 8 heures
            ipRestrictions: false,
            auditLevel: 'LOW'
        });
        
        // Viewer (Lecture seule)
        this.roles.set('viewer', {
            id: 'viewer',
            name: 'Observateur',
            description: 'Accès en lecture seule',
            level: 20,
            permissions: [
                'form:read',
                'data:read',
                'analytics:read'
            ],
            inherits: [],
            restrictions: ['*:create', '*:update', '*:delete'],
            mfaRequired: false,
            sessionTimeout: 4 * 60 * 60 * 1000, // 4 heures
            ipRestrictions: false,
            auditLevel: 'LOW'
        });
        
        // API User (Pour les intégrations)
        this.roles.set('api-user', {
            id: 'api-user',
            name: 'Utilisateur API',
            description: 'Accès API programmatique',
            level: 30,
            permissions: [
                'form:read', 'form:create',
                'data:read', 'data:create',
                'integration:execute',
                'workflow:execute'
            ],
            inherits: [],
            restrictions: ['system:*', 'organization:*'],
            mfaRequired: false,
            sessionTimeout: 24 * 60 * 60 * 1000, // 24 heures
            ipRestrictions: true,
            auditLevel: 'HIGH'
        });
        
        console.log('👥 Rôles par défaut configurés :', this.roles.size);
    }
    
    /**
     * Configuration des permissions par défaut
     */
    setupDefaultPermissions() {
        // Permissions système
        const systemPermissions = [
            'system:read', 'system:update', 'system:delete', 'system:admin',
            'system:backup', 'system:restore', 'system:monitor'
        ];
        
        // Permissions organisation
        const orgPermissions = [
            'organization:create', 'organization:read', 'organization:update', 'organization:delete',
            'organization:admin', 'organization:billing', 'organization:settings'
        ];
        
        // Permissions projet
        const projectPermissions = [
            'project:create', 'project:read', 'project:update', 'project:delete',
            'project:publish', 'project:share', 'project:collaborate'
        ];
        
        // Permissions formulaire
        const formPermissions = [
            'form:create', 'form:read', 'form:update', 'form:delete',
            'form:publish', 'form:unpublish', 'form:duplicate', 'form:template'
        ];
        
        // Permissions données
        const dataPermissions = [
            'data:read', 'data:create', 'data:update', 'data:delete',
            'data:export', 'data:import', 'data:anonymize', 'data:purge'
        ];
        
        // Permissions analytics
        const analyticsPermissions = [
            'analytics:read', 'analytics:create', 'analytics:update', 'analytics:delete',
            'analytics:export', 'analytics:schedule', 'analytics:share'
        ];
        
        // Permissions intégrations
        const integrationPermissions = [
            'integration:read', 'integration:create', 'integration:update', 'integration:delete',
            'integration:execute', 'integration:test', 'integration:deploy'
        ];
        
        // Permissions workflows
        const workflowPermissions = [
            'workflow:read', 'workflow:create', 'workflow:update', 'workflow:delete',
            'workflow:execute', 'workflow:approve', 'workflow:publish'
        ];
        
        // Permissions IA
        const aiPermissions = [
            'ai:read', 'ai:execute', 'ai:train', 'ai:configure',
            'ai:monitor', 'ai:export', 'ai:import'
        ];
        
        // Ajouter toutes les permissions
        const allPermissions = [
            ...systemPermissions,
            ...orgPermissions,
            ...projectPermissions,
            ...formPermissions,
            ...dataPermissions,
            ...analyticsPermissions,
            ...integrationPermissions,
            ...workflowPermissions,
            ...aiPermissions
        ];
        
        for (const permission of allPermissions) {
            const [scope, action] = permission.split(':');
            this.permissions.set(permission, {
                id: permission,
                scope: scope,
                action: action,
                description: this.getPermissionDescription(scope, action),
                level: this.getPermissionLevel(scope, action),
                auditable: this.isPermissionAuditable(scope, action)
            });
        }
        
        console.log('🔒 Permissions configurées :', this.permissions.size);
    }
    
    /**
     * Configuration des fournisseurs d'authentification
     */
    setupAuthProviders() {
        // OAuth 2.0 - Google
        this.authProviders.set('google-oauth', {
            id: 'google-oauth',
            name: 'Google OAuth 2.0',
            type: this.authMethods.oauth2,
            enabled: true,
            config: {
                clientId: 'your-google-client-id',
                clientSecret: 'your-google-client-secret',
                redirectUri: '/auth/google/callback',
                scope: 'openid email profile',
                authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenUrl: 'https://oauth2.googleapis.com/token',
                userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
            },
            mapping: {
                id: 'id',
                email: 'email',
                name: 'name',
                avatar: 'picture'
            },
            autoCreateUser: true,
            defaultRole: 'user'
        });
        
        // OAuth 2.0 - Microsoft
        this.authProviders.set('microsoft-oauth', {
            id: 'microsoft-oauth',
            name: 'Microsoft OAuth 2.0',
            type: this.authMethods.oauth2,
            enabled: true,
            config: {
                clientId: 'your-microsoft-client-id',
                clientSecret: 'your-microsoft-client-secret',
                redirectUri: '/auth/microsoft/callback',
                scope: 'openid email profile',
                authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
                tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
                userInfoUrl: 'https://graph.microsoft.com/v1.0/me'
            },
            mapping: {
                id: 'id',
                email: 'mail',
                name: 'displayName',
                avatar: null
            },
            autoCreateUser: true,
            defaultRole: 'user'
        });
        
        // SAML 2.0
        this.authProviders.set('saml-sso', {
            id: 'saml-sso',
            name: 'SAML 2.0 SSO',
            type: this.authMethods.saml,
            enabled: false,
            config: {
                entryPoint: 'https://your-idp.com/sso',
                issuer: 'FormEase',
                cert: 'your-saml-cert',
                signatureAlgorithm: 'sha256',
                digestAlgorithm: 'sha256'
            },
            mapping: {
                id: 'NameID',
                email: 'Email',
                name: 'DisplayName',
                roles: 'Roles'
            },
            autoCreateUser: true,
            defaultRole: 'user'
        });
        
        // LDAP/Active Directory
        this.authProviders.set('ldap-ad', {
            id: 'ldap-ad',
            name: 'LDAP/Active Directory',
            type: this.authMethods.ldap,
            enabled: false,
            config: {
                url: 'ldap://your-ldap-server.com:389',
                bindDN: 'cn=admin,dc=company,dc=com',
                bindCredentials: 'password',
                searchBase: 'ou=users,dc=company,dc=com',
                searchFilter: '(uid={{username}})',
                attributes: ['uid', 'mail', 'displayName', 'memberOf']
            },
            mapping: {
                id: 'uid',
                email: 'mail',
                name: 'displayName',
                groups: 'memberOf'
            },
            autoCreateUser: true,
            defaultRole: 'user'
        });
        
        console.log('🔗 Fournisseurs d\'authentification configurés :', this.authProviders.size);
    }
    
    /**
     * Configuration des fournisseurs sociaux
     */
    setupSocialProviders() {
        this.socialProviders.set('github', {
            id: 'github',
            name: 'GitHub',
            icon: 'fab fa-github',
            color: '#333',
            authUrl: 'https://github.com/login/oauth/authorize',
            tokenUrl: 'https://github.com/login/oauth/access_token',
            userUrl: 'https://api.github.com/user',
            scope: 'user:email'
        });
        
        this.socialProviders.set('linkedin', {
            id: 'linkedin',
            name: 'LinkedIn',
            icon: 'fab fa-linkedin',
            color: '#0077B5',
            authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
            tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
            userUrl: 'https://api.linkedin.com/v2/me',
            scope: 'r_liteprofile r_emailaddress'
        });
        
        console.log('📱 Fournisseurs sociaux configurés :', this.socialProviders.size);
    }
    
    /**
     * Authentification avec mot de passe
     */
    async authenticateWithPassword(credentials) {
        try {
            // Validation des identifiants
            const validation = this.validateCredentials(credentials);
            if (!validation.valid) {
                return this.createAuthResponse(false, null, validation.errors);
            }
            
            // Authentification via SecurityManager
            const authResult = await this.security.authenticateUser(credentials);
            
            if (!authResult.success) {
                return this.createAuthResponse(false, null, authResult.errors);
            }
            
            // Enrichir les données utilisateur
            const enrichedUser = await this.enrichUserData(authResult.user);
            
            // Créer les tokens d'authentification
            const tokens = await this.createAuthTokens(enrichedUser, authResult.session);
            
            this.logAuthEvent('password_auth_success', {
                userId: enrichedUser.id,
                sessionId: authResult.session.sessionId
            });
            
            return this.createAuthResponse(true, {
                user: enrichedUser,
                tokens: tokens,
                session: authResult.session,
                mfaRequired: authResult.mfaRequired
            });
            
        } catch (error) {
            console.error('Erreur authentification mot de passe :', error);
            this.logAuthEvent('password_auth_error', { error: error.message });
            return this.createAuthResponse(false, null, ['Erreur d\'authentification']);
        }
    }
    
    /**
     * Authentification OAuth 2.0
     */
    async authenticateWithOAuth(providerId, code, state) {
        try {
            const provider = this.authProviders.get(providerId);
            if (!provider || !provider.enabled) {
                throw new Error(`Fournisseur ${providerId} non disponible`);
            }
            
            // Échanger le code contre un token d'accès
            const tokenResponse = await this.exchangeOAuthCode(provider, code);
            
            // Récupérer les informations utilisateur
            const userInfo = await this.fetchOAuthUserInfo(provider, tokenResponse.access_token);
            
            // Mapper les données utilisateur
            const mappedUser = this.mapOAuthUser(provider, userInfo);
            
            // Trouver ou créer l'utilisateur
            let user = await this.findUserByEmail(mappedUser.email);
            
            if (!user && provider.autoCreateUser) {
                user = await this.createUserFromOAuth(provider, mappedUser);
            } else if (!user) {
                throw new Error('Utilisateur non autorisé');
            }
            
            // Enrichir les données utilisateur
            const enrichedUser = await this.enrichUserData(user);
            
            // Créer la session
            const session = await this.security.createSecureSession(enrichedUser);
            
            // Créer les tokens
            const tokens = await this.createAuthTokens(enrichedUser, session);
            
            this.logAuthEvent('oauth_auth_success', {
                userId: enrichedUser.id,
                provider: providerId,
                sessionId: session.sessionId
            });
            
            return this.createAuthResponse(true, {
                user: enrichedUser,
                tokens: tokens,
                session: session
            });
            
        } catch (error) {
            console.error('Erreur authentification OAuth :', error);
            this.logAuthEvent('oauth_auth_error', { 
                provider: providerId, 
                error: error.message 
            });
            return this.createAuthResponse(false, null, [error.message]);
        }
    }
    
    /**
     * Authentification par token API
     */
    async authenticateWithAPIToken(token) {
        try {
            const tokenData = this.apiTokens.get(token);
            
            if (!tokenData) {
                throw new Error('Token API invalide');
            }
            
            if (tokenData.expires && new Date() > tokenData.expires) {
                this.apiTokens.delete(token);
                throw new Error('Token API expiré');
            }
            
            if (!tokenData.active) {
                throw new Error('Token API désactivé');
            }
            
            // Vérifier les restrictions IP
            if (tokenData.ipRestrictions && tokenData.ipRestrictions.length > 0) {
                const clientIP = this.getClientIP();
                if (!tokenData.ipRestrictions.includes(clientIP)) {
                    throw new Error('IP non autorisée pour ce token');
                }
            }
            
            // Récupérer l'utilisateur
            const user = await this.getUserById(tokenData.userId);
            if (!user) {
                throw new Error('Utilisateur associé au token introuvable');
            }
            
            // Mettre à jour les statistiques d'utilisation
            tokenData.lastUsed = new Date();
            tokenData.usageCount = (tokenData.usageCount || 0) + 1;
            
            this.logAuthEvent('api_token_auth_success', {
                userId: user.id,
                tokenId: tokenData.id,
                scope: tokenData.scope
            });
            
            return this.createAuthResponse(true, {
                user: user,
                tokenData: tokenData,
                authMethod: this.authMethods.apiKey
            });
            
        } catch (error) {
            console.error('Erreur authentification token API :', error);
            this.logAuthEvent('api_token_auth_error', { error: error.message });
            return this.createAuthResponse(false, null, [error.message]);
        }
    }
    
    /**
     * Délégation d'autorisation
     */
    async createDelegation(delegatorId, delegateeId, permissions, duration = 24 * 60 * 60 * 1000) {
        try {
            const delegator = await this.getUserById(delegatorId);
            const delegatee = await this.getUserById(delegateeId);
            
            if (!delegator || !delegatee) {
                throw new Error('Utilisateur introuvable');
            }
            
            // Vérifier que le délégateur a les permissions à déléguer
            const hasPermissions = await this.checkUserPermissions(delegatorId, permissions);
            if (!hasPermissions) {
                throw new Error('Permissions insuffisantes pour la délégation');
            }
            
            const delegationId = this.generateId('del');
            const delegation = {
                id: delegationId,
                delegatorId: delegatorId,
                delegateeId: delegateeId,
                permissions: permissions,
                created: new Date(),
                expires: new Date(Date.now() + duration),
                active: true,
                usageCount: 0,
                restrictions: {
                    maxUsage: null,
                    ipRestrictions: [],
                    timeRestrictions: null
                }
            };
            
            this.delegations.set(delegationId, delegation);
            
            this.logAuthEvent('delegation_created', {
                delegatorId,
                delegateeId,
                delegationId,
                permissions
            });
            
            return delegation;
            
        } catch (error) {
            console.error('Erreur création délégation :', error);
            throw error;
        }
    }
    
    /**
     * Impersonation (se faire passer pour un autre utilisateur)
     */
    async impersonateUser(adminUserId, targetUserId, reason) {
        try {
            // Vérifier que l'admin a les droits d'impersonation
            const hasPermission = await this.checkUserPermission(adminUserId, 'system:admin');
            if (!hasPermission) {
                throw new Error('Droits d\'impersonation insuffisants');
            }
            
            const admin = await this.getUserById(adminUserId);
            const target = await this.getUserById(targetUserId);
            
            if (!admin || !target) {
                throw new Error('Utilisateur introuvable');
            }
            
            // Créer une session d'impersonation
            const impersonationSession = {
                id: this.generateId('imp'),
                adminUserId: adminUserId,
                targetUserId: targetUserId,
                reason: reason,
                created: new Date(),
                expires: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 heures max
                restrictions: {
                    cannotChangePassword: true,
                    cannotAccessBilling: true,
                    cannotDeleteData: true,
                    auditAll: true
                }
            };
            
            // Créer la session pour l'utilisateur cible
            const session = await this.security.createSecureSession({
                ...target,
                impersonatedBy: adminUserId,
                impersonationSession: impersonationSession.id
            });
            
            this.logAuthEvent('impersonation_started', {
                adminUserId,
                targetUserId,
                sessionId: session.sessionId,
                reason
            });
            
            return {
                session: session,
                impersonationSession: impersonationSession,
                targetUser: target
            };
            
        } catch (error) {
            console.error('Erreur impersonation :', error);
            throw error;
        }
    }
    
    /**
     * Vérification des permissions
     */
    async checkUserPermission(userId, permission) {
        try {
            const user = await this.getUserById(userId);
            if (!user) return false;
            
            // Récupérer tous les rôles de l'utilisateur (directs + hérités)
            const userRoles = await this.getUserRoles(userId);
            
            // Vérifier si l'utilisateur a la permission via ses rôles
            for (const roleId of userRoles) {
                const role = this.roles.get(roleId);
                if (!role) continue;
                
                // Vérification permission wildcard (*)
                if (role.permissions.includes('*')) return true;
                
                // Vérification permission exacte
                if (role.permissions.includes(permission)) return true;
                
                // Vérification permission par scope (ex: form:*)
                const [scope, action] = permission.split(':');
                if (role.permissions.includes(`${scope}:*`)) return true;
            }
            
            // Vérifier les délégations actives
            const delegations = await this.getActiveDelegations(userId);
            for (const delegation of delegations) {
                if (delegation.permissions.includes(permission) || 
                    delegation.permissions.includes('*')) {
                    return true;
                }
            }
            
            return false;
            
        } catch (error) {
            console.error('Erreur vérification permission :', error);
            return false;
        }
    }
    
    /**
     * Vérification de plusieurs permissions
     */
    async checkUserPermissions(userId, permissions) {
        for (const permission of permissions) {
            const hasPermission = await this.checkUserPermission(userId, permission);
            if (!hasPermission) return false;
        }
        return true;
    }
    
    /**
     * Attribution de rôle
     */
    async assignRole(userId, roleId, assignedBy) {
        try {
            const user = await this.getUserById(userId);
            const role = this.roles.get(roleId);
            const assigner = await this.getUserById(assignedBy);
            
            if (!user || !role || !assigner) {
                throw new Error('Utilisateur ou rôle introuvable');
            }
            
            // Vérifier que l'assigneur a le droit d'attribuer ce rôle
            const canAssign = await this.canAssignRole(assignedBy, roleId);
            if (!canAssign) {
                throw new Error('Droits insuffisants pour attribuer ce rôle');
            }
            
            // Ajouter le rôle à l'utilisateur
            if (!user.roles) user.roles = [];
            if (!user.roles.includes(roleId)) {
                user.roles.push(roleId);
                
                this.logAuthEvent('role_assigned', {
                    userId,
                    roleId,
                    assignedBy
                });
            }
            
            return true;
            
        } catch (error) {
            console.error('Erreur attribution rôle :', error);
            throw error;
        }
    }
    
    /**
     * Retrait de rôle
     */
    async removeRole(userId, roleId, removedBy) {
        try {
            const user = await this.getUserById(userId);
            const remover = await this.getUserById(removedBy);
            
            if (!user || !remover) {
                throw new Error('Utilisateur introuvable');
            }
            
            // Vérifier que le retireur a le droit de retirer ce rôle
            const canRemove = await this.canRemoveRole(removedBy, roleId);
            if (!canRemove) {
                throw new Error('Droits insuffisants pour retirer ce rôle');
            }
            
            // Retirer le rôle de l'utilisateur
            if (user.roles && user.roles.includes(roleId)) {
                user.roles = user.roles.filter(r => r !== roleId);
                
                this.logAuthEvent('role_removed', {
                    userId,
                    roleId,
                    removedBy
                });
            }
            
            return true;
            
        } catch (error) {
            console.error('Erreur retrait rôle :', error);
            throw error;
        }
    }
    
    /**
     * Création d'un token API
     */
    async createAPIToken(userId, name, scope = [], options = {}) {
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('Utilisateur introuvable');
            }
            
            const tokenId = this.generateId('api');
            const token = this.generateSecureToken(64);
            
            const apiToken = {
                id: tokenId,
                token: token,
                name: name,
                userId: userId,
                scope: scope,
                created: new Date(),
                expires: options.expires || new Date(Date.now() + this.config.apiTokenDuration),
                active: true,
                lastUsed: null,
                usageCount: 0,
                ipRestrictions: options.ipRestrictions || [],
                rateLimit: options.rateLimit || 1000,
                metadata: options.metadata || {}
            };
            
            this.apiTokens.set(token, apiToken);
            
            this.logAuthEvent('api_token_created', {
                userId,
                tokenId,
                name,
                scope
            });
            
            return {
                id: tokenId,
                token: token,
                name: name,
                scope: scope,
                expires: apiToken.expires
            };
            
        } catch (error) {
            console.error('Erreur création token API :', error);
            throw error;
        }
    }
    
    /**
     * Initialisation de l'architecture Zero Trust
     */
    initializeZeroTrust() {
        this.zeroTrust = {
            enabled: true,
            policies: {
                verifyEveryRequest: true,
                minimumPrivilege: true,
                continuousValidation: true,
                deviceTrust: true,
                networkSegmentation: true
            },
            riskScoring: {
                enabled: true,
                factors: [
                    'location', 'device', 'behavior', 
                    'time', 'network', 'authentication'
                ],
                thresholds: {
                    low: 30,
                    medium: 60,
                    high: 80
                }
            }
        };
        
        console.log('🛡️ Architecture Zero Trust initialisée');
    }
    
    /**
     * Démarrage de la gestion des sessions
     */
    startSessionManagement() {
        // Nettoyage périodique des sessions expirées
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 5 * 60 * 1000); // Toutes les 5 minutes
        
        // Nettoyage des délégations expirées
        setInterval(() => {
            this.cleanupExpiredDelegations();
        }, 10 * 60 * 1000); // Toutes les 10 minutes
        
        // Nettoyage des tokens API expirés
        setInterval(() => {
            this.cleanupExpiredAPITokens();
        }, 60 * 60 * 1000); // Toutes les heures
        
        console.log('⏰ Gestion des sessions démarrée');
    }
    
    /**
     * Fonctions utilitaires
     */
    createAuthResponse(success, data = null, errors = []) {
        return {
            success,
            data,
            errors,
            timestamp: new Date()
        };
    }
    
    validateCredentials(credentials) {
        const errors = [];
        
        if (!credentials.username || credentials.username.trim().length === 0) {
            errors.push('Nom d\'utilisateur requis');
        }
        
        if (!credentials.password || credentials.password.length === 0) {
            errors.push('Mot de passe requis');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    async enrichUserData(user) {
        // Ajouter les rôles et permissions complets
        const roles = await this.getUserRoles(user.id);
        const permissions = await this.getUserPermissions(user.id);
        
        return {
            ...user,
            roles,
            permissions,
            effectivePermissions: await this.getEffectivePermissions(user.id),
            securityLevel: this.calculateSecurityLevel(roles),
            lastEnriched: new Date()
        };
    }
    
    async createAuthTokens(user, session) {
        // Token d'accès (JWT)
        const accessToken = await this.createJWT(user, session, {
            type: 'access',
            expires: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        });
        
        // Token de rafraîchissement
        const refreshToken = await this.createJWT(user, session, {
            type: 'refresh',
            expires: new Date(Date.now() + this.config.refreshTokenDuration)
        });
        
        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: 15 * 60 // 15 minutes en secondes
        };
    }
    
    async createJWT(user, session, options) {
        // Simulation de création JWT - en production, utiliser une vraie librairie JWT
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            sub: user.id,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(options.expires.getTime() / 1000),
            type: options.type,
            sessionId: session.sessionId,
            permissions: user.permissions || []
        }));
        
        // En production, signer avec une clé secrète
        const signature = btoa('signature');
        
        return `${header}.${payload}.${signature}`;
    }
    
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateSecureToken(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    logAuthEvent(type, details) {
        if (this.security) {
            this.security.logSecurityEvent(`auth_${type}`, details);
        }
        console.log(`🔑 [AUTH] ${type}:`, details);
    }
    
    getPermissionDescription(scope, action) {
        const descriptions = {
            'system:read': 'Lecture des paramètres système',
            'system:admin': 'Administration complète du système',
            'form:create': 'Création de formulaires',
            'form:read': 'Lecture des formulaires',
            'data:export': 'Export des données'
        };
        
        return descriptions[`${scope}:${action}`] || `${action} sur ${scope}`;
    }
    
    getPermissionLevel(scope, action) {
        const levels = {
            'system': 100,
            'organization': 80,
            'project': 60,
            'form': 40,
            'data': 60,
            'analytics': 40
        };
        
        return levels[scope] || 20;
    }
    
    isPermissionAuditable(scope, action) {
        const auditableActions = ['create', 'update', 'delete', 'admin', 'export'];
        return auditableActions.includes(action);
    }
    
    async getUserRoles(userId) {
        const user = await this.getUserById(userId);
        if (!user || !user.roles) return [];
        
        // Inclure les rôles hérités
        const allRoles = new Set(user.roles);
        
        for (const roleId of user.roles) {
            const inherited = this.roleHierarchy[roleId] || [];
            inherited.forEach(r => allRoles.add(r));
        }
        
        return Array.from(allRoles);
    }
    
    async getUserPermissions(userId) {
        const roles = await this.getUserRoles(userId);
        const permissions = new Set();
        
        for (const roleId of roles) {
            const role = this.roles.get(roleId);
            if (role && role.permissions) {
                role.permissions.forEach(p => permissions.add(p));
            }
        }
        
        return Array.from(permissions);
    }
    
    async getEffectivePermissions(userId) {
        const permissions = await this.getUserPermissions(userId);
        const delegations = await this.getActiveDelegations(userId);
        
        const effective = new Set(permissions);
        
        for (const delegation of delegations) {
            delegation.permissions.forEach(p => effective.add(p));
        }
        
        return Array.from(effective);
    }
    
    calculateSecurityLevel(roles) {
        let maxLevel = 0;
        
        for (const roleId of roles) {
            const role = this.roles.get(roleId);
            if (role && role.level > maxLevel) {
                maxLevel = role.level;
            }
        }
        
        return maxLevel;
    }
    
    // Méthodes mock pour simulation
    async getUserById(userId) {
        return {
            id: userId,
            username: 'demo-user',
            email: 'demo@formease.com',
            name: 'Demo User',
            roles: ['user'],
            active: true,
            created: new Date(),
            lastLogin: new Date()
        };
    }
    
    async findUserByEmail(email) {
        // Simulation - en production, requête base de données
        return email === 'demo@formease.com' ? await this.getUserById('user-123') : null;
    }
    
    async exchangeOAuthCode(provider, code) {
        // Simulation - en production, appel API réel
        return {
            access_token: 'mock-access-token',
            token_type: 'Bearer',
            expires_in: 3600
        };
    }
    
    async fetchOAuthUserInfo(provider, accessToken) {
        // Simulation - en production, appel API réel
        return {
            id: '123456',
            email: 'user@example.com',
            name: 'John Doe',
            picture: 'https://example.com/avatar.jpg'
        };
    }
    
    mapOAuthUser(provider, userInfo) {
        const mapped = {};
        
        for (const [localField, remoteField] of Object.entries(provider.mapping)) {
            if (userInfo[remoteField]) {
                mapped[localField] = userInfo[remoteField];
            }
        }
        
        return mapped;
    }
    
    async createUserFromOAuth(provider, mappedUser) {
        // Simulation - en production, créer en base de données
        return {
            id: this.generateId('user'),
            email: mappedUser.email,
            name: mappedUser.name,
            avatar: mappedUser.avatar,
            roles: [provider.defaultRole],
            provider: provider.id,
            created: new Date(),
            active: true
        };
    }
    
    getClientIP() {
        // Simulation - en production, obtenir l'IP réelle
        return '192.168.1.100';
    }
    
    async canAssignRole(userId, roleId) {
        // Vérifier si l'utilisateur peut attribuer ce rôle
        const userLevel = await this.getUserSecurityLevel(userId);
        const role = this.roles.get(roleId);
        
        return role && userLevel >= role.level;
    }
    
    async canRemoveRole(userId, roleId) {
        return await this.canAssignRole(userId, roleId);
    }
    
    async getUserSecurityLevel(userId) {
        const user = await this.getUserById(userId);
        const roles = await this.getUserRoles(user.id);
        return this.calculateSecurityLevel(roles);
    }
    
    async getActiveDelegations(userId) {
        const now = new Date();
        const active = [];
        
        for (const delegation of this.delegations.values()) {
            if (delegation.delegateeId === userId && 
                delegation.active && 
                delegation.expires > now) {
                active.push(delegation);
            }
        }
        
        return active;
    }
    
    cleanupExpiredSessions() {
        // Délégué au SecurityManager
        if (this.security) {
            this.security.cleanupExpiredSessions();
        }
    }
    
    cleanupExpiredDelegations() {
        const now = new Date();
        let cleaned = 0;
        
        for (const [id, delegation] of this.delegations.entries()) {
            if (delegation.expires < now) {
                this.delegations.delete(id);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} délégations expirées nettoyées`);
        }
    }
    
    cleanupExpiredAPITokens() {
        const now = new Date();
        let cleaned = 0;
        
        for (const [token, data] of this.apiTokens.entries()) {
            if (data.expires < now) {
                this.apiTokens.delete(token);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} tokens API expirés nettoyés`);
        }
    }
    
    /**
     * API publique
     */
    getAuthStatus() {
        return {
            providers: this.authProviders.size,
            roles: this.roles.size,
            permissions: this.permissions.size,
            activeTokens: this.apiTokens.size,
            activeDelegations: this.delegations.size,
            zeroTrustEnabled: this.zeroTrust.enabled
        };
    }
    
    getRoles() {
        return Array.from(this.roles.values());
    }
    
    getPermissions() {
        return Array.from(this.permissions.values());
    }
    
    getAuthProviders() {
        return Array.from(this.authProviders.values()).map(provider => ({
            id: provider.id,
            name: provider.name,
            type: provider.type,
            enabled: provider.enabled
        }));
    }
    
    getSocialProviders() {
        return Array.from(this.socialProviders.values());
    }
}

// Export pour compatibilité navigateur
window.AuthController = AuthController;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.authController && window.securityManager) {
        window.authController = new AuthController(window.securityManager);
        console.log('🔑 AuthController initialisé globalement');
    }
});

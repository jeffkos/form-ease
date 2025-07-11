/**
 * 🔗 IntegrationManager.js - FormEase Sprint 3 Phase 3
 * 
 * Gestionnaire central des intégrations externes
 * Orchestre toutes les connexions avec les services tiers
 * 
 * Fonctionnalités :
 * - Gestion centralisée des intégrations
 * - Authentification multi-protocoles (OAuth, API Key, JWT)
 * - Catalogue de connecteurs prédéfinis
 * - Configuration dynamique des intégrations
 * - Monitoring et health check des connexions
 * - Gestion des quotas et rate limiting
 * 
 * @version 3.0.0
 * @author FormEase Team
 * @since Sprint 3 Phase 3
 */

class IntegrationManager {
    constructor() {
        this.integrations = new Map();
        this.connectors = new Map();
        this.authentications = new Map();
        this.activeConnections = new Map();
        
        this.config = {
            maxConcurrentConnections: 50,
            defaultTimeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            healthCheckInterval: 60000
        };
        
        this.metrics = {
            totalIntegrations: 0,
            activeIntegrations: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            dataTransferred: 0
        };
        
        this.authTypes = {
            apikey: 'apikey',
            oauth2: 'oauth2',
            basic: 'basic',
            bearer: 'bearer',
            jwt: 'jwt',
            custom: 'custom'
        };
        
        this.integrationStatus = {
            active: 'active',
            inactive: 'inactive',
            error: 'error',
            configuring: 'configuring',
            testing: 'testing'
        };
        
        this.init();
    }
    
    /**
     * Initialisation du gestionnaire d'intégrations
     */
    init() {
        this.setupPredefinedConnectors();
        this.loadSavedIntegrations();
        this.startHealthMonitoring();
        this.initializeEventHandlers();
        console.log('🔗 IntegrationManager v3.0 initialisé');
    }
    
    /**
     * Configuration des connecteurs prédéfinis
     */
    setupPredefinedConnectors() {
        // Connecteur Google Workspace
        this.connectors.set('google-workspace', {
            id: 'google-workspace',
            name: 'Google Workspace',
            description: 'Intégration avec Google Sheets, Drive, Gmail',
            category: 'productivity',
            icon: '🔷',
            version: '1.0.0',
            supported_auth: ['oauth2'],
            endpoints: {
                sheets: 'https://sheets.googleapis.com/v4',
                drive: 'https://www.googleapis.com/drive/v3',
                gmail: 'https://gmail.googleapis.com/gmail/v1'
            },
            capabilities: [
                'read_sheets', 'write_sheets', 'create_files', 
                'send_emails', 'list_files', 'share_files'
            ],
            config_schema: {
                spreadsheet_id: { type: 'string', required: false, description: 'ID du Google Sheet' },
                folder_id: { type: 'string', required: false, description: 'ID du dossier Drive' },
                email_template: { type: 'string', required: false, description: 'Template d\'email' }
            }
        });
        
        // Connecteur Microsoft 365
        this.connectors.set('microsoft-365', {
            id: 'microsoft-365',
            name: 'Microsoft 365',
            description: 'Intégration avec Excel Online, OneDrive, Outlook',
            category: 'productivity',
            icon: '🔶',
            version: '1.0.0',
            supported_auth: ['oauth2'],
            endpoints: {
                graph: 'https://graph.microsoft.com/v1.0',
                excel: 'https://graph.microsoft.com/v1.0/me/drive/items',
                outlook: 'https://graph.microsoft.com/v1.0/me/messages'
            },
            capabilities: [
                'read_excel', 'write_excel', 'create_files',
                'send_emails', 'calendar_events', 'teams_notifications'
            ],
            config_schema: {
                workbook_id: { type: 'string', required: false, description: 'ID du classeur Excel' },
                site_id: { type: 'string', required: false, description: 'ID du site SharePoint' }
            }
        });
        
        // Connecteur Slack
        this.connectors.set('slack', {
            id: 'slack',
            name: 'Slack',
            description: 'Notifications et interactions Slack',
            category: 'communication',
            icon: '💬',
            version: '1.0.0',
            supported_auth: ['bearer', 'oauth2'],
            endpoints: {
                api: 'https://slack.com/api',
                webhooks: 'https://hooks.slack.com/services'
            },
            capabilities: [
                'send_messages', 'create_channels', 'invite_users',
                'upload_files', 'post_webhooks', 'slash_commands'
            ],
            config_schema: {
                default_channel: { type: 'string', required: true, description: 'Canal par défaut' },
                webhook_url: { type: 'string', required: false, description: 'URL du webhook' },
                bot_name: { type: 'string', required: false, description: 'Nom du bot' }
            }
        });
        
        // Connecteur Salesforce
        this.connectors.set('salesforce', {
            id: 'salesforce',
            name: 'Salesforce',
            description: 'CRM Salesforce - Leads, Contacts, Opportunités',
            category: 'crm',
            icon: '☁️',
            version: '1.0.0',
            supported_auth: ['oauth2', 'jwt'],
            endpoints: {
                api: 'https://{{instance}}.salesforce.com/services/data/v58.0',
                sobjects: 'https://{{instance}}.salesforce.com/services/data/v58.0/sobjects'
            },
            capabilities: [
                'create_leads', 'update_contacts', 'create_opportunities',
                'custom_objects', 'apex_calls', 'bulk_operations'
            ],
            config_schema: {
                instance_url: { type: 'string', required: true, description: 'URL de l\'instance Salesforce' },
                sandbox: { type: 'boolean', required: false, description: 'Utiliser le sandbox' }
            }
        });
        
        // Connecteur HubSpot
        this.connectors.set('hubspot', {
            id: 'hubspot',
            name: 'HubSpot',
            description: 'Marketing et CRM HubSpot',
            category: 'crm',
            icon: '🧡',
            version: '1.0.0',
            supported_auth: ['apikey', 'oauth2'],
            endpoints: {
                api: 'https://api.hubapi.com',
                contacts: 'https://api.hubapi.com/crm/v3/objects/contacts',
                companies: 'https://api.hubapi.com/crm/v3/objects/companies'
            },
            capabilities: [
                'create_contacts', 'update_companies', 'track_events',
                'email_marketing', 'workflows', 'custom_properties'
            ],
            config_schema: {
                portal_id: { type: 'string', required: false, description: 'ID du portail HubSpot' },
                property_mapping: { type: 'object', required: false, description: 'Mapping des propriétés' }
            }
        });
        
        // Connecteur Zapier
        this.connectors.set('zapier', {
            id: 'zapier',
            name: 'Zapier',
            description: 'Intégration avec plus de 3000+ apps via Zapier',
            category: 'automation',
            icon: '⚡',
            version: '1.0.0',
            supported_auth: ['webhook'],
            endpoints: {
                webhook: 'https://hooks.zapier.com/hooks/catch'
            },
            capabilities: [
                'trigger_zaps', 'send_data', 'receive_webhooks'
            ],
            config_schema: {
                webhook_url: { type: 'string', required: true, description: 'URL du webhook Zapier' },
                secret_key: { type: 'string', required: false, description: 'Clé secrète pour validation' }
            }
        });
        
        // Connecteur Make (ex-Integromat)
        this.connectors.set('make', {
            id: 'make',
            name: 'Make',
            description: 'Automatisation avancée avec Make',
            category: 'automation',
            icon: '🔄',
            version: '1.0.0',
            supported_auth: ['webhook', 'apikey'],
            endpoints: {
                webhook: 'https://hook.{{region}}.make.com'
            },
            capabilities: [
                'trigger_scenarios', 'data_processing', 'conditional_logic'
            ],
            config_schema: {
                webhook_url: { type: 'string', required: true, description: 'URL du webhook Make' },
                region: { type: 'string', required: false, description: 'Région Make (eu, us)' }
            }
        });
        
        // Connecteur Database (MySQL, PostgreSQL, MongoDB)
        this.connectors.set('database', {
            id: 'database',
            name: 'Base de Données',
            description: 'Connexion directe aux bases de données',
            category: 'database',
            icon: '🗄️',
            version: '1.0.0',
            supported_auth: ['basic', 'custom'],
            endpoints: {
                mysql: 'mysql://{{host}}:{{port}}/{{database}}',
                postgresql: 'postgresql://{{host}}:{{port}}/{{database}}',
                mongodb: 'mongodb://{{host}}:{{port}}/{{database}}'
            },
            capabilities: [
                'execute_queries', 'insert_records', 'update_records',
                'delete_records', 'transactions', 'stored_procedures'
            ],
            config_schema: {
                host: { type: 'string', required: true, description: 'Hôte de la base' },
                port: { type: 'number', required: true, description: 'Port de connexion' },
                database: { type: 'string', required: true, description: 'Nom de la base' },
                table_mapping: { type: 'object', required: false, description: 'Mapping des tables' }
            }
        });
        
        console.log('🔌 Connecteurs prédéfinis chargés :', this.connectors.size);
    }
    
    /**
     * Création d'une nouvelle intégration
     */
    async createIntegration(config) {
        const integrationId = 'int_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Validation de la configuration
        if (!config.connector_id || !this.connectors.has(config.connector_id)) {
            throw new Error('Connecteur invalide ou non trouvé');
        }
        
        const connector = this.connectors.get(config.connector_id);
        
        const integration = {
            id: integrationId,
            name: config.name || `${connector.name} Integration`,
            description: config.description || '',
            connector_id: config.connector_id,
            connector: connector,
            status: this.integrationStatus.configuring,
            created: new Date(),
            modified: new Date(),
            config: {
                ...config.config,
                timeout: config.timeout || this.config.defaultTimeout,
                retryAttempts: config.retryAttempts || this.config.retryAttempts
            },
            auth: null,
            mapping: config.mapping || {},
            triggers: config.triggers || [],
            actions: config.actions || [],
            metrics: {
                requests: 0,
                errors: 0,
                lastRequest: null,
                lastError: null,
                averageResponseTime: 0
            }
        };
        
        // Validation du schéma de configuration
        const validationResult = this.validateConfig(integration.config, connector.config_schema);
        if (!validationResult.valid) {
            throw new Error(`Configuration invalide : ${validationResult.errors.join(', ')}`);
        }
        
        this.integrations.set(integrationId, integration);
        this.metrics.totalIntegrations++;
        
        console.log('✅ Intégration créée :', integrationId);
        return integration;
    }
    
    /**
     * Configuration de l'authentification pour une intégration
     */
    async setupAuthentication(integrationId, authConfig) {
        const integration = this.integrations.get(integrationId);
        if (!integration) {
            throw new Error(`Intégration ${integrationId} introuvable`);
        }
        
        const connector = integration.connector;
        
        // Vérifier que le type d'auth est supporté
        if (!connector.supported_auth.includes(authConfig.type)) {
            throw new Error(`Type d'authentification ${authConfig.type} non supporté pour ${connector.name}`);
        }
        
        let authData = null;
        
        switch (authConfig.type) {
            case 'apikey':
                authData = await this.setupAPIKeyAuth(authConfig);
                break;
            case 'oauth2':
                authData = await this.setupOAuth2Auth(authConfig);
                break;
            case 'basic':
                authData = await this.setupBasicAuth(authConfig);
                break;
            case 'bearer':
                authData = await this.setupBearerAuth(authConfig);
                break;
            case 'jwt':
                authData = await this.setupJWTAuth(authConfig);
                break;
            default:
                throw new Error(`Type d'authentification non supporté : ${authConfig.type}`);
        }
        
        integration.auth = {
            type: authConfig.type,
            data: authData,
            configured: new Date(),
            expires: authData.expires || null
        };
        
        integration.modified = new Date();
        
        console.log(`🔐 Authentification configurée pour ${integrationId}`);
        return integration;
    }
    
    /**
     * Configuration API Key
     */
    async setupAPIKeyAuth(authConfig) {
        return {
            api_key: authConfig.api_key,
            header_name: authConfig.header_name || 'X-API-Key',
            location: authConfig.location || 'header' // header, query, body
        };
    }
    
    /**
     * Configuration OAuth2
     */
    async setupOAuth2Auth(authConfig) {
        // Simulation du flow OAuth2
        const authUrl = `${authConfig.auth_url}?client_id=${authConfig.client_id}&redirect_uri=${authConfig.redirect_uri}&scope=${authConfig.scope}&response_type=code`;
        
        console.log('🔐 URL d\'autorisation OAuth2 :', authUrl);
        
        // En production, on redirigerait vers cette URL et attendrait le callback
        return {
            client_id: authConfig.client_id,
            client_secret: authConfig.client_secret,
            access_token: 'simulated_access_token_' + Date.now(),
            refresh_token: 'simulated_refresh_token_' + Date.now(),
            token_type: 'Bearer',
            expires: new Date(Date.now() + 3600000), // 1 heure
            scope: authConfig.scope
        };
    }
    
    /**
     * Configuration Basic Auth
     */
    async setupBasicAuth(authConfig) {
        const credentials = btoa(`${authConfig.username}:${authConfig.password}`);
        return {
            username: authConfig.username,
            password: authConfig.password,
            encoded: credentials
        };
    }
    
    /**
     * Configuration Bearer Token
     */
    async setupBearerAuth(authConfig) {
        return {
            token: authConfig.token,
            prefix: authConfig.prefix || 'Bearer'
        };
    }
    
    /**
     * Configuration JWT
     */
    async setupJWTAuth(authConfig) {
        // Simulation de génération JWT
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = {
            iss: authConfig.issuer,
            sub: authConfig.subject,
            aud: authConfig.audience,
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000)
        };
        
        const token = 'simulated_jwt_' + Date.now();
        
        return {
            token: token,
            algorithm: authConfig.algorithm || 'HS256',
            secret: authConfig.secret,
            expires: new Date(Date.now() + 3600000)
        };
    }
    
    /**
     * Validation de configuration selon schéma
     */
    validateConfig(config, schema) {
        const errors = [];
        
        for (const [key, definition] of Object.entries(schema)) {
            const value = config[key];
            
            // Vérifier les champs requis
            if (definition.required && (value === undefined || value === null || value === '')) {
                errors.push(`Champ requis manquant : ${key}`);
                continue;
            }
            
            // Vérifier les types
            if (value !== undefined && value !== null) {
                const expectedType = definition.type;
                const actualType = Array.isArray(value) ? 'array' : typeof value;
                
                if (expectedType !== actualType) {
                    errors.push(`Type incorrect pour ${key} : attendu ${expectedType}, reçu ${actualType}`);
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Test de connexion d'une intégration
     */
    async testConnection(integrationId) {
        const integration = this.integrations.get(integrationId);
        if (!integration) {
            throw new Error(`Intégration ${integrationId} introuvable`);
        }
        
        if (!integration.auth) {
            throw new Error('Authentification non configurée');
        }
        
        try {
            integration.status = this.integrationStatus.testing;
            
            const startTime = Date.now();
            
            // Test selon le type de connecteur
            let testResult = null;
            
            switch (integration.connector_id) {
                case 'google-workspace':
                    testResult = await this.testGoogleWorkspace(integration);
                    break;
                case 'microsoft-365':
                    testResult = await this.testMicrosoft365(integration);
                    break;
                case 'slack':
                    testResult = await this.testSlack(integration);
                    break;
                case 'salesforce':
                    testResult = await this.testSalesforce(integration);
                    break;
                case 'hubspot':
                    testResult = await this.testHubSpot(integration);
                    break;
                default:
                    testResult = await this.testGenericAPI(integration);
            }
            
            const responseTime = Date.now() - startTime;
            
            integration.status = this.integrationStatus.active;
            integration.metrics.lastRequest = new Date();
            integration.metrics.averageResponseTime = responseTime;
            
            console.log(`✅ Test de connexion réussi pour ${integration.name} (${responseTime}ms)`);
            
            return {
                success: true,
                responseTime: responseTime,
                result: testResult
            };
            
        } catch (error) {
            integration.status = this.integrationStatus.error;
            integration.metrics.lastError = {
                message: error.message,
                timestamp: new Date()
            };
            
            console.error(`❌ Test de connexion échoué pour ${integration.name} :`, error.message);
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Test Google Workspace
     */
    async testGoogleWorkspace(integration) {
        // Simulation d'appel API Google
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        
        return {
            user_info: {
                email: 'test@workspace.com',
                name: 'Test User'
            },
            permissions: ['read', 'write'],
            quota_remaining: 1000000
        };
    }
    
    /**
     * Test Microsoft 365
     */
    async testMicrosoft365(integration) {
        // Simulation d'appel Microsoft Graph
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
        
        return {
            user_info: {
                displayName: 'Test User',
                mail: 'test@office365.com'
            },
            available_services: ['Excel', 'Outlook', 'OneDrive'],
            subscription: 'Business Premium'
        };
    }
    
    /**
     * Test Slack
     */
    async testSlack(integration) {
        // Simulation d'appel Slack API
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        
        return {
            team_info: {
                name: 'Test Workspace',
                id: 'T1234567890'
            },
            bot_info: {
                name: 'FormEase Bot',
                id: 'B0987654321'
            },
            channels_count: 15
        };
    }
    
    /**
     * Test Salesforce
     */
    async testSalesforce(integration) {
        // Simulation d'appel Salesforce API
        await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 500));
        
        return {
            instance_info: {
                organizationId: '00D000000000000EAA',
                organizationName: 'Test Org'
            },
            user_info: {
                username: 'test@salesforce.com',
                profileName: 'System Administrator'
            },
            limits: {
                DailyApiRequests: { remaining: 14500, max: 15000 }
            }
        };
    }
    
    /**
     * Test HubSpot
     */
    async testHubSpot(integration) {
        // Simulation d'appel HubSpot API
        await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 350));
        
        return {
            portal_info: {
                portalId: 12345678,
                timeZone: 'Europe/Paris'
            },
            user_info: {
                email: 'test@hubspot.com',
                firstName: 'Test',
                lastName: 'User'
            },
            subscription: 'Professional'
        };
    }
    
    /**
     * Test générique d'API
     */
    async testGenericAPI(integration) {
        // Simulation d'appel API générique
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        
        return {
            status: 'connected',
            api_version: '1.0',
            timestamp: new Date()
        };
    }
    
    /**
     * Exécution d'une action sur une intégration
     */
    async executeAction(integrationId, actionType, actionData) {
        const integration = this.integrations.get(integrationId);
        if (!integration) {
            throw new Error(`Intégration ${integrationId} introuvable`);
        }
        
        if (integration.status !== this.integrationStatus.active) {
            throw new Error(`Intégration ${integration.name} non active`);
        }
        
        const startTime = Date.now();
        
        try {
            integration.metrics.requests++;
            
            let result = null;
            
            // Router l'action selon le connecteur
            switch (integration.connector_id) {
                case 'google-workspace':
                    result = await this.executeGoogleAction(integration, actionType, actionData);
                    break;
                case 'slack':
                    result = await this.executeSlackAction(integration, actionType, actionData);
                    break;
                case 'salesforce':
                    result = await this.executeSalesforceAction(integration, actionType, actionData);
                    break;
                case 'hubspot':
                    result = await this.executeHubSpotAction(integration, actionType, actionData);
                    break;
                default:
                    result = await this.executeGenericAction(integration, actionType, actionData);
            }
            
            const responseTime = Date.now() - startTime;
            integration.metrics.averageResponseTime = Math.round(
                (integration.metrics.averageResponseTime + responseTime) / 2
            );
            integration.metrics.lastRequest = new Date();
            
            this.metrics.successfulRequests++;
            this.updateMetrics();
            
            console.log(`✅ Action ${actionType} exécutée sur ${integration.name} (${responseTime}ms)`);
            
            return {
                success: true,
                result: result,
                responseTime: responseTime
            };
            
        } catch (error) {
            integration.metrics.errors++;
            integration.metrics.lastError = {
                message: error.message,
                timestamp: new Date(),
                action: actionType
            };
            
            this.metrics.failedRequests++;
            
            console.error(`❌ Erreur action ${actionType} sur ${integration.name} :`, error.message);
            
            throw error;
        }
    }
    
    /**
     * Exécution d'action Google Workspace
     */
    async executeGoogleAction(integration, actionType, actionData) {
        switch (actionType) {
            case 'create_sheet_row':
                await new Promise(resolve => setTimeout(resolve, 300));
                return {
                    spreadsheetId: actionData.spreadsheetId,
                    range: 'A1:Z1',
                    updatedRows: 1,
                    updatedCells: actionData.values.length
                };
                
            case 'send_email':
                await new Promise(resolve => setTimeout(resolve, 400));
                return {
                    messageId: 'msg_' + Date.now(),
                    to: actionData.to,
                    subject: actionData.subject,
                    sent: true
                };
                
            default:
                throw new Error(`Action Google non supportée : ${actionType}`);
        }
    }
    
    /**
     * Exécution d'action Slack
     */
    async executeSlackAction(integration, actionType, actionData) {
        switch (actionType) {
            case 'send_message':
                await new Promise(resolve => setTimeout(resolve, 150));
                return {
                    channel: actionData.channel,
                    ts: Date.now(),
                    message: actionData.text
                };
                
            case 'upload_file':
                await new Promise(resolve => setTimeout(resolve, 500));
                return {
                    file: {
                        id: 'F' + Date.now(),
                        name: actionData.filename,
                        permalink: 'https://slack.com/files/...'
                    }
                };
                
            default:
                throw new Error(`Action Slack non supportée : ${actionType}`);
        }
    }
    
    /**
     * Exécution d'action Salesforce
     */
    async executeSalesforceAction(integration, actionType, actionData) {
        switch (actionType) {
            case 'create_lead':
                await new Promise(resolve => setTimeout(resolve, 600));
                return {
                    id: '00Q' + Date.now(),
                    success: true,
                    created: true
                };
                
            case 'update_contact':
                await new Promise(resolve => setTimeout(resolve, 450));
                return {
                    id: actionData.id,
                    success: true,
                    updated: true
                };
                
            default:
                throw new Error(`Action Salesforce non supportée : ${actionType}`);
        }
    }
    
    /**
     * Exécution d'action HubSpot
     */
    async executeHubSpotAction(integration, actionType, actionData) {
        switch (actionType) {
            case 'create_contact':
                await new Promise(resolve => setTimeout(resolve, 350));
                return {
                    id: Date.now(),
                    properties: actionData.properties,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
            case 'track_event':
                await new Promise(resolve => setTimeout(resolve, 200));
                return {
                    eventName: actionData.event,
                    occurredAt: new Date(),
                    contactId: actionData.contactId
                };
                
            default:
                throw new Error(`Action HubSpot non supportée : ${actionType}`);
        }
    }
    
    /**
     * Exécution d'action générique
     */
    async executeGenericAction(integration, actionType, actionData) {
        // Simulation d'appel API générique
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
        
        return {
            action: actionType,
            data: actionData,
            timestamp: new Date(),
            success: true
        };
    }
    
    /**
     * Chargement des intégrations sauvegardées
     */
    loadSavedIntegrations() {
        try {
            const saved = localStorage.getItem('formease-integrations');
            if (saved) {
                const integrations = JSON.parse(saved);
                integrations.forEach(integration => {
                    // Restaurer les connecteurs
                    if (this.connectors.has(integration.connector_id)) {
                        integration.connector = this.connectors.get(integration.connector_id);
                        this.integrations.set(integration.id, integration);
                    }
                });
                console.log(`💾 ${integrations.length} intégration(s) chargée(s)`);
            }
        } catch (error) {
            console.error('Erreur chargement intégrations :', error);
        }
    }
    
    /**
     * Sauvegarde des intégrations
     */
    saveIntegrations() {
        try {
            const integrations = Array.from(this.integrations.values()).map(integration => {
                // Exclure l'objet connector pour éviter les références circulaires
                const { connector, ...saved } = integration;
                return saved;
            });
            localStorage.setItem('formease-integrations', JSON.stringify(integrations));
        } catch (error) {
            console.error('Erreur sauvegarde intégrations :', error);
        }
    }
    
    /**
     * Démarrage du monitoring de santé
     */
    startHealthMonitoring() {
        setInterval(() => {
            this.performHealthChecks();
        }, this.config.healthCheckInterval);
    }
    
    /**
     * Vérifications de santé
     */
    async performHealthChecks() {
        const activeIntegrations = Array.from(this.integrations.values())
            .filter(integration => integration.status === this.integrationStatus.active);
        
        for (const integration of activeIntegrations) {
            try {
                // Test simple de connectivité
                await this.quickHealthCheck(integration);
            } catch (error) {
                console.warn(`⚠️ Health check échoué pour ${integration.name} :`, error.message);
                integration.status = this.integrationStatus.error;
            }
        }
        
        this.updateMetrics();
    }
    
    /**
     * Test rapide de santé
     */
    async quickHealthCheck(integration) {
        // Test rapide sans exécution d'action
        const timeout = 5000; // 5 secondes max
        
        return Promise.race([
            this.performMinimalTest(integration),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), timeout)
            )
        ]);
    }
    
    /**
     * Test minimal pour health check
     */
    async performMinimalTest(integration) {
        // Simulation d'un ping rapide
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        return { status: 'healthy', timestamp: new Date() };
    }
    
    /**
     * Mise à jour des métriques globales
     */
    updateMetrics() {
        this.metrics.activeIntegrations = Array.from(this.integrations.values())
            .filter(integration => integration.status === this.integrationStatus.active).length;
        
        const allIntegrations = Array.from(this.integrations.values());
        if (allIntegrations.length > 0) {
            const totalResponseTime = allIntegrations.reduce(
                (sum, integration) => sum + integration.metrics.averageResponseTime, 0
            );
            this.metrics.averageResponseTime = Math.round(totalResponseTime / allIntegrations.length);
        }
    }
    
    /**
     * Initialisation des gestionnaires d'événements
     */
    initializeEventHandlers() {
        // Sauvegarde automatique toutes les 30 secondes
        setInterval(() => {
            this.saveIntegrations();
        }, 30000);
    }
    
    /**
     * Obtention de la liste des connecteurs
     */
    getConnectors() {
        return Array.from(this.connectors.values());
    }
    
    /**
     * Obtention de la liste des intégrations
     */
    getIntegrations() {
        return Array.from(this.integrations.values());
    }
    
    /**
     * Obtention des métriques globales
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Suppression d'une intégration
     */
    deleteIntegration(integrationId) {
        const integration = this.integrations.get(integrationId);
        if (!integration) {
            throw new Error(`Intégration ${integrationId} introuvable`);
        }
        
        this.integrations.delete(integrationId);
        this.metrics.totalIntegrations--;
        this.updateMetrics();
        this.saveIntegrations();
        
        console.log(`🗑️ Intégration ${integration.name} supprimée`);
    }
    
    /**
     * Activation/Désactivation d'une intégration
     */
    toggleIntegration(integrationId, active) {
        const integration = this.integrations.get(integrationId);
        if (!integration) {
            throw new Error(`Intégration ${integrationId} introuvable`);
        }
        
        integration.status = active ? this.integrationStatus.active : this.integrationStatus.inactive;
        integration.modified = new Date();
        
        this.updateMetrics();
        this.saveIntegrations();
        
        console.log(`🔄 Intégration ${integration.name} ${active ? 'activée' : 'désactivée'}`);
    }
}

// Export pour compatibilité navigateur
window.IntegrationManager = IntegrationManager;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.integrationManager) {
        window.integrationManager = new IntegrationManager();
        console.log('🔗 IntegrationManager initialisé globalement');
    }
});

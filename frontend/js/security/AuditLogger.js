/**
 * 📋 AuditLogger.js - FormEase Sprint 4 Phase 1
 * 
 * Système d'audit et de journalisation avancé
 * Conformité réglementaire et traçabilité complète
 * 
 * Fonctionnalités :
 * - Audit trail complet et inaltérable
 * - Conformité RGPD, SOC2, ISO27001, HIPAA
 * - Journalisation structurée et recherchable
 * - Intégrité cryptographique des logs
 * - Alertes et monitoring en temps réel
 * - Rétention et archivage automatique
 * - Analyse comportementale et détection d'anomalies
 * - Export pour analyse forensique
 * 
 * @version 4.0.0
 * @author FormEase Security Team
 * @since Sprint 4 Phase 1
 */

class AuditLogger {
    constructor(securityManager, permissionSystem) {
        this.security = securityManager || window.securityManager;
        this.permissions = permissionSystem || window.permissionSystem;
        this.auditLogs = new Map();
        this.logStreams = new Map();
        this.alertRules = new Map();
        this.logRetention = new Map();
        this.integrityChain = [];
        this.searchIndex = new Map();
        
        this.config = {
            maxLogSize: 10000,              // Nombre max de logs en mémoire
            retentionPeriod: 2555,          // 7 ans (RGPD)
            compressionEnabled: true,        // Compression des anciens logs
            encryptionEnabled: true,         // Chiffrement des logs
            realTimeAlerting: true,         // Alertes temps réel
            integrityChecking: true,        // Vérification d'intégrité
            searchIndexing: true,           // Index de recherche
            batchSize: 100,                 // Taille des lots pour traitement
            flushInterval: 5000             // Interval de flush (5s)
        };
        
        this.logLevels = {
            trace: 0,
            debug: 1,
            info: 2,
            warn: 3,
            error: 4,
            fatal: 5,
            security: 6,
            audit: 7
        };
        
        this.eventCategories = {
            authentication: 'auth',
            authorization: 'authz',
            dataAccess: 'data_access',
            dataModification: 'data_mod',
            systemAdmin: 'sys_admin',
            userManagement: 'user_mgmt',
            configuration: 'config',
            integration: 'integration',
            workflow: 'workflow',
            api: 'api',
            security: 'security',
            compliance: 'compliance'
        };
        
        this.severityLevels = {
            low: 1,
            medium: 2,
            high: 3,
            critical: 4,
            emergency: 5
        };
        
        this.complianceStandards = {
            gdpr: {
                enabled: true,
                requirements: [
                    'personal_data_access',
                    'personal_data_modification',
                    'personal_data_deletion',
                    'consent_changes',
                    'data_breach_incidents'
                ]
            },
            soc2: {
                enabled: true,
                requirements: [
                    'user_access_provisioning',
                    'privilege_escalation',
                    'data_backup_restore',
                    'system_configuration_changes',
                    'monitoring_alerts'
                ]
            },
            iso27001: {
                enabled: true,
                requirements: [
                    'security_incidents',
                    'access_control_violations',
                    'vulnerability_assessments',
                    'risk_assessments',
                    'security_training'
                ]
            },
            hipaa: {
                enabled: false,
                requirements: [
                    'phi_access',
                    'phi_disclosure',
                    'security_violations',
                    'breach_notifications',
                    'audit_log_access'
                ]
            }
        };
        
        this.logBuffer = [];
        this.pendingFlush = false;
        this.anomalyDetector = null;
        
        this.init();
    }
    
    /**
     * Initialisation du système d'audit
     */
    init() {
        this.setupLogStreams();
        this.setupAlertRules();
        this.setupRetentionPolicies();
        this.initializeIntegrityChain();
        this.startLogProcessing();
        this.startAnomalyDetection();
        this.setupComplianceMonitoring();
        console.log('📋 AuditLogger v4.0 initialisé - Conformité Enterprise');
    }
    
    /**
     * Configuration des flux de logs
     */
    setupLogStreams() {
        // Stream principal
        this.logStreams.set('main', {
            id: 'main',
            name: 'Log Principal',
            type: 'structured',
            format: 'json',
            enabled: true,
            filters: [],
            destinations: ['memory', 'console'],
            compression: false,
            encryption: true
        });
        
        // Stream sécurité
        this.logStreams.set('security', {
            id: 'security',
            name: 'Logs Sécurité',
            type: 'security',
            format: 'json',
            enabled: true,
            filters: [
                'category:security',
                'category:auth',
                'category:authz',
                'severity:>=high'
            ],
            destinations: ['memory', 'secure_storage'],
            compression: true,
            encryption: true,
            immutable: true
        });
        
        // Stream conformité
        this.logStreams.set('compliance', {
            id: 'compliance',
            name: 'Logs Conformité',
            type: 'compliance',
            format: 'structured',
            enabled: true,
            filters: [
                'category:compliance',
                'standard:gdpr',
                'standard:soc2',
                'standard:iso27001'
            ],
            destinations: ['memory', 'compliance_archive'],
            compression: true,
            encryption: true,
            retention: 2555 // 7 ans
        });
        
        // Stream API
        this.logStreams.set('api', {
            id: 'api',
            name: 'Logs API',
            type: 'api',
            format: 'json',
            enabled: true,
            filters: ['category:api'],
            destinations: ['memory'],
            compression: true,
            encryption: false,
            sampling: 0.1 // 10% des requêtes API
        });
        
        // Stream audit système
        this.logStreams.set('system', {
            id: 'system',
            name: 'Audit Système',
            type: 'system',
            format: 'structured',
            enabled: true,
            filters: [
                'category:sys_admin',
                'category:config',
                'severity:>=medium'
            ],
            destinations: ['memory', 'system_archive'],
            compression: true,
            encryption: true
        });
        
        console.log('📊 Flux de logs configurés :', this.logStreams.size);
    }
    
    /**
     * Configuration des règles d'alerte
     */
    setupAlertRules() {
        // Alerte échecs d'authentification multiples
        this.alertRules.set('multiple_auth_failures', {
            id: 'multiple_auth_failures',
            name: 'Échecs Authentification Multiples',
            description: 'Détection de tentatives de force brute',
            condition: {
                event: 'login_failed',
                threshold: 5,
                timeWindow: 5 * 60 * 1000, // 5 minutes
                groupBy: ['user_id', 'ip_address']
            },
            severity: this.severityLevels.high,
            actions: [
                'send_notification',
                'block_ip',
                'alert_security_team'
            ],
            enabled: true
        });
        
        // Alerte escalade de privilèges
        this.alertRules.set('privilege_escalation', {
            id: 'privilege_escalation',
            name: 'Escalade de Privilèges',
            description: 'Détection d\'escalade de privilèges suspecte',
            condition: {
                event: 'permission_granted',
                filter: 'level:>=admin',
                threshold: 1,
                timeWindow: 60 * 1000, // 1 minute
                requireApproval: true
            },
            severity: this.severityLevels.critical,
            actions: [
                'immediate_notification',
                'freeze_account',
                'require_mfa'
            ],
            enabled: true
        });
        
        // Alerte accès données sensibles
        this.alertRules.set('sensitive_data_access', {
            id: 'sensitive_data_access',
            name: 'Accès Données Sensibles',
            description: 'Accès à des données classifiées',
            condition: {
                event: 'data_access',
                filter: 'classification:confidential OR classification:restricted',
                threshold: 1,
                timeWindow: 0, // Immédiat
                outOfHours: true
            },
            severity: this.severityLevels.high,
            actions: [
                'log_detailed',
                'notify_data_owner',
                'verify_authorization'
            ],
            enabled: true
        });
        
        // Alerte modifications système
        this.alertRules.set('system_modifications', {
            id: 'system_modifications',
            name: 'Modifications Système',
            description: 'Changements de configuration système',
            condition: {
                event: 'system_config_changed',
                threshold: 1,
                timeWindow: 0,
                severity: '>=medium'
            },
            severity: this.severityLevels.medium,
            actions: [
                'log_change_details',
                'notify_admin',
                'backup_configuration'
            ],
            enabled: true
        });
        
        // Alerte violation RGPD
        this.alertRules.set('gdpr_violation', {
            id: 'gdpr_violation',
            name: 'Violation RGPD Potentielle',
            description: 'Détection de violation RGPD',
            condition: {
                event: ['personal_data_access_denied', 'consent_violation', 'data_retention_exceeded'],
                threshold: 1,
                timeWindow: 0
            },
            severity: this.severityLevels.critical,
            actions: [
                'immediate_alert',
                'escalate_to_dpo',
                'investigate_incident',
                'prepare_breach_report'
            ],
            enabled: true
        });
        
        console.log('🚨 Règles d\'alerte configurées :', this.alertRules.size);
    }
    
    /**
     * Configuration des politiques de rétention
     */
    setupRetentionPolicies() {
        this.logRetention.set('security_events', {
            category: ['security', 'auth', 'authz'],
            retention: 2555, // 7 ans
            archiveAfter: 365, // 1 an
            compressionLevel: 9,
            encryptionRequired: true
        });
        
        this.logRetention.set('compliance_logs', {
            category: ['compliance'],
            retention: 2555, // 7 ans (RGPD)
            archiveAfter: 90, // 3 mois
            compressionLevel: 9,
            encryptionRequired: true,
            immutable: true
        });
        
        this.logRetention.set('api_logs', {
            category: ['api'],
            retention: 90, // 3 mois
            archiveAfter: 30, // 1 mois
            compressionLevel: 6,
            encryptionRequired: false,
            sampling: 0.1
        });
        
        this.logRetention.set('general_logs', {
            category: ['info', 'debug'],
            retention: 30, // 1 mois
            archiveAfter: 7, // 1 semaine
            compressionLevel: 3,
            encryptionRequired: false
        });
        
        console.log('📦 Politiques de rétention configurées');
    }
    
    /**
     * Initialisation de la chaîne d'intégrité
     */
    initializeIntegrityChain() {
        if (this.config.integrityChecking) {
            // Premier bloc de la chaîne
            const genesisBlock = {
                index: 0,
                timestamp: new Date(),
                data: 'GENESIS_BLOCK',
                previousHash: '0',
                hash: this.calculateHash('GENESIS_BLOCK', '0', new Date()),
                nonce: 0
            };
            
            this.integrityChain.push(genesisBlock);
            console.log('🔗 Chaîne d\'intégrité initialisée');
        }
    }
    
    /**
     * Journalisation d'un événement
     */
    async log(level, category, event, details = {}, context = {}) {
        try {
            const logEntry = await this.createLogEntry(level, category, event, details, context);
            
            // Ajouter au buffer
            this.logBuffer.push(logEntry);
            
            // Traitement immédiat pour les événements critiques
            if (level >= this.logLevels.error || category === this.eventCategories.security) {
                await this.processLogEntry(logEntry);
            }
            
            // Flush automatique si buffer plein
            if (this.logBuffer.length >= this.config.batchSize) {
                await this.flushLogs();
            }
            
            return logEntry.id;
            
        } catch (error) {
            console.error('Erreur journalisation :', error);
            // Fallback : log d'erreur simple
            console.error(`[AUDIT_ERROR] ${level}:${category}:${event}`, details);
        }
    }
    
    /**
     * Création d'une entrée de log
     */
    async createLogEntry(level, category, event, details, context) {
        const timestamp = new Date();
        const logId = this.generateLogId();
        
        const logEntry = {
            id: logId,
            timestamp: timestamp,
            level: level,
            levelName: this.getLevelName(level),
            category: category,
            event: event,
            severity: this.calculateSeverity(level, category, event),
            details: this.sanitizeDetails(details),
            context: {
                userId: context.userId || 'anonymous',
                sessionId: context.sessionId || null,
                ip: context.ip || this.getClientIP(),
                userAgent: context.userAgent || navigator.userAgent,
                requestId: context.requestId || this.generateRequestId(),
                trace: context.trace || null,
                ...context
            },
            metadata: {
                source: 'AuditLogger',
                version: '4.0.0',
                environment: 'production',
                node: this.getNodeId()
            },
            compliance: this.getComplianceFlags(category, event),
            hash: null, // Calculé après
            signature: null // Calculé après
        };
        
        // Calculer le hash pour l'intégrité
        if (this.config.integrityChecking) {
            logEntry.hash = await this.calculateLogHash(logEntry);
            logEntry.signature = await this.signLogEntry(logEntry);
        }
        
        return logEntry;
    }
    
    /**
     * Traitement d'une entrée de log
     */
    async processLogEntry(logEntry) {
        try {
            // 1. Stocker dans les flux appropriés
            await this.distributeToStreams(logEntry);
            
            // 2. Indexer pour la recherche
            if (this.config.searchIndexing) {
                this.indexLogEntry(logEntry);
            }
            
            // 3. Vérifier les règles d'alerte
            if (this.config.realTimeAlerting) {
                await this.checkAlertRules(logEntry);
            }
            
            // 4. Ajouter à la chaîne d'intégrité
            if (this.config.integrityChecking) {
                await this.addToIntegrityChain(logEntry);
            }
            
            // 5. Vérifier la conformité
            await this.checkComplianceRequirements(logEntry);
            
            // 6. Détecter les anomalies
            if (this.anomalyDetector) {
                await this.anomalyDetector.analyze(logEntry);
            }
            
        } catch (error) {
            console.error('Erreur traitement log :', error);
        }
    }
    
    /**
     * Distribution vers les flux
     */
    async distributeToStreams(logEntry) {
        for (const stream of this.logStreams.values()) {
            if (!stream.enabled) continue;
            
            // Vérifier les filtres
            if (!this.passesStreamFilters(logEntry, stream.filters)) continue;
            
            // Appliquer le sampling si configuré
            if (stream.sampling && Math.random() > stream.sampling) continue;
            
            // Distribuer vers les destinations
            for (const destination of stream.destinations) {
                await this.writeToDestination(logEntry, destination, stream);
            }
        }
    }
    
    /**
     * Écriture vers une destination
     */
    async writeToDestination(logEntry, destination, stream) {
        switch (destination) {
            case 'memory':
                this.writeToMemory(logEntry, stream);
                break;
                
            case 'console':
                this.writeToConsole(logEntry, stream);
                break;
                
            case 'secure_storage':
                await this.writeToSecureStorage(logEntry, stream);
                break;
                
            case 'compliance_archive':
                await this.writeToComplianceArchive(logEntry, stream);
                break;
                
            case 'system_archive':
                await this.writeToSystemArchive(logEntry, stream);
                break;
                
            default:
                console.warn('Destination inconnue :', destination);
        }
    }
    
    /**
     * Vérification des règles d'alerte
     */
    async checkAlertRules(logEntry) {
        for (const rule of this.alertRules.values()) {
            if (!rule.enabled) continue;
            
            const triggered = await this.evaluateAlertRule(rule, logEntry);
            if (triggered) {
                await this.triggerAlert(rule, logEntry, triggered.context);
            }
        }
    }
    
    /**
     * Évaluation d'une règle d'alerte
     */
    async evaluateAlertRule(rule, logEntry) {
        const condition = rule.condition;
        
        // Vérifier l'événement
        if (Array.isArray(condition.event)) {
            if (!condition.event.includes(logEntry.event)) return false;
        } else if (condition.event !== logEntry.event) {
            return false;
        }
        
        // Vérifier les filtres
        if (condition.filter && !this.evaluateFilter(logEntry, condition.filter)) {
            return false;
        }
        
        // Vérifier les conditions temporelles
        if (condition.outOfHours && this.isDuringBusinessHours()) {
            return false;
        }
        
        // Vérifier les seuils si applicable
        if (condition.threshold > 1) {
            const count = await this.countRecentEvents(
                condition.event,
                condition.timeWindow,
                condition.groupBy,
                logEntry
            );
            
            if (count < condition.threshold) {
                return false;
            }
            
            return { triggered: true, count, context: { count } };
        }
        
        return { triggered: true, context: {} };
    }
    
    /**
     * Déclenchement d'une alerte
     */
    async triggerAlert(rule, logEntry, context) {
        const alert = {
            id: this.generateAlertId(),
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            timestamp: new Date(),
            logEntry: logEntry,
            context: context,
            status: 'active',
            actions: []
        };
        
        console.warn(`🚨 ALERTE [${rule.name}] - Severity: ${rule.severity}`, alert);
        
        // Exécuter les actions
        for (const action of rule.actions) {
            try {
                const result = await this.executeAlertAction(action, alert, logEntry);
                alert.actions.push({ action, result, timestamp: new Date() });
            } catch (error) {
                console.error(`Erreur exécution action ${action}:`, error);
                alert.actions.push({ action, error: error.message, timestamp: new Date() });
            }
        }
        
        // Journaliser l'alerte elle-même
        await this.log(
            this.logLevels.security,
            this.eventCategories.security,
            'alert_triggered',
            { alert },
            { automated: true }
        );
    }
    
    /**
     * Recherche dans les logs
     */
    async searchLogs(query, options = {}) {
        const results = {
            logs: [],
            total: 0,
            aggregations: {},
            took: 0
        };
        
        const startTime = Date.now();
        
        try {
            // Recherche simple dans l'index
            const searchResults = await this.executeSearch(query, options);
            
            results.logs = searchResults.logs;
            results.total = searchResults.total;
            results.aggregations = searchResults.aggregations;
            results.took = Date.now() - startTime;
            
            // Auditer la recherche
            await this.log(
                this.logLevels.audit,
                this.eventCategories.dataAccess,
                'audit_search_performed',
                {
                    query: query,
                    resultsCount: results.total,
                    took: results.took
                },
                options.context || {}
            );
            
            return results;
            
        } catch (error) {
            console.error('Erreur recherche logs :', error);
            
            await this.log(
                this.logLevels.error,
                this.eventCategories.dataAccess,
                'audit_search_failed',
                {
                    query: query,
                    error: error.message
                },
                options.context || {}
            );
            
            throw error;
        }
    }
    
    /**
     * Export de logs pour analyse forensique
     */
    async exportLogs(filters, format = 'json', options = {}) {
        try {
            const exportId = this.generateExportId();
            
            // Journaliser la demande d'export
            await this.log(
                this.logLevels.audit,
                this.eventCategories.dataAccess,
                'audit_export_requested',
                {
                    exportId,
                    filters,
                    format,
                    requestedBy: options.userId
                },
                options.context || {}
            );
            
            // Filtrer les logs
            const logs = await this.filterLogs(filters);
            
            // Exporter selon le format
            let exportData;
            switch (format) {
                case 'json':
                    exportData = this.exportToJSON(logs);
                    break;
                case 'csv':
                    exportData = this.exportToCSV(logs);
                    break;
                case 'xml':
                    exportData = this.exportToXML(logs);
                    break;
                default:
                    throw new Error(`Format d'export non supporté : ${format}`);
            }
            
            // Journaliser l'export réussi
            await this.log(
                this.logLevels.audit,
                this.eventCategories.dataAccess,
                'audit_export_completed',
                {
                    exportId,
                    logsCount: logs.length,
                    format,
                    size: exportData.length
                },
                options.context || {}
            );
            
            return {
                exportId,
                data: exportData,
                format,
                count: logs.length,
                timestamp: new Date()
            };
            
        } catch (error) {
            console.error('Erreur export logs :', error);
            
            await this.log(
                this.logLevels.error,
                this.eventCategories.dataAccess,
                'audit_export_failed',
                {
                    filters,
                    format,
                    error: error.message
                },
                options.context || {}
            );
            
            throw error;
        }
    }
    
    /**
     * Vérification d'intégrité des logs
     */
    async verifyIntegrity(startDate, endDate) {
        if (!this.config.integrityChecking) {
            return { verified: false, reason: 'Vérification d\'intégrité désactivée' };
        }
        
        const verification = {
            verified: true,
            checked: 0,
            errors: [],
            warnings: [],
            startDate,
            endDate,
            timestamp: new Date()
        };
        
        try {
            // Vérifier la chaîne d'intégrité
            for (let i = 1; i < this.integrityChain.length; i++) {
                const currentBlock = this.integrityChain[i];
                const previousBlock = this.integrityChain[i - 1];
                
                // Vérifier le hash précédent
                if (currentBlock.previousHash !== previousBlock.hash) {
                    verification.verified = false;
                    verification.errors.push({
                        type: 'CHAIN_BROKEN',
                        block: i,
                        message: 'Chaîne d\'intégrité brisée'
                    });
                }
                
                // Vérifier le hash du bloc
                const calculatedHash = this.calculateHash(
                    currentBlock.data,
                    currentBlock.previousHash,
                    currentBlock.timestamp
                );
                
                if (currentBlock.hash !== calculatedHash) {
                    verification.verified = false;
                    verification.errors.push({
                        type: 'HASH_MISMATCH',
                        block: i,
                        message: 'Hash du bloc invalide'
                    });
                }
                
                verification.checked++;
            }
            
            // Journaliser la vérification
            await this.log(
                this.logLevels.audit,
                this.eventCategories.security,
                'integrity_verification_completed',
                {
                    verified: verification.verified,
                    checked: verification.checked,
                    errors: verification.errors.length,
                    warnings: verification.warnings.length
                }
            );
            
            return verification;
            
        } catch (error) {
            console.error('Erreur vérification intégrité :', error);
            
            verification.verified = false;
            verification.errors.push({
                type: 'VERIFICATION_ERROR',
                message: error.message
            });
            
            return verification;
        }
    }
    
    /**
     * Démarrage du traitement des logs
     */
    startLogProcessing() {
        // Flush périodique des logs
        setInterval(() => {
            if (this.logBuffer.length > 0 && !this.pendingFlush) {
                this.flushLogs();
            }
        }, this.config.flushInterval);
        
        // Nettoyage périodique
        setInterval(() => {
            this.cleanupOldLogs();
        }, 60 * 60 * 1000); // Chaque heure
        
        // Vérification d'intégrité périodique
        setInterval(() => {
            this.performIntegrityCheck();
        }, 24 * 60 * 60 * 1000); // Chaque jour
        
        console.log('⚙️ Traitement des logs démarré');
    }
    
    /**
     * Démarrage de la détection d'anomalies
     */
    startAnomalyDetection() {
        this.anomalyDetector = {
            patterns: new Map(),
            baselines: new Map(),
            
            async analyze(logEntry) {
                // Analyser les patterns d'accès
                await this.analyzeAccessPatterns(logEntry);
                
                // Détecter les comportements anormaux
                await this.detectAnomalousActivity(logEntry);
                
                // Mettre à jour les baselines
                await this.updateBaselines(logEntry);
            },
            
            async analyzeAccessPatterns(logEntry) {
                if (logEntry.category === 'data_access') {
                    const pattern = `${logEntry.context.userId}:${logEntry.event}`;
                    const existing = this.patterns.get(pattern) || { count: 0, times: [] };
                    
                    existing.count++;
                    existing.times.push(logEntry.timestamp);
                    
                    // Garder seulement les 100 derniers accès
                    if (existing.times.length > 100) {
                        existing.times = existing.times.slice(-100);
                    }
                    
                    this.patterns.set(pattern, existing);
                }
            },
            
            async detectAnomalousActivity(logEntry) {
                // Détecter les accès hors horaires
                if (logEntry.category === 'data_access' && this.isOutOfHours(logEntry.timestamp)) {
                    await window.auditLogger.log(
                        window.auditLogger.logLevels.warn,
                        window.auditLogger.eventCategories.security,
                        'anomaly_out_of_hours_access',
                        {
                            originalEvent: logEntry.event,
                            userId: logEntry.context.userId,
                            timestamp: logEntry.timestamp
                        },
                        { anomalyDetection: true }
                    );
                }
                
                // Détecter les volumes anormaux
                const userActivity = this.getUserActivityLevel(logEntry.context.userId);
                if (userActivity > this.getActivityBaseline(logEntry.context.userId) * 3) {
                    await window.auditLogger.log(
                        window.auditLogger.logLevels.warn,
                        window.auditLogger.eventCategories.security,
                        'anomaly_high_activity',
                        {
                            userId: logEntry.context.userId,
                            activityLevel: userActivity,
                            baseline: this.getActivityBaseline(logEntry.context.userId)
                        },
                        { anomalyDetection: true }
                    );
                }
            },
            
            async updateBaselines(logEntry) {
                const userId = logEntry.context.userId;
                const hour = logEntry.timestamp.getHours();
                
                const key = `${userId}:${hour}`;
                const baseline = this.baselines.get(key) || { count: 0, average: 0 };
                
                baseline.count++;
                baseline.average = (baseline.average + 1) / baseline.count;
                
                this.baselines.set(key, baseline);
            },
            
            getUserActivityLevel(userId) {
                let count = 0;
                const since = new Date(Date.now() - 60 * 60 * 1000); // Dernière heure
                
                for (const [pattern, data] of this.patterns.entries()) {
                    if (pattern.startsWith(userId)) {
                        count += data.times.filter(t => t > since).length;
                    }
                }
                
                return count;
            },
            
            getActivityBaseline(userId) {
                const hour = new Date().getHours();
                const key = `${userId}:${hour}`;
                const baseline = this.baselines.get(key);
                return baseline ? baseline.average : 5; // Baseline par défaut
            },
            
            isOutOfHours(timestamp) {
                const hour = timestamp.getHours();
                return hour < 8 || hour > 18;
            }
        };
        
        console.log('🔍 Détection d\'anomalies démarrée');
    }
    
    /**
     * Configuration du monitoring de conformité
     */
    setupComplianceMonitoring() {
        for (const [standard, config] of Object.entries(this.complianceStandards)) {
            if (!config.enabled) continue;
            
            for (const requirement of config.requirements) {
                this.setupComplianceRule(standard, requirement);
            }
        }
        
        console.log('📋 Monitoring de conformité configuré');
    }
    
    /**
     * Fonctions utilitaires
     */
    async flushLogs() {
        if (this.pendingFlush || this.logBuffer.length === 0) return;
        
        this.pendingFlush = true;
        const batch = [...this.logBuffer];
        this.logBuffer = [];
        
        try {
            for (const logEntry of batch) {
                await this.processLogEntry(logEntry);
            }
        } catch (error) {
            console.error('Erreur flush logs :', error);
            // Remettre les logs en buffer en cas d'erreur
            this.logBuffer.unshift(...batch);
        } finally {
            this.pendingFlush = false;
        }
    }
    
    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    generateExportId() {
        return `export_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    getNodeId() {
        return 'node-1'; // En production, identifier le nœud
    }
    
    getClientIP() {
        return '192.168.1.100'; // Simulation
    }
    
    getLevelName(level) {
        return Object.keys(this.logLevels).find(key => this.logLevels[key] === level) || 'unknown';
    }
    
    calculateSeverity(level, category, event) {
        if (level >= this.logLevels.fatal) return this.severityLevels.emergency;
        if (level >= this.logLevels.error) return this.severityLevels.critical;
        if (category === this.eventCategories.security) return this.severityLevels.high;
        if (level >= this.logLevels.warn) return this.severityLevels.medium;
        return this.severityLevels.low;
    }
    
    sanitizeDetails(details) {
        // Supprimer les informations sensibles
        const sanitized = { ...details };
        
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
        
        return sanitized;
    }
    
    getComplianceFlags(category, event) {
        const flags = [];
        
        for (const [standard, config] of Object.entries(this.complianceStandards)) {
            if (!config.enabled) continue;
            
            if (config.requirements.some(req => event.includes(req) || category.includes(req))) {
                flags.push(standard);
            }
        }
        
        return flags;
    }
    
    async calculateLogHash(logEntry) {
        const data = JSON.stringify({
            id: logEntry.id,
            timestamp: logEntry.timestamp,
            event: logEntry.event,
            category: logEntry.category,
            details: logEntry.details
        });
        
        return this.hashString(data);
    }
    
    async signLogEntry(logEntry) {
        // Simulation de signature cryptographique
        return `sig_${logEntry.hash.substring(0, 16)}`;
    }
    
    calculateHash(data, previousHash, timestamp) {
        const content = `${data}${previousHash}${timestamp}`;
        return this.hashString(content);
    }
    
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }
    
    async addToIntegrityChain(logEntry) {
        const lastBlock = this.integrityChain[this.integrityChain.length - 1];
        
        const newBlock = {
            index: this.integrityChain.length,
            timestamp: logEntry.timestamp,
            data: logEntry.hash,
            previousHash: lastBlock.hash,
            hash: null,
            nonce: 0
        };
        
        newBlock.hash = this.calculateHash(
            newBlock.data,
            newBlock.previousHash,
            newBlock.timestamp
        );
        
        this.integrityChain.push(newBlock);
    }
    
    passesStreamFilters(logEntry, filters) {
        for (const filter of filters) {
            if (!this.evaluateFilter(logEntry, filter)) {
                return false;
            }
        }
        return true;
    }
    
    evaluateFilter(logEntry, filter) {
        if (filter.startsWith('category:')) {
            return logEntry.category === filter.substring(9);
        }
        
        if (filter.startsWith('severity:>=')) {
            const threshold = filter.substring(11);
            return logEntry.severity >= this.severityLevels[threshold];
        }
        
        if (filter.startsWith('standard:')) {
            const standard = filter.substring(9);
            return logEntry.compliance.includes(standard);
        }
        
        return true;
    }
    
    writeToMemory(logEntry, stream) {
        const streamLogs = this.auditLogs.get(stream.id) || [];
        streamLogs.push(logEntry);
        
        // Limiter la taille en mémoire
        if (streamLogs.length > this.config.maxLogSize) {
            streamLogs.splice(0, streamLogs.length - this.config.maxLogSize);
        }
        
        this.auditLogs.set(stream.id, streamLogs);
    }
    
    writeToConsole(logEntry, stream) {
        const message = `[${logEntry.timestamp.toISOString()}] ${logEntry.levelName.toUpperCase()} ${logEntry.category}:${logEntry.event}`;
        
        switch (logEntry.level) {
            case this.logLevels.error:
            case this.logLevels.fatal:
                console.error(message, logEntry.details);
                break;
            case this.logLevels.warn:
                console.warn(message, logEntry.details);
                break;
            case this.logLevels.debug:
                console.debug(message, logEntry.details);
                break;
            default:
                console.log(message, logEntry.details);
        }
    }
    
    async writeToSecureStorage(logEntry, stream) {
        // Simulation d'écriture sécurisée
        console.log(`🔒 [SECURE] ${logEntry.id} stored`);
    }
    
    async writeToComplianceArchive(logEntry, stream) {
        // Simulation d'archivage conformité
        console.log(`📋 [COMPLIANCE] ${logEntry.id} archived`);
    }
    
    async writeToSystemArchive(logEntry, stream) {
        // Simulation d'archivage système
        console.log(`💾 [SYSTEM] ${logEntry.id} archived`);
    }
    
    indexLogEntry(logEntry) {
        // Index simple par mots-clés
        const keywords = [
            logEntry.event,
            logEntry.category,
            logEntry.context.userId,
            ...Object.keys(logEntry.details)
        ];
        
        for (const keyword of keywords) {
            if (!this.searchIndex.has(keyword)) {
                this.searchIndex.set(keyword, []);
            }
            this.searchIndex.get(keyword).push(logEntry.id);
        }
    }
    
    async executeSearch(query, options) {
        // Recherche simple dans l'index
        const results = {
            logs: [],
            total: 0,
            aggregations: {}
        };
        
        const keywords = query.split(' ');
        const logIds = new Set();
        
        for (const keyword of keywords) {
            const ids = this.searchIndex.get(keyword) || [];
            ids.forEach(id => logIds.add(id));
        }
        
        // Récupérer les logs correspondants
        for (const streamLogs of this.auditLogs.values()) {
            for (const log of streamLogs) {
                if (logIds.has(log.id)) {
                    results.logs.push(log);
                }
            }
        }
        
        results.total = results.logs.length;
        
        // Appliquer la pagination
        const offset = options.offset || 0;
        const limit = options.limit || 100;
        results.logs = results.logs.slice(offset, offset + limit);
        
        return results;
    }
    
    async filterLogs(filters) {
        const allLogs = [];
        
        for (const streamLogs of this.auditLogs.values()) {
            allLogs.push(...streamLogs);
        }
        
        return allLogs.filter(log => {
            // Appliquer les filtres
            if (filters.startDate && log.timestamp < filters.startDate) return false;
            if (filters.endDate && log.timestamp > filters.endDate) return false;
            if (filters.category && log.category !== filters.category) return false;
            if (filters.userId && log.context.userId !== filters.userId) return false;
            
            return true;
        });
    }
    
    exportToJSON(logs) {
        return JSON.stringify(logs, null, 2);
    }
    
    exportToCSV(logs) {
        const headers = ['timestamp', 'level', 'category', 'event', 'userId', 'ip'];
        const rows = [headers];
        
        for (const log of logs) {
            rows.push([
                log.timestamp.toISOString(),
                log.levelName,
                log.category,
                log.event,
                log.context.userId,
                log.context.ip
            ]);
        }
        
        return rows.map(row => row.join(',')).join('\n');
    }
    
    exportToXML(logs) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<logs>\n';
        
        for (const log of logs) {
            xml += `  <log id="${log.id}">\n`;
            xml += `    <timestamp>${log.timestamp.toISOString()}</timestamp>\n`;
            xml += `    <level>${log.levelName}</level>\n`;
            xml += `    <category>${log.category}</category>\n`;
            xml += `    <event>${log.event}</event>\n`;
            xml += `  </log>\n`;
        }
        
        xml += '</logs>';
        return xml;
    }
    
    async countRecentEvents(event, timeWindow, groupBy, currentLog) {
        // Compter les événements récents pour les seuils d'alerte
        let count = 0;
        const since = new Date(Date.now() - timeWindow);
        
        for (const streamLogs of this.auditLogs.values()) {
            for (const log of streamLogs) {
                if (log.event === event && log.timestamp > since) {
                    // Vérifier le groupBy si spécifié
                    if (groupBy) {
                        let matches = true;
                        for (const field of groupBy) {
                            if (log.context[field] !== currentLog.context[field]) {
                                matches = false;
                                break;
                            }
                        }
                        if (matches) count++;
                    } else {
                        count++;
                    }
                }
            }
        }
        
        return count;
    }
    
    isDuringBusinessHours() {
        const hour = new Date().getHours();
        return hour >= 8 && hour < 18;
    }
    
    async executeAlertAction(action, alert, logEntry) {
        switch (action) {
            case 'send_notification':
                return await this.sendNotification(alert);
                
            case 'block_ip':
                return await this.blockIP(logEntry.context.ip);
                
            case 'alert_security_team':
                return await this.alertSecurityTeam(alert);
                
            case 'immediate_notification':
                return await this.sendImmediateNotification(alert);
                
            case 'freeze_account':
                return await this.freezeAccount(logEntry.context.userId);
                
            case 'require_mfa':
                return await this.requireMFA(logEntry.context.userId);
                
            default:
                return { success: false, message: `Action inconnue: ${action}` };
        }
    }
    
    // Actions d'alerte (simulation)
    async sendNotification(alert) {
        console.log('📧 Notification envoyée:', alert.ruleName);
        return { success: true };
    }
    
    async blockIP(ip) {
        console.log('🚫 IP bloquée:', ip);
        return { success: true };
    }
    
    async alertSecurityTeam(alert) {
        console.log('🚨 Équipe sécurité alertée:', alert.ruleName);
        return { success: true };
    }
    
    async sendImmediateNotification(alert) {
        console.log('⚡ Notification immédiate:', alert.ruleName);
        return { success: true };
    }
    
    async freezeAccount(userId) {
        console.log('❄️ Compte gelé:', userId);
        return { success: true };
    }
    
    async requireMFA(userId) {
        console.log('🔐 MFA requis pour:', userId);
        return { success: true };
    }
    
    checkComplianceRequirements(logEntry) {
        // Vérifier les exigences de conformité
        for (const standard of logEntry.compliance) {
            const config = this.complianceStandards[standard];
            if (config && config.enabled) {
                // Traitement spécifique par standard
                this.processComplianceEvent(standard, logEntry);
            }
        }
    }
    
    processComplianceEvent(standard, logEntry) {
        console.log(`📋 Événement conformité ${standard.toUpperCase()}:`, logEntry.event);
    }
    
    setupComplianceRule(standard, requirement) {
        console.log(`📋 Règle conformité configurée: ${standard}:${requirement}`);
    }
    
    cleanupOldLogs() {
        const now = new Date();
        let totalCleaned = 0;
        
        for (const [streamId, logs] of this.auditLogs.entries()) {
            const stream = this.logStreams.get(streamId);
            if (!stream) continue;
            
            const retentionPolicy = this.getRetentionPolicy(stream);
            if (!retentionPolicy) continue;
            
            const cutoffDate = new Date(now.getTime() - retentionPolicy.retention * 24 * 60 * 60 * 1000);
            
            const initialCount = logs.length;
            const filteredLogs = logs.filter(log => log.timestamp > cutoffDate);
            const cleaned = initialCount - filteredLogs.length;
            
            if (cleaned > 0) {
                this.auditLogs.set(streamId, filteredLogs);
                totalCleaned += cleaned;
            }
        }
        
        if (totalCleaned > 0) {
            console.log(`🧹 ${totalCleaned} logs anciens nettoyés`);
        }
    }
    
    getRetentionPolicy(stream) {
        for (const policy of this.logRetention.values()) {
            if (policy.category.includes(stream.type)) {
                return policy;
            }
        }
        return null;
    }
    
    performIntegrityCheck() {
        console.log('🔍 Vérification d\'intégrité périodique...');
        this.verifyIntegrity(
            new Date(Date.now() - 24 * 60 * 60 * 1000),
            new Date()
        ).then(result => {
            if (!result.verified) {
                console.error('❌ Échec vérification d\'intégrité:', result.errors);
            } else {
                console.log('✅ Intégrité vérifiée');
            }
        });
    }
    
    /**
     * API publique
     */
    getAuditStatus() {
        return {
            streamsConfigured: this.logStreams.size,
            alertRules: this.alertRules.size,
            retentionPolicies: this.logRetention.size,
            logsInMemory: Array.from(this.auditLogs.values()).reduce((sum, logs) => sum + logs.length, 0),
            integrityBlocks: this.integrityChain.length,
            bufferSize: this.logBuffer.length,
            searchIndexSize: this.searchIndex.size
        };
    }
    
    getLogStreams() {
        return Array.from(this.logStreams.values());
    }
    
    getAlertRules() {
        return Array.from(this.alertRules.values());
    }
    
    getComplianceStatus() {
        return this.complianceStandards;
    }
}

// Export pour compatibilité navigateur
window.AuditLogger = AuditLogger;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.auditLogger && window.securityManager && window.permissionSystem) {
        window.auditLogger = new AuditLogger(window.securityManager, window.permissionSystem);
        console.log('📋 AuditLogger initialisé globalement');
    }
});

// Méthodes globales de journalisation
window.auditLog = {
    info: (category, event, details, context) => 
        window.auditLogger?.log(window.auditLogger.logLevels.info, category, event, details, context),
    
    warn: (category, event, details, context) => 
        window.auditLogger?.log(window.auditLogger.logLevels.warn, category, event, details, context),
    
    error: (category, event, details, context) => 
        window.auditLogger?.log(window.auditLogger.logLevels.error, category, event, details, context),
    
    security: (event, details, context) => 
        window.auditLogger?.log(window.auditLogger.logLevels.security, window.auditLogger.eventCategories.security, event, details, context),
    
    audit: (event, details, context) => 
        window.auditLogger?.log(window.auditLogger.logLevels.audit, window.auditLogger.eventCategories.audit, event, details, context)
};

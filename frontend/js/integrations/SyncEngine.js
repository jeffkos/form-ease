/**
 * ⚡ SyncEngine.js - FormEase Sprint 3 Phase 3
 * 
 * Moteur de synchronisation temps réel et bidirectionnel
 * Orchestre la synchronisation entre FormEase et les systèmes externes
 * 
 * Fonctionnalités :
 * - Synchronisation temps réel et batch
 * - Sync bidirectionnel (import/export)
 * - Détection et résolution de conflits
 * - Queue de synchronisation avec priorités
 * - Retry automatique avec backoff
 * - Monitoring et métriques détaillées
 * - Support des webhooks pour sync temps réel
 * 
 * @version 3.0.0
 * @author FormEase Team
 * @since Sprint 3 Phase 3
 */

class SyncEngine {
    constructor() {
        this.syncJobs = new Map();
        this.syncQueue = [];
        this.activeSyncs = new Map();
        this.syncHistory = [];
        this.conflictStrategies = new Map();
        
        this.config = {
            maxConcurrentSyncs: 5,
            batchSize: 100,
            syncInterval: 30000, // 30 secondes
            maxRetries: 3,
            retryDelay: 5000,
            conflictDetection: true,
            realTimeSync: true,
            historyRetention: 1000 // Nombre d'entrées d'historique
        };
        
        this.syncTypes = {
            realtime: 'realtime',
            batch: 'batch',
            manual: 'manual',
            webhook: 'webhook'
        };
        
        this.syncDirections = {
            import: 'import',      // Externe -> FormEase
            export: 'export',      // FormEase -> Externe
            bidirectional: 'bidirectional'
        };
        
        this.syncStatus = {
            pending: 'pending',
            running: 'running',
            completed: 'completed',
            failed: 'failed',
            conflict: 'conflict',
            paused: 'paused'
        };
        
        this.conflictTypes = {
            duplicate: 'duplicate',
            outdated: 'outdated',
            missing: 'missing',
            invalid: 'invalid'
        };
        
        this.priorities = {
            critical: 1,
            high: 2,
            normal: 3,
            low: 4
        };
        
        this.metrics = {
            totalSyncs: 0,
            successfulSyncs: 0,
            failedSyncs: 0,
            conflictsDetected: 0,
            conflictsResolved: 0,
            averageSyncTime: 0,
            dataTransferred: 0,
            lastSyncTime: null
        };
        
        this.eventHandlers = new Map();
        this.init();
    }
    
    /**
     * Initialisation du moteur de synchronisation
     */
    init() {
        this.setupConflictStrategies();
        this.startSyncProcessor();
        this.setupEventHandlers();
        this.loadSyncJobs();
        console.log('⚡ SyncEngine v3.0 initialisé');
    }
    
    /**
     * Configuration des stratégies de résolution de conflits
     */
    setupConflictStrategies() {
        // Stratégie : Le plus récent gagne
        this.conflictStrategies.set('latest-wins', {
            id: 'latest-wins',
            name: 'Le Plus Récent Gagne',
            description: 'Utilise l\'enregistrement le plus récent en cas de conflit',
            resolve: async (localData, remoteData, conflictInfo) => {
                const localTimestamp = new Date(localData.updated_at || localData.modified || 0);
                const remoteTimestamp = new Date(remoteData.updated_at || remoteData.modified || 0);
                
                return {
                    resolution: remoteTimestamp > localTimestamp ? 'remote' : 'local',
                    data: remoteTimestamp > localTimestamp ? remoteData : localData,
                    reason: `Timestamp: local ${localTimestamp.toISOString()} vs remote ${remoteTimestamp.toISOString()}`
                };
            }
        });
        
        // Stratégie : Local gagne toujours
        this.conflictStrategies.set('local-wins', {
            id: 'local-wins',
            name: 'Local Gagne',
            description: 'Privilégie toujours les données locales',
            resolve: async (localData, remoteData, conflictInfo) => {
                return {
                    resolution: 'local',
                    data: localData,
                    reason: 'Stratégie local-wins appliquée'
                };
            }
        });
        
        // Stratégie : Distant gagne toujours
        this.conflictStrategies.set('remote-wins', {
            id: 'remote-wins',
            name: 'Distant Gagne',
            description: 'Privilégie toujours les données distantes',
            resolve: async (localData, remoteData, conflictInfo) => {
                return {
                    resolution: 'remote',
                    data: remoteData,
                    reason: 'Stratégie remote-wins appliquée'
                };
            }
        });
        
        // Stratégie : Fusion intelligente
        this.conflictStrategies.set('smart-merge', {
            id: 'smart-merge',
            name: 'Fusion Intelligente',
            description: 'Fusionne les données en prenant le meilleur de chaque source',
            resolve: async (localData, remoteData, conflictInfo) => {
                const mergedData = { ...localData };
                
                // Fusionner les champs non vides du distant
                for (const [key, value] of Object.entries(remoteData)) {
                    if (value && (!localData[key] || localData[key] === '')) {
                        mergedData[key] = value;
                    }
                    
                    // Pour les dates, prendre la plus récente
                    if (key.includes('_at') || key.includes('date')) {
                        const localDate = new Date(localData[key] || 0);
                        const remoteDate = new Date(value || 0);
                        if (remoteDate > localDate) {
                            mergedData[key] = value;
                        }
                    }
                }
                
                return {
                    resolution: 'merged',
                    data: mergedData,
                    reason: 'Fusion intelligente des données'
                };
            }
        });
        
        // Stratégie : Intervention manuelle
        this.conflictStrategies.set('manual', {
            id: 'manual',
            name: 'Intervention Manuelle',
            description: 'Nécessite une intervention manuelle pour résoudre',
            resolve: async (localData, remoteData, conflictInfo) => {
                return {
                    resolution: 'manual',
                    data: null,
                    reason: 'Intervention manuelle requise',
                    requiresManualResolution: true
                };
            }
        });
        
        console.log('🔧 Stratégies de conflit configurées :', this.conflictStrategies.size);
    }
    
    /**
     * Création d'un job de synchronisation
     */
    createSyncJob(config) {
        const jobId = 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const job = {
            id: jobId,
            name: config.name || `Sync Job ${jobId}`,
            description: config.description || '',
            integrationId: config.integrationId,
            direction: config.direction || this.syncDirections.bidirectional,
            type: config.type || this.syncTypes.batch,
            schedule: config.schedule || null,
            mapping: config.mapping || null,
            filters: config.filters || {},
            options: {
                conflictStrategy: config.conflictStrategy || 'latest-wins',
                batchSize: config.batchSize || this.config.batchSize,
                priority: config.priority || this.priorities.normal,
                enableRetry: config.enableRetry !== false,
                validateData: config.validateData !== false,
                ...config.options
            },
            status: this.syncStatus.pending,
            created: new Date(),
            modified: new Date(),
            lastSync: null,
            nextSync: config.schedule ? this.calculateNextSync(config.schedule) : null,
            metrics: {
                totalRuns: 0,
                successfulRuns: 0,
                failedRuns: 0,
                recordsProcessed: 0,
                conflictsDetected: 0,
                averageRunTime: 0
            }
        };
        
        this.syncJobs.set(jobId, job);
        
        // Programmer la première synchronisation si nécessaire
        if (job.schedule && job.type === this.syncTypes.batch) {
            this.scheduleSync(job);
        }
        
        console.log('📅 Job de synchronisation créé :', jobId);
        return job;
    }
    
    /**
     * Exécution d'une synchronisation
     */
    async executeSync(jobId, options = {}) {
        const job = this.syncJobs.get(jobId);
        if (!job) {
            throw new Error(`Job de synchronisation ${jobId} introuvable`);
        }
        
        const syncId = 'exec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const startTime = Date.now();
        
        const syncExecution = {
            id: syncId,
            jobId: jobId,
            status: this.syncStatus.running,
            direction: job.direction,
            startTime: new Date(),
            endTime: null,
            recordsProcessed: 0,
            recordsSuccessful: 0,
            recordsFailed: 0,
            conflictsDetected: 0,
            conflictsResolved: 0,
            errors: [],
            logs: [],
            options: { ...job.options, ...options }
        };
        
        this.activeSyncs.set(syncId, syncExecution);
        this.metrics.totalSyncs++;
        job.metrics.totalRuns++;
        
        try {
            this.log(syncExecution, 'info', `Démarrage de la synchronisation ${job.direction}`);
            
            // Vérifier les limites de concurrence
            if (this.activeSyncs.size > this.config.maxConcurrentSyncs) {
                await this.waitForAvailableSlot();
            }
            
            let result = null;
            
            switch (job.direction) {
                case this.syncDirections.import:
                    result = await this.executeImport(syncExecution, job);
                    break;
                case this.syncDirections.export:
                    result = await this.executeExport(syncExecution, job);
                    break;
                case this.syncDirections.bidirectional:
                    result = await this.executeBidirectionalSync(syncExecution, job);
                    break;
            }
            
            // Finalisation
            syncExecution.status = this.syncStatus.completed;
            syncExecution.endTime = new Date();
            
            const executionTime = syncExecution.endTime - syncExecution.startTime;
            this.updateSyncMetrics(job, syncExecution, executionTime, true);
            this.updateGlobalMetrics(executionTime, true);
            
            this.log(syncExecution, 'success', 
                `Synchronisation terminée: ${syncExecution.recordsSuccessful}/${syncExecution.recordsProcessed} réussies`);
            
            // Programmer la prochaine sync si nécessaire
            if (job.schedule) {
                job.nextSync = this.calculateNextSync(job.schedule);
                this.scheduleSync(job);
            }
            
            return result;
            
        } catch (error) {
            syncExecution.status = this.syncStatus.failed;
            syncExecution.endTime = new Date();
            syncExecution.errors.push({
                message: error.message,
                timestamp: new Date(),
                stack: error.stack
            });
            
            const executionTime = syncExecution.endTime - syncExecution.startTime;
            this.updateSyncMetrics(job, syncExecution, executionTime, false);
            this.updateGlobalMetrics(executionTime, false);
            
            this.log(syncExecution, 'error', `Erreur synchronisation: ${error.message}`);
            
            // Retry si configuré
            if (job.options.enableRetry && !options.isRetry) {
                await this.scheduleRetry(jobId, error, options.attempt || 0);
            }
            
            throw error;
            
        } finally {
            this.activeSyncs.delete(syncId);
            this.addToHistory(syncExecution);
            job.lastSync = new Date();
            job.modified = new Date();
        }
    }
    
    /**
     * Exécution d'un import (Externe -> FormEase)
     */
    async executeImport(syncExecution, job) {
        this.log(syncExecution, 'info', 'Début de l\'import des données externes');
        
        // Récupérer les données externes
        const externalData = await this.fetchExternalData(job);
        this.log(syncExecution, 'info', `${externalData.length} enregistrements récupérés`);
        
        const results = {
            imported: 0,
            updated: 0,
            skipped: 0,
            conflicts: 0
        };
        
        // Traitement par batch
        const batches = this.createBatches(externalData, job.options.batchSize);
        
        for (const batch of batches) {
            for (const externalRecord of batch) {
                try {
                    syncExecution.recordsProcessed++;
                    
                    // Mapper les données
                    const mappedData = await this.mapExternalToLocal(externalRecord, job.mapping);
                    
                    // Vérifier les conflits
                    const conflict = await this.detectConflict(mappedData, 'import');
                    
                    if (conflict) {
                        const resolution = await this.resolveConflict(
                            conflict.localData, 
                            mappedData, 
                            conflict, 
                            job.options.conflictStrategy
                        );
                        
                        syncExecution.conflictsDetected++;
                        this.metrics.conflictsDetected++;
                        
                        if (resolution.resolution === 'manual') {
                            this.log(syncExecution, 'warning', `Conflit manuel pour ${mappedData.id}`);
                            results.conflicts++;
                            continue;
                        }
                        
                        mappedData = resolution.data;
                        syncExecution.conflictsResolved++;
                        this.metrics.conflictsResolved++;
                    }
                    
                    // Sauvegarder localement
                    const saved = await this.saveToLocal(mappedData, conflict ? 'update' : 'create');
                    
                    if (saved) {
                        syncExecution.recordsSuccessful++;
                        if (conflict) {
                            results.updated++;
                        } else {
                            results.imported++;
                        }
                    }
                    
                } catch (error) {
                    syncExecution.recordsFailed++;
                    syncExecution.errors.push({
                        record: externalRecord,
                        error: error.message,
                        timestamp: new Date()
                    });
                    
                    this.log(syncExecution, 'error', `Erreur import enregistrement: ${error.message}`);
                }
            }
            
            // Pause entre les batches
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.log(syncExecution, 'info', 
            `Import terminé: ${results.imported} créés, ${results.updated} mis à jour, ${results.conflicts} conflits`);
        
        return results;
    }
    
    /**
     * Exécution d'un export (FormEase -> Externe)
     */
    async executeExport(syncExecution, job) {
        this.log(syncExecution, 'info', 'Début de l\'export vers le système externe');
        
        // Récupérer les données locales
        const localData = await this.fetchLocalData(job);
        this.log(syncExecution, 'info', `${localData.length} enregistrements locaux récupérés`);
        
        const results = {
            exported: 0,
            updated: 0,
            skipped: 0,
            conflicts: 0
        };
        
        // Traitement par batch
        const batches = this.createBatches(localData, job.options.batchSize);
        
        for (const batch of batches) {
            for (const localRecord of batch) {
                try {
                    syncExecution.recordsProcessed++;
                    
                    // Mapper les données
                    const mappedData = await this.mapLocalToExternal(localRecord, job.mapping);
                    
                    // Vérifier les conflits
                    const conflict = await this.detectConflict(mappedData, 'export');
                    
                    if (conflict) {
                        const resolution = await this.resolveConflict(
                            mappedData,
                            conflict.remoteData, 
                            conflict, 
                            job.options.conflictStrategy
                        );
                        
                        syncExecution.conflictsDetected++;
                        this.metrics.conflictsDetected++;
                        
                        if (resolution.resolution === 'manual') {
                            this.log(syncExecution, 'warning', `Conflit manuel pour ${mappedData.id}`);
                            results.conflicts++;
                            continue;
                        }
                        
                        mappedData = resolution.data;
                        syncExecution.conflictsResolved++;
                        this.metrics.conflictsResolved++;
                    }
                    
                    // Sauvegarder à distance
                    const saved = await this.saveToExternal(mappedData, conflict ? 'update' : 'create', job.integrationId);
                    
                    if (saved) {
                        syncExecution.recordsSuccessful++;
                        if (conflict) {
                            results.updated++;
                        } else {
                            results.exported++;
                        }
                    }
                    
                } catch (error) {
                    syncExecution.recordsFailed++;
                    syncExecution.errors.push({
                        record: localRecord,
                        error: error.message,
                        timestamp: new Date()
                    });
                    
                    this.log(syncExecution, 'error', `Erreur export enregistrement: ${error.message}`);
                }
            }
            
            // Pause entre les batches
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.log(syncExecution, 'info', 
            `Export terminé: ${results.exported} créés, ${results.updated} mis à jour, ${results.conflicts} conflits`);
        
        return results;
    }
    
    /**
     * Exécution d'une synchronisation bidirectionnelle
     */
    async executeBidirectionalSync(syncExecution, job) {
        this.log(syncExecution, 'info', 'Début de la synchronisation bidirectionnelle');
        
        // Exécuter l'import puis l'export
        const importResults = await this.executeImport(syncExecution, job);
        const exportResults = await this.executeExport(syncExecution, job);
        
        return {
            import: importResults,
            export: exportResults,
            total: {
                processed: importResults.imported + importResults.updated + exportResults.exported + exportResults.updated,
                conflicts: importResults.conflicts + exportResults.conflicts
            }
        };
    }
    
    /**
     * Récupération des données externes
     */
    async fetchExternalData(job) {
        // Simulation de récupération via l'IntegrationManager
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        // Données simulées
        const mockData = [];
        for (let i = 0; i < 50; i++) {
            mockData.push({
                id: `ext_${Date.now()}_${i}`,
                first_name: `Prénom${i}`,
                last_name: `Nom${i}`,
                email: `user${i}@external.com`,
                updated_at: new Date(Date.now() - Math.random() * 86400000).toISOString()
            });
        }
        
        return mockData;
    }
    
    /**
     * Récupération des données locales
     */
    async fetchLocalData(job) {
        // Simulation de récupération depuis FormEase
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        
        // Données simulées
        const mockData = [];
        for (let i = 0; i < 30; i++) {
            mockData.push({
                id: `local_${Date.now()}_${i}`,
                firstName: `LocalPrénom${i}`,
                lastName: `LocalNom${i}`,
                email: `local${i}@formease.com`,
                modified: new Date(Date.now() - Math.random() * 43200000).toISOString()
            });
        }
        
        return mockData;
    }
    
    /**
     * Mapping externe vers local
     */
    async mapExternalToLocal(externalData, mappingConfig) {
        // Utiliser le DataMapper si disponible
        if (window.dataMapper && mappingConfig) {
            return await window.dataMapper.mapData(mappingConfig, externalData);
        }
        
        // Mapping simple par défaut
        return {
            id: externalData.id,
            firstName: externalData.first_name,
            lastName: externalData.last_name,
            email: externalData.email,
            modified: externalData.updated_at || new Date().toISOString()
        };
    }
    
    /**
     * Mapping local vers externe
     */
    async mapLocalToExternal(localData, mappingConfig) {
        // Utiliser le DataMapper si disponible
        if (window.dataMapper && mappingConfig) {
            return await window.dataMapper.mapData(mappingConfig, localData);
        }
        
        // Mapping simple par défaut
        return {
            id: localData.id,
            first_name: localData.firstName,
            last_name: localData.lastName,
            email: localData.email,
            updated_at: localData.modified || new Date().toISOString()
        };
    }
    
    /**
     * Détection de conflits
     */
    async detectConflict(data, direction) {
        // Simulation de détection de conflit
        if (!this.config.conflictDetection) {
            return null;
        }
        
        const conflictProbability = 0.1; // 10% de chance de conflit
        if (Math.random() > conflictProbability) {
            return null;
        }
        
        // Simuler un conflit
        const conflictType = Object.values(this.conflictTypes)[
            Math.floor(Math.random() * Object.values(this.conflictTypes).length)
        ];
        
        return {
            type: conflictType,
            description: `Conflit détecté: ${conflictType}`,
            localData: direction === 'import' ? { ...data, modified: new Date(Date.now() - 3600000) } : data,
            remoteData: direction === 'export' ? { ...data, updated_at: new Date(Date.now() - 1800000) } : data,
            timestamp: new Date()
        };
    }
    
    /**
     * Résolution de conflit
     */
    async resolveConflict(localData, remoteData, conflictInfo, strategyId) {
        const strategy = this.conflictStrategies.get(strategyId);
        if (!strategy) {
            throw new Error(`Stratégie de conflit ${strategyId} introuvable`);
        }
        
        const resolution = await strategy.resolve(localData, remoteData, conflictInfo);
        
        this.log(null, 'info', `Conflit résolu avec stratégie ${strategyId}: ${resolution.reason}`);
        
        return resolution;
    }
    
    /**
     * Sauvegarde locale
     */
    async saveToLocal(data, operation) {
        // Simulation de sauvegarde locale
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        
        console.log(`💾 Sauvegarde locale (${operation}):`, data.id || data.email);
        return true;
    }
    
    /**
     * Sauvegarde externe
     */
    async saveToExternal(data, operation, integrationId) {
        // Simulation de sauvegarde externe via APIConnector
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        
        console.log(`🌐 Sauvegarde externe (${operation}) via ${integrationId}:`, data.id || data.email);
        return true;
    }
    
    /**
     * Création de batches
     */
    createBatches(data, batchSize) {
        const batches = [];
        for (let i = 0; i < data.length; i += batchSize) {
            batches.push(data.slice(i, i + batchSize));
        }
        return batches;
    }
    
    /**
     * Calcul de la prochaine synchronisation
     */
    calculateNextSync(schedule) {
        const now = new Date();
        
        switch (schedule.type) {
            case 'interval':
                return new Date(now.getTime() + schedule.interval);
                
            case 'cron':
                // Simulation d'un parser cron simple
                return new Date(now.getTime() + 3600000); // 1 heure
                
            case 'daily':
                const nextDay = new Date(now);
                nextDay.setDate(nextDay.getDate() + 1);
                nextDay.setHours(schedule.hour || 0, schedule.minute || 0, 0, 0);
                return nextDay;
                
            case 'weekly':
                const nextWeek = new Date(now);
                nextWeek.setDate(nextWeek.getDate() + 7);
                return nextWeek;
                
            default:
                return new Date(now.getTime() + 3600000); // 1 heure par défaut
        }
    }
    
    /**
     * Programmation d'une synchronisation
     */
    scheduleSync(job) {
        if (!job.nextSync) return;
        
        const delay = job.nextSync.getTime() - Date.now();
        if (delay <= 0) return;
        
        setTimeout(() => {
            this.executeSync(job.id).catch(error => {
                console.error(`❌ Erreur sync programmée ${job.id}:`, error.message);
            });
        }, delay);
        
        console.log(`⏰ Sync programmée pour ${job.name} à ${job.nextSync}`);
    }
    
    /**
     * Programmation d'un retry
     */
    async scheduleRetry(jobId, error, attempt) {
        if (attempt >= this.config.maxRetries) {
            console.error(`❌ Abandon retry pour ${jobId} après ${attempt} tentatives`);
            return;
        }
        
        const delay = this.config.retryDelay * Math.pow(2, attempt); // Backoff exponentiel
        
        setTimeout(() => {
            this.executeSync(jobId, { isRetry: true, attempt: attempt + 1 }).catch(retryError => {
                console.error(`❌ Retry ${attempt + 1} échoué pour ${jobId}:`, retryError.message);
            });
        }, delay);
        
        console.log(`🔄 Retry programmé pour ${jobId} dans ${delay}ms (tentative ${attempt + 1})`);
    }
    
    /**
     * Attente d'un slot disponible
     */
    async waitForAvailableSlot() {
        return new Promise(resolve => {
            const checkSlot = () => {
                if (this.activeSyncs.size < this.config.maxConcurrentSyncs) {
                    resolve();
                } else {
                    setTimeout(checkSlot, 1000);
                }
            };
            checkSlot();
        });
    }
    
    /**
     * Démarrage du processeur de synchronisation
     */
    startSyncProcessor() {
        // Processeur de queue principal
        setInterval(() => {
            this.processSyncQueue();
        }, this.config.syncInterval);
        
        // Processeur de synchronisation temps réel
        if (this.config.realTimeSync) {
            this.startRealtimeProcessor();
        }
        
        console.log('🔄 Processeur de synchronisation démarré');
    }
    
    /**
     * Traitement de la queue de synchronisation
     */
    async processSyncQueue() {
        if (this.syncQueue.length === 0) return;
        
        // Trier par priorité
        this.syncQueue.sort((a, b) => a.priority - b.priority);
        
        const availableSlots = this.config.maxConcurrentSyncs - this.activeSyncs.size;
        const toProcess = this.syncQueue.splice(0, availableSlots);
        
        for (const queueItem of toProcess) {
            try {
                await this.executeSync(queueItem.jobId, queueItem.options);
            } catch (error) {
                console.error(`❌ Erreur traitement queue ${queueItem.jobId}:`, error.message);
            }
        }
    }
    
    /**
     * Démarrage du processeur temps réel
     */
    startRealtimeProcessor() {
        // Simulation d'événements temps réel
        setInterval(() => {
            this.processRealtimeEvents();
        }, 5000);
    }
    
    /**
     * Traitement des événements temps réel
     */
    async processRealtimeEvents() {
        // Simulation d'événements de données changeantes
        const realtimeJobs = Array.from(this.syncJobs.values())
            .filter(job => job.type === this.syncTypes.realtime);
        
        for (const job of realtimeJobs) {
            // Vérifier s'il y a des changements à synchroniser
            if (Math.random() < 0.1) { // 10% de chance d'événement
                this.addToQueue(job.id, { priority: this.priorities.high, realtime: true });
            }
        }
    }
    
    /**
     * Ajout à la queue de synchronisation
     */
    addToQueue(jobId, options = {}) {
        const job = this.syncJobs.get(jobId);
        if (!job) return;
        
        const queueItem = {
            jobId: jobId,
            priority: options.priority || job.options.priority,
            addedAt: new Date(),
            options: options
        };
        
        this.syncQueue.push(queueItem);
        console.log(`📥 Job ${jobId} ajouté à la queue (priorité ${queueItem.priority})`);
    }
    
    /**
     * Configuration des gestionnaires d'événements
     */
    setupEventHandlers() {
        // Événement de changement de données
        this.on('dataChanged', async (data) => {
            const realtimeJobs = Array.from(this.syncJobs.values())
                .filter(job => job.type === this.syncTypes.realtime);
            
            for (const job of realtimeJobs) {
                this.addToQueue(job.id, { priority: this.priorities.high, triggerData: data });
            }
        });
        
        // Événement de webhook
        this.on('webhookReceived', async (webhookData) => {
            const webhookJobs = Array.from(this.syncJobs.values())
                .filter(job => job.type === this.syncTypes.webhook);
            
            for (const job of webhookJobs) {
                this.addToQueue(job.id, { priority: this.priorities.critical, webhookData: webhookData });
            }
        });
    }
    
    /**
     * Gestion d'événements
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    
    emit(event, data) {
        const handlers = this.eventHandlers.get(event) || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Erreur handler événement ${event}:`, error);
            }
        });
    }
    
    /**
     * Logging d'exécution
     */
    log(syncExecution, level, message) {
        const logEntry = {
            timestamp: new Date(),
            level: level,
            message: message,
            syncId: syncExecution?.id
        };
        
        if (syncExecution) {
            syncExecution.logs.push(logEntry);
        }
        
        console.log(`[${level.toUpperCase()}] Sync ${syncExecution?.id || 'SYSTEM'}: ${message}`);
    }
    
    /**
     * Mise à jour des métriques de job
     */
    updateSyncMetrics(job, syncExecution, executionTime, success) {
        if (success) {
            job.metrics.successfulRuns++;
            job.metrics.averageRunTime = Math.round(
                (job.metrics.averageRunTime + executionTime) / 2
            );
        } else {
            job.metrics.failedRuns++;
        }
        
        job.metrics.recordsProcessed += syncExecution.recordsProcessed;
        job.metrics.conflictsDetected += syncExecution.conflictsDetected;
    }
    
    /**
     * Mise à jour des métriques globales
     */
    updateGlobalMetrics(executionTime, success) {
        if (success) {
            this.metrics.successfulSyncs++;
            this.metrics.averageProcessingTime = Math.round(
                (this.metrics.averageProcessingTime + executionTime) / 2
            );
        } else {
            this.metrics.failedSyncs++;
        }
        
        this.metrics.lastSyncTime = new Date();
    }
    
    /**
     * Ajout à l'historique
     */
    addToHistory(syncExecution) {
        this.syncHistory.unshift(syncExecution);
        
        // Limiter la taille de l'historique
        if (this.syncHistory.length > this.config.historyRetention) {
            this.syncHistory = this.syncHistory.slice(0, this.config.historyRetention);
        }
    }
    
    /**
     * Chargement des jobs sauvegardés
     */
    loadSyncJobs() {
        try {
            const saved = localStorage.getItem('formease-sync-jobs');
            if (saved) {
                const jobs = JSON.parse(saved);
                jobs.forEach(job => {
                    this.syncJobs.set(job.id, job);
                    if (job.schedule && job.type === this.syncTypes.batch) {
                        this.scheduleSync(job);
                    }
                });
                console.log(`💾 ${jobs.length} job(s) de synchronisation chargé(s)`);
            }
        } catch (error) {
            console.error('Erreur chargement jobs sync :', error);
        }
    }
    
    /**
     * Sauvegarde des jobs
     */
    saveSyncJobs() {
        try {
            const jobs = Array.from(this.syncJobs.values());
            localStorage.setItem('formease-sync-jobs', JSON.stringify(jobs));
        } catch (error) {
            console.error('Erreur sauvegarde jobs sync :', error);
        }
    }
    
    /**
     * Pause d'un job de synchronisation
     */
    pauseJob(jobId) {
        const job = this.syncJobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} introuvable`);
        }
        
        job.status = this.syncStatus.paused;
        console.log(`⏸️ Job ${job.name} mis en pause`);
    }
    
    /**
     * Reprise d'un job de synchronisation
     */
    resumeJob(jobId) {
        const job = this.syncJobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} introuvable`);
        }
        
        job.status = this.syncStatus.pending;
        if (job.schedule) {
            job.nextSync = this.calculateNextSync(job.schedule);
            this.scheduleSync(job);
        }
        
        console.log(`▶️ Job ${job.name} repris`);
    }
    
    /**
     * Obtention des jobs de synchronisation
     */
    getSyncJobs() {
        return Array.from(this.syncJobs.values());
    }
    
    /**
     * Obtention des synchronisations actives
     */
    getActiveSyncs() {
        return Array.from(this.activeSyncs.values());
    }
    
    /**
     * Obtention de l'historique
     */
    getSyncHistory(limit = 50) {
        return this.syncHistory.slice(0, limit);
    }
    
    /**
     * Obtention des métriques globales
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Suppression d'un job
     */
    deleteJob(jobId) {
        const job = this.syncJobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} introuvable`);
        }
        
        this.syncJobs.delete(jobId);
        this.saveSyncJobs();
        
        console.log(`🗑️ Job ${job.name} supprimé`);
    }
    
    /**
     * Test de synchronisation
     */
    async testSync(jobId) {
        const job = this.syncJobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} introuvable`);
        }
        
        try {
            const result = await this.executeSync(jobId, { test: true });
            
            return {
                success: true,
                result: result,
                message: 'Test de synchronisation réussi'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Test de synchronisation échoué'
            };
        }
    }
}

// Export pour compatibilité navigateur
window.SyncEngine = SyncEngine;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.syncEngine) {
        window.syncEngine = new SyncEngine();
        console.log('⚡ SyncEngine initialisé globalement');
    }
});

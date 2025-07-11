/**
 * 💾 CacheSystem.js - FormEase Sprint 4 Phase 3
 * 
 * Système de cache intelligent et adaptatif
 * Système de cache enterprise-grade pour FormEase
 * 
 * Fonctionnalités :
 * - Cache multi-niveaux (L1, L2, L3)
 * - Stratégies d'éviction intelligentes
 * - Cache distribué avec synchronisation
 * - Compression et optimisation automatique
 * - Cache prédictif basé sur l'IA
 * - Invalidation selective et batch
 * - Métriques et analytics avancés
 * - Persistence et récupération
 * 
 * @version 4.0.0
 * @author FormEase Cache Team
 * @since Sprint 4 Phase 3
 */

class CacheSystem {
    constructor() {
        this.caches = new Map();
        this.strategies = new Map();
        this.metrics = new Map();
        this.policies = new Map();
        this.storage = new Map();
        this.watchers = new Map();
        this.predictors = new Map();
        
        this.config = {
            levels: {
                l1: {
                    name: 'Memory Cache',
                    type: 'memory',
                    maxSize: 50 * 1024 * 1024, // 50MB
                    maxEntries: 10000,
                    ttl: 5 * 60 * 1000, // 5 minutes
                    compression: false,
                    encryption: false
                },
                l2: {
                    name: 'Storage Cache',
                    type: 'localstorage',
                    maxSize: 100 * 1024 * 1024, // 100MB
                    maxEntries: 50000,
                    ttl: 60 * 60 * 1000, // 1 heure
                    compression: true,
                    encryption: true
                },
                l3: {
                    name: 'IndexedDB Cache',
                    type: 'indexeddb',
                    maxSize: 500 * 1024 * 1024, // 500MB
                    maxEntries: 100000,
                    ttl: 24 * 60 * 60 * 1000, // 24 heures
                    compression: true,
                    encryption: true
                }
            },
            strategies: {
                default: 'lru',
                fallback: 'fifo',
                eviction: 'adaptive',
                prefetch: 'predictive',
                compression: 'smart',
                invalidation: 'selective'
            },
            monitoring: {
                enabled: true,
                interval: 30000, // 30 secondes
                analytics: true,
                alerts: true
            },
            performance: {
                batchSize: 100,
                compressionThreshold: 1024, // 1KB
                encryptionThreshold: 10240, // 10KB
                prefetchThreshold: 0.8, // 80% hit rate
                cleanupInterval: 300000 // 5 minutes
            }
        };
        
        this.evictionStrategies = {
            lru: 'least_recently_used',
            lfu: 'least_frequently_used',
            fifo: 'first_in_first_out',
            lifo: 'last_in_first_out',
            ttl: 'time_to_live',
            size: 'size_based',
            adaptive: 'adaptive_strategy'
        };
        
        this.compressionTypes = {
            none: 'no_compression',
            gzip: 'gzip_compression',
            lz4: 'lz4_compression',
            brotli: 'brotli_compression',
            smart: 'smart_compression'
        };
        
        this.cacheTypes = {
            static: 'static_content',
            dynamic: 'dynamic_content',
            api: 'api_responses',
            user: 'user_data',
            system: 'system_data',
            temporary: 'temporary_data'
        };
        
        this.invalidationMethods = {
            manual: 'manual_invalidation',
            automatic: 'automatic_invalidation',
            selective: 'selective_invalidation',
            batch: 'batch_invalidation',
            cascade: 'cascade_invalidation'
        };
        
        this.globalStats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            compressions: 0,
            decompressions: 0,
            encryptions: 0,
            decryptions: 0
        };
        
        this.init();
    }
    
    /**
     * Initialisation du système de cache
     */
    init() {
        this.initializeCacheLevels();
        this.setupEvictionStrategies();
        this.initializeCompression();
        this.setupEncryption();
        this.initializePredictiveCache();
        this.setupSynchronization();
        this.startMonitoring();
        this.initializePersistence();
        this.setupCleanupTasks();
        console.log('💾 CacheSystem v4.0 initialisé - Mode ENTERPRISE');
    }
    
    /**
     * Initialisation des niveaux de cache
     */
    initializeCacheLevels() {
        // Cache L1 - Mémoire (le plus rapide)
        this.caches.set('l1', {
            id: 'l1',
            name: this.config.levels.l1.name,
            type: this.config.levels.l1.type,
            config: this.config.levels.l1,
            storage: new Map(),
            index: new Map(), // Index pour l'accès rapide
            accessOrder: [], // Pour LRU
            accessCount: new Map(), // Pour LFU
            size: 0,
            entries: 0,
            metrics: {
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0,
                evictions: 0,
                hitRate: 0,
                avgAccessTime: 0
            }
        });
        
        // Cache L2 - LocalStorage (persistant, taille moyenne)
        this.caches.set('l2', {
            id: 'l2',
            name: this.config.levels.l2.name,
            type: this.config.levels.l2.type,
            config: this.config.levels.l2,
            storage: new Map(),
            index: new Map(),
            accessOrder: [],
            accessCount: new Map(),
            size: 0,
            entries: 0,
            metrics: {
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0,
                evictions: 0,
                hitRate: 0,
                avgAccessTime: 0
            }
        });
        
        // Cache L3 - IndexedDB (persistant, grande taille)
        this.caches.set('l3', {
            id: 'l3',
            name: this.config.levels.l3.name,
            type: this.config.levels.l3.type,
            config: this.config.levels.l3,
            storage: new Map(),
            index: new Map(),
            accessOrder: [],
            accessCount: new Map(),
            size: 0,
            entries: 0,
            metrics: {
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0,
                evictions: 0,
                hitRate: 0,
                avgAccessTime: 0
            }
        });
        
        console.log('📚 Niveaux de cache initialisés:', this.caches.size);
    }
    
    /**
     * Configuration des stratégies d'éviction
     */
    setupEvictionStrategies() {
        // Stratégie LRU (Least Recently Used)
        this.strategies.set('lru', {
            id: 'lru',
            name: 'Least Recently Used',
            selectForEviction: (cache, count = 1) => {
                const entries = cache.accessOrder.slice(0, count);
                return entries.map(key => ({ key, entry: cache.storage.get(key) }));
            },
            onAccess: (cache, key) => {
                // Déplacer à la fin (plus récent)
                const index = cache.accessOrder.indexOf(key);
                if (index > -1) {
                    cache.accessOrder.splice(index, 1);
                }
                cache.accessOrder.push(key);
            },
            onAdd: (cache, key) => {
                cache.accessOrder.push(key);
            },
            onRemove: (cache, key) => {
                const index = cache.accessOrder.indexOf(key);
                if (index > -1) {
                    cache.accessOrder.splice(index, 1);
                }
            }
        });
        
        // Stratégie LFU (Least Frequently Used)
        this.strategies.set('lfu', {
            id: 'lfu',
            name: 'Least Frequently Used',
            selectForEviction: (cache, count = 1) => {
                const entries = Array.from(cache.accessCount.entries())
                    .sort((a, b) => a[1] - b[1])
                    .slice(0, count);
                return entries.map(([key]) => ({ key, entry: cache.storage.get(key) }));
            },
            onAccess: (cache, key) => {
                const currentCount = cache.accessCount.get(key) || 0;
                cache.accessCount.set(key, currentCount + 1);
            },
            onAdd: (cache, key) => {
                cache.accessCount.set(key, 1);
            },
            onRemove: (cache, key) => {
                cache.accessCount.delete(key);
            }
        });
        
        // Stratégie FIFO (First In, First Out)
        this.strategies.set('fifo', {
            id: 'fifo',
            name: 'First In First Out',
            selectForEviction: (cache, count = 1) => {
                const entries = cache.accessOrder.slice(0, count);
                return entries.map(key => ({ key, entry: cache.storage.get(key) }));
            },
            onAccess: (cache, key) => {
                // FIFO ne change pas l'ordre sur l'accès
            },
            onAdd: (cache, key) => {
                cache.accessOrder.push(key);
            },
            onRemove: (cache, key) => {
                const index = cache.accessOrder.indexOf(key);
                if (index > -1) {
                    cache.accessOrder.splice(index, 1);
                }
            }
        });
        
        // Stratégie TTL (Time To Live)
        this.strategies.set('ttl', {
            id: 'ttl',
            name: 'Time To Live',
            selectForEviction: (cache, count = 1) => {
                const now = Date.now();
                const expiredEntries = [];
                
                for (const [key, entry] of cache.storage.entries()) {
                    if (entry.expires && entry.expires < now) {
                        expiredEntries.push({ key, entry });
                        if (expiredEntries.length >= count) break;
                    }
                }
                
                return expiredEntries;
            },
            onAccess: (cache, key) => {
                // TTL ne change pas sur l'accès
            },
            onAdd: (cache, key) => {
                // TTL géré au niveau de l'entrée
            },
            onRemove: (cache, key) => {
                // Pas de nettoyage spécial nécessaire
            }
        });
        
        // Stratégie adaptative
        this.strategies.set('adaptive', {
            id: 'adaptive',
            name: 'Adaptive Strategy',
            selectForEviction: (cache, count = 1) => {
                // Combiner plusieurs stratégies selon les métriques
                const hitRate = cache.metrics.hitRate;
                
                if (hitRate > 0.8) {
                    // Bon taux de hit, utiliser LRU
                    return this.strategies.get('lru').selectForEviction(cache, count);
                } else if (hitRate > 0.5) {
                    // Taux moyen, utiliser LFU
                    return this.strategies.get('lfu').selectForEviction(cache, count);
                } else {
                    // Faible taux, nettoyer les expirées d'abord
                    const expiredEntries = this.strategies.get('ttl').selectForEviction(cache, count);
                    if (expiredEntries.length >= count) {
                        return expiredEntries;
                    }
                    // Compléter avec FIFO
                    const remainingCount = count - expiredEntries.length;
                    const fifoEntries = this.strategies.get('fifo').selectForEviction(cache, remainingCount);
                    return [...expiredEntries, ...fifoEntries];
                }
            },
            onAccess: (cache, key) => {
                // Appliquer toutes les stratégies
                this.strategies.get('lru').onAccess(cache, key);
                this.strategies.get('lfu').onAccess(cache, key);
            },
            onAdd: (cache, key) => {
                this.strategies.get('lru').onAdd(cache, key);
                this.strategies.get('lfu').onAdd(cache, key);
                this.strategies.get('fifo').onAdd(cache, key);
            },
            onRemove: (cache, key) => {
                this.strategies.get('lru').onRemove(cache, key);
                this.strategies.get('lfu').onRemove(cache, key);
                this.strategies.get('fifo').onRemove(cache, key);
            }
        });
        
        console.log('🧠 Stratégies d\'éviction configurées:', this.strategies.size);
    }
    
    /**
     * Initialisation de la compression
     */
    initializeCompression() {
        this.compressionEngine = {
            algorithms: {
                gzip: { enabled: true, ratio: 0.7, speed: 'medium' },
                lz4: { enabled: true, ratio: 0.6, speed: 'fast' },
                brotli: { enabled: true, ratio: 0.8, speed: 'slow' }
            },
            
            async compress(data, algorithm = 'smart') {
                try {
                    if (typeof data !== 'string') {
                        data = JSON.stringify(data);
                    }
                    
                    const originalSize = new Blob([data]).size;
                    
                    // Seuil minimum pour la compression
                    if (originalSize < this.config.performance.compressionThreshold) {
                        return {
                            compressed: false,
                            data: data,
                            originalSize,
                            compressedSize: originalSize,
                            algorithm: 'none',
                            ratio: 1
                        };
                    }
                    
                    // Sélection automatique d'algorithme
                    if (algorithm === 'smart') {
                        algorithm = this.selectCompressionAlgorithm(originalSize, data);
                    }
                    
                    // Simulation de compression (en production, utiliser une vraie librairie)
                    const compressionRatio = this.algorithms[algorithm]?.ratio || 0.7;
                    const compressedSize = Math.floor(originalSize * compressionRatio);
                    
                    // Encoder en base64 pour la simulation
                    const compressedData = btoa(data).substring(0, Math.floor(btoa(data).length * compressionRatio));
                    
                    this.globalStats.compressions++;
                    
                    return {
                        compressed: true,
                        data: compressedData,
                        originalSize,
                        compressedSize,
                        algorithm,
                        ratio: compressionRatio,
                        timestamp: new Date()
                    };
                    
                } catch (error) {
                    console.error('Erreur compression:', error);
                    return {
                        compressed: false,
                        data: data,
                        originalSize: new Blob([data]).size,
                        compressedSize: new Blob([data]).size,
                        algorithm: 'none',
                        ratio: 1,
                        error: error.message
                    };
                }
            },
            
            async decompress(compressedData) {
                try {
                    if (!compressedData.compressed) {
                        return compressedData.data;
                    }
                    
                    // Simulation de décompression
                    const decompressedData = atob(compressedData.data);
                    
                    this.globalStats.decompressions++;
                    
                    // Essayer de parser en JSON
                    try {
                        return JSON.parse(decompressedData);
                    } catch {
                        return decompressedData;
                    }
                    
                } catch (error) {
                    console.error('Erreur décompression:', error);
                    return compressedData.data;
                }
            },
            
            selectCompressionAlgorithm(size, data) {
                // Sélection basée sur la taille et le type de données
                if (size > 1024 * 1024) { // > 1MB
                    return 'brotli'; // Meilleur ratio pour gros fichiers
                } else if (size > 10240) { // > 10KB
                    return 'gzip'; // Bon compromis
                } else {
                    return 'lz4'; // Rapide pour petits fichiers
                }
            }
        };
        
        console.log('🗜️ Moteur de compression initialisé');
    }
    
    /**
     * Configuration du chiffrement
     */
    setupEncryption() {
        this.encryptionEngine = {
            enabled: true,
            algorithm: 'AES-GCM',
            keySize: 256,
            
            async encrypt(data, level = 'standard') {
                try {
                    if (!this.enabled) {
                        return { encrypted: false, data: data };
                    }
                    
                    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
                    const dataSize = new Blob([dataString]).size;
                    
                    // Seuil minimum pour le chiffrement
                    if (dataSize < this.config.performance.encryptionThreshold) {
                        return { encrypted: false, data: data };
                    }
                    
                    // Simulation de chiffrement (en production, utiliser WebCrypto API)
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    const encryptedData = btoa(dataString + iv.join(','));
                    
                    this.globalStats.encryptions++;
                    
                    return {
                        encrypted: true,
                        data: encryptedData,
                        algorithm: this.algorithm,
                        level: level,
                        iv: Array.from(iv),
                        timestamp: new Date()
                    };
                    
                } catch (error) {
                    console.error('Erreur chiffrement:', error);
                    return { encrypted: false, data: data, error: error.message };
                }
            },
            
            async decrypt(encryptedData) {
                try {
                    if (!encryptedData.encrypted) {
                        return encryptedData.data;
                    }
                    
                    // Simulation de déchiffrement
                    const decryptedString = atob(encryptedData.data);
                    const ivStart = decryptedString.lastIndexOf(',');
                    const originalData = decryptedString.substring(0, ivStart);
                    
                    this.globalStats.decryptions++;
                    
                    // Essayer de parser en JSON
                    try {
                        return JSON.parse(originalData);
                    } catch {
                        return originalData;
                    }
                    
                } catch (error) {
                    console.error('Erreur déchiffrement:', error);
                    return encryptedData.data;
                }
            }
        };
        
        console.log('🔐 Moteur de chiffrement configuré');
    }
    
    /**
     * Initialisation du cache prédictif
     */
    initializePredictiveCache() {
        this.predictor = {
            enabled: true,
            models: new Map(),
            patterns: new Map(),
            predictions: new Map(),
            
            // Analyser les patterns d'accès
            analyzeAccessPatterns() {
                const patterns = {
                    temporal: new Map(), // Patterns temporels
                    sequential: new Map(), // Accès séquentiels
                    associative: new Map(), // Données souvent accédées ensemble
                    user: new Map() // Patterns par utilisateur
                };
                
                // Analyser les accès récents
                for (const [cacheId, cache] of this.caches.entries()) {
                    for (const [key, entry] of cache.storage.entries()) {
                        if (entry.accessHistory) {
                            this.analyzeTemporalPattern(key, entry.accessHistory, patterns.temporal);
                            this.analyzeSequentialPattern(key, entry.accessHistory, patterns.sequential);
                        }
                    }
                }
                
                this.patterns = patterns;
                return patterns;
            },
            
            analyzeTemporalPattern(key, accessHistory, temporalPatterns) {
                // Analyser les patterns horaires/journaliers
                const hourlyAccess = new Array(24).fill(0);
                const dailyAccess = new Array(7).fill(0);
                
                accessHistory.forEach(access => {
                    const date = new Date(access.timestamp);
                    hourlyAccess[date.getHours()]++;
                    dailyAccess[date.getDay()]++;
                });
                
                temporalPatterns.set(key, {
                    hourly: hourlyAccess,
                    daily: dailyAccess,
                    peakHour: hourlyAccess.indexOf(Math.max(...hourlyAccess)),
                    peakDay: dailyAccess.indexOf(Math.max(...dailyAccess))
                });
            },
            
            analyzeSequentialPattern(key, accessHistory, sequentialPatterns) {
                // Détecter les accès séquentiels
                const sequences = [];
                
                for (let i = 1; i < accessHistory.length; i++) {
                    const timeDiff = accessHistory[i].timestamp - accessHistory[i-1].timestamp;
                    if (timeDiff < 60000) { // Moins d'1 minute
                        sequences.push({
                            predecessor: accessHistory[i-1].key,
                            successor: key,
                            timeDiff: timeDiff
                        });
                    }
                }
                
                sequentialPatterns.set(key, sequences);
            },
            
            // Prédire les prochains accès
            async predictNextAccess(currentKey, timeHorizon = 300000) { // 5 minutes
                try {
                    const predictions = [];
                    
                    // Prédiction basée sur les patterns temporels
                    const temporalPrediction = this.predictFromTemporal(currentKey, timeHorizon);
                    if (temporalPrediction) {
                        predictions.push(temporalPrediction);
                    }
                    
                    // Prédiction basée sur les séquences
                    const sequentialPrediction = this.predictFromSequential(currentKey);
                    if (sequentialPrediction) {
                        predictions.push(sequentialPrediction);
                    }
                    
                    // Combiner et scorer les prédictions
                    const scoredPredictions = this.scorePredictions(predictions);
                    
                    return scoredPredictions.filter(p => p.confidence > 0.3); // Seuil minimum
                    
                } catch (error) {
                    console.error('Erreur prédiction:', error);
                    return [];
                }
            },
            
            predictFromTemporal(currentKey, timeHorizon) {
                const pattern = this.patterns.get('temporal')?.get(currentKey);
                if (!pattern) return null;
                
                const now = new Date();
                const currentHour = now.getHours();
                const futureHour = new Date(now.getTime() + timeHorizon).getHours();
                
                const currentAccess = pattern.hourly[currentHour];
                const futureAccess = pattern.hourly[futureHour];
                
                if (futureAccess > currentAccess) {
                    return {
                        key: currentKey,
                        type: 'temporal',
                        confidence: Math.min(0.9, futureAccess / Math.max(currentAccess, 1)),
                        eta: timeHorizon
                    };
                }
                
                return null;
            },
            
            predictFromSequential(currentKey) {
                const sequences = this.patterns.get('sequential')?.get(currentKey);
                if (!sequences || sequences.length === 0) return null;
                
                // Trouver la séquence la plus fréquente
                const sequenceCount = new Map();
                sequences.forEach(seq => {
                    const count = sequenceCount.get(seq.successor) || 0;
                    sequenceCount.set(seq.successor, count + 1);
                });
                
                const mostFrequent = Array.from(sequenceCount.entries())
                    .sort((a, b) => b[1] - a[1])[0];
                
                if (mostFrequent && mostFrequent[1] > 1) {
                    return {
                        key: mostFrequent[0],
                        type: 'sequential',
                        confidence: Math.min(0.9, mostFrequent[1] / sequences.length),
                        eta: sequences.find(s => s.successor === mostFrequent[0])?.timeDiff || 30000
                    };
                }
                
                return null;
            },
            
            scorePredictions(predictions) {
                return predictions
                    .map(pred => ({
                        ...pred,
                        score: pred.confidence * (pred.type === 'sequential' ? 1.2 : 1.0)
                    }))
                    .sort((a, b) => b.score - a.score);
            },
            
            // Précharger les données prédites
            async prefetchPredicted(predictions) {
                for (const prediction of predictions) {
                    if (prediction.confidence > this.config.performance.prefetchThreshold) {
                        try {
                            // Simuler le préchargement
                            await this.simulatePrefetch(prediction.key);
                            
                            console.log(`🔮 Préchargement prédictif: ${prediction.key} (confiance: ${prediction.confidence.toFixed(2)})`);
                        } catch (error) {
                            console.error('Erreur préchargement:', error);
                        }
                    }
                }
            },
            
            async simulatePrefetch(key) {
                // En production, charger réellement les données
                return new Promise(resolve => {
                    setTimeout(() => {
                        console.log(`📦 Données préchargées pour: ${key}`);
                        resolve();
                    }, 100);
                });
            }
        };
        
        console.log('🔮 Cache prédictif initialisé');
    }
    
    /**
     * GET - Récupérer une valeur du cache
     */
    async get(key, options = {}) {
        const startTime = performance.now();
        
        try {
            // Essayer les niveaux de cache dans l'ordre
            for (const [level, cache] of this.caches.entries()) {
                const result = await this.getFromCache(cache, key, options);
                
                if (result.found) {
                    // Enregistrer l'accès
                    this.recordAccess(cache, key, true);
                    
                    // Promouvoir vers les niveaux supérieurs si nécessaire
                    if (level !== 'l1' && options.promote !== false) {
                        await this.promoteToHigherLevel(key, result.data, level);
                    }
                    
                    // Analyser pour les prédictions
                    if (this.predictor.enabled) {
                        const predictions = await this.predictor.predictNextAccess(key);
                        await this.predictor.prefetchPredicted(predictions);
                    }
                    
                    const accessTime = performance.now() - startTime;
                    this.updateAccessMetrics(cache, accessTime);
                    
                    this.globalStats.hits++;
                    
                    return result.data;
                }
                
                this.recordAccess(cache, key, false);
            }
            
            // Aucun niveau n'a la donnée
            this.globalStats.misses++;
            return null;
            
        } catch (error) {
            console.error('Erreur récupération cache:', error);
            this.globalStats.misses++;
            return null;
        }
    }
    
    /**
     * SET - Stocker une valeur dans le cache
     */
    async set(key, value, options = {}) {
        try {
            const {
                ttl = null,
                level = 'l1',
                type = 'dynamic',
                compress = null,
                encrypt = null,
                tags = []
            } = options;
            
            // Créer l'entrée de cache
            const entry = await this.createCacheEntry(key, value, {
                ttl,
                type,
                compress,
                encrypt,
                tags
            });
            
            // Stocker dans le niveau spécifié et les niveaux inférieurs
            const targetCache = this.caches.get(level);
            if (!targetCache) {
                throw new Error(`Niveau de cache ${level} non trouvé`);
            }
            
            await this.setInCache(targetCache, key, entry);
            
            // Stocker également dans les niveaux inférieurs pour la persistence
            if (level === 'l1' && entry.type !== 'temporary') {
                await this.setInCache(this.caches.get('l2'), key, entry);
            }
            if ((level === 'l1' || level === 'l2') && entry.type === 'static') {
                await this.setInCache(this.caches.get('l3'), key, entry);
            }
            
            this.globalStats.sets++;
            
            console.log(`💾 Cache SET: ${key} dans ${level}`);
            return true;
            
        } catch (error) {
            console.error('Erreur stockage cache:', error);
            return false;
        }
    }
    
    /**
     * DELETE - Supprimer une clé du cache
     */
    async delete(key, options = {}) {
        try {
            const { level = 'all', cascade = true } = options;
            
            let deleted = false;
            
            if (level === 'all') {
                // Supprimer de tous les niveaux
                for (const [cacheId, cache] of this.caches.entries()) {
                    if (await this.deleteFromCache(cache, key)) {
                        deleted = true;
                    }
                }
            } else {
                // Supprimer d'un niveau spécifique
                const cache = this.caches.get(level);
                if (cache) {
                    deleted = await this.deleteFromCache(cache, key);
                }
            }
            
            // Suppression en cascade des clés liées
            if (cascade && deleted) {
                await this.cascadeDelete(key);
            }
            
            if (deleted) {
                this.globalStats.deletes++;
                console.log(`🗑️ Cache DELETE: ${key}`);
            }
            
            return deleted;
            
        } catch (error) {
            console.error('Erreur suppression cache:', error);
            return false;
        }
    }
    
    /**
     * CLEAR - Vider le cache
     */
    async clear(options = {}) {
        try {
            const { level = 'all', type = null, olderThan = null } = options;
            
            let clearedCount = 0;
            
            const cachesToClear = level === 'all' 
                ? Array.from(this.caches.values())
                : [this.caches.get(level)].filter(Boolean);
            
            for (const cache of cachesToClear) {
                const keysToDelete = [];
                
                for (const [key, entry] of cache.storage.entries()) {
                    let shouldDelete = true;
                    
                    if (type && entry.type !== type) {
                        shouldDelete = false;
                    }
                    
                    if (olderThan && entry.created > new Date(Date.now() - olderThan)) {
                        shouldDelete = false;
                    }
                    
                    if (shouldDelete) {
                        keysToDelete.push(key);
                    }
                }
                
                for (const key of keysToDelete) {
                    await this.deleteFromCache(cache, key);
                    clearedCount++;
                }
            }
            
            console.log(`🧹 Cache CLEAR: ${clearedCount} entrées supprimées`);
            return clearedCount;
            
        } catch (error) {
            console.error('Erreur nettoyage cache:', error);
            return 0;
        }
    }
    
    /**
     * Création d'une entrée de cache
     */
    async createCacheEntry(key, value, options) {
        const {
            ttl,
            type,
            compress,
            encrypt,
            tags
        } = options;
        
        const now = new Date();
        
        // Compression si nécessaire
        let processedValue = value;
        let compressionInfo = null;
        
        if (compress !== false) {
            const shouldCompress = compress === true || 
                (compress === null && this.shouldCompress(value));
            
            if (shouldCompress) {
                compressionInfo = await this.compressionEngine.compress(value);
                if (compressionInfo.compressed) {
                    processedValue = compressionInfo;
                }
            }
        }
        
        // Chiffrement si nécessaire
        let encryptionInfo = null;
        
        if (encrypt !== false) {
            const shouldEncrypt = encrypt === true ||
                (encrypt === null && this.shouldEncrypt(type, value));
            
            if (shouldEncrypt) {
                encryptionInfo = await this.encryptionEngine.encrypt(processedValue);
                if (encryptionInfo.encrypted) {
                    processedValue = encryptionInfo;
                }
            }
        }
        
        return {
            key,
            value: processedValue,
            type,
            tags: tags || [],
            created: now,
            expires: ttl ? new Date(now.getTime() + ttl) : null,
            lastAccessed: now,
            accessCount: 0,
            size: this.calculateEntrySize(processedValue),
            compressed: !!compressionInfo?.compressed,
            encrypted: !!encryptionInfo?.encrypted,
            compressionInfo,
            encryptionInfo,
            accessHistory: []
        };
    }
    
    /**
     * Récupération depuis un cache spécifique
     */
    async getFromCache(cache, key, options) {
        try {
            const entry = cache.storage.get(key);
            
            if (!entry) {
                return { found: false, data: null };
            }
            
            // Vérifier l'expiration
            if (entry.expires && entry.expires < new Date()) {
                await this.deleteFromCache(cache, key);
                return { found: false, data: null };
            }
            
            // Décompresser si nécessaire
            let value = entry.value;
            
            if (entry.encrypted && entry.encryptionInfo) {
                value = await this.encryptionEngine.decrypt(entry.encryptionInfo);
            }
            
            if (entry.compressed && entry.compressionInfo) {
                value = await this.compressionEngine.decompress(entry.compressionInfo);
            }
            
            // Mettre à jour les métadonnées d'accès
            entry.lastAccessed = new Date();
            entry.accessCount++;
            entry.accessHistory.push({
                timestamp: Date.now(),
                key: key
            });
            
            // Limiter l'historique
            if (entry.accessHistory.length > 100) {
                entry.accessHistory = entry.accessHistory.slice(-50);
            }
            
            // Mettre à jour la stratégie d'éviction
            const strategy = this.strategies.get(this.config.strategies.default);
            if (strategy) {
                strategy.onAccess(cache, key);
            }
            
            return { found: true, data: value };
            
        } catch (error) {
            console.error('Erreur récupération depuis cache:', error);
            return { found: false, data: null };
        }
    }
    
    /**
     * Stockage dans un cache spécifique
     */
    async setInCache(cache, key, entry) {
        try {
            // Vérifier si il faut faire de la place
            const spaceNeeded = entry.size;
            await this.ensureSpace(cache, spaceNeeded);
            
            // Stocker l'entrée
            cache.storage.set(key, entry);
            cache.index.set(key, {
                size: entry.size,
                type: entry.type,
                created: entry.created,
                expires: entry.expires
            });
            
            // Mettre à jour les métriques
            cache.size += entry.size;
            cache.entries++;
            cache.metrics.sets++;
            
            // Notifier la stratégie d'éviction
            const strategy = this.strategies.get(this.config.strategies.default);
            if (strategy) {
                strategy.onAdd(cache, key);
            }
            
            // Persister si nécessaire
            if (cache.type !== 'memory') {
                await this.persistEntry(cache, key, entry);
            }
            
            return true;
            
        } catch (error) {
            console.error('Erreur stockage dans cache:', error);
            return false;
        }
    }
    
    /**
     * Suppression depuis un cache spécifique
     */
    async deleteFromCache(cache, key) {
        try {
            const entry = cache.storage.get(key);
            if (!entry) {
                return false;
            }
            
            // Supprimer l'entrée
            cache.storage.delete(key);
            cache.index.delete(key);
            
            // Mettre à jour les métriques
            cache.size -= entry.size;
            cache.entries--;
            cache.metrics.deletes++;
            
            // Notifier la stratégie d'éviction
            const strategy = this.strategies.get(this.config.strategies.default);
            if (strategy) {
                strategy.onRemove(cache, key);
            }
            
            // Supprimer de la persistence
            if (cache.type !== 'memory') {
                await this.unpersistEntry(cache, key);
            }
            
            return true;
            
        } catch (error) {
            console.error('Erreur suppression depuis cache:', error);
            return false;
        }
    }
    
    /**
     * S'assurer qu'il y a assez d'espace
     */
    async ensureSpace(cache, spaceNeeded) {
        const config = cache.config;
        
        // Vérifier les limites
        while (cache.size + spaceNeeded > config.maxSize || 
               cache.entries >= config.maxEntries) {
            
            const strategy = this.strategies.get(this.config.strategies.eviction);
            const entriesToEvict = strategy.selectForEviction(cache, 1);
            
            if (entriesToEvict.length === 0) {
                throw new Error('Impossible de libérer de l\'espace dans le cache');
            }
            
            for (const { key } of entriesToEvict) {
                await this.deleteFromCache(cache, key);
                cache.metrics.evictions++;
                this.globalStats.evictions++;
            }
        }
    }
    
    /**
     * Démarrage du monitoring
     */
    startMonitoring() {
        if (!this.config.monitoring.enabled) {
            return;
        }
        
        this.monitoringInterval = setInterval(() => {
            this.updateCacheMetrics();
            this.analyzePerformance();
            this.optimizeCache();
        }, this.config.monitoring.interval);
        
        console.log('📊 Monitoring du cache démarré');
    }
    
    /**
     * Mise à jour des métriques
     */
    updateCacheMetrics() {
        for (const [cacheId, cache] of this.caches.entries()) {
            const metrics = cache.metrics;
            
            // Calculer le taux de hit
            const totalRequests = metrics.hits + metrics.misses;
            metrics.hitRate = totalRequests > 0 ? (metrics.hits / totalRequests) * 100 : 0;
            
            // Utilisation
            const utilization = {
                size: (cache.size / cache.config.maxSize) * 100,
                entries: (cache.entries / cache.config.maxEntries) * 100
            };
            
            // Stocker les métriques
            this.metrics.set(cacheId, {
                ...metrics,
                utilization,
                timestamp: new Date()
            });
        }
        
        // Métriques globales
        this.metrics.set('global', {
            ...this.globalStats,
            hitRate: this.globalStats.hits + this.globalStats.misses > 0 ?
                (this.globalStats.hits / (this.globalStats.hits + this.globalStats.misses)) * 100 : 0,
            timestamp: new Date()
        });
    }
    
    /**
     * Fonctions utilitaires
     */
    shouldCompress(value) {
        const size = this.calculateSize(value);
        return size >= this.config.performance.compressionThreshold;
    }
    
    shouldEncrypt(type, value) {
        const sensitiveTypes = ['user', 'confidential', 'personal'];
        const size = this.calculateSize(value);
        
        return sensitiveTypes.includes(type) || 
               size >= this.config.performance.encryptionThreshold;
    }
    
    calculateSize(data) {
        if (typeof data === 'string') {
            return new Blob([data]).size;
        }
        return new Blob([JSON.stringify(data)]).size;
    }
    
    calculateEntrySize(entry) {
        return this.calculateSize(entry);
    }
    
    recordAccess(cache, key, hit) {
        if (hit) {
            cache.metrics.hits++;
        } else {
            cache.metrics.misses++;
        }
    }
    
    updateAccessMetrics(cache, accessTime) {
        const metrics = cache.metrics;
        metrics.avgAccessTime = metrics.avgAccessTime === 0 ?
            accessTime :
            (metrics.avgAccessTime + accessTime) / 2;
    }
    
    /**
     * API publique
     */
    getCacheStats() {
        return {
            global: this.globalStats,
            levels: Object.fromEntries(this.metrics),
            strategies: Array.from(this.strategies.keys()),
            totalSize: Array.from(this.caches.values()).reduce((sum, cache) => sum + cache.size, 0),
            totalEntries: Array.from(this.caches.values()).reduce((sum, cache) => sum + cache.entries, 0)
        };
    }
    
    async invalidateByTag(tag) {
        let invalidated = 0;
        
        for (const [cacheId, cache] of this.caches.entries()) {
            const keysToDelete = [];
            
            for (const [key, entry] of cache.storage.entries()) {
                if (entry.tags && entry.tags.includes(tag)) {
                    keysToDelete.push(key);
                }
            }
            
            for (const key of keysToDelete) {
                await this.deleteFromCache(cache, key);
                invalidated++;
            }
        }
        
        console.log(`🏷️ Invalidation par tag "${tag}": ${invalidated} entrées`);
        return invalidated;
    }
    
    async optimize() {
        console.log('🔧 Optimisation du cache...');
        
        // Nettoyer les entrées expirées
        const expired = await this.clear({ olderThan: 0 });
        
        // Compresser les gros éléments non compressés
        await this.compressLargeEntries();
        
        // Analyser les patterns d'accès
        if (this.predictor.enabled) {
            this.predictor.analyzeAccessPatterns();
        }
        
        console.log(`✅ Optimisation terminée: ${expired} entrées expirées nettoyées`);
    }
    
    getLevel(level) {
        return this.caches.get(level);
    }
    
    async backup() {
        const backup = {
            timestamp: new Date(),
            version: '4.0.0',
            caches: {}
        };
        
        for (const [cacheId, cache] of this.caches.entries()) {
            if (cache.type !== 'memory') {
                backup.caches[cacheId] = {
                    config: cache.config,
                    entries: Array.from(cache.storage.entries())
                };
            }
        }
        
        return backup;
    }
    
    async restore(backup) {
        if (!backup || backup.version !== '4.0.0') {
            throw new Error('Backup incompatible');
        }
        
        let restored = 0;
        
        for (const [cacheId, cacheData] of Object.entries(backup.caches)) {
            const cache = this.caches.get(cacheId);
            if (cache) {
                for (const [key, entry] of cacheData.entries) {
                    await this.setInCache(cache, key, entry);
                    restored++;
                }
            }
        }
        
        console.log(`📥 Restauration: ${restored} entrées restaurées`);
        return restored;
    }
}

// Export pour compatibilité navigateur
window.CacheSystem = CacheSystem;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.cacheSystem) {
        window.cacheSystem = new CacheSystem();
        console.log('💾 CacheSystem initialisé globalement');
    }
});

/**
 * 🚀 SPRINT 2 - DataCache : Cache Intelligent pour FormEase
 * Design System : Tremor Blocks
 * Couleurs : #ffffff (bg), #2563eb (primary)
 * Icônes : Remix Icons
 */

class DataCache {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.config = {
            defaultTTL: 5 * 60 * 1000, // 5 minutes par défaut
            maxCacheSize: 100,
            cleanupInterval: 60 * 1000, // Nettoyage chaque minute
            strategies: {
                forms: 10 * 60 * 1000,      // 10 minutes pour les formulaires
                submissions: 2 * 60 * 1000,  // 2 minutes pour les soumissions
                stats: 30 * 1000,           // 30 secondes pour les stats temps réel
                users: 15 * 60 * 1000       // 15 minutes pour les utilisateurs
            }
        };
        
        // Auto-nettoyage périodique
        this.startCleanupTimer();
        
        // Analytics pour optimisation
        this.analytics = {
            hits: 0,
            misses: 0,
            invalidations: 0,
            memoryUsage: 0
        };
        
        console.log('🚀 DataCache initialisé - Style Tremor');
    }

    /**
     * 🔍 Récupérer une valeur du cache
     * @param {string} key - Clé unique
     * @param {string} category - Catégorie (forms, submissions, stats, users)
     * @returns {*|null} - Valeur cachée ou null si expirée/inexistante
     */
    get(key, category = 'default') {
        const fullKey = `${category}:${key}`;
        
        if (!this.cache.has(fullKey)) {
            this.analytics.misses++;
            return null;
        }

        const timestamp = this.timestamps.get(fullKey);
        const ttl = this.config.strategies[category] || this.config.defaultTTL;
        
        if (Date.now() - timestamp > ttl) {
            // Expirée - nettoyage automatique
            this.delete(fullKey);
            this.analytics.misses++;
            return null;
        }

        this.analytics.hits++;
        const data = this.cache.get(fullKey);
        
        // Log avec style Tremor pour debugging
        console.log(`💾 Cache HIT: ${fullKey}`, {
            age: Math.round((Date.now() - timestamp) / 1000) + 's',
            category,
            size: JSON.stringify(data).length + ' bytes'
        });
        
        return data;
    }

    /**
     * 💾 Stocker une valeur dans le cache
     * @param {string} key - Clé unique
     * @param {*} data - Données à cacher
     * @param {string} category - Catégorie
     * @param {number} customTTL - TTL personnalisé (optionnel)
     */
    set(key, data, category = 'default', customTTL = null) {
        const fullKey = `${category}:${key}`;
        
        // Éviter la surcharge mémoire
        if (this.cache.size >= this.config.maxCacheSize) {
            this.evictOldest();
        }

        this.cache.set(fullKey, data);
        this.timestamps.set(fullKey, Date.now());
        
        // Log avec style Tremor
        console.log(`💾 Cache SET: ${fullKey}`, {
            category,
            ttl: customTTL || this.config.strategies[category] || this.config.defaultTTL,
            size: JSON.stringify(data).length + ' bytes'
        });

        this.updateMemoryUsage();
    }

    /**
     * 🗑️ Supprimer une entrée du cache
     */
    delete(key) {
        this.cache.delete(key);
        this.timestamps.delete(key);
        this.analytics.invalidations++;
        this.updateMemoryUsage();
    }

    /**
     * 🔄 Invalidation intelligente par catégorie
     * @param {string} category - Catégorie à invalider
     * @param {string} pattern - Pattern optionnel (regex)
     */
    invalidateCategory(category, pattern = null) {
        const regex = pattern ? new RegExp(pattern) : null;
        let invalidated = 0;

        for (const [key] of this.cache) {
            if (key.startsWith(`${category}:`)) {
                if (!regex || regex.test(key)) {
                    this.delete(key);
                    invalidated++;
                }
            }
        }

        console.log(`🔄 Invalidation catégorie: ${category}`, {
            invalidated,
            pattern,
            remaining: this.cache.size
        });

        return invalidated;
    }

    /**
     * 📊 Stratégies d'invalidation intelligentes
     */
    invalidateSmartly(action, entityId = null) {
        switch (action) {
            case 'form_created':
            case 'form_updated':
            case 'form_deleted':
                this.invalidateCategory('forms');
                this.invalidateCategory('stats'); // Les stats changent
                break;
                
            case 'submission_created':
                this.invalidateCategory('submissions');
                this.invalidateCategory('stats');
                // Garder les formulaires en cache
                break;
                
            case 'user_updated':
                this.invalidateCategory('users');
                break;
                
            case 'stats_refresh':
                this.invalidateCategory('stats');
                break;
                
            default:
                console.warn(`🤔 Action d'invalidation inconnue: ${action}`);
        }
    }

    /**
     * 🧹 Nettoyage automatique des entrées expirées
     */
    cleanup() {
        let cleaned = 0;
        const now = Date.now();

        for (const [key, timestamp] of this.timestamps) {
            const category = key.split(':')[0];
            const ttl = this.config.strategies[category] || this.config.defaultTTL;
            
            if (now - timestamp > ttl) {
                this.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Nettoyage automatique: ${cleaned} entrées supprimées`);
        }

        this.updateMemoryUsage();
        return cleaned;
    }

    /**
     * ⏰ Timer de nettoyage automatique
     */
    startCleanupTimer() {
        setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
    }

    /**
     * 📈 Mise à jour des métriques mémoire
     */
    updateMemoryUsage() {
        let totalSize = 0;
        for (const [key, data] of this.cache) {
            totalSize += JSON.stringify(data).length;
        }
        this.analytics.memoryUsage = totalSize;
    }

    /**
     * 🔄 Éviction des plus anciennes entrées
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, timestamp] of this.timestamps) {
            if (timestamp < oldestTime) {
                oldestTime = timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.delete(oldestKey);
            console.log(`🗑️ Éviction automatique: ${oldestKey}`);
        }
    }

    /**
     * 📊 Analytics et métriques
     */
    getAnalytics() {
        const hitRate = this.analytics.hits + this.analytics.misses > 0 
            ? (this.analytics.hits / (this.analytics.hits + this.analytics.misses) * 100).toFixed(1)
            : 0;

        return {
            ...this.analytics,
            hitRate: `${hitRate}%`,
            cacheSize: this.cache.size,
            memoryUsageKB: Math.round(this.analytics.memoryUsage / 1024),
            categories: this.getCategoriesStats()
        };
    }

    /**
     * 📋 Statistiques par catégorie
     */
    getCategoriesStats() {
        const stats = {};
        for (const [key] of this.cache) {
            const category = key.split(':')[0];
            stats[category] = (stats[category] || 0) + 1;
        }
        return stats;
    }

    /**
     * 🎨 Affichage formaté style Tremor pour debugging
     */
    logStatus() {
        const analytics = this.getAnalytics();
        
        console.group('📊 DataCache Status - Style Tremor');
        console.log('🎯 Performance:', {
            hitRate: analytics.hitRate,
            hits: analytics.hits,
            misses: analytics.misses
        });
        console.log('💾 Mémoire:', {
            size: analytics.cacheSize + ' entrées',
            memory: analytics.memoryUsageKB + ' KB',
            limit: this.config.maxCacheSize + ' entrées max'
        });
        console.log('📁 Catégories:', analytics.categories);
        console.groupEnd();
    }

    /**
     * 🧪 Mode debug pour développement
     */
    enableDebugMode() {
        this.debugMode = true;
        console.log('🐛 Mode debug activé pour DataCache');
        
        // Override des méthodes pour logging détaillé
        const originalSet = this.set.bind(this);
        this.set = (...args) => {
            console.log('🔵 Cache SET:', args);
            return originalSet(...args);
        };

        const originalGet = this.get.bind(this);
        this.get = (...args) => {
            const result = originalGet(...args);
            console.log('🔍 Cache GET:', args, '→', result ? '✅ HIT' : '❌ MISS');
            return result;
        };
    }

    /**
     * 🧹 Reset complet du cache
     */
    clear() {
        this.cache.clear();
        this.timestamps.clear();
        this.analytics = { hits: 0, misses: 0, invalidations: 0, memoryUsage: 0 };
        console.log('🧹 Cache complètement vidé');
    }
}

// Export pour utilisation globale
window.DataCache = DataCache;

// Instance globale pour l'application
window.formEaseCache = new DataCache();

console.log('🚀 DataCache chargé - Prêt pour optimisation Sprint 2 !');

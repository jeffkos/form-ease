/**
 * 🚀 SPRINT 2 - ApiService Optimisé avec Cache Intelligent
 * Design System : Tremor Blocks
 * Intégration : DataCache + SkeletonLoader
 * Couleurs : #ffffff (bg), #2563eb (primary)
 */

class OptimizedApiService {
    constructor() {
        this.baseURL = 'http://localhost:4000/api';
        this.token = localStorage.getItem('token');
        
        // Intégration du cache intelligent
        this.cache = window.formEaseCache || new DataCache();
        this.skeleton = window.tremorSkeleton || new SkeletonLoader();
        
        // Configuration des performances
        this.config = {
            retryAttempts: 3,
            retryDelay: 1000,
            timeout: 30000,
            debounceDelay: 300
        };
        
        // Tracking des requêtes en cours
        this.pendingRequests = new Map();
        
        // Analytics de performance
        this.analytics = {
            requests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0,
            avgResponseTime: 0,
            lastRequestTime: null
        };
        
        // Initialisation du debouncing
        this.debouncedRequests = new Map();
        
        console.log('🚀 OptimizedApiService initialisé avec cache Tremor');
    }

    /**
     * 🎯 Requête principale avec cache et optimisations
     */
    async request(endpoint, options = {}) {
        const startTime = Date.now();
        this.analytics.requests++;
        
        // Génération de la clé de cache
        const cacheKey = this.generateCacheKey(endpoint, options);
        const category = this.getCacheCategory(endpoint);
        
        // Tentative de récupération depuis le cache
        if (options.method === 'GET' || !options.method) {
            const cachedData = this.cache.get(cacheKey, category);
            if (cachedData) {
                this.analytics.cacheHits++;
                console.log(`💾 Cache HIT: ${endpoint}`);
                return cachedData;
            }
            this.analytics.cacheMisses++;
        }

        // Éviter les requêtes duplicatas
        if (this.pendingRequests.has(cacheKey)) {
            console.log(`⏳ Requête en cours, attente: ${endpoint}`);
            return this.pendingRequests.get(cacheKey);
        }

        // Configuration de la requête
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
                ...options.headers
            },
            timeout: this.config.timeout,
            ...options
        };

        // Exécution de la requête avec retry
        const requestPromise = this.executeWithRetry(url, config, startTime, cacheKey, category);
        
        // Tracking de la requête en cours
        this.pendingRequests.set(cacheKey, requestPromise);
        
        try {
            const result = await requestPromise;
            return result;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    /**
     * 🔄 Exécution avec retry automatique
     */
    async executeWithRetry(url, config, startTime, cacheKey, category) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                // Affichage du skeleton pour la première tentative
                if (attempt === 1) {
                    this.showSkeletonIfNeeded(category);
                }
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);
                
                const response = await fetch(url, {
                    ...config,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    if (response.status === 401) {
                        this.handleAuthError();
                        return;
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // Mise en cache pour les GET
                if (!config.method || config.method === 'GET') {
                    this.cache.set(cacheKey, data, category);
                }
                
                // Invalidation intelligente pour les modifications
                this.handleSmartInvalidation(config.method, url);
                
                // Analytics
                this.updateAnalytics(startTime, true);
                
                // Masquer le skeleton
                this.hideSkeletonIfNeeded();
                
                console.log(`✅ Requête réussie: ${url} (tentative ${attempt})`);
                return data;
                
            } catch (error) {
                lastError = error;
                this.analytics.errors++;
                
                console.warn(`⚠️ Tentative ${attempt}/${this.config.retryAttempts} échouée: ${error.message}`);
                
                if (attempt < this.config.retryAttempts) {
                    await this.delay(this.config.retryDelay * attempt);
                }
            }
        }
        
        // Toutes les tentatives ont échoué
        this.hideSkeletonIfNeeded();
        this.updateAnalytics(startTime, false);
        this.showTremorError(lastError, url);
        throw lastError;
    }

    /**
     * 🔑 Génération de clé de cache intelligente
     */
    generateCacheKey(endpoint, options) {
        const method = options.method || 'GET';
        const params = new URLSearchParams(endpoint.split('?')[1] || '');
        const sortedParams = Array.from(params.entries()).sort();
        
        return `${method}:${endpoint.split('?')[0]}:${JSON.stringify(sortedParams)}`;
    }

    /**
     * 📁 Catégorisation pour le cache
     */
    getCacheCategory(endpoint) {
        if (endpoint.includes('/forms') && !endpoint.includes('/submissions')) {
            return 'forms';
        } else if (endpoint.includes('/submissions')) {
            return 'submissions';
        } else if (endpoint.includes('/stats') || endpoint.includes('/dashboard')) {
            return 'stats';
        } else if (endpoint.includes('/users')) {
            return 'users';
        }
        return 'default';
    }

    /**
     * 🔄 Invalidation intelligente après modifications
     */
    handleSmartInvalidation(method, url) {
        if (!method || method === 'GET') return;
        
        if (url.includes('/forms')) {
            if (method === 'POST') {
                this.cache.invalidateSmartly('form_created');
            } else if (method === 'PUT') {
                this.cache.invalidateSmartly('form_updated');
            } else if (method === 'DELETE') {
                this.cache.invalidateSmartly('form_deleted');
            }
        } else if (url.includes('/submissions')) {
            this.cache.invalidateSmartly('submission_created');
        }
    }

    /**
     * 🎨 Gestion du skeleton Tremor
     */
    showSkeletonIfNeeded(category) {
        const targetElement = this.getSkeletonTarget(category);
        if (targetElement) {
            const skeletonType = this.getSkeletonType(category);
            this.skeleton.applyTo(targetElement, skeletonType);
        }
    }

    hideSkeletonIfNeeded() {
        const skeletonContainers = document.querySelectorAll('.tremor-skeleton-container');
        skeletonContainers.forEach(container => {
            this.skeleton.remove(container, true);
        });
    }

    getSkeletonTarget(category) {
        const targets = {
            'forms': '#forms-list',
            'submissions': '#submissions-list',
            'stats': '#dashboard-stats',
            'default': '#main-content'
        };
        return document.querySelector(targets[category] || targets.default);
    }

    getSkeletonType(category) {
        const types = {
            'forms': 'formList',
            'submissions': 'table',
            'stats': 'dashboard',
            'default': 'formList'
        };
        return types[category] || types.default;
    }

    /**
     * 📊 Méthodes optimisées avec cache
     */
    async getForms(useCache = true) {
        return this.request('/forms', { useCache });
    }

    async getForm(id, useCache = true) {
        return this.request(`/forms/${id}`, { useCache });
    }

    async createForm(formData) {
        const result = await this.request('/forms', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        // Notification style Tremor
        this.showTremorNotification('Formulaire créé avec succès', 'success');
        return result;
    }

    async updateForm(id, formData) {
        const result = await this.request(`/forms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        
        this.showTremorNotification('Formulaire mis à jour', 'success');
        return result;
    }

    async deleteForm(id) {
        const result = await this.request(`/forms/${id}`, {
            method: 'DELETE'
        });
        
        this.showTremorNotification('Formulaire supprimé', 'success');
        return result;
    }

    async duplicateForm(id) {
        const result = await this.request(`/forms/${id}/duplicate`, {
            method: 'POST'
        });
        
        this.showTremorNotification('Formulaire dupliqué', 'success');
        return result;
    }

    /**
     * 🔍 Recherche avec debouncing
     */
    async searchFormsDebounced(query, delay = 300) {
        const searchKey = `search:${query}`;
        
        // Annuler la recherche précédente
        if (this.debouncedRequests.has(searchKey)) {
            clearTimeout(this.debouncedRequests.get(searchKey));
        }
        
        return new Promise((resolve) => {
            const timeoutId = setTimeout(async () => {
                try {
                    const results = await this.request(`/forms/search?q=${encodeURIComponent(query)}`);
                    resolve(results);
                } catch (error) {
                    resolve([]);
                }
                this.debouncedRequests.delete(searchKey);
            }, delay);
            
            this.debouncedRequests.set(searchKey, timeoutId);
        });
    }

    /**
     * 📈 Analytics et métriques
     */
    updateAnalytics(startTime, success) {
        const duration = Date.now() - startTime;
        this.analytics.avgResponseTime = 
            (this.analytics.avgResponseTime + duration) / 2;
        this.analytics.lastRequestTime = Date.now();
        
        if (!success) {
            this.analytics.errors++;
        }
    }

    getPerformanceMetrics() {
        const cacheStats = this.cache.getAnalytics();
        
        return {
            ...this.analytics,
            cacheHitRate: cacheStats.hitRate,
            cacheSize: cacheStats.cacheSize,
            cacheMemoryKB: cacheStats.memoryUsageKB
        };
    }

    /**
     * 🎨 Notifications style Tremor
     */
    showTremorNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-50 text-green-800 border-green-200',
            error: 'bg-red-50 text-red-800 border-red-200',
            warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
            info: 'bg-blue-50 text-blue-800 border-blue-200'
        };

        const icons = {
            success: 'ri-check-line',
            error: 'ri-error-warning-line',
            warning: 'ri-alert-line',
            info: 'ri-information-line'
        };

        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg border ${colors[type]} shadow-lg max-w-sm`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="${icons[type]} mr-2"></i>
                <span class="text-sm font-medium">${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showTremorError(error, url) {
        this.showTremorNotification(
            `Erreur de connexion: ${error.message}`,
            'error'
        );
    }

    /**
     * 🔐 Gestion de l'authentification
     */
    handleAuthError() {
        localStorage.removeItem('token');
        this.showTremorNotification('Session expirée, redirection...', 'warning');
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 2000);
    }

    /**
     * ⏳ Utilitaire de délai
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 🎯 Préchargement intelligent
     */
    async preloadCriticalData() {
        console.log('🚀 Préchargement des données critiques...');
        
        try {
            // Précharger en parallèle
            await Promise.all([
                this.getForms(),
                this.request('/dashboard/stats'),
                this.request('/user/profile')
            ]);
            
            console.log('✅ Données critiques préchargées');
        } catch (error) {
            console.warn('⚠️ Erreur lors du préchargement:', error);
        }
    }

    /**
     * 🧹 Nettoyage des ressources
     */
    cleanup() {
        this.debouncedRequests.forEach(timeoutId => clearTimeout(timeoutId));
        this.debouncedRequests.clear();
        this.pendingRequests.clear();
        console.log('🧹 OptimizedApiService nettoyé');
    }
}

// Export et instance globale
window.OptimizedApiService = OptimizedApiService;
window.optimizedApiService = new OptimizedApiService();

// Préchargement automatique au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.optimizedApiService.preloadCriticalData();
});

console.log('🚀 OptimizedApiService chargé - Performance Tremor activée !');

/**
 * 🔄 STATE SERVICE - GESTION D'ÉTAT GLOBALE
 * 
 * Service de gestion d'état centralisée pour l'application FormEase
 * Permet la communication entre composants et la persistance des données
 */

class StateService {
    constructor() {
        // État global de l'application
        this.state = {
            // Données utilisateur
            user: null,
            isAuthenticated: false,
            
            // Données des formulaires
            forms: [],
            currentForm: null,
            formSubmissions: [],
            
            // Données analytiques
            analytics: {
                overview: {},
                charts: {},
                topForms: [],
                recentActivity: []
            },
            
            // Données des campagnes
            emailCampaigns: [],
            smsCampaigns: [],
            
            // État de l'interface
            loading: false,
            errors: [],
            notifications: [],
            
            // Navigation
            currentPage: null,
            breadcrumb: [],
            
            // Paramètres
            theme: 'light',
            language: 'fr'
        };
        
        // Listeners pour les changements d'état
        this.listeners = {};
        
        // Cache pour les données fréquemment utilisées
        this.cache = new Map();
        this.cacheExpiry = new Map();
        
        this.init();
    }

    /**
     * Initialisation du service
     */
    init() {
        // Charger l'état depuis localStorage si disponible
        this.loadFromStorage();
        
        // Synchroniser avec ApiService si disponible
        this.syncWithAuth();
        
        console.log('🔄 StateService initialisé');
    }

    // ========================
    // GESTION D'ÉTAT PRINCIPAL
    // ========================

    /**
     * Mettre à jour l'état
     * @param {string} key - Clé de l'état à mettre à jour
     * @param {any} value - Nouvelle valeur
     * @param {boolean} notify - Notifier les listeners (défaut: true)
     */
    setState(key, value, notify = true) {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        console.log(`🔄 État mis à jour: ${key}`, value);
        
        // Sauvegarder dans localStorage pour certaines clés
        this.saveToStorage(key, value);
        
        // Notifier les listeners
        if (notify && oldValue !== value) {
            this.notifyListeners(key, value, oldValue);
        }
    }

    /**
     * Récupérer l'état
     * @param {string} key - Clé de l'état (optionnel, retourne tout l'état si non spécifié)
     * @returns {any} - Valeur de l'état
     */
    getState(key = null) {
        if (key) {
            return this.state[key];
        }
        return { ...this.state }; // Retourner une copie pour éviter les mutations
    }

    /**
     * Mettre à jour partiellement un objet dans l'état
     * @param {string} key - Clé de l'objet à mettre à jour
     * @param {object} updates - Propriétés à mettre à jour
     */
    updateState(key, updates) {
        const currentValue = this.state[key];
        
        if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
            this.setState(key, { ...currentValue, ...updates });
        } else {
            console.warn(`⚠️ Impossible de mettre à jour partiellement la clé ${key}: n'est pas un objet`);
        }
    }

    /**
     * Réinitialiser l'état
     * @param {string} key - Clé spécifique à réinitialiser (optionnel)
     */
    resetState(key = null) {
        if (key) {
            delete this.state[key];
            console.log(`🗑️ État réinitialisé: ${key}`);
        } else {
            this.state = {};
            localStorage.removeItem('formease_state');
            console.log('🗑️ État global réinitialisé');
        }
    }

    // ========================
    // SYSTÈME D'ABONNEMENT
    // ========================

    /**
     * S'abonner aux changements d'état
     * @param {string} key - Clé à surveiller
     * @param {function} callback - Fonction appelée lors du changement
     * @returns {function} - Fonction de désabonnement
     */
    subscribe(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        
        this.listeners[key].push(callback);
        console.log(`👂 Abonnement ajouté pour: ${key}`);
        
        // Retourner une fonction de désabonnement
        return () => this.unsubscribe(key, callback);
    }

    /**
     * Se désabonner des changements d'état
     * @param {string} key - Clé surveillée
     * @param {function} callback - Fonction à désabonner
     */
    unsubscribe(key, callback) {
        if (this.listeners[key]) {
            this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
            console.log(`👋 Désabonnement pour: ${key}`);
        }
    }

    /**
     * Notifier tous les listeners d'un changement
     * @param {string} key - Clé qui a changé
     * @param {any} newValue - Nouvelle valeur
     * @param {any} oldValue - Ancienne valeur
     */
    notifyListeners(key, newValue, oldValue) {
        if (this.listeners[key]) {
            this.listeners[key].forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (error) {
                    console.error(`❌ Erreur dans un listener pour ${key}:`, error);
                }
            });
        }
    }

    // ========================
    // MÉTHODES SPÉCIALISÉES
    // ========================

    /**
     * Définir l'utilisateur connecté
     * @param {object} user - Données utilisateur
     */
    setUser(user) {
        this.setState('user', user);
        this.setState('isAuthenticated', !!user);
    }

    /**
     * Ajouter un formulaire à la liste
     * @param {object} form - Nouveau formulaire
     */
    addForm(form) {
        const currentForms = this.getState('forms') || [];
        this.setState('forms', [...currentForms, form]);
    }

    /**
     * Mettre à jour un formulaire dans la liste
     * @param {string} formId - ID du formulaire
     * @param {object} updates - Mises à jour
     */
    updateForm(formId, updates) {
        const currentForms = this.getState('forms') || [];
        const updatedForms = currentForms.map(form => 
            form.id === formId ? { ...form, ...updates } : form
        );
        this.setState('forms', updatedForms);
    }

    /**
     * Supprimer un formulaire de la liste
     * @param {string} formId - ID du formulaire
     */
    removeForm(formId) {
        const currentForms = this.getState('forms') || [];
        const filteredForms = currentForms.filter(form => form.id !== formId);
        this.setState('forms', filteredForms);
    }

    /**
     * Définir le formulaire actuel
     * @param {object} form - Formulaire actuel
     */
    setCurrentForm(form) {
        this.setState('currentForm', form);
    }

    /**
     * Ajouter une erreur
     * @param {string} message - Message d'erreur
     * @param {string} type - Type d'erreur
     */
    addError(message, type = 'error') {
        const currentErrors = this.getState('errors') || [];
        const error = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };
        this.setState('errors', [...currentErrors, error]);
    }

    /**
     * Supprimer une erreur
     * @param {number} errorId - ID de l'erreur
     */
    removeError(errorId) {
        const currentErrors = this.getState('errors') || [];
        const filteredErrors = currentErrors.filter(error => error.id !== errorId);
        this.setState('errors', filteredErrors);
    }

    /**
     * Effacer toutes les erreurs
     */
    clearErrors() {
        this.setState('errors', []);
    }

    /**
     * Ajouter une notification
     * @param {string} message - Message de notification
     * @param {string} type - Type de notification (success, info, warning, error)
     * @param {number} duration - Durée d'affichage en ms (défaut: 5000)
     */
    addNotification(message, type = 'info', duration = 5000) {
        const currentNotifications = this.getState('notifications') || [];
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date(),
            duration
        };
        
        this.setState('notifications', [...currentNotifications, notification]);
        
        // Auto-suppression après la durée spécifiée
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }
    }

    /**
     * Supprimer une notification
     * @param {number} notificationId - ID de la notification
     */
    removeNotification(notificationId) {
        const currentNotifications = this.getState('notifications') || [];
        const filteredNotifications = currentNotifications.filter(
            notification => notification.id !== notificationId
        );
        this.setState('notifications', filteredNotifications);
    }

    /**
     * Définir l'état de chargement
     * @param {boolean} loading - État de chargement
     */
    setLoading(loading) {
        this.setState('loading', loading);
    }

    // ========================
    // GESTION DU CACHE
    // ========================

    /**
     * Mettre en cache une valeur
     * @param {string} key - Clé du cache
     * @param {any} value - Valeur à cacher
     * @param {number} ttl - Durée de vie en ms (défaut: 5 minutes)
     */
    setCache(key, value, ttl = 5 * 60 * 1000) {
        this.cache.set(key, value);
        this.cacheExpiry.set(key, Date.now() + ttl);
        console.log(`💾 Valeur mise en cache: ${key}`);
    }

    /**
     * Récupérer une valeur du cache
     * @param {string} key - Clé du cache
     * @returns {any} - Valeur cachée ou null si expirée/inexistante
     */
    getCache(key) {
        const expiry = this.cacheExpiry.get(key);
        
        if (expiry && Date.now() > expiry) {
            this.cache.delete(key);
            this.cacheExpiry.delete(key);
            console.log(`⏰ Cache expiré: ${key}`);
            return null;
        }
        
        const value = this.cache.get(key);
        if (value !== undefined) {
            console.log(`💾 Valeur récupérée du cache: ${key}`);
        }
        
        return value || null;
    }

    /**
     * Effacer le cache
     * @param {string} key - Clé spécifique (optionnel)
     */
    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
            this.cacheExpiry.delete(key);
            console.log(`🗑️ Cache effacé: ${key}`);
        } else {
            this.cache.clear();
            this.cacheExpiry.clear();
            console.log('🗑️ Tout le cache effacé');
        }
    }

    // ========================
    // PERSISTANCE
    // ========================

    /**
     * Sauvegarder certaines données dans localStorage
     * @param {string} key - Clé de l'état
     * @param {any} value - Valeur à sauvegarder
     */
    saveToStorage(key, value) {
        const persistentKeys = ['user', 'theme', 'language'];
        
        if (persistentKeys.includes(key)) {
            try {
                const storageData = JSON.parse(localStorage.getItem('formease_state') || '{}');
                storageData[key] = value;
                localStorage.setItem('formease_state', JSON.stringify(storageData));
            } catch (error) {
                console.error('❌ Erreur de sauvegarde dans localStorage:', error);
            }
        }
    }

    /**
     * Charger les données depuis localStorage
     */
    loadFromStorage() {
        try {
            const storageData = JSON.parse(localStorage.getItem('formease_state') || '{}');
            
            Object.keys(storageData).forEach(key => {
                this.state[key] = storageData[key];
            });
            
            console.log('📥 État chargé depuis localStorage');
        } catch (error) {
            console.error('❌ Erreur de chargement depuis localStorage:', error);
        }
    }

    /**
     * Synchroniser avec l'authentification
     */
    syncWithAuth() {
        if (window.apiService && window.apiService.isAuthenticated()) {
            this.setUser(window.apiService.user);
        }
    }

    // ========================
    // MÉTHODES UTILITAIRES
    // ========================

    /**
     * Obtenir des statistiques sur l'état
     * @returns {object} - Statistiques de l'état
     */
    getStats() {
        return {
            stateKeys: Object.keys(this.state).length,
            listeners: Object.keys(this.listeners).length,
            cacheSize: this.cache.size,
            isAuthenticated: this.getState('isAuthenticated'),
            formsCount: (this.getState('forms') || []).length,
            errorsCount: (this.getState('errors') || []).length,
            notificationsCount: (this.getState('notifications') || []).length
        };
    }

    /**
     * Exporter l'état (pour le débogage)
     * @returns {object} - État complet
     */
    exportState() {
        return {
            state: this.getState(),
            listeners: Object.keys(this.listeners),
            cache: Array.from(this.cache.keys()),
            stats: this.getStats()
        };
    }
}

// Création de l'instance globale
window.stateService = new StateService();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateService;
}

console.log('🔄 StateService initialisé et disponible globalement');

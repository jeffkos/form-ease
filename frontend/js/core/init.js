/**
 * 🚀 CORE INIT - SYSTÈME D'INITIALISATION AUTOMATIQUE
 * 
 * Charge automatiquement tous les services nécessaires et initialise l'environnement
 * Ce script doit être inclus dans toutes les pages pour la synchronisation
 */

(function() {
    'use strict';
    
    console.log('🚀 Démarrage de l\'initialisation FormEase...');
    
    // Configuration globale
    window.FormEaseConfig = {
        apiBaseUrl: 'http://localhost:4000/api',
        version: '2.0.0',
        environment: 'development',
        debug: true
    };
    
    // Files des services à charger
    const servicesToLoad = [
        '/js/services/ApiService.js',
        '/js/services/StateService.js',
        '/js/services/NavigationService.js',
        '/js/core/UIUtils.js',
        '/js/core/NotificationSystem.js'
    ];
    
    // Compteur de services chargés
    let servicesLoaded = 0;
    
    /**
     * Charger un script de manière asynchrone
     * @param {string} src - Chemin du script
     * @returns {Promise} - Promise de chargement
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                console.log(`✅ Service chargé: ${src}`);
                servicesLoaded++;
                resolve();
            };
            
            script.onerror = () => {
                console.error(`❌ Erreur de chargement: ${src}`);
                reject(new Error(`Failed to load ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Charger tous les services de base
     */
    async function loadCoreServices() {
        try {
            console.log('📦 Chargement des services de base...');
            
            // Charger les services en parallèle
            await Promise.all(servicesToLoad.map(loadScript));
            
            console.log(`✅ Tous les services chargés (${servicesLoaded}/${servicesToLoad.length})`);
            
            // Attendre un court instant pour s'assurer que les services sont initialisés
            setTimeout(initializeApplication, 100);
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des services:', error);
            showFallbackError('Erreur de chargement des services');
        }
    }
    
    /**
     * Initialiser l'application après chargement des services
     */
    async function initializeApplication() {
        try {
            console.log('🔧 Initialisation de l\'application...');
            
            // Vérifier que tous les services sont disponibles
            if (!window.apiService || !window.stateService || !window.navigationService) {
                throw new Error('Services manquants');
            }
            
            // Initialiser l'état global
            await initializeGlobalState();
            
            // Vérifier l'authentification pour les pages protégées
            await checkAuthenticationForProtectedPages();
            
            // Initialiser l'interface utilisateur
            initializeUI();
            
            // Marquer l'application comme prête
            markApplicationReady();
            
            console.log('🎉 Application FormEase initialisée avec succès !');
            
        } catch (error) {
            console.error('❌ Erreur d\'initialisation de l\'application:', error);
            showFallbackError('Erreur d\'initialisation');
        }
    }
    
    /**
     * Initialiser l'état global
     */
    async function initializeGlobalState() {
        // Charger les données utilisateur depuis localStorage
        const userData = localStorage.getItem('formease_user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                window.stateService.setUser(user);
                console.log('👤 Utilisateur chargé:', user.email);
            } catch (error) {
                console.warn('⚠️ Données utilisateur corrompues dans localStorage');
                localStorage.removeItem('formease_user');
                localStorage.removeItem('formease_token');
            }
        }
        
        // Définir la page actuelle
        window.stateService.setState('currentPage', window.location.pathname);
        
        // Générer le fil d'Ariane
        if (window.navigationService) {
            const breadcrumb = window.navigationService.generateBreadcrumb();
            window.stateService.setState('breadcrumb', breadcrumb);
        }
    }
    
    /**
     * Vérifier l'authentification pour les pages protégées
     */
    async function checkAuthenticationForProtectedPages() {
        if (window.navigationService && window.navigationService.isProtectedRoute()) {
            console.log('🔐 Page protégée détectée, vérification de l\'authentification...');
            
            const isAuthenticated = await window.navigationService.requireAuth();
            
            if (isAuthenticated) {
                console.log('✅ Authentification validée');
                
                // Charger les données initiales pour les pages authentifiées
                await loadInitialData();
            } else {
                console.log('❌ Authentification échouée, redirection...');
                // La redirection est gérée par NavigationService
                return;
            }
        }
    }
    
    /**
     * Charger les données initiales pour les pages authentifiées
     */
    async function loadInitialData() {
        try {
            // Charger les données de base selon la page
            const currentPage = window.location.pathname;
            
            if (currentPage.includes('/dashboard/')) {
                console.log('📊 Chargement des données du dashboard...');
                // Les données seront chargées par la page spécifique
            } else if (currentPage.includes('/forms/')) {
                console.log('📝 Chargement des données des formulaires...');
                // Les données seront chargées par la page spécifique
            } else if (currentPage.includes('/analytics/')) {
                console.log('📈 Chargement des données analytiques...');
                // Les données seront chargées par la page spécifique
            }
            
        } catch (error) {
            console.warn('⚠️ Erreur lors du chargement des données initiales:', error.message);
            // Continuer l'initialisation même en cas d'erreur
        }
    }
    
    /**
     * Initialiser l'interface utilisateur
     */
    function initializeUI() {
        // Ajouter les classes CSS globales
        document.body.classList.add('formease-app');
        
        // Initialiser le système de notifications si disponible
        if (window.NotificationSystem) {
            window.notificationSystem = new window.NotificationSystem();
        }
        
        // Initialiser les utilitaires UI si disponibles
        if (window.UIUtils) {
            window.uiUtils = new window.UIUtils();
        }
        
        // Ajouter les event listeners globaux
        addGlobalEventListeners();
        
        // Masquer le loader de chargement s'il existe
        hideLoadingScreen();
    }
    
    /**
     * Ajouter les event listeners globaux
     */
    function addGlobalEventListeners() {
        // Listener pour les erreurs globales
        window.addEventListener('error', function(event) {
            console.error('🚨 Erreur globale:', event.error);
            
            if (window.stateService) {
                window.stateService.addError(
                    'Une erreur inattendue s\'est produite',
                    'error'
                );
            }
        });
        
        // Listener pour les promesses rejetées
        window.addEventListener('unhandledrejection', function(event) {
            console.error('🚨 Promesse rejetée:', event.reason);
            
            if (window.stateService) {
                window.stateService.addError(
                    'Erreur de traitement des données',
                    'error'
                );
            }
        });
        
        // Listener pour la déconnexion automatique en cas d'inactivité
        let inactivityTimer;
        const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
        
        function resetInactivityTimer() {
            clearTimeout(inactivityTimer);
            
            if (window.apiService && window.apiService.isAuthenticated()) {
                inactivityTimer = setTimeout(() => {
                    console.log('⏰ Déconnexion automatique pour inactivité');
                    
                    if (window.notificationSystem) {
                        window.notificationSystem.show(
                            'Session expirée pour inactivité',
                            'warning'
                        );
                    }
                    
                    setTimeout(() => {
                        window.apiService.logout();
                    }, 3000);
                    
                }, INACTIVITY_TIMEOUT);
            }
        }
        
        // Événements d'activité utilisateur
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetInactivityTimer, true);
        });
        
        // Démarrer le timer d'inactivité
        resetInactivityTimer();
    }
    
    /**
     * Masquer l'écran de chargement
     */
    function hideLoadingScreen() {
        const loadingScreen = document.getElementById('formease-loading');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }
    
    /**
     * Marquer l'application comme prête
     */
    function markApplicationReady() {
        // Ajouter une classe CSS pour indiquer que l'app est prête
        document.body.classList.add('formease-ready');
        
        // Déclencher un événement personnalisé
        const readyEvent = new CustomEvent('formeaseReady', {
            detail: {
                version: window.FormEaseConfig.version,
                services: {
                    api: !!window.apiService,
                    state: !!window.stateService,
                    navigation: !!window.navigationService,
                    notifications: !!window.notificationSystem,
                    ui: !!window.uiUtils
                }
            }
        });
        
        document.dispatchEvent(readyEvent);
        
        // Mettre à jour l'état global
        if (window.stateService) {
            window.stateService.setState('appReady', true);
        }
    }
    
    /**
     * Afficher une erreur de fallback en cas d'échec critique
     */
    function showFallbackError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: Inter, sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 2rem;
                    border-radius: 0.5rem;
                    text-align: center;
                    max-width: 400px;
                ">
                    <h2 style="color: #ef4444; margin-bottom: 1rem;">Erreur de chargement</h2>
                    <p style="color: #6b7280; margin-bottom: 1.5rem;">${message}</p>
                    <button onclick="window.location.reload()" style="
                        background: #3b82f6;
                        color: white;
                        padding: 0.5rem 1rem;
                        border: none;
                        border-radius: 0.375rem;
                        cursor: pointer;
                    ">
                        Recharger la page
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }
    
    /**
     * Créer l'écran de chargement si nécessaire
     */
    function createLoadingScreen() {
        if (!document.getElementById('formease-loading')) {
            const loadingScreen = document.createElement('div');
            loadingScreen.id = 'formease-loading';
            loadingScreen.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(248, 250, 252, 0.95);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    font-family: Inter, sans-serif;
                ">
                    <div style="text-align: center;">
                        <div style="
                            width: 40px;
                            height: 40px;
                            border: 3px solid #e5e7eb;
                            border-top: 3px solid #3b82f6;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 1rem;
                        "></div>
                        <p style="color: #6b7280; font-size: 0.875rem;">
                            Chargement de FormEase...
                        </p>
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            
            document.body.appendChild(loadingScreen);
        }
    }
    
    // ========================
    // DÉMARRAGE DE L'INITIALISATION
    // ========================
    
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startInitialization);
    } else {
        startInitialization();
    }
    
    function startInitialization() {
        console.log('📄 DOM prêt, démarrage de l\'initialisation...');
        
        // Créer l'écran de chargement
        createLoadingScreen();
        
        // Démarrer le chargement des services
        loadCoreServices();
    }
    
    // Exposer des utilitaires globaux pour le débogage
    window.FormEaseDebug = {
        getState: () => window.stateService?.exportState(),
        getNavStats: () => window.navigationService?.getStats(),
        getApiStats: () => ({
            isAuthenticated: window.apiService?.isAuthenticated(),
            user: window.apiService?.user,
            baseURL: window.apiService?.baseURL
        }),
        reloadServices: () => window.location.reload(),
        clearCache: () => {
            localStorage.clear();
            window.location.reload();
        }
    };
    
})();

console.log('🔧 Système d\'initialisation FormEase chargé');

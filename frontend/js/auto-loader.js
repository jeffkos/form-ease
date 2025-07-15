/**
 * 🚀 FormEase - Auto-loader de Scripts Dynamiques
 * Charge automatiquement les scripts et services nécessaires pour rendre les pages dynamiques
 */

(function() {
    'use strict';

    console.log('🚀 Initialisation du loader de scripts dynamiques FormEase...');

    // Configuration des scripts à charger
    const SCRIPTS_CONFIG = {
        // Scripts de base requis pour toutes les pages
        base: [
            '/js/services/ApiService.js',
            '/js/services/DynamicPageService.js'
        ],
        
        // Scripts spécialisés par page
        pages: {
            'dashboard/home': [
                '/js/services/RealTimeChartsService.js',
                '/js/pages/dashboard.js'
            ],
            'forms/ai-generator': [
                '/js/pages/ai-generator.js'
            ],
            'forms/builder': [
                '/js/pages/form-builder.js'
            ],
            'forms/management': [
                '/js/pages/forms-management.js'
            ],
            'analytics/dashboard': [
                '/js/services/RealTimeChartsService.js',
                '/js/pages/analytics.js'
            ],
            'email-tracking': [
                '/js/pages/email-tracking.js'
            ],
            'analytics/reports': [
                '/js/pages/reports.js'
            ],
            'forms/qr-codes': [
                '/js/pages/qr-codes.js'
            ],
            'dashboard/profile': [
                '/js/pages/profile.js'
            ],
            'auth/login': [
                '/js/pages/login.js'
            ],
            'public/form-response': [
                '/js/pages/public-form.js',
                '/js/pages/public-form-fields.js',
                '/js/pages/public-form-validation.js',
                '/js/pages/public-form-navigation.js'
            ]
        }
    };

    // Détection de la page actuelle
    function detectCurrentPage() {
        const path = window.location.pathname;
        
        if (path.includes('dashboard/home')) return 'dashboard/home';
        if (path.includes('ai-generator')) return 'forms/ai-generator';
        if (path.includes('builder')) return 'forms/builder';
        if (path.includes('forms/management')) return 'forms/management';
        if (path.includes('analytics/dashboard')) return 'analytics/dashboard';
        if (path.includes('email-tracking')) return 'email-tracking';
        if (path.includes('analytics/reports')) return 'analytics/reports';
        if (path.includes('qr-codes')) return 'forms/qr-codes';
        if (path.includes('dashboard/profile')) return 'dashboard/profile';
        if (path.includes('auth/login')) return 'auth/login';
        if (path.includes('public/form-response')) return 'public/form-response';
        
        return null;
    }

    // Chargement asynchrone d'un script
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Vérifier si le script est déjà chargé
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                console.log(`✅ Script chargé: ${src}`);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`❌ Erreur chargement script: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }

    // Chargement de tous les scripts
    async function loadAllScripts() {
        try {
            const currentPage = detectCurrentPage();
            console.log(`📄 Page détectée: ${currentPage || 'page générique'}`);

            // Charger les scripts de base
            console.log('📦 Chargement des scripts de base...');
            for (const script of SCRIPTS_CONFIG.base) {
                await loadScript(script);
            }

            // Charger les scripts spécialisés pour la page
            if (currentPage && SCRIPTS_CONFIG.pages[currentPage]) {
                console.log(`📦 Chargement des scripts pour: ${currentPage}`);
                for (const script of SCRIPTS_CONFIG.pages[currentPage]) {
                    await loadScript(script);
                }
            }

            console.log('🎉 Tous les scripts chargés avec succès');
            
            // Déclencher l'événement de fin de chargement
            const event = new CustomEvent('formeaseScriptsLoaded', {
                detail: { page: currentPage }
            });
            document.dispatchEvent(event);

            // Initialiser la page spécifique
            await initializePage(currentPage);

        } catch (error) {
            console.error('❌ Erreur lors du chargement des scripts:', error);
            
            // Notification d'erreur visible pour l'utilisateur
            showLoadingError();
        }
    }

    // Initialisation de page spécifique
    async function initializePage(currentPage) {
        try {
            console.log(`🎯 Initialisation de la page: ${currentPage}`);
            
            // Attendre un petit délai pour s'assurer que tous les scripts sont prêts
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Mapping des pages vers leurs fonctions d'initialisation
            const pageInitializers = {
                'dashboard/home': 'initDashboard',
                'forms/ai-generator': 'initAiGenerator', 
                'forms/builder': 'initFormBuilder',
                'forms/management': 'initFormsManagement',
                'analytics/dashboard': 'initAnalytics',
                'email-tracking': 'initEmailTracking',
                'analytics/reports': 'initReports',
                'forms/qr-codes': 'initQrCodes',
                'dashboard/profile': 'initProfile',
                'auth/login': 'initLogin',
                'public/form-response': 'initPublicForm'
            };
            
            const initFunction = pageInitializers[currentPage];
            if (initFunction && typeof window[initFunction] === 'function') {
                console.log(`🚀 Exécution de ${initFunction}...`);
                await window[initFunction]();
                console.log(`✅ ${initFunction} terminée`);
            } else if (currentPage) {
                console.log(`⚠️ Aucune fonction d'initialisation trouvée pour: ${currentPage}`);
            }
            
        } catch (error) {
            console.error(`❌ Erreur lors de l'initialisation de la page ${currentPage}:`, error);
        }
    }

    // Affichage d'une erreur de chargement
    function showLoadingError() {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'formease-loading-error';
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-[9999] max-w-sm';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i class="ri-error-warning-line mr-3 text-xl"></i>
                <div>
                    <p class="font-medium">Erreur de chargement</p>
                    <p class="text-sm text-red-100">Certaines fonctionnalités peuvent être indisponibles</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="ml-4 text-white hover:text-red-200">
                    <i class="ri-close-line"></i>
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        // Auto-suppression après 10 secondes
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 10000);
    }

    // Indicateur de chargement
    function showLoadingIndicator() {
        const loader = document.createElement('div');
        loader.id = 'formease-script-loader';
        loader.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-lg shadow-lg z-[9999] border border-gray-200';
        loader.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span class="text-sm text-gray-700">Chargement des scripts FormEase...</span>
            </div>
        `;
        document.body.appendChild(loader);
        
        return loader;
    }

    function hideLoadingIndicator(loader) {
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
    }

    // Initialisation automatique
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            const loader = showLoadingIndicator();
            await loadAllScripts();
            hideLoadingIndicator(loader);
        });
    } else {
        // Le DOM est déjà chargé
        (async () => {
            const loader = showLoadingIndicator();
            await loadAllScripts();
            hideLoadingIndicator(loader);
        })();
    }

    // Configuration globale pour debugging
    window.FormEaseLoader = {
        detectCurrentPage,
        loadScript,
        loadAllScripts,
        SCRIPTS_CONFIG
    };

})();

// Style CSS pour les indicateurs
const style = document.createElement('style');
style.textContent = `
    #formease-script-loader,
    #formease-loading-error {
        font-family: 'Inter', 'ui-sans-serif', 'system-ui', sans-serif;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    #formease-script-loader,
    #formease-loading-error {
        animation: fadeIn 0.3s ease-out;
    }
`;
document.head.appendChild(style);

console.log('🔧 Auto-loader FormEase initialisé');

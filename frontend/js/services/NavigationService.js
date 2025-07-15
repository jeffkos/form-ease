/**
 * 🧭 NAVIGATION SERVICE - GESTION DE LA NAVIGATION ET SÉCURITÉ
 * 
 * Service de gestion de la navigation avec contrôle d'authentification
 * Sécurise les routes et gère les redirections automatiques
 */

class NavigationService {
    constructor() {
        // Routes protégées nécessitant une authentification
        this.protectedRoutes = [
            '/frontend/pages/dashboard/',
            '/frontend/pages/forms/',
            '/frontend/pages/analytics/',
            '/frontend/pages/subscription/',
            '/frontend/pages/admin/'
        ];
        
        // Routes publiques accessibles sans authentification
        this.publicRoutes = [
            '/frontend/pages/auth/',
            '/frontend/pages/public/',
            '/form/' // Formulaires publics
        ];
        
        // Routes admin nécessitant le rôle SUPERADMIN
        this.adminRoutes = [
            '/frontend/pages/admin/'
        ];
        
        // Routes premium nécessitant le rôle PREMIUM ou SUPERADMIN
        this.premiumRoutes = [
            '/frontend/pages/analytics/advanced.html',
            '/frontend/pages/forms/ai-generator.html'
        ];
        
        // Configuration des redirections par défaut
        this.defaultRedirects = {
            authenticated: '/frontend/pages/dashboard/home.html',
            unauthenticated: '/frontend/pages/auth/login.html',
            admin: '/frontend/pages/admin/dashboard.html',
            premium: '/frontend/pages/dashboard/home.html'
        };
        
        this.init();
    }

    /**
     * Initialisation du service
     */
    init() {
        // Vérifier l'authentification au chargement de la page
        this.checkRouteAccess();
        
        // Écouter les changements d'URL (pour les SPAs)
        window.addEventListener('popstate', () => {
            this.checkRouteAccess();
        });
        
        console.log('🧭 NavigationService initialisé');
    }

    // ========================
    // VÉRIFICATION D'AUTHENTIFICATION
    // ========================

    /**
     * Vérifier si l'utilisateur est authentifié
     * @returns {Promise<boolean>} - True si authentifié
     */
    async checkAuth() {
        try {
            const token = localStorage.getItem('formease_token');
            if (!token) {
                console.log('🔐 Aucun token trouvé');
                return false;
            }

            // Vérifier la validité du token avec l'API
            if (window.apiService) {
                const profile = await window.apiService.getProfile();
                
                // Mettre à jour l'état global
                if (window.stateService) {
                    window.stateService.setUser(profile);
                }
                
                console.log('✅ Utilisateur authentifié:', profile.email);
                return true;
            }
            
            return false;
        } catch (error) {
            console.warn('⚠️ Erreur de vérification d\'authentification:', error.message);
            
            // Nettoyer l'authentification en cas d'erreur
            if (window.apiService) {
                window.apiService.clearAuth();
            }
            
            return false;
        }
    }

    /**
     * Vérifier l'accès à la route actuelle
     * @returns {Promise<boolean>} - True si l'accès est autorisé
     */
    async checkRouteAccess() {
        const currentPath = window.location.pathname;
        
        try {
            // Vérifier si c'est une route protégée
            if (this.isProtectedRoute(currentPath)) {
                const isAuthenticated = await this.requireAuth();
                
                if (!isAuthenticated) {
                    return false;
                }
                
                // Vérifier les permissions spéciales
                return this.checkSpecialPermissions(currentPath);
            }
            
            // Route publique - accès autorisé
            return true;
            
        } catch (error) {
            console.error('❌ Erreur de vérification d\'accès:', error);
            this.redirectToLogin();
            return false;
        }
    }

    /**
     * Exiger une authentification
     * @returns {Promise<boolean>} - True si authentifié, false sinon
     */
    async requireAuth() {
        const isAuthenticated = await this.checkAuth();
        
        if (!isAuthenticated) {
            console.log('🚪 Redirection vers la page de connexion');
            this.redirectToLogin();
            return false;
        }
        
        return true;
    }

    /**
     * Vérifier les permissions spéciales (admin, premium)
     * @param {string} path - Chemin à vérifier
     * @returns {boolean} - True si autorisé
     */
    checkSpecialPermissions(path) {
        const user = window.apiService?.user;
        
        if (!user) {
            return false;
        }
        
        // Vérifier l'accès admin
        if (this.isAdminRoute(path) && !this.isAdmin(user)) {
            console.warn('❌ Accès admin requis');
            this.redirectToUnauthorized();
            return false;
        }
        
        // Vérifier l'accès premium
        if (this.isPremiumRoute(path) && !this.isPremium(user)) {
            console.warn('💎 Accès premium requis');
            this.redirectToPricing();
            return false;
        }
        
        return true;
    }

    // ========================
    // VÉRIFICATION DES TYPES DE ROUTES
    // ========================

    /**
     * Vérifier si c'est une route protégée
     * @param {string} path - Chemin à vérifier (optionnel, utilise l'URL actuelle par défaut)
     * @returns {boolean} - True si protégée
     */
    isProtectedRoute(path = window.location.pathname) {
        return this.protectedRoutes.some(route => path.includes(route));
    }

    /**
     * Vérifier si c'est une route publique
     * @param {string} path - Chemin à vérifier (optionnel, utilise l'URL actuelle par défaut)
     * @returns {boolean} - True si publique
     */
    isPublicRoute(path = window.location.pathname) {
        return this.publicRoutes.some(route => path.includes(route));
    }

    /**
     * Vérifier si c'est une route admin
     * @param {string} path - Chemin à vérifier (optionnel, utilise l'URL actuelle par défaut)
     * @returns {boolean} - True si admin
     */
    isAdminRoute(path = window.location.pathname) {
        return this.adminRoutes.some(route => path.includes(route));
    }

    /**
     * Vérifier si c'est une route premium
     * @param {string} path - Chemin à vérifier (optionnel, utilise l'URL actuelle par défaut)
     * @returns {boolean} - True si premium
     */
    isPremiumRoute(path = window.location.pathname) {
        return this.premiumRoutes.some(route => path.includes(route));
    }

    // ========================
    // VÉRIFICATION DES RÔLES
    // ========================

    /**
     * Vérifier si l'utilisateur est admin
     * @param {object} user - Objet utilisateur (optionnel)
     * @returns {boolean} - True si admin
     */
    isAdmin(user = window.apiService?.user) {
        return user?.role === 'SUPERADMIN';
    }

    /**
     * Vérifier si l'utilisateur est premium
     * @param {object} user - Objet utilisateur (optionnel)
     * @returns {boolean} - True si premium
     */
    isPremium(user = window.apiService?.user) {
        return ['PREMIUM', 'SUPERADMIN'].includes(user?.role);
    }

    /**
     * Vérifier si l'utilisateur a un rôle spécifique
     * @param {string} role - Rôle à vérifier
     * @param {object} user - Objet utilisateur (optionnel)
     * @returns {boolean} - True si l'utilisateur a le rôle
     */
    hasRole(role, user = window.apiService?.user) {
        return user?.role === role;
    }

    // ========================
    // REDIRECTIONS
    // ========================

    /**
     * Rediriger vers la page de connexion
     * @param {string} returnUrl - URL de retour après connexion
     */
    redirectToLogin(returnUrl = window.location.pathname) {
        const loginUrl = this.defaultRedirects.unauthenticated;
        const encodedReturnUrl = encodeURIComponent(returnUrl);
        
        console.log('🔄 Redirection vers la connexion');
        window.location.href = `${loginUrl}?return=${encodedReturnUrl}`;
    }

    /**
     * Rediriger vers la page d'accueil après connexion
     * @param {object} user - Utilisateur connecté
     */
    redirectAfterLogin(user) {
        // Vérifier s'il y a une URL de retour
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('return');
        
        if (returnUrl && this.isValidReturnUrl(returnUrl)) {
            console.log('🔄 Redirection vers l\'URL de retour:', returnUrl);
            window.location.href = decodeURIComponent(returnUrl);
            return;
        }
        
        // Redirection par défaut selon le rôle
        let defaultUrl = this.defaultRedirects.authenticated;
        
        if (this.isAdmin(user)) {
            defaultUrl = this.defaultRedirects.admin;
        }
        
        console.log('🔄 Redirection par défaut:', defaultUrl);
        window.location.href = defaultUrl;
    }

    /**
     * Rediriger vers une page non autorisée
     */
    redirectToUnauthorized() {
        console.log('🚫 Redirection vers page non autorisée');
        window.location.href = '/frontend/pages/errors/unauthorized.html';
    }

    /**
     * Rediriger vers la page de tarification
     */
    redirectToPricing() {
        console.log('💎 Redirection vers la page de tarification');
        window.location.href = '/frontend/pages/subscription/pricing.html';
    }

    /**
     * Rediriger vers le dashboard après déconnexion
     */
    redirectAfterLogout() {
        console.log('👋 Redirection après déconnexion');
        window.location.href = this.defaultRedirects.unauthenticated;
    }

    // ========================
    // NAVIGATION PROGRAMMÉE
    // ========================

    /**
     * Naviguer vers une URL de manière sécurisée
     * @param {string} url - URL de destination
     * @param {boolean} checkAccess - Vérifier l'accès avant navigation (défaut: true)
     */
    async navigateTo(url, checkAccess = true) {
        if (checkAccess) {
            // Simuler la navigation pour vérifier l'accès
            const originalPath = window.location.pathname;
            window.history.replaceState({}, '', url);
            
            const hasAccess = await this.checkRouteAccess();
            
            if (!hasAccess) {
                // Restaurer l'URL originale en cas d'échec
                window.history.replaceState({}, '', originalPath);
                return;
            }
        }
        
        console.log('🧭 Navigation vers:', url);
        window.location.href = url;
    }

    /**
     * Ouvrir une URL dans un nouvel onglet
     * @param {string} url - URL à ouvrir
     */
    openInNewTab(url) {
        console.log('🔗 Ouverture dans un nouvel onglet:', url);
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    /**
     * Retour en arrière sécurisé
     */
    goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // Redirection par défaut si pas d'historique
            const user = window.apiService?.user;
            if (user) {
                this.navigateTo(this.defaultRedirects.authenticated);
            } else {
                this.navigateTo(this.defaultRedirects.unauthenticated);
            }
        }
    }

    // ========================
    // UTILITAIRES
    // ========================

    /**
     * Vérifier si une URL de retour est valide
     * @param {string} returnUrl - URL à vérifier
     * @returns {boolean} - True si valide
     */
    isValidReturnUrl(returnUrl) {
        try {
            const url = new URL(returnUrl, window.location.origin);
            
            // Vérifier que c'est bien du même domaine
            if (url.origin !== window.location.origin) {
                return false;
            }
            
            // Vérifier que ce n'est pas une page d'auth
            return !this.publicRoutes.some(route => url.pathname.includes(route));
            
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtenir l'URL de retour pour la connexion
     * @returns {string} - URL de retour
     */
    getReturnUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('return') || this.defaultRedirects.authenticated;
    }

    /**
     * Générer le fil d'Ariane pour la page actuelle
     * @returns {Array} - Tableau des éléments du fil d'Ariane
     */
    generateBreadcrumb() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(segment => segment);
        
        const breadcrumb = [
            { name: 'Accueil', path: this.defaultRedirects.authenticated }
        ];
        
        let currentPath = '';
        segments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            
            // Mapper les segments vers des noms lisibles
            const readableNames = {
                'frontend': null, // Ignorer
                'pages': null,    // Ignorer
                'dashboard': 'Tableau de bord',
                'forms': 'Formulaires',
                'analytics': 'Analytics',
                'auth': 'Authentification',
                'admin': 'Administration'
            };
            
            const name = readableNames[segment];
            if (name) {
                breadcrumb.push({
                    name,
                    path: currentPath,
                    isActive: index === segments.length - 1
                });
            }
        });
        
        return breadcrumb;
    }

    /**
     * Obtenir des statistiques de navigation
     * @returns {object} - Statistiques
     */
    getStats() {
        return {
            currentPath: window.location.pathname,
            isProtected: this.isProtectedRoute(),
            isPublic: this.isPublicRoute(),
            isAdmin: this.isAdminRoute(),
            isPremium: this.isPremiumRoute(),
            userRole: window.apiService?.user?.role || 'anonymous',
            isAuthenticated: window.apiService?.isAuthenticated() || false
        };
    }
}

// Création de l'instance globale
window.navigationService = new NavigationService();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationService;
}

console.log('🧭 NavigationService initialisé et disponible globalement');

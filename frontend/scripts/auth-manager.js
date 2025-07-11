// 🔐 FORMEASE AUTHENTICATION MANAGER - Éviter les boucles infinies
class FormEaseAuth {
    constructor() {
        this.TOKEN_KEY = 'formease_token';
        this.USER_KEY = 'formease_user';
        this.publicPages = [
            '/login.html', 
            '/register.html', 
            '/landing.html', 
            '/about.html', 
            '/pricing.html',
            '/forgot-password.html',
            '/reset-password.html'
        ];
    }

    // Vérifier si la page actuelle est publique
    isPublicPage() {
        const currentPath = window.location.pathname;
        return this.publicPages.some(page => currentPath.includes(page));
    }

    // Vérifier si l'utilisateur est connecté
    isAuthenticated() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        return token !== null && token !== '';
    }

    // Obtenir le token
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    // Obtenir les données utilisateur
    getUser() {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    }

    // Connexion utilisateur
    login(token, userData) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
    }

    // Déconnexion utilisateur
    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        window.location.href = '/frontend/pages/auth/login.html';
    }

    // Protection des pages privées - évite les boucles infinies
    protectPage() {
        const currentPath = window.location.pathname;
        
        // Si c'est une page publique, pas besoin de vérification
        if (this.isPublicPage()) {
            return true;
        }

        // Si pas authentifié et pas déjà sur une page d'auth
        if (!this.isAuthenticated()) {
            if (!currentPath.includes('/auth/')) {
                console.log('🔐 Redirection vers login - utilisateur non authentifié');
                window.location.href = '../auth/login.html';
                return false;
            }
        }

        return true;
    }

    // Initialiser la protection automatique
    init() {
        // Éviter les redirections multiples
        if (window.authInitialized) {
            return true;
        }

        window.authInitialized = true;
        return this.protectPage();
    }
}

// Instance globale
window.FormEaseAuth = new FormEaseAuth();

// Auto-initialisation sécurisée
document.addEventListener('DOMContentLoaded', function() {
    if (!window.FormEaseAuth.init()) {
        // Arrêter l'exécution si redirection nécessaire
        return;
    }
});

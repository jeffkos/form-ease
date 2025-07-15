/**
 * FormEase - Page de Connexion (Dynamique)
 * Script pour la gestion dynamique de la page de connexion
 * 
 * Fonctionnalités:
 * - Authentification avec validation en temps réel
 * - Gestion des erreurs et notifications
 * - Redirection automatique après connexion
 * - Connexions sociales (Google, GitHub)
 * - Réinitialisation des tentatives
 * - Auto-focus et UX optimisée
 */

class LoginManager {
    constructor() {
        this.isLoading = false;
        this.maxAttempts = 5;
        this.blockDuration = 15 * 60 * 1000; // 15 minutes
        this.attemptKey = 'formease_login_attempts';
        this.blockKey = 'formease_login_blocked_until';
        
        this.init();
    }

    /**
     * Initialisation du gestionnaire de connexion
     */
    init() {
        console.log('🔐 Initialisation de la page de connexion');
        
        // Vérifier si déjà connecté
        this.checkExistingAuth();
        
        // Vérifier le blocage temporaire
        this.checkLoginBlock();
        
        // Initialiser les événements
        this.initializeEvents();
        
        // Initialiser l'interface
        this.initializeUI();
        
        // Gestion des paramètres d'URL
        this.handleUrlParameters();
        
        console.log('✅ Page de connexion initialisée');
    }

    /**
     * Vérifier l'authentification existante
     */
    async checkExistingAuth() {
        if (window.apiService && window.apiService.isAuthenticated()) {
            try {
                console.log('🔍 Vérification du token existant...');
                const profile = await window.apiService.getProfile();
                
                console.log('👤 Utilisateur déjà connecté:', profile.email);
                this.showNotification('Déjà connecté ! Redirection...', 'info');
                
                // Redirection après 1 seconde
                setTimeout(() => {
                    this.redirectAfterLogin(profile);
                }, 1000);
                
                return true;
            } catch (error) {
                console.log('🚫 Token invalide, nettoyage...');
                window.apiService.clearAuth();
            }
        }
        return false;
    }

    /**
     * Vérifier le blocage temporaire
     */
    checkLoginBlock() {
        const blockedUntil = localStorage.getItem(this.blockKey);
        if (blockedUntil) {
            const blockedTime = parseInt(blockedUntil);
            const now = Date.now();
            
            if (now < blockedTime) {
                const remainingTime = Math.ceil((blockedTime - now) / 1000 / 60);
                this.showBlockedState(remainingTime);
                return true;
            } else {
                // Déblocage automatique
                this.clearLoginAttempts();
            }
        }
        return false;
    }

    /**
     * Initialiser les événements
     */
    initializeEvents() {
        // Formulaire de connexion
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Toggle password visibility
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Validation en temps réel
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        
        if (emailField) {
            emailField.addEventListener('blur', () => this.validateEmail());
            emailField.addEventListener('input', () => this.clearFieldError('email'));
        }
        
        if (passwordField) {
            passwordField.addEventListener('input', () => this.clearFieldError('password'));
        }

        // Connexions sociales
        this.initializeSocialLogins();

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isLoading) {
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.id === 'email' || activeElement.id === 'password')) {
                    loginForm.dispatchEvent(new Event('submit'));
                }
            }
        });
    }

    /**
     * Initialiser l'interface utilisateur
     */
    initializeUI() {
        // Auto-focus sur le champ email
        const emailField = document.getElementById('email');
        if (emailField && !emailField.value) {
            setTimeout(() => emailField.focus(), 100);
        }

        // Afficher les statistiques de connexion (pour les développeurs)
        if (localStorage.getItem('formease_debug') === 'true') {
            this.showDebugInfo();
        }

        // Pré-remplir l'email si disponible
        const rememberedEmail = localStorage.getItem('formease_remembered_email');
        if (rememberedEmail && emailField) {
            emailField.value = rememberedEmail;
            const passwordField = document.getElementById('password');
            if (passwordField) {
                passwordField.focus();
            }
        }
    }

    /**
     * Gérer les paramètres d'URL
     */
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Message de déconnexion
        if (urlParams.get('logout') === 'success') {
            this.showNotification('Déconnexion réussie', 'success');
            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Message d'expiration de session
        if (urlParams.get('session') === 'expired') {
            this.showNotification('Session expirée, veuillez vous reconnecter', 'warning');
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Email pré-rempli
        const email = urlParams.get('email');
        if (email) {
            const emailField = document.getElementById('email');
            if (emailField) {
                emailField.value = email;
            }
        }
    }

    /**
     * Gérer la soumission du formulaire
     */
    async handleLogin(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        // Vérifier le blocage
        if (this.checkLoginBlock()) {
            return;
        }

        const formData = new FormData(event.target);
        const email = formData.get('email')?.trim();
        const password = formData.get('password');
        const remember = formData.get('remember');

        // Validation des champs
        if (!this.validateForm(email, password)) {
            return;
        }

        try {
            this.setLoadingState(true);
            console.log('🔐 Tentative de connexion pour:', email);

            // Appel API
            const result = await window.apiService.login(email, password, remember);

            // Succès
            console.log('✅ Connexion réussie:', result.user.email);
            
            // Gérer "Se souvenir de moi"
            if (remember) {
                localStorage.setItem('formease_remembered_email', email);
            } else {
                localStorage.removeItem('formease_remembered_email');
            }

            // Nettoyer les tentatives
            this.clearLoginAttempts();

            // Notification et redirection
            this.showNotification('Connexion réussie ! Redirection...', 'success');
            
            setTimeout(() => {
                this.redirectAfterLogin(result.user);
            }, 1000);

        } catch (error) {
            console.error('❌ Erreur de connexion:', error);
            
            // Incrémenter les tentatives
            this.incrementLoginAttempts();
            
            // Afficher l'erreur
            this.handleLoginError(error);
            
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Valider le formulaire
     */
    validateForm(email, password) {
        let isValid = true;

        // Validation email
        if (!email) {
            this.showFieldError('email', 'L\'email est requis');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('email', 'Format d\'email invalide');
            isValid = false;
        }

        // Validation password
        if (!password) {
            this.showFieldError('password', 'Le mot de passe est requis');
            isValid = false;
        } else if (password.length < 6) {
            this.showFieldError('password', 'Le mot de passe doit contenir au moins 6 caractères');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Valider l'email en temps réel
     */
    validateEmail() {
        const emailField = document.getElementById('email');
        const email = emailField.value.trim();
        
        if (email && !this.isValidEmail(email)) {
            this.showFieldError('email', 'Format d\'email invalide');
            return false;
        } else {
            this.clearFieldError('email');
            return true;
        }
    }

    /**
     * Vérifier le format email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Afficher une erreur de champ
     */
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const existingError = document.getElementById(`${fieldId}-error`);
        
        if (existingError) {
            existingError.textContent = message;
            return;
        }

        field.classList.add('border-red-500', 'ring-red-500');
        
        const errorDiv = document.createElement('div');
        errorDiv.id = `${fieldId}-error`;
        errorDiv.className = 'text-red-500 text-sm mt-1 flex items-center';
        errorDiv.innerHTML = `<i class="ri-error-warning-line mr-1"></i>${message}`;
        
        field.parentNode.appendChild(errorDiv);
    }

    /**
     * Effacer l'erreur d'un champ
     */
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorDiv = document.getElementById(`${fieldId}-error`);
        
        if (errorDiv) {
            errorDiv.remove();
        }
        
        field.classList.remove('border-red-500', 'ring-red-500');
    }

    /**
     * Gérer les erreurs de connexion
     */
    handleLoginError(error) {
        let errorMessage = 'Erreur de connexion';
        
        if (error.status === 401 || error.message.includes('401')) {
            errorMessage = 'Email ou mot de passe incorrect';
            // Focus sur le mot de passe pour retry
            setTimeout(() => {
                const passwordField = document.getElementById('password');
                passwordField.focus();
                passwordField.select();
            }, 100);
        } else if (error.status === 429 || error.message.includes('429')) {
            errorMessage = 'Trop de tentatives. Veuillez patienter quelques minutes.';
            this.blockLoginTemporarily();
        } else if (error.message.includes('Network') || error.status === 0) {
            errorMessage = 'Problème de connexion au serveur';
        } else if (error.message) {
            errorMessage = error.message;
        }

        this.showNotification(errorMessage, 'error');
    }

    /**
     * Incrémenter les tentatives de connexion
     */
    incrementLoginAttempts() {
        const attempts = parseInt(localStorage.getItem(this.attemptKey) || '0') + 1;
        localStorage.setItem(this.attemptKey, attempts.toString());
        
        const remaining = this.maxAttempts - attempts;
        
        if (remaining > 0) {
            this.showNotification(`${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`, 'warning');
        }
        
        if (attempts >= this.maxAttempts) {
            this.blockLoginTemporarily();
        }
    }

    /**
     * Bloquer temporairement les connexions
     */
    blockLoginTemporarily() {
        const blockedUntil = Date.now() + this.blockDuration;
        localStorage.setItem(this.blockKey, blockedUntil.toString());
        
        const minutes = Math.ceil(this.blockDuration / 1000 / 60);
        this.showBlockedState(minutes);
    }

    /**
     * Afficher l'état bloqué
     */
    showBlockedState(remainingMinutes) {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = `
                <i class="ri-lock-line mr-2"></i>
                Bloqué (${remainingMinutes} min)
            `;
            loginBtn.classList.add('bg-red-500', 'hover:bg-red-600');
            loginBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        }

        this.showNotification(
            `Trop de tentatives. Connexion bloquée pour ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
            'error',
            10000
        );
    }

    /**
     * Nettoyer les tentatives de connexion
     */
    clearLoginAttempts() {
        localStorage.removeItem(this.attemptKey);
        localStorage.removeItem(this.blockKey);
        
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = `
                <span id="loginBtnText">Se connecter</span>
                <i class="ri-arrow-right-line ml-2" id="loginBtnIcon"></i>
                <i class="ri-loader-4-line animate-spin ml-2 hidden" id="loginBtnLoader"></i>
            `;
            loginBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            loginBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }
    }

    /**
     * Réinitialiser les tentatives (bouton debug)
     */
    resetRateLimit() {
        this.clearLoginAttempts();
        this.showNotification('Tentatives réinitialisées', 'success');
        console.log('🔓 Tentatives de connexion réinitialisées');
    }

    /**
     * Basculer la visibilité du mot de passe
     */
    togglePasswordVisibility() {
        const passwordField = document.getElementById('password');
        const eyeIcon = document.getElementById('eyeIcon');
        
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            eyeIcon.className = 'ri-eye-off-line';
        } else {
            passwordField.type = 'password';
            eyeIcon.className = 'ri-eye-line';
        }
    }

    /**
     * Initialiser les connexions sociales
     */
    initializeSocialLogins() {
        // Google Login (à implémenter avec l'API Google)
        const googleBtn = document.querySelector('button:has(.ri-google-fill)');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleSocialLogin('google'));
        }

        // GitHub Login (à implémenter avec l'API GitHub)
        const githubBtn = document.querySelector('button:has(.ri-github-fill)');
        if (githubBtn) {
            githubBtn.addEventListener('click', () => this.handleSocialLogin('github'));
        }
    }

    /**
     * Gérer la connexion sociale
     */
    async handleSocialLogin(provider) {
        try {
            this.showNotification(`Connexion ${provider} en cours...`, 'info');
            
            // TODO: Implémenter la connexion sociale
            console.log(`🔗 Connexion sociale ${provider} demandée`);
            
            // Pour l'instant, afficher un message
            this.showNotification(`Connexion ${provider} bientôt disponible`, 'info');
            
        } catch (error) {
            console.error(`❌ Erreur connexion ${provider}:`, error);
            this.showNotification(`Erreur lors de la connexion ${provider}`, 'error');
        }
    }

    /**
     * Redirection après connexion réussie
     */
    redirectAfterLogin(user) {
        // Déterminer l'URL de destination
        const urlParams = new URLSearchParams(window.location.search);
        let redirectUrl = urlParams.get('redirect') || '/frontend/pages/dashboard/home.html';
        
        // Sécurité: vérifier que l'URL de redirection est locale
        if (!redirectUrl.startsWith('/') && !redirectUrl.startsWith('./')) {
            redirectUrl = '/frontend/pages/dashboard/home.html';
        }

        console.log('🚀 Redirection vers:', redirectUrl);
        window.location.href = redirectUrl;
    }

    /**
     * Gérer l'état de chargement
     */
    setLoadingState(loading) {
        this.isLoading = loading;
        
        const loginBtn = document.getElementById('loginBtn');
        const loginBtnText = document.getElementById('loginBtnText');
        const loginBtnIcon = document.getElementById('loginBtnIcon');
        const loginBtnLoader = document.getElementById('loginBtnLoader');
        
        if (loading) {
            loginBtn.disabled = true;
            if (loginBtnText) loginBtnText.textContent = 'Connexion...';
            if (loginBtnIcon) loginBtnIcon.classList.add('hidden');
            if (loginBtnLoader) loginBtnLoader.classList.remove('hidden');
        } else {
            loginBtn.disabled = false;
            if (loginBtnText) loginBtnText.textContent = 'Se connecter';
            if (loginBtnIcon) loginBtnIcon.classList.remove('hidden');
            if (loginBtnLoader) loginBtnLoader.classList.add('hidden');
        }
    }

    /**
     * Afficher une notification
     */
    showNotification(message, type = 'info', duration = 5000) {
        if (window.notificationSystem) {
            window.notificationSystem.show(message, type, { duration });
        } else {
            // Fallback
            this.showFallbackNotification(message, type, duration);
        }
    }

    /**
     * Notification fallback
     */
    showFallbackNotification(message, type, duration = 5000) {
        const container = document.getElementById('messageContainer') || document.body;
        const messageEl = document.createElement('div');
        
        const bgColor = {
            'success': 'bg-green-500',
            'warning': 'bg-yellow-500',
            'info': 'bg-blue-500',
            'error': 'bg-red-500'
        }[type] || 'bg-gray-500';
        
        const icon = {
            'success': 'ri-check-line',
            'warning': 'ri-alert-line',
            'info': 'ri-information-line',
            'error': 'ri-error-warning-line'
        }[type] || 'ri-information-line';
        
        messageEl.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 flex items-center mb-2 fixed top-4 right-4 z-50`;
        messageEl.innerHTML = `
            <i class="${icon} mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="ml-4 opacity-75 hover:opacity-100">
                <i class="ri-close-line"></i>
            </button>
        `;
        
        container.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, duration);
    }

    /**
     * Afficher les informations de debug
     */
    showDebugInfo() {
        const attempts = localStorage.getItem(this.attemptKey) || '0';
        const blocked = localStorage.getItem(this.blockKey);
        
        console.log('🐛 Debug Info - Tentatives:', attempts);
        if (blocked) {
            const blockedUntil = new Date(parseInt(blocked));
            console.log('🐛 Debug Info - Bloqué jusqu\'à:', blockedUntil);
        }
    }
}

// Fonction d'initialisation globale pour l'auto-loader
window.initLogin = function() {
    console.log('🚀 Initialisation de la page de connexion via auto-loader');
    
    // Attendre que tous les services soient prêts
    if (window.apiService) {
        new LoginManager();
    } else {
        // Attendre le chargement de l'API Service
        document.addEventListener('formeaseReady', function() {
            new LoginManager();
        });
    }
};

// Fonction globale pour réinitialiser les tentatives (compatibilité)
window.resetRateLimit = function() {
    if (window.loginManager) {
        window.loginManager.resetRateLimit();
    } else {
        localStorage.removeItem('formease_login_attempts');
        localStorage.removeItem('formease_login_blocked_until');
        window.location.reload();
    }
};

// Auto-initialisation si pas d'auto-loader
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (!window.autoLoader) {
            setTimeout(() => window.initLogin(), 100);
        }
    });
} else {
    if (!window.autoLoader) {
        setTimeout(() => window.initLogin(), 100);
    }
}

console.log('📁 Script login.js chargé');

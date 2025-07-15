/**
 * 🔌 API SERVICE - SERVICE DE COMMUNICATION AVEC LE BACKEND
 * 
 * Service centralisé pour toutes les communications avec l'API FormEase
 * Gère l'authentification JWT, les erreurs et la persistance des tokens
 */

class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:4000/api';
        this.token = localStorage.getItem('formease_token');
        this.user = JSON.parse(localStorage.getItem('formease_user') || 'null');
        
        // Configuration par défaut des requêtes
        this.defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }

    /**
     * Méthode générique pour les requêtes API
     * @param {string} endpoint - Point de terminaison de l'API
     * @param {object} options - Options de la requête (method, body, headers, etc.)
     * @returns {Promise} - Réponse de l'API
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        // Configuration de la requête
        const config = {
            ...this.defaultOptions,
            ...options,
            headers: {
                ...this.defaultOptions.headers,
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            }
        };

        try {
            console.log(`🔌 API Request: ${config.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            const data = await response.json();
            
            // Gestion des erreurs d'authentification
            if (response.status === 401) {
                console.warn('🔐 Token expiré ou invalide');
                this.handleAuthError();
                throw new Error('Session expirée. Veuillez vous reconnecter.');
            }
            
            // Gestion des autres erreurs HTTP
            if (!response.ok) {
                const errorMessage = data.message || data.error || `Erreur ${response.status}`;
                console.error('❌ Erreur API:', errorMessage);
                throw new Error(errorMessage);
            }
            
            console.log('✅ API Response:', data);
            return data;
            
        } catch (error) {
            console.error('🚨 Erreur de requête API:', error);
            
            // Erreur de réseau
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
            }
            
            throw error;
        }
    }

    // ========================
    // MÉTHODES D'AUTHENTIFICATION
    // ========================

    /**
     * Connexion utilisateur
     * @param {string} email - Email de l'utilisateur
     * @param {string} password - Mot de passe
     * @returns {Promise} - Données de l'utilisateur connecté
     */
    async login(email, password) {
        try {
            const data = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            this.setAuth(data.token, data.user);
            console.log('🔐 Connexion réussie pour:', data.user.email);
            
            return data;
        } catch (error) {
            console.error('❌ Erreur de connexion:', error.message);
            throw error;
        }
    }

    /**
     * Inscription utilisateur
     * @param {object} userData - Données de l'utilisateur (first_name, last_name, email, password, language)
     * @returns {Promise} - Données de l'utilisateur créé
     */
    async register(userData) {
        try {
            const data = await this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            this.setAuth(data.token, data.user);
            console.log('📝 Inscription réussie pour:', data.user.email);
            
            return data;
        } catch (error) {
            console.error('❌ Erreur d\'inscription:', error.message);
            throw error;
        }
    }

    /**
     * Déconnexion utilisateur
     */
    async logout() {
        try {
            // Appel API pour invalider le token côté serveur (si implémenté)
            await this.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.warn('⚠️ Erreur lors de la déconnexion côté serveur:', error.message);
        } finally {
            this.clearAuth();
            console.log('👋 Utilisateur déconnecté');
            
            // Redirection vers la page de connexion
            if (!window.location.pathname.includes('/auth/')) {
                window.location.href = '/frontend/pages/auth/login.html';
            }
        }
    }

    /**
     * Vérification du profil utilisateur actuel
     * @returns {Promise} - Profil utilisateur
     */
    async getProfile() {
        try {
            const data = await this.request('/auth/me');
            
            // Mise à jour des données utilisateur locales
            this.user = data.user;
            localStorage.setItem('formease_user', JSON.stringify(data.user));
            
            return data.user;
        } catch (error) {
            console.error('❌ Erreur de récupération du profil:', error.message);
            throw error;
        }
    }

    /**
     * Mise à jour du profil utilisateur
     * @param {object} profileData - Nouvelles données du profil
     * @returns {Promise} - Profil mis à jour
     */
    async updateProfile(profileData) {
        try {
            const data = await this.request('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            
            // Mise à jour des données locales
            this.user = data.user;
            localStorage.setItem('formease_user', JSON.stringify(data.user));
            
            console.log('📝 Profil mis à jour pour:', data.user.email);
            return data.user;
        } catch (error) {
            console.error('❌ Erreur de mise à jour du profil:', error.message);
            throw error;
        }
    }

    // ========================
    // MÉTHODES POUR LES FORMULAIRES
    // ========================

    /**
     * Récupérer tous les formulaires de l'utilisateur
     * @param {object} filters - Filtres optionnels (limit, offset, search, etc.)
     * @returns {Promise} - Liste des formulaires
     */
    async getForms(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = `/forms${queryParams ? `?${queryParams}` : ''}`;
        
        return await this.request(endpoint);
    }

    /**
     * Récupérer un formulaire spécifique
     * @param {string} formId - ID du formulaire
     * @returns {Promise} - Données du formulaire
     */
    async getForm(formId) {
        return await this.request(`/forms/${formId}`);
    }

    /**
     * Créer un nouveau formulaire
     * @param {object} formData - Données du formulaire (title, description, config, etc.)
     * @returns {Promise} - Formulaire créé
     */
    async createForm(formData) {
        return await this.request('/forms', {
            method: 'POST',
            body: JSON.stringify({
                ...formData,
                user_id: this.user?.id
            })
        });
    }

    /**
     * Mettre à jour un formulaire
     * @param {string} formId - ID du formulaire
     * @param {object} formData - Nouvelles données du formulaire
     * @returns {Promise} - Formulaire mis à jour
     */
    async updateForm(formId, formData) {
        return await this.request(`/forms/${formId}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
    }

    /**
     * Supprimer un formulaire
     * @param {string} formId - ID du formulaire
     * @returns {Promise} - Confirmation de suppression
     */
    async deleteForm(formId) {
        return await this.request(`/forms/${formId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Récupérer les réponses d'un formulaire
     * @param {string} formId - ID du formulaire
     * @param {object} filters - Filtres optionnels
     * @returns {Promise} - Liste des réponses
     */
    async getFormSubmissions(formId, filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = `/forms/${formId}/submissions${queryParams ? `?${queryParams}` : ''}`;
        
        return await this.request(endpoint);
    }

    // ========================
    // MÉTHODES POUR LES ANALYTICS
    // ========================

    /**
     * Récupérer les statistiques du dashboard
     * @returns {Promise} - Statistiques utilisateur
     */
    async getDashboardStats() {
        try {
            return await this.request('/dashboard/stats');
        } catch (error) {
            console.error('❌ Erreur récupération stats dashboard:', error);
            throw error;
        }
    }

    /**
     * Récupérer les données analytiques
     * @param {string} period - Période d'analyse (day, week, month, year)
     * @returns {Promise} - Données analytiques
     */
    async getAnalytics(period = 'month') {
        return await this.request(`/analytics?period=${period}`);
    }

    /**
     * Récupérer le résumé analytique
     * @returns {Promise} - Résumé des analytics
     */
    async getAnalyticsSummary() {
        return await this.request('/analytics/summary');
    }

    // ========================
    // MÉTHODES POUR IA
    // ========================

    /**
     * Générer un formulaire avec l'IA
     * @param {string} prompt - Description du formulaire souhaité
     * @returns {Promise} - Formulaire généré par IA
     */
    async generateFormAI(prompt) {
        return await this.request('/ai/generate-form', {
            method: 'POST',
            body: JSON.stringify({ 
                prompt,
                user_id: this.user?.id 
            })
        });
    }

    /**
     * Générer un formulaire avec l'IA
     */
    async generateFormWithAI(prompt, options = {}) {
        try {
            return await this.request('/ai/generate-form', {
                method: 'POST',
                body: JSON.stringify({ 
                    prompt, 
                    options,
                    userId: this.user?.id 
                })
            });
        } catch (error) {
            console.error('❌ Erreur génération IA:', error);
            throw error;
        }
    }

    /**
     * Améliorer un formulaire avec l'IA
     */
    async improveFormWithAI(formId, instructions) {
        try {
            return await this.request(`/ai/improve-form/${formId}`, {
                method: 'POST',
                body: JSON.stringify({ instructions })
            });
        } catch (error) {
            console.error('❌ Erreur amélioration IA:', error);
            throw error;
        }
    }

    /**
     * Historique des générations IA
     */
    async getAIHistory() {
        try {
            return await this.request('/ai/history');
        } catch (error) {
            console.error('❌ Erreur récupération historique IA:', error);
            throw error;
        }
    }

    // ========================
    // MÉTHODES QR CODES
    // ========================

    /**
     * Générer un QR Code pour un formulaire
     */
    async generateQRCode(formId, options = {}) {
        try {
            return await this.request('/qrcodes/generate', {
                method: 'POST',
                body: JSON.stringify({ formId, options })
            });
        } catch (error) {
            console.error('❌ Erreur génération QR code:', error);
            throw error;
        }
    }

    /**
     * Liste des QR Codes
     */
    async getQRCodes() {
        try {
            return await this.request('/qrcodes');
        } catch (error) {
            console.error('❌ Erreur récupération QR codes:', error);
            throw error;
        }
    }

    /**
     * Statistiques des QR Codes
     */
    async getQRCodeStats(qrCodeId = null) {
        try {
            const endpoint = qrCodeId ? `/qrcodes/stats/${qrCodeId}` : '/qrcodes/stats';
            return await this.request(endpoint);
        } catch (error) {
            console.error('❌ Erreur stats QR codes:', error);
            throw error;
        }
    }

    // ========================
    // MÉTHODES EMAILS
    // ========================

    /**
     * Suivi des emails
     */
    async getEmailTracking(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/emails/tracking${queryString ? '?' + queryString : ''}`);
        } catch (error) {
            console.error('❌ Erreur suivi emails:', error);
            throw error;
        }
    }

    /**
     * Statistiques des emails
     */
    async getEmailStats() {
        try {
            return await this.request('/emails/statistics');
        } catch (error) {
            console.error('❌ Erreur stats emails:', error);
            throw error;
        }
    }

    /**
     * Configurer les notifications email
     */
    async updateEmailSettings(settings) {
        try {
            return await this.request('/emails/settings', {
                method: 'PUT',
                body: JSON.stringify(settings)
            });
        } catch (error) {
            console.error('❌ Erreur config emails:', error);
            throw error;
        }
    }

    // ========================
    // MÉTHODES RAPPORTS
    // ========================

    /**
     * Générer un rapport
     */
    async generateReport(type, params = {}) {
        try {
            return await this.request('/reports/generate', {
                method: 'POST',
                body: JSON.stringify({ type, params })
            });
        } catch (error) {
            console.error('❌ Erreur génération rapport:', error);
            throw error;
        }
    }

    /**
     * Liste des rapports disponibles
     */
    async getReports() {
        try {
            return await this.request('/reports');
        } catch (error) {
            console.error('❌ Erreur récupération rapports:', error);
            throw error;
        }
    }

    // ========================
    // MÉTHODES PROFIL UTILISATEUR
    // ========================

    /**
     * Profil utilisateur complet
     */
    async getUserProfile() {
        try {
            return await this.request('/users/profile');
        } catch (error) {
            console.error('❌ Erreur profil utilisateur:', error);
            throw error;
        }
    }

    /**
     * Changer le mot de passe
     */
    async changePassword(currentPassword, newPassword) {
        try {
            return await this.request('/users/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword })
            });
        } catch (error) {
            console.error('❌ Erreur changement mot de passe:', error);
            throw error;
        }
    }

    /**
     * Quotas utilisateur
     */
    async getUserQuotas() {
        try {
            return await this.request('/users/quotas');
        } catch (error) {
            console.error('❌ Erreur récupération quotas:', error);
            throw error;
        }
    }

    // ========================
    // GESTION DE L'AUTHENTIFICATION
    // ========================

    /**
     * Définir les données d'authentification
     * @param {string} token - Token JWT
     * @param {object} user - Données utilisateur
     */
    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('formease_token', token);
        localStorage.setItem('formease_user', JSON.stringify(user));
        
        console.log('🔐 Authentification sauvegardée');
    }

    /**
     * Effacer les données d'authentification
     */
    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('formease_token');
        localStorage.removeItem('formease_user');
        
        console.log('🗑️ Authentification effacée');
    }

    /**
     * Gérer les erreurs d'authentification
     */
    handleAuthError() {
        this.clearAuth();
        
        // Redirection uniquement si on n'est pas déjà sur une page d'auth
        if (!window.location.pathname.includes('/auth/')) {
            console.log('🔄 Redirection vers la page de connexion');
            window.location.href = '/frontend/pages/auth/login.html';
        }
    }

    /**
     * Vérifier si l'utilisateur est connecté
     * @returns {boolean} - True si connecté
     */
    isAuthenticated() {
        return !!(this.token && this.user);
    }

    /**
     * Vérifier si l'utilisateur a un rôle spécifique
     * @param {string} role - Rôle à vérifier (USER, PREMIUM, SUPERADMIN)
     * @returns {boolean} - True si l'utilisateur a le rôle
     */
    hasRole(role) {
        return this.user?.role === role;
    }

    /**
     * Vérifier si l'utilisateur est premium
     * @returns {boolean} - True si premium
     */
    isPremium() {
        return this.hasRole('PREMIUM') || this.hasRole('SUPERADMIN');
    }

    /**
     * Vérifier si l'utilisateur est admin
     * @returns {boolean} - True si admin
     */
    isAdmin() {
        return this.hasRole('SUPERADMIN');
    }
}

// Création de l'instance globale
window.apiService = new ApiService();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}

console.log('🔌 ApiService initialisé et disponible globalement');

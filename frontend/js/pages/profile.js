/**
 * Profile Page - Script dynamique
 * Gère le profil utilisateur et ses préférences
 */

class ProfilePage {
    constructor() {
        this.userProfile = null;
        this.quotas = null;
        this.activityHistory = [];
        this.preferences = null;
        this.isEditing = {
            profile: false,
            password: false,
            preferences: false
        };
    }

    async init() {
        try {
            console.log('🚀 Initialisation Profile Page...');
            
            // Initialisation des services
            if (!window.apiService) {
                console.error('❌ ApiService non disponible');
                return;
            }

            // Chargement initial des données
            await this.loadUserProfile();
            await this.loadQuotas();
            await this.loadActivityHistory();
            await this.loadPreferences();
            
            // Configuration des événements
            this.setupEventListeners();
            
            // Rendu initial
            this.renderProfile();
            this.renderQuotas();
            this.renderActivity();
            this.renderPreferences();

            console.log('✅ Profile Page initialisée avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showError('Erreur lors du chargement des données');
        }
    }

    async loadUserProfile() {
        try {
            console.log('👤 Chargement du profil utilisateur...');
            
            // Simulation de données pour le développement
            this.userProfile = {
                id: 'user-123',
                firstName: 'Jean',
                lastName: 'Dupont',
                email: 'jean.dupont@example.com',
                company: 'Mon Entreprise',
                position: 'Directeur Marketing',
                phone: '+33 1 23 45 67 89',
                avatar: null,
                joinDate: new Date('2024-01-15'),
                lastLogin: new Date(),
                timezone: 'Europe/Paris',
                language: 'fr',
                emailVerified: true,
                phoneVerified: false,
                twoFactorEnabled: false,
                planType: 'premium',
                planExpiry: new Date('2025-01-15')
            };
            
            // TODO: Remplacer par un appel API réel
            // const response = await window.apiService.get('/users/profile');
            // this.userProfile = response.data;
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement du profil:', error);
            throw error;
        }
    }

    async loadQuotas() {
        try {
            console.log('📊 Chargement des quotas...');
            
            this.quotas = {
                forms: {
                    used: 12,
                    limit: 50,
                    percentage: 24
                },
                responses: {
                    used: 1247,
                    limit: 10000,
                    percentage: 12.47
                },
                storage: {
                    used: 2.1,
                    limit: 10,
                    percentage: 21,
                    unit: 'GB'
                },
                aiGenerations: {
                    used: 8,
                    limit: 25,
                    percentage: 32
                },
                emailsSent: {
                    used: 450,
                    limit: 2000,
                    percentage: 22.5
                }
            };
            
            // TODO: Appel API réel
            // const response = await window.apiService.get('/users/quotas');
            // this.quotas = response.data;
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des quotas:', error);
        }
    }

    async loadActivityHistory() {
        try {
            console.log('📜 Chargement de l\'historique...');
            
            const activities = [
                'login', 'form_created', 'form_published', 'response_received', 
                'report_generated', 'settings_updated', 'password_changed'
            ];
            
            this.activityHistory = [];
            for (let i = 0; i < 20; i++) {
                const activity = activities[Math.floor(Math.random() * activities.length)];
                const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
                
                this.activityHistory.push({
                    id: `activity-${i + 1}`,
                    type: activity,
                    description: this.getActivityDescription(activity),
                    date: date,
                    ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
                    device: Math.random() > 0.5 ? 'Desktop' : 'Mobile',
                    location: 'Paris, France'
                });
            }
            
            this.activityHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'activité:', error);
        }
    }

    async loadPreferences() {
        try {
            console.log('⚙️ Chargement des préférences...');
            
            this.preferences = {
                notifications: {
                    email: true,
                    browser: true,
                    formSubmissions: true,
                    weeklyReports: true,
                    systemUpdates: false,
                    marketing: false
                },
                privacy: {
                    profileVisibility: 'private',
                    dataRetention: '2years',
                    analyticsTracking: true,
                    shareUsageData: false
                },
                interface: {
                    theme: 'light',
                    language: 'fr',
                    timezone: 'Europe/Paris',
                    dateFormat: 'dd/mm/yyyy',
                    defaultFormView: 'list'
                }
            };
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des préférences:', error);
        }
    }

    setupEventListeners() {
        // Boutons d'édition
        const editProfileBtn = document.getElementById('edit-profile');
        const editPasswordBtn = document.getElementById('edit-password');
        const editPreferencesBtn = document.getElementById('edit-preferences');

        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this.toggleEdit('profile'));
        }

        if (editPasswordBtn) {
            editPasswordBtn.addEventListener('click', () => this.toggleEdit('password'));
        }

        if (editPreferencesBtn) {
            editPreferencesBtn.addEventListener('click', () => this.toggleEdit('preferences'));
        }

        // Formulaires
        const profileForm = document.getElementById('profile-form');
        const passwordForm = document.getElementById('password-form');
        const preferencesForm = document.getElementById('preferences-form');

        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));
        }

        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordSubmit(e));
        }

        if (preferencesForm) {
            preferencesForm.addEventListener('submit', (e) => this.handlePreferencesSubmit(e));
        }

        // Upload d'avatar
        const avatarInput = document.getElementById('avatar-upload');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }

        // Two-factor authentication
        const twoFactorToggle = document.getElementById('two-factor-toggle');
        if (twoFactorToggle) {
            twoFactorToggle.addEventListener('change', (e) => this.toggleTwoFactor(e.target.checked));
        }

        // Boutons d'action
        const exportDataBtn = document.getElementById('export-data');
        const deleteAccountBtn = document.getElementById('delete-account');

        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportUserData());
        }

        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => this.showDeleteConfirmation());
        }
    }

    renderProfile() {
        // Informations de base
        this.updateElement('user-name', `${this.userProfile.firstName} ${this.userProfile.lastName}`);
        this.updateElement('user-email', this.userProfile.email);
        this.updateElement('user-company', this.userProfile.company);
        this.updateElement('user-position', this.userProfile.position);
        this.updateElement('user-phone', this.userProfile.phone);
        this.updateElement('join-date', this.formatDate(this.userProfile.joinDate));
        this.updateElement('last-login', this.formatDateTime(this.userProfile.lastLogin));
        this.updateElement('plan-type', this.userProfile.planType);
        this.updateElement('plan-expiry', this.formatDate(this.userProfile.planExpiry));

        // Statuts de vérification
        this.updateVerificationStatus('email-verified', this.userProfile.emailVerified);
        this.updateVerificationStatus('phone-verified', this.userProfile.phoneVerified);
        this.updateToggleStatus('two-factor-status', this.userProfile.twoFactorEnabled);

        // Avatar
        if (this.userProfile.avatar) {
            const avatarImg = document.getElementById('user-avatar');
            if (avatarImg) {
                avatarImg.src = this.userProfile.avatar;
            }
        }

        // Formulaire de profil
        if (this.isEditing.profile) {
            this.populateProfileForm();
        }
    }

    renderQuotas() {
        if (!this.quotas) return;

        // Rendu de chaque quota
        Object.keys(this.quotas).forEach(quotaType => {
            const quota = this.quotas[quotaType];
            
            // Mise à jour des valeurs
            this.updateElement(`${quotaType}-used`, quota.used);
            this.updateElement(`${quotaType}-limit`, quota.limit);
            this.updateElement(`${quotaType}-percentage`, `${quota.percentage.toFixed(1)}%`);
            
            // Mise à jour de la barre de progression
            const progressBar = document.getElementById(`${quotaType}-progress`);
            if (progressBar) {
                progressBar.style.width = `${quota.percentage}%`;
                
                // Couleur selon le pourcentage
                if (quota.percentage > 80) {
                    progressBar.className = progressBar.className.replace(/bg-\w+-\d+/, 'bg-red-500');
                } else if (quota.percentage > 60) {
                    progressBar.className = progressBar.className.replace(/bg-\w+-\d+/, 'bg-orange-500');
                } else {
                    progressBar.className = progressBar.className.replace(/bg-\w+-\d+/, 'bg-blue-500');
                }
            }
        });
    }

    renderActivity() {
        const container = document.getElementById('activity-list');
        if (!container) return;

        container.innerHTML = this.activityHistory.slice(0, 10).map(activity => `
            <div class="flex items-start space-x-3 py-3">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="${this.getActivityIcon(activity.type)} text-blue-600 text-sm"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-900">${activity.description}</p>
                    <div class="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <span>${this.formatDateTime(activity.date)}</span>
                        <span>•</span>
                        <span>${activity.device}</span>
                        <span>•</span>
                        <span>${activity.location}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPreferences() {
        if (!this.preferences) return;

        // Notifications
        Object.keys(this.preferences.notifications).forEach(key => {
            const checkbox = document.getElementById(`notification-${key}`);
            if (checkbox) {
                checkbox.checked = this.preferences.notifications[key];
            }
        });

        // Privacy
        Object.keys(this.preferences.privacy).forEach(key => {
            const element = document.getElementById(`privacy-${key}`);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = this.preferences.privacy[key];
                } else {
                    element.value = this.preferences.privacy[key];
                }
            }
        });

        // Interface
        Object.keys(this.preferences.interface).forEach(key => {
            const element = document.getElementById(`interface-${key}`);
            if (element) {
                element.value = this.preferences.interface[key];
            }
        });
    }

    toggleEdit(section) {
        this.isEditing[section] = !this.isEditing[section];
        
        const form = document.getElementById(`${section}-form`);
        const display = document.getElementById(`${section}-display`);
        const editBtn = document.getElementById(`edit-${section}`);
        
        if (this.isEditing[section]) {
            if (form) form.classList.remove('hidden');
            if (display) display.classList.add('hidden');
            if (editBtn) editBtn.textContent = 'Annuler';
            
            if (section === 'profile') this.populateProfileForm();
        } else {
            if (form) form.classList.add('hidden');
            if (display) display.classList.remove('hidden');
            if (editBtn) editBtn.textContent = 'Modifier';
        }
    }

    populateProfileForm() {
        // Remplir le formulaire avec les données actuelles
        const fields = ['firstName', 'lastName', 'email', 'company', 'position', 'phone'];
        fields.forEach(field => {
            const input = document.getElementById(`profile-${field}`);
            if (input && this.userProfile[field]) {
                input.value = this.userProfile[field];
            }
        });
    }

    async handleProfileSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const updatedProfile = {};
            
            for (let [key, value] of formData.entries()) {
                updatedProfile[key.replace('profile-', '')] = value;
            }
            
            // TODO: Appel API pour mettre à jour le profil
            // await window.apiService.put('/users/profile', updatedProfile);
            
            // Mise à jour locale
            Object.assign(this.userProfile, updatedProfile);
            
            this.toggleEdit('profile');
            this.renderProfile();
            this.showSuccess('Profil mis à jour avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du profil:', error);
            this.showError('Erreur lors de la mise à jour du profil');
        }
    }

    async handlePasswordSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const currentPassword = formData.get('current-password');
            const newPassword = formData.get('new-password');
            const confirmPassword = formData.get('confirm-password');
            
            if (newPassword !== confirmPassword) {
                this.showError('Les mots de passe ne correspondent pas');
                return;
            }
            
            // TODO: Appel API pour changer le mot de passe
            // await window.apiService.post('/users/change-password', {
            //     currentPassword,
            //     newPassword
            // });
            
            this.toggleEdit('password');
            e.target.reset();
            this.showSuccess('Mot de passe mis à jour avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors du changement de mot de passe:', error);
            this.showError('Erreur lors du changement de mot de passe');
        }
    }

    async handlePreferencesSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const updatedPreferences = { ...this.preferences };
            
            // Traitement des checkboxes et autres champs
            for (let [key, value] of formData.entries()) {
                const [section, field] = key.split('-');
                if (updatedPreferences[section]) {
                    updatedPreferences[section][field] = value === 'on' ? true : value;
                }
            }
            
            // TODO: Appel API pour mettre à jour les préférences
            // await window.apiService.put('/users/preferences', updatedPreferences);
            
            this.preferences = updatedPreferences;
            this.toggleEdit('preferences');
            this.showSuccess('Préférences mises à jour avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour des préférences:', error);
            this.showError('Erreur lors de la mise à jour des préférences');
        }
    }

    async handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            // TODO: Upload de l'avatar
            // const formData = new FormData();
            // formData.append('avatar', file);
            // const response = await window.apiService.post('/users/avatar', formData);
            
            // Simulation d'upload
            const reader = new FileReader();
            reader.onload = (e) => {
                this.userProfile.avatar = e.target.result;
                this.renderProfile();
                this.showSuccess('Avatar mis à jour avec succès');
            };
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'upload de l\'avatar:', error);
            this.showError('Erreur lors de l\'upload de l\'avatar');
        }
    }

    async toggleTwoFactor(enabled) {
        try {
            // TODO: API call to enable/disable 2FA
            // await window.apiService.post('/users/two-factor', { enabled });
            
            this.userProfile.twoFactorEnabled = enabled;
            this.renderProfile();
            this.showSuccess(`Authentification à deux facteurs ${enabled ? 'activée' : 'désactivée'}`);
            
        } catch (error) {
            console.error('❌ Erreur lors de la configuration 2FA:', error);
            this.showError('Erreur lors de la configuration de l\'authentification à deux facteurs');
        }
    }

    async exportUserData() {
        try {
            console.log('📤 Export des données utilisateur...');
            
            // TODO: API call to export user data
            // const response = await window.apiService.get('/users/export');
            
            // Simulation d'export
            const userData = {
                profile: this.userProfile,
                preferences: this.preferences,
                activity: this.activityHistory,
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(userData, null, 2)], { 
                type: 'application/json' 
            });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `formease-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showSuccess('Données exportées avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'export:', error);
            this.showError('Erreur lors de l\'export des données');
        }
    }

    showDeleteConfirmation() {
        if (confirm('⚠️ ATTENTION: Cette action est irréversible.\n\nÊtes-vous sûr de vouloir supprimer définitivement votre compte et toutes vos données ?')) {
            if (confirm('Dernière confirmation: Tapez "SUPPRIMER" pour confirmer') === 'SUPPRIMER') {
                this.deleteAccount();
            }
        }
    }

    async deleteAccount() {
        try {
            // TODO: API call to delete account
            // await window.apiService.delete('/users/account');
            
            this.showSuccess('Compte supprimé. Redirection...');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erreur lors de la suppression:', error);
            this.showError('Erreur lors de la suppression du compte');
        }
    }

    getActivityDescription(type) {
        const descriptions = {
            login: 'Connexion à FormEase',
            form_created: 'Nouveau formulaire créé',
            form_published: 'Formulaire publié',
            response_received: 'Nouvelle réponse reçue',
            report_generated: 'Rapport généré',
            settings_updated: 'Paramètres mis à jour',
            password_changed: 'Mot de passe modifié'
        };
        return descriptions[type] || 'Activité inconnue';
    }

    getActivityIcon(type) {
        const icons = {
            login: 'ri-login-circle-line',
            form_created: 'ri-file-add-line',
            form_published: 'ri-send-plane-line',
            response_received: 'ri-mail-line',
            report_generated: 'ri-file-chart-line',
            settings_updated: 'ri-settings-line',
            password_changed: 'ri-key-line'
        };
        return icons[type] || 'ri-information-line';
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateVerificationStatus(id, verified) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = verified 
                ? '<i class="ri-check-line text-green-600"></i> Vérifié'
                : '<i class="ri-close-line text-red-600"></i> Non vérifié';
        }
    }

    updateToggleStatus(id, enabled) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = enabled 
                ? '<i class="ri-shield-check-line text-green-600"></i> Activé'
                : '<i class="ri-shield-line text-gray-600"></i> Désactivé';
        }
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatDateTime(date) {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showSuccess(message) {
        console.log('✅', message);
        // TODO: Implémenter les notifications toast
    }

    showError(message) {
        console.error('❌', message);
        // TODO: Implémenter les notifications toast
    }

    showInfo(message) {
        console.log('ℹ️', message);
        // TODO: Implémenter les notifications toast
    }
}

// Initialisation globale
let profilePage;

// Fonction d'initialisation appelée par l'auto-loader
window.initProfile = function() {
    profilePage = new ProfilePage();
    profilePage.init();
};

// Auto-initialisation si le DOM est déjà chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initProfile);
} else {
    window.initProfile();
}

/**
 * 🚀 FormEase - Service de Dynamisation des Pages
 * Service pour rendre les pages HTML dynamiques avec des données en temps réel
 */

class DynamicPageService {
    constructor() {
        this.api = window.apiService || new ApiService();
        this.refreshInterval = null;
        this.autoRefreshEnabled = true;
        this.currentPage = this.detectCurrentPage();
        
        console.log(`📄 Page dynamique détectée: ${this.currentPage}`);
        this.init();
    }

    /**
     * Détecter la page actuelle
     */
    detectCurrentPage() {
        const path = window.location.pathname;
        
        if (path.includes('ai-generator')) return 'ai-generator';
        if (path.includes('builder')) return 'builder';
        if (path.includes('dashboard/home')) return 'dashboard';
        if (path.includes('forms/management')) return 'forms-management';
        if (path.includes('analytics/dashboard')) return 'analytics';
        if (path.includes('email-tracking')) return 'email-tracking';
        if (path.includes('analytics/reports')) return 'reports';
        if (path.includes('qr-codes')) return 'qr-codes';
        if (path.includes('dashboard/profile')) return 'profile';
        
        return 'unknown';
    }

    /**
     * Initialiser la page dynamique
     */
    async init() {
        try {
            // Vérifier l'authentification
            if (!this.api.isAuthenticated()) {
                console.warn('⚠️ Utilisateur non authentifié');
                this.redirectToLogin();
                return;
            }

            // Charger les données initiales selon la page
            await this.loadPageData();
            
            // Configurer la mise à jour automatique
            if (this.autoRefreshEnabled) {
                this.startAutoRefresh();
            }

            // Écouter les événements
            this.setupEventListeners();

        } catch (error) {
            console.error('❌ Erreur d\'initialisation de la page:', error);
            this.showError('Erreur de chargement de la page');
        }
    }

    /**
     * Charger les données selon la page actuelle
     */
    async loadPageData() {
        const loader = this.showLoader('Chargement des données...');
        
        try {
            switch (this.currentPage) {
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
                case 'ai-generator':
                    await this.loadAIGeneratorData();
                    break;
                case 'builder':
                    await this.loadBuilderData();
                    break;
                case 'forms-management':
                    await this.loadFormsManagementData();
                    break;
                case 'analytics':
                    await this.loadAnalyticsData();
                    break;
                case 'email-tracking':
                    await this.loadEmailTrackingData();
                    break;
                case 'reports':
                    await this.loadReportsData();
                    break;
                case 'qr-codes':
                    await this.loadQRCodesData();
                    break;
                case 'profile':
                    await this.loadProfileData();
                    break;
                default:
                    console.warn('⚠️ Page non reconnue');
            }
        } finally {
            this.hideLoader(loader);
        }
    }

    // ========== DASHBOARD ==========
    
    async loadDashboardData() {
        try {
            console.log('📊 Chargement des données dashboard...');
            
            // Charger les statistiques principales
            const stats = await this.api.getDashboardStats();
            this.updateDashboardStats(stats.data);
            
            // Charger les formulaires récents
            const recentForms = await this.api.getRecentForms();
            this.updateRecentForms(recentForms.data);
            
            // Charger l'activité récente
            const recentActivity = await this.api.getRecentActivity();
            this.updateRecentActivity(recentActivity.data);
            
            // Charger les métriques pour les graphiques
            const metrics = await this.api.getDashboardMetrics();
            this.updateDashboardCharts(metrics.data);
            
        } catch (error) {
            console.error('❌ Erreur chargement dashboard:', error);
            this.showError('Impossible de charger les données du dashboard');
        }
    }

    updateDashboardStats(stats) {
        // Mettre à jour les cartes de statistiques
        this.updateElement('#total-forms', stats.totalForms || 0);
        this.updateElement('#total-responses', stats.totalResponses || 0);
        this.updateElement('#total-users', stats.totalUsers || 0);
        this.updateElement('#conversion-rate', `${stats.conversionRate || 0}%`);
        
        // Mettre à jour les changements
        this.updateElement('#forms-change', stats.formsChange || '+0%');
        this.updateElement('#responses-change', stats.responsesChange || '+0%');
        this.updateElement('#users-change', stats.usersChange || '+0%');
        this.updateElement('#conversion-change', stats.conversionChange || '+0%');
    }

    updateRecentForms(forms) {
        const container = document.getElementById('recent-forms-container');
        if (!container) return;

        container.innerHTML = forms.map(form => `
            <div class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div>
                    <h4 class="font-medium text-gray-900">${form.title}</h4>
                    <p class="text-sm text-gray-500">${form.responses} réponses • ${form.status}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm text-gray-500">${this.formatDate(form.createdAt)}</p>
                    <p class="text-xs text-gray-400">par ${form.author}</p>
                </div>
            </div>
        `).join('');
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recent-activity-container');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="flex items-start space-x-3 p-3">
                <div class="flex-shrink-0">
                    <i class="ri-${this.getActivityIcon(activity.type)} text-tremor-brand-DEFAULT"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm text-gray-900">${activity.description}</p>
                    <p class="text-xs text-gray-500">${this.formatDate(activity.timestamp)}</p>
                </div>
            </div>
        `).join('');
    }

    updateDashboardCharts(metrics) {
        // Mettre à jour les graphiques ApexCharts
        if (window.ApexCharts && metrics.chartData) {
            this.updateApexChart('forms-chart', metrics.chartData.forms);
            this.updateApexChart('responses-chart', metrics.chartData.responses);
        }
    }

    // ========== AI GENERATOR ==========
    
    async loadAIGeneratorData() {
        try {
            console.log('🤖 Chargement AI Generator...');
            
            // Vérifier les quotas IA de l'utilisateur
            const quotas = await this.api.request('/users/quotas');
            this.updateAIQuotas(quotas.data);
            
            // Charger l'historique des générations
            const history = await this.api.request('/ai/history');
            this.updateAIHistory(history.data);
            
        } catch (error) {
            console.error('❌ Erreur chargement AI Generator:', error);
        }
    }

    updateAIQuotas(quotas) {
        const aiQuotaElement = document.getElementById('ai-quota-usage');
        if (aiQuotaElement) {
            const percentage = (quotas.aiGenerations / quotas.aiGenerationsMax) * 100;
            aiQuotaElement.innerHTML = `
                <div class="flex justify-between mb-2">
                    <span>Générations IA utilisées</span>
                    <span>${quotas.aiGenerations}/${quotas.aiGenerationsMax}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-tremor-brand-DEFAULT h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
            `;
        }
    }

    updateAIHistory(history) {
        const container = document.getElementById('ai-history-container');
        if (!container) return;

        container.innerHTML = history.map(item => `
            <div class="p-3 border-l-4 border-tremor-brand-DEFAULT bg-gray-50 rounded">
                <p class="font-medium">${item.prompt}</p>
                <p class="text-sm text-gray-500">${this.formatDate(item.createdAt)}</p>
                <button onclick="dynamicPageService.reloadAIGeneration('${item.id}')" 
                        class="text-xs text-tremor-brand-DEFAULT hover:underline">
                    Réutiliser
                </button>
            </div>
        `).join('');
    }

    // ========== FORMS MANAGEMENT ==========
    
    async loadFormsManagementData() {
        try {
            console.log('📝 Chargement gestion des formulaires...');
            
            const forms = await this.api.getForms();
            this.updateFormsTable(forms.data);
            
        } catch (error) {
            console.error('❌ Erreur chargement formulaires:', error);
        }
    }

    updateFormsTable(forms) {
        const container = document.getElementById('forms-table-container');
        if (!container) return;

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formulaire</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Réponses</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${forms.map(form => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div class="text-sm font-medium text-gray-900">${form.title}</div>
                                        <div class="text-sm text-gray-500">${form.description || 'Aucune description'}</div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${form.submissionCount || 0}</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 py-1 text-xs font-medium rounded-full ${this.getStatusColor(form.isActive)}">
                                        ${form.isActive ? 'Actif' : 'Inactif'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${this.formatDate(form.createdAt)}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="dynamicPageService.editForm('${form.id}')" class="text-tremor-brand-DEFAULT hover:underline mr-3">Éditer</button>
                                    <button onclick="dynamicPageService.duplicateForm('${form.id}')" class="text-gray-600 hover:underline mr-3">Dupliquer</button>
                                    <button onclick="dynamicPageService.deleteForm('${form.id}')" class="text-red-600 hover:underline">Supprimer</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ========== ANALYTICS ==========
    
    async loadAnalyticsData() {
        try {
            console.log('📊 Chargement analytics...');
            
            const analytics = await this.api.getAnalytics();
            this.updateAnalyticsMetrics(analytics.data);
            
            // Charger les données des graphiques
            const chartData = await this.api.getAnalyticsChartData('overview');
            this.updateAnalyticsCharts(chartData.data);
            
        } catch (error) {
            console.error('❌ Erreur chargement analytics:', error);
        }
    }

    updateAnalyticsMetrics(metrics) {
        this.updateElement('#total-views', metrics.totalViews || 0);
        this.updateElement('#total-submissions', metrics.totalSubmissions || 0);
        this.updateElement('#conversion-rate-analytics', `${metrics.conversionRate || 0}%`);
        this.updateElement('#avg-completion-time', `${metrics.avgCompletionTime || 0}s`);
    }

    updateAnalyticsCharts(chartData) {
        if (window.ApexCharts) {
            this.updateApexChart('analytics-main-chart', chartData);
        }
    }

    // ========== EMAIL TRACKING ==========
    
    async loadEmailTrackingData() {
        try {
            console.log('📧 Chargement suivi emails...');
            
            const tracking = await this.api.getEmailTracking();
            const stats = await this.api.getEmailStats();
            
            this.updateEmailTrackingTable(tracking.data);
            this.updateEmailStats(stats.data);
            
        } catch (error) {
            console.error('❌ Erreur chargement email tracking:', error);
        }
    }

    updateEmailTrackingTable(emails) {
        const container = document.getElementById('email-tracking-container');
        if (!container) return;

        container.innerHTML = emails.map(email => `
            <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-medium text-gray-900">${email.subject}</h4>
                        <p class="text-sm text-gray-500">À: ${email.recipient}</p>
                    </div>
                    <div class="text-right">
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${this.getEmailStatusColor(email.status)}">
                            ${this.getEmailStatusLabel(email.status)}
                        </span>
                        <p class="text-xs text-gray-500 mt-1">${this.formatDate(email.sentAt)}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ========== QR CODES ==========
    
    async loadQRCodesData() {
        try {
            console.log('📱 Chargement QR Codes...');
            
            const qrCodes = await this.api.getQRCodes();
            const stats = await this.api.getQRCodeStats();
            
            this.updateQRCodesGrid(qrCodes.data);
            this.updateQRCodeStats(stats.data);
            
        } catch (error) {
            console.error('❌ Erreur chargement QR Codes:', error);
        }
    }

    updateQRCodesGrid(qrCodes) {
        const container = document.getElementById('qr-codes-grid');
        if (!container) return;

        container.innerHTML = qrCodes.map(qr => `
            <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div class="text-center">
                    <img src="${qr.imageUrl}" alt="QR Code" class="mx-auto mb-3 w-32 h-32">
                    <h4 class="font-medium text-gray-900">${qr.formTitle}</h4>
                    <p class="text-sm text-gray-500">${qr.scanCount} scans</p>
                    <div class="mt-3 space-x-2">
                        <button onclick="dynamicPageService.downloadQR('${qr.id}')" class="text-tremor-brand-DEFAULT hover:underline text-sm">
                            Télécharger
                        </button>
                        <button onclick="dynamicPageService.shareQR('${qr.id}')" class="text-gray-600 hover:underline text-sm">
                            Partager
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ========== PROFILE ==========
    
    async loadProfileData() {
        try {
            console.log('👤 Chargement profil utilisateur...');
            
            const profile = await this.api.getUserProfile();
            this.updateProfileForm(profile.data);
            
        } catch (error) {
            console.error('❌ Erreur chargement profil:', error);
        }
    }

    updateProfileForm(profile) {
        this.updateFormField('#profile-name', profile.name);
        this.updateFormField('#profile-email', profile.email);
        this.updateFormField('#profile-company', profile.company);
        this.updateFormField('#profile-phone', profile.phone);
        
        // Afficher les informations de compte
        this.updateElement('#account-role', profile.role);
        this.updateElement('#account-created', this.formatDate(profile.createdAt));
        this.updateElement('#account-plan', profile.plan || 'Gratuit');
    }

    // ========== UTILITIES ==========
    
    updateElement(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = value;
        }
    }

    updateFormField(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.value = value || '';
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getActivityIcon(type) {
        const icons = {
            'form_created': 'file-add-line',
            'form_submitted': 'send-plane-line',
            'user_registered': 'user-add-line',
            'payment_received': 'money-dollar-circle-line'
        };
        return icons[type] || 'information-line';
    }

    getStatusColor(isActive) {
        return isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800';
    }

    getEmailStatusColor(status) {
        const colors = {
            'sent': 'bg-blue-100 text-blue-800',
            'delivered': 'bg-green-100 text-green-800',
            'opened': 'bg-purple-100 text-purple-800',
            'clicked': 'bg-yellow-100 text-yellow-800',
            'bounced': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    getEmailStatusLabel(status) {
        const labels = {
            'sent': 'Envoyé',
            'delivered': 'Livré',
            'opened': 'Ouvert',
            'clicked': 'Cliqué',
            'bounced': 'Rejeté'
        };
        return labels[status] || 'Inconnu';
    }

    updateApexChart(containerId, data) {
        // Implementation spécifique pour ApexCharts
        console.log(`📊 Mise à jour du graphique: ${containerId}`, data);
    }

    showLoader(message = 'Chargement...') {
        const loader = document.createElement('div');
        loader.id = 'dynamic-loader';
        loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loader.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-lg">
                <div class="flex items-center space-x-3">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-tremor-brand-DEFAULT"></div>
                    <span>${message}</span>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
        return loader;
    }

    hideLoader(loader) {
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
    }

    showError(message) {
        // Implementation d'une notification d'erreur
        console.error('❌', message);
        
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    redirectToLogin() {
        window.location.href = '/frontend/pages/auth/login.html';
    }

    setupEventListeners() {
        // Écouter les changements de formulaires pour mise à jour en temps réel
        document.addEventListener('formUpdated', () => {
            this.loadPageData();
        });
        
        // Gérer la déconnexion automatique en cas d'erreur d'auth
        document.addEventListener('authError', () => {
            this.redirectToLogin();
        });
    }

    startAutoRefresh() {
        // Rafraîchissement automatique toutes les 2 minutes
        this.refreshInterval = setInterval(() => {
            this.loadPageData();
        }, 120000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // ========== ACTIONS ==========
    
    async editForm(formId) {
        window.location.href = `/frontend/pages/forms/builder.html?id=${formId}`;
    }

    async duplicateForm(formId) {
        try {
            const loader = this.showLoader('Duplication en cours...');
            await this.api.duplicateForm(formId);
            this.hideLoader(loader);
            this.loadPageData(); // Recharger la liste
        } catch (error) {
            this.hideLoader(loader);
            this.showError('Erreur lors de la duplication');
        }
    }

    async deleteForm(formId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce formulaire ?')) {
            try {
                const loader = this.showLoader('Suppression en cours...');
                await this.api.deleteForm(formId);
                this.hideLoader(loader);
                this.loadPageData(); // Recharger la liste
            } catch (error) {
                this.hideLoader(loader);
                this.showError('Erreur lors de la suppression');
            }
        }
    }

    async downloadQR(qrId) {
        // Implementation du téléchargement de QR code
        console.log('📱 Téléchargement QR:', qrId);
    }

    async shareQR(qrId) {
        // Implementation du partage de QR code
        console.log('📱 Partage QR:', qrId);
    }

    async reloadAIGeneration(generationId) {
        // Implementation du rechargement d'une génération IA
        console.log('🤖 Rechargement génération IA:', generationId);
    }
}

// Initialisation automatique quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.dynamicPageService = new DynamicPageService();
});

console.log('🚀 Service de pages dynamiques initialisé');

/**
 * 🏠 FormEase - Dashboard Principal
 * Script de dynamisation pour la page d'accueil du dashboard
 */

class Dashboard {
    constructor() {
        this.apiService = window.ApiService;
        this.dynamicPageService = window.DynamicPageService;
        this.realTimeChartsService = window.RealTimeChartsService;
        
        this.refreshInterval = null;
        this.charts = {};
        this.lastUpdateTime = null;
        
        this.init();
    }

    async init() {
        try {
            await this.loadDashboardData();
            this.setupQuickActions();
            this.setupEventListeners();
            this.initializeCharts();
            this.startAutoRefresh();
            
            console.log('✅ Dashboard principal initialisé');
        } catch (error) {
            console.error('❌ Erreur initialisation dashboard:', error);
            this.showError('Erreur lors du chargement du dashboard');
        }
    }

    async loadDashboardData() {
        try {
            // Afficher les états de chargement
            this.showLoadingStates();

            // Charger toutes les données en parallèle
            const [dashboardResponse, recentFormsResponse, activityResponse, chartsResponse] = await Promise.all([
                this.apiService.getDashboard(),
                this.apiService.getRecentForms({ limit: 5 }),
                this.apiService.getUserActivity({ limit: 10 }),
                this.apiService.getDashboardCharts()
            ]);

            // Mettre à jour les données
            if (dashboardResponse.success) {
                this.updateMetrics(dashboardResponse.data.metrics);
                this.updateUserInfo(dashboardResponse.data.user);
            }

            if (recentFormsResponse.success) {
                this.updateRecentForms(recentFormsResponse.data.forms);
            }

            if (activityResponse.success) {
                this.updateRecentActivity(activityResponse.data.activities);
            }

            if (chartsResponse.success) {
                this.updateCharts(chartsResponse.data);
            }

            // Marquer le temps de dernière mise à jour
            this.lastUpdateTime = new Date();
            this.updateLastRefreshTime();

        } catch (error) {
            console.error('❌ Erreur chargement dashboard:', error);
            this.showError('Erreur lors du chargement des données');
        }
    }

    async loadDashboardData() {
        this.uiUtils.showLoading();
        
        try {
            // Charger les statistiques
            await this.loadStats();
            
            // Charger les formulaires
            await this.loadForms();
            
            // Charger les soumissions récentes
            await this.loadRecentSubmissions();
            
            // Charger les données d'analytics
            await this.loadAnalytics();
            
        } catch (error) {
            console.error('Erreur chargement données:', error);
            throw error;
        } finally {
            this.uiUtils.hideLoading();
        }
    }

    async loadStats() {
        try {
            // Récupérer les stats depuis l'API
            const formsResponse = await this.apiService.getForms();
            const forms = formsResponse.data || [];
            
            // Calculer les statistiques
            this.stats = {
                totalForms: forms.length,
                totalSubmissions: forms.reduce((sum, form) => sum + (form.submissions?.length || 0), 0),
                totalViews: forms.reduce((sum, form) => sum + (form.views || 0), 0),
                conversionRate: this.calculateConversionRate(forms)
            };
        } catch (error) {
            console.error('Erreur chargement stats:', error);
            this.stats = {
                totalForms: 0,
                totalSubmissions: 0,
                totalViews: 0,
                conversionRate: 0
            };
        }
    }

    async loadForms() {
        try {
            const response = await this.apiService.getForms();
            this.forms = response.data || [];
            
            // Trier par date de création
            this.forms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Erreur chargement formulaires:', error);
            this.forms = [];
        }
    }

    async loadRecentSubmissions() {
        try {
            // Récupérer les soumissions récentes de tous les formulaires
            const submissions = [];
            for (const form of this.forms.slice(0, 5)) { // Limiter à 5 formulaires pour performance
                try {
                    const response = await this.apiService.getFormSubmissions(form.id);
                    if (response.data) {
                        submissions.push(...response.data.map(sub => ({
                            ...sub,
                            formTitle: form.title
                        })));
                    }
                } catch (error) {
                    console.warn(`Erreur récupération soumissions form ${form.id}:`, error);
                }
            }
            
            // Trier par date et prendre les 10 plus récentes
            this.recentSubmissions = submissions
                .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                .slice(0, 10);
                
        } catch (error) {
            console.error('Erreur chargement soumissions récentes:', error);
            this.recentSubmissions = [];
        }
    }

    async loadAnalytics() {
        try {
            // Données pour les graphiques Tremor
            const now = new Date();
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            // Simuler des données analytics en attendant l'API analytics complète
            this.analyticsData = {
                submissionsChart: this.generateSubmissionsChartData(),
                formsPerformance: this.generateFormsPerformanceData(),
                conversionTrend: this.generateConversionTrendData()
            };
        } catch (error) {
            console.error('Erreur chargement analytics:', error);
            this.analyticsData = {};
        }
    }

    renderDashboard() {
        this.renderWelcomeSection();
        this.renderStatsCards();
        this.renderChartsSection();
        this.renderFormsSection();
        this.renderRecentSubmissions();
        this.renderQuickActions();
    }

    renderWelcomeSection() {
        const welcomeElement = document.getElementById('welcome-user');
        if (welcomeElement && this.user) {
            welcomeElement.textContent = `Bonjour, ${this.user.firstName || this.user.email}`;
        }
    }

    renderStatsCards() {
        // Carte Total Formulaires
        this.updateStatCard('total-forms', this.stats.totalForms, 'Formulaires créés');
        
        // Carte Total Soumissions
        this.updateStatCard('total-submissions', this.stats.totalSubmissions, 'Soumissions reçues');
        
        // Carte Total Vues
        this.updateStatCard('total-views', this.stats.totalViews, 'Vues totales');
        
        // Carte Taux Conversion
        this.updateStatCard('conversion-rate', `${this.stats.conversionRate}%`, 'Taux de conversion');
    }

    updateStatCard(cardId, value, label) {
        const card = document.getElementById(cardId);
        if (card) {
            const valueElement = card.querySelector('.stat-value');
            const labelElement = card.querySelector('.stat-label');
            
            if (valueElement) valueElement.textContent = value;
            if (labelElement) labelElement.textContent = label;
        }
    }

    renderChartsSection() {
        // Graphique des soumissions (utilise les données Tremor existantes)
        this.renderSubmissionsChart();
        
        // Graphique performance des formulaires
        this.renderFormsPerformanceChart();
    }

    renderSubmissionsChart() {
        const chartContainer = document.getElementById('submissions-chart');
        if (!chartContainer) return;

        // Utiliser les données dynamiques pour mettre à jour le graphique Tremor existant
        // Le graphique Tremor est déjà configuré dans le HTML, on met juste à jour les données
        const chartData = this.analyticsData.submissionsChart;
        
        // Dispatch un événement pour mettre à jour le graphique
        chartContainer.dispatchEvent(new CustomEvent('updateChartData', {
            detail: { data: chartData }
        }));
    }

    renderFormsPerformanceChart() {
        const chartContainer = document.getElementById('forms-performance-chart');
        if (!chartContainer) return;

        const performanceData = this.analyticsData.formsPerformance;
        
        chartContainer.dispatchEvent(new CustomEvent('updateChartData', {
            detail: { data: performanceData }
        }));
    }

    renderFormsSection() {
        const formsContainer = document.getElementById('recent-forms-list');
        if (!formsContainer) return;

        if (this.forms.length === 0) {
            formsContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="ri-file-text-line text-4xl mb-4"></i>
                    <p>Aucun formulaire créé</p>
                    <button onclick="window.location.href='/frontend/pages/forms/ai-generator.html'" 
                            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Créer mon premier formulaire
                    </button>
                </div>
            `;
            return;
        }

        const formsHTML = this.forms.slice(0, 5).map(form => `
            <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                 onclick="dashboard.viewForm('${form.id}')">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-900 mb-2">${this.escapeHtml(form.title)}</h3>
                        <p class="text-gray-600 text-sm mb-3">${this.escapeHtml(form.description || 'Aucune description')}</p>
                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                            <span class="flex items-center">
                                <i class="ri-eye-line mr-1"></i>
                                ${form.views || 0} vues
                            </span>
                            <span class="flex items-center">
                                <i class="ri-file-text-line mr-1"></i>
                                ${form.submissions?.length || 0} soumissions
                            </span>
                            <span class="flex items-center">
                                <i class="ri-calendar-line mr-1"></i>
                                ${this.formatDate(form.createdAt)}
                            </span>
                        </div>
                    </div>
                    <div class="ml-4">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                   ${form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                            ${form.isActive ? 'Actif' : 'Inactif'}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');

        formsContainer.innerHTML = formsHTML;
    }

    renderRecentSubmissions() {
        const submissionsContainer = document.getElementById('recent-submissions-list');
        if (!submissionsContainer) return;

        if (this.recentSubmissions.length === 0) {
            submissionsContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="ri-inbox-line text-4xl mb-4"></i>
                    <p>Aucune soumission récente</p>
                </div>
            `;
            return;
        }

        const submissionsHTML = this.recentSubmissions.map(submission => `
            <div class="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                 onclick="dashboard.viewSubmission('${submission.id}')">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900">${this.escapeHtml(submission.formTitle)}</h4>
                        <p class="text-sm text-gray-600 mt-1">
                            Soumis par ${this.escapeHtml(submission.email || 'Anonyme')}
                        </p>
                        <span class="text-xs text-gray-500">${this.formatDate(submission.submittedAt)}</span>
                    </div>
                    <div class="ml-4">
                        <i class="ri-arrow-right-line text-gray-400"></i>
                    </div>
                </div>
            </div>
        `).join('');

        submissionsContainer.innerHTML = submissionsHTML;
    }

    renderQuickActions() {
        const actionsContainer = document.getElementById('quick-actions');
        if (!actionsContainer) return;

        actionsContainer.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onclick="window.location.href='/frontend/pages/forms/ai-generator.html'"
                        class="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                    <i class="ri-magic-line text-xl mb-2"></i>
                    <span class="block text-sm font-medium">Générateur IA</span>
                </button>
                <button onclick="window.location.href='/frontend/pages/forms/builder.html'"
                        class="p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
                    <i class="ri-tools-line text-xl mb-2"></i>
                    <span class="block text-sm font-medium">Builder</span>
                </button>
                <button onclick="window.location.href='/frontend/pages/analytics/reports.html'"
                        class="p-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                    <i class="ri-bar-chart-line text-xl mb-2"></i>
                    <span class="block text-sm font-medium">Analytics</span>
                </button>
                <button onclick="window.location.href='/frontend/pages/forms/manage.html'"
                        class="p-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors">
                    <i class="ri-settings-line text-xl mb-2"></i>
                    <span class="block text-sm font-medium">Gérer</span>
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        // Rafraîchir les données
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }

        // Export données
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
    }

    async refreshDashboard() {
        this.notificationSystem.info('Actualisation des données...');
        try {
            await this.loadDashboardData();
            this.renderDashboard();
            this.notificationSystem.success('Données actualisées');
        } catch (error) {
            console.error('Erreur refresh:', error);
            this.notificationSystem.error('Erreur lors de l\'actualisation');
        }
    }

    async exportData() {
        try {
            const exportData = {
                stats: this.stats,
                forms: this.forms,
                submissions: this.recentSubmissions,
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `formease-dashboard-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.notificationSystem.success('Données exportées');
        } catch (error) {
            console.error('Erreur export:', error);
            this.notificationSystem.error('Erreur lors de l\'export');
        }
    }

    startPeriodicUpdates() {
        // Actualiser les stats toutes les 5 minutes
        setInterval(() => {
            this.loadStats().then(() => {
                this.renderStatsCards();
            }).catch(error => {
                console.error('Erreur actualisation périodique:', error);
            });
        }, 5 * 60 * 1000);
    }

    // Actions pour les éléments cliquables
    viewForm(formId) {
        window.location.href = `/frontend/pages/forms/view.html?id=${formId}`;
    }

    viewSubmission(submissionId) {
        window.location.href = `/frontend/pages/submissions/view.html?id=${submissionId}`;
    }

    // Utilitaires
    calculateConversionRate(forms) {
        const totalViews = forms.reduce((sum, form) => sum + (form.views || 0), 0);
        const totalSubmissions = forms.reduce((sum, form) => sum + (form.submissions?.length || 0), 0);
        
        if (totalViews === 0) return 0;
        return Math.round((totalSubmissions / totalViews) * 100);
    }

    generateSubmissionsChartData() {
        // Générer des données pour les 30 derniers jours
        const data = [];
        const now = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            
            // Calculer les soumissions réelles pour cette date
            const daySubmissions = this.recentSubmissions.filter(sub => {
                const subDate = new Date(sub.submittedAt).toISOString().split('T')[0];
                return subDate === dateStr;
            }).length;
            
            data.push({
                date: dateStr,
                submissions: daySubmissions,
                views: Math.max(daySubmissions * 2, Math.floor(Math.random() * 20)) // Estimation des vues
            });
        }
        
        return data;
    }

    generateFormsPerformanceData() {
        return this.forms.slice(0, 5).map(form => ({
            name: form.title.substring(0, 20) + (form.title.length > 20 ? '...' : ''),
            submissions: form.submissions?.length || 0,
            views: form.views || 0,
            conversion: form.views > 0 ? Math.round((form.submissions?.length || 0) / form.views * 100) : 0
        }));
    }

    generateConversionTrendData() {
        // Données de tendance de conversion sur 7 jours
        const data = [];
        const now = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            data.push({
                date: date.toISOString().split('T')[0],
                rate: Math.max(this.stats.conversionRate + (Math.random() - 0.5) * 10, 0)
            });
        }
        
        return data;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialiser le dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new DashboardController();
});

// Export pour usage global
window.DashboardController = DashboardController;

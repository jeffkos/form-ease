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

    showLoadingStates() {
        // États de chargement pour les métriques
        document.querySelectorAll('[data-metric]').forEach(element => {
            element.innerHTML = `
                <div class="animate-pulse">
                    <div class="h-6 bg-gray-200 rounded w-16 mb-2"></div>
                    <div class="h-4 bg-gray-200 rounded w-24"></div>
                </div>
            `;
        });

        // États de chargement pour les conteneurs
        document.querySelectorAll('[data-loading]').forEach(element => {
            element.innerHTML = `
                <div class="flex items-center justify-center p-6">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span class="ml-3 text-gray-600">Chargement...</span>
                </div>
            `;
        });
    }

    updateMetrics(metrics) {
        if (!metrics) return;

        // Métrique : Total des formulaires
        this.updateMetricCard('total-forms', {
            value: metrics.totalForms || 0,
            change: metrics.formsChange || 0,
            label: 'Formulaires'
        });

        // Métrique : Total des réponses
        this.updateMetricCard('total-responses', {
            value: metrics.totalResponses || 0,
            change: metrics.responsesChange || 0,
            label: 'Réponses'
        });

        // Métrique : Taux de conversion
        this.updateMetricCard('conversion-rate', {
            value: `${(metrics.conversionRate || 0).toFixed(1)}%`,
            change: metrics.conversionChange || 0,
            label: 'Conversion'
        });

        // Métrique : Activité récente
        this.updateMetricCard('recent-activity-count', {
            value: metrics.recentActivityCount || 0,
            change: metrics.activityChange || 0,
            label: 'Activités (24h)'
        });

        // Métrique : Vues totales
        this.updateMetricCard('total-views', {
            value: metrics.totalViews || 0,
            change: metrics.viewsChange || 0,
            label: 'Vues'
        });

        // Métrique : Utilisateurs actifs
        this.updateMetricCard('active-users', {
            value: metrics.activeUsers || 0,
            change: metrics.usersChange || 0,
            label: 'Utilisateurs actifs'
        });
    }

    updateMetricCard(elementId, data) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const changeClass = data.change >= 0 ? 'text-green-600' : 'text-red-600';
        const changeIcon = data.change >= 0 ? '↗️' : '↘️';
        const changeText = data.change >= 0 ? `+${data.change.toFixed(1)}%` : `${data.change.toFixed(1)}%`;

        element.innerHTML = `
            <div class="tremor-Card bg-white p-6 rounded-lg shadow-sm border">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-tremor-default text-tremor-content">${data.label}</p>
                        <p class="text-3xl text-tremor-content-strong font-semibold">${data.value}</p>
                    </div>
                    <div class="text-right">
                        <span class="${changeClass} text-sm font-medium flex items-center">
                            ${changeIcon} ${changeText}
                        </span>
                        <p class="text-xs text-gray-500 mt-1">vs mois dernier</p>
                    </div>
                </div>
            </div>
        `;
    }

    updateUserInfo(user) {
        if (!user) return;

        const userInfoElement = document.getElementById('user-info-section');
        if (!userInfoElement) return;

        const planBadge = this.getPlanBadge(user.plan);
        const quotaProgress = user.quotaUsed && user.quotaLimit ? 
            Math.round((user.quotaUsed / user.quotaLimit) * 100) : 0;

        userInfoElement.innerHTML = `
            <div class="tremor-Card bg-white p-6 rounded-lg shadow-sm border">
                <div class="flex items-start justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span class="text-xl">${user.name?.charAt(0) || '👤'}</span>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900">${user.name || 'Utilisateur'}</h3>
                            <p class="text-sm text-gray-600">${user.email || ''}</p>
                            <div class="flex items-center space-x-2 mt-1">
                                ${planBadge}
                                <span class="text-xs text-gray-500">
                                    Membre depuis ${this.formatDate(user.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-medium text-gray-900">Quota utilisé</p>
                        <p class="text-2xl font-bold text-blue-600">${user.quotaUsed || 0}/${user.quotaLimit || 'illimité'}</p>
                        ${user.quotaLimit ? `
                            <div class="w-24 bg-gray-200 rounded-full h-2 mt-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: ${quotaProgress}%"></div>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">${quotaProgress}% utilisé</p>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getPlanBadge(plan) {
        const planConfig = {
            'free': { color: 'gray', text: 'Gratuit' },
            'premium': { color: 'blue', text: 'Premium' },
            'enterprise': { color: 'purple', text: 'Enterprise' }
        };

        const config = planConfig[plan?.toLowerCase()] || planConfig.free;
        return `
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800">
                ${config.text}
            </span>
        `;
    }

    updateRecentForms(forms) {
        const container = document.getElementById('recent-forms-container');
        if (!container) return;

        if (!forms || forms.length === 0) {
            container.innerHTML = `
                <div class="tremor-Card bg-white p-6 rounded-lg shadow-sm border">
                    <h3 class="font-semibold text-gray-900 mb-4">Formulaires récents</h3>
                    <div class="text-center py-8">
                        <div class="text-4xl mb-2">📝</div>
                        <p class="text-gray-500 mb-4">Aucun formulaire créé</p>
                        <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                                data-quick-action="create-form">
                            Créer votre premier formulaire
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const formsHTML = forms.map(form => `
            <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div class="flex-1">
                    <h4 class="font-medium text-gray-900">${form.title}</h4>
                    <div class="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>📊 ${form.responsesCount || 0} réponses</span>
                        <span>👁️ ${form.viewsCount || 0} vues</span>
                        <span>${this.formatDate(form.updatedAt)}</span>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button class="text-blue-600 hover:text-blue-800 text-sm"
                            onclick="window.open('/api/forms/${form.id}/preview', '_blank')">
                        Voir
                    </button>
                    <button class="text-green-600 hover:text-green-800 text-sm"
                            onclick="window.location.href='/frontend/pages/forms/builder.html?id=${form.id}'">
                        Modifier
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="tremor-Card bg-white p-6 rounded-lg shadow-sm border">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-gray-900">Formulaires récents</h3>
                    <button class="text-blue-600 hover:text-blue-800 text-sm"
                            onclick="window.location.href='/frontend/pages/forms/management.html'">
                        Voir tous →
                    </button>
                </div>
                <div class="space-y-2">
                    ${formsHTML}
                </div>
            </div>
        `;
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recent-activity-container');
        if (!container) return;

        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div class="tremor-Card bg-white p-6 rounded-lg shadow-sm border">
                    <h3 class="font-semibold text-gray-900 mb-4">Activité récente</h3>
                    <div class="text-center py-8">
                        <div class="text-4xl mb-2">📈</div>
                        <p class="text-gray-500">Aucune activité récente</p>
                    </div>
                </div>
            `;
            return;
        }

        const activitiesHTML = activities.map(activity => `
            <div class="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    ${this.getActivityIcon(activity.type)}
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">${activity.description}</p>
                    <p class="text-sm text-gray-500">${activity.details || ''}</p>
                    <p class="text-xs text-gray-400">${this.formatTimeAgo(activity.timestamp)}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="tremor-Card bg-white p-6 rounded-lg shadow-sm border">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-gray-900">Activité récente</h3>
                    <button class="text-blue-600 hover:text-blue-800 text-sm"
                            onclick="window.location.href='/frontend/pages/analytics/dashboard.html'">
                        Voir détails →
                    </button>
                </div>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                    ${activitiesHTML}
                </div>
            </div>
        `;
    }

    getActivityIcon(type) {
        const icons = {
            'form_created': '📝',
            'form_submitted': '✅',
            'form_viewed': '👁️',
            'form_shared': '🔗',
            'user_login': '🔑',
            'export_data': '📤',
            'ai_generated': '🤖'
        };
        return icons[type] || '📋';
    }

    async updateCharts(chartsData) {
        if (!this.realTimeChartsService || !chartsData) return;

        try {
            // Graphique des formulaires (vue d'ensemble)
            if (chartsData.formsOverview) {
                await this.createFormsOverviewChart(chartsData.formsOverview);
            }

            // Graphique de l'activité (timeline)
            if (chartsData.activityTimeline) {
                await this.createActivityTimelineChart(chartsData.activityTimeline);
            }

        } catch (error) {
            console.error('❌ Erreur mise à jour graphiques:', error);
        }
    }

    async createFormsOverviewChart(data) {
        const chartContainer = document.getElementById('dashboard-forms-chart');
        if (!chartContainer) return;

        const options = {
            chart: {
                type: 'line',
                height: 300,
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            series: [
                {
                    name: 'Formulaires créés',
                    data: data.created.map(item => ({
                        x: new Date(item.date).getTime(),
                        y: item.count
                    })),
                    color: '#3B82F6'
                },
                {
                    name: 'Réponses reçues',
                    data: data.responses.map(item => ({
                        x: new Date(item.date).getTime(),
                        y: item.count
                    })),
                    color: '#10B981'
                }
            ],
            xaxis: {
                type: 'datetime',
                labels: {
                    format: 'dd/MM'
                }
            },
            yaxis: {
                title: {
                    text: 'Nombre'
                }
            },
            title: {
                text: 'Vue d\'ensemble des formulaires',
                align: 'left',
                style: {
                    fontSize: '16px',
                    fontWeight: 600
                }
            },
            tooltip: {
                shared: true,
                intersect: false,
                x: {
                    format: 'dd/MM/yyyy'
                }
            },
            legend: {
                position: 'top'
            },
            stroke: {
                curve: 'smooth',
                width: 3
            }
        };

        this.charts.formsOverview = await this.realTimeChartsService.createChart(chartContainer, options);
    }

    async createActivityTimelineChart(data) {
        const chartContainer = document.getElementById('dashboard-activity-chart');
        if (!chartContainer) return;

        const options = {
            chart: {
                type: 'bar',
                height: 300
            },
            series: [{
                name: 'Activités',
                data: data.map(item => ({
                    x: item.hour + ':00',
                    y: item.count
                }))
            }],
            xaxis: {
                title: {
                    text: 'Heures'
                }
            },
            yaxis: {
                title: {
                    text: 'Nombre d\'activités'
                }
            },
            title: {
                text: 'Activité par heure (24h)',
                align: 'left',
                style: {
                    fontSize: '16px',
                    fontWeight: 600
                }
            },
            colors: ['#F59E0B'],
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    columnWidth: '60%'
                }
            },
            tooltip: {
                y: {
                    formatter: (value) => `${value} activité${value > 1 ? 's' : ''}`
                }
            }
        };

        this.charts.activityTimeline = await this.realTimeChartsService.createChart(chartContainer, options);
    }

    setupQuickActions() {
        // Actions rapides avec data-quick-action
        document.addEventListener('click', (e) => {
            const quickAction = e.target.dataset.quickAction;
            if (quickAction) {
                this.handleQuickAction(quickAction);
            }
        });
    }

    handleQuickAction(action) {
        switch (action) {
            case 'create-form':
                window.location.href = '/frontend/pages/forms/builder.html';
                break;
            case 'view-analytics':
                window.location.href = '/frontend/pages/analytics/dashboard.html';
                break;
            case 'manage-forms':
                window.location.href = '/frontend/pages/forms/management.html';
                break;
            case 'ai-generator':
                window.location.href = '/frontend/pages/forms/ai-generator.html';
                break;
            case 'view-profile':
                window.location.href = '/frontend/pages/dashboard/profile.html';
                break;
            default:
                console.log(`Action rapide: ${action}`);
        }
    }

    setupEventListeners() {
        // Bouton de rafraîchissement manuel
        document.getElementById('refresh-dashboard')?.addEventListener('click', () => {
            this.loadDashboardData();
        });

        // Liens de navigation
        document.querySelectorAll('[data-nav]').forEach(link => {
            link.addEventListener('click', (e) => {
                const destination = e.target.dataset.nav;
                if (destination) {
                    window.location.href = destination;
                }
            });
        });
    }

    initializeCharts() {
        // Préparer les conteneurs de graphiques
        console.log('📊 Initialisation des conteneurs de graphiques...');
    }

    startAutoRefresh() {
        // Rafraîchir toutes les 2 minutes
        this.refreshInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.loadDashboardData();
            }
        }, 2 * 60 * 1000);
    }

    updateLastRefreshTime() {
        const refreshElement = document.getElementById('last-refresh-time');
        if (refreshElement && this.lastUpdateTime) {
            refreshElement.textContent = `Dernière mise à jour: ${this.formatTime(this.lastUpdateTime)}`;
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Non défini';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatTime(date) {
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'À l\'instant';
        if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        
        return this.formatDate(dateString);
    }

    showSuccess(message) {
        this.dynamicPageService?.showSuccess?.(message) || console.log('✅', message);
    }

    showError(message) {
        this.dynamicPageService?.showError?.(message) || console.error('❌', message);
    }

    destroy() {
        // Nettoyer les intervalles
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Détruire les graphiques
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
    }
}

// Initialiser quand la page est chargée
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboard = new Dashboard();
    });
} else {
    window.dashboard = new Dashboard();
}

// Nettoyage lors du déchargement de la page
window.addEventListener('beforeunload', () => {
    if (window.dashboard) {
        window.dashboard.destroy();
    }
});

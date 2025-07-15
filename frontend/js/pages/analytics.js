/**
 * 📊 FormEase - Dashboard Analytics
 * Script de dynamisation pour le dashboard analytics avec graphiques temps réel
 */

class AnalyticsDashboard {
    constructor() {
        this.apiService = window.ApiService;
        this.dynamicPageService = window.DynamicPageService;
        this.realTimeChartsService = window.RealTimeChartsService;
        
        this.currentPeriod = '30d';
        this.selectedFormId = null;
        this.refreshInterval = null;
        this.charts = {};
        
        this.init();
    }

    async init() {
        try {
            // Récupérer l'ID du formulaire depuis l'URL si présent
            const urlParams = new URLSearchParams(window.location.search);
            this.selectedFormId = urlParams.get('form');
            
            await this.loadAnalyticsData();
            this.setupEventListeners();
            this.setupFilters();
            this.initializeCharts();
            this.startAutoRefresh();
            
            console.log('✅ Dashboard Analytics initialisé');
        } catch (error) {
            console.error('❌ Erreur initialisation analytics:', error);
            this.showError('Erreur lors du chargement du dashboard');
        }
    }

    async loadAnalyticsData() {
        try {
            // Afficher les indicateurs de chargement
            this.showLoadingStates();

            // Charger les données analytics
            const analyticsPromise = this.apiService.getAnalytics({
                period: this.currentPeriod,
                formId: this.selectedFormId
            });

            // Charger les données des graphiques
            const chartsPromise = this.apiService.getAnalyticsCharts({
                period: this.currentPeriod,
                formId: this.selectedFormId
            });

            const [analyticsResponse, chartsResponse] = await Promise.all([
                analyticsPromise,
                chartsPromise
            ]);

            if (analyticsResponse.success) {
                this.updateMetrics(analyticsResponse.data.metrics);
                this.updateTopForms(analyticsResponse.data.topForms);
                this.updateRecentActivity(analyticsResponse.data.recentActivity);
            }

            if (chartsResponse.success) {
                this.updateCharts(chartsResponse.data);
            }

        } catch (error) {
            console.error('❌ Erreur chargement analytics:', error);
            this.showError('Erreur lors du chargement des données');
        }
    }

    showLoadingStates() {
        // Indicateurs de chargement pour les métriques
        document.querySelectorAll('[data-metric]').forEach(element => {
            element.innerHTML = `
                <div class="animate-pulse">
                    <div class="h-4 bg-gray-200 rounded mb-2"></div>
                    <div class="h-6 bg-gray-200 rounded"></div>
                </div>
            `;
        });

        // Indicateurs de chargement pour les graphiques
        document.querySelectorAll('[data-chart-container]').forEach(element => {
            element.innerHTML = `
                <div class="flex items-center justify-center h-64">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span class="ml-3 text-gray-600">Chargement du graphique...</span>
                </div>
            `;
        });
    }

    updateMetrics(metrics) {
        if (!metrics) return;

        // Métriques principales
        this.updateMetric('total-views', metrics.totalViews, metrics.viewsChange);
        this.updateMetric('total-submissions', metrics.totalSubmissions, metrics.submissionsChange);
        this.updateMetric('conversion-rate', `${metrics.conversionRate.toFixed(1)}%`, metrics.conversionChange);
        this.updateMetric('avg-completion-time', this.formatDuration(metrics.avgCompletionTime), metrics.timeChange);
        this.updateMetric('bounce-rate', `${metrics.bounceRate.toFixed(1)}%`, metrics.bounceChange);
        this.updateMetric('user-satisfaction', `${metrics.userSatisfaction.toFixed(1)}/5`, metrics.satisfactionChange);

        // Métriques par appareil
        this.updateDeviceMetrics(metrics.deviceMetrics);

        // Métriques par source de trafic
        this.updateTrafficMetrics(metrics.trafficSources);
    }

    updateMetric(elementId, value, change) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const changeClass = change >= 0 ? 'text-green-600' : 'text-red-600';
        const changeIcon = change >= 0 ? '↗️' : '↘️';
        const changeText = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;

        element.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-2xl font-bold text-gray-900">${value}</span>
                <span class="${changeClass} text-sm font-medium">
                    ${changeIcon} ${changeText}
                </span>
            </div>
        `;
    }

    updateDeviceMetrics(deviceMetrics) {
        const container = document.getElementById('device-metrics');
        if (!container || !deviceMetrics) return;

        const devicesHTML = Object.entries(deviceMetrics).map(([device, data]) => `
            <div class="bg-white p-4 rounded-lg border">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600">${this.getDeviceIcon(device)} ${device}</span>
                    <span class="text-sm text-gray-500">${data.percentage.toFixed(1)}%</span>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${data.percentage}%"></div>
                    </div>
                    <span class="text-sm font-medium">${data.count}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = devicesHTML;
    }

    getDeviceIcon(device) {
        const icons = {
            'desktop': '🖥️',
            'mobile': '📱',
            'tablet': '📱',
            'other': '💻'
        };
        return icons[device.toLowerCase()] || '📱';
    }

    updateTrafficMetrics(trafficSources) {
        const container = document.getElementById('traffic-sources');
        if (!container || !trafficSources) return;

        const sourcesHTML = Object.entries(trafficSources).map(([source, data]) => `
            <div class="bg-white p-4 rounded-lg border">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600">${this.getSourceIcon(source)} ${source}</span>
                    <span class="text-sm text-gray-500">${data.percentage.toFixed(1)}%</span>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                        <div class="bg-green-600 h-2 rounded-full" style="width: ${data.percentage}%"></div>
                    </div>
                    <span class="text-sm font-medium">${data.visits}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = sourcesHTML;
    }

    getSourceIcon(source) {
        const icons = {
            'direct': '🔗',
            'search': '🔍',
            'social': '📱',
            'referral': '🌐',
            'email': '📧',
            'paid': '💰'
        };
        return icons[source.toLowerCase()] || '🌐';
    }

    updateTopForms(topForms) {
        const container = document.getElementById('top-forms-list');
        if (!container || !topForms) return;

        if (topForms.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Aucun formulaire trouvé</p>';
            return;
        }

        const formsHTML = topForms.map((form, index) => `
            <div class="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="text-lg font-bold text-gray-400">#${index + 1}</span>
                            <h4 class="font-semibold text-gray-900">${form.title}</h4>
                        </div>
                        <div class="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span class="text-gray-500">Vues:</span>
                                <span class="font-medium ml-1">${form.views}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Réponses:</span>
                                <span class="font-medium ml-1">${form.submissions}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Taux:</span>
                                <span class="font-medium ml-1">${form.conversionRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-800 text-sm"
                                onclick="window.open('/frontend/pages/analytics/dashboard.html?form=${form.id}', '_blank')">
                            📊 Détails
                        </button>
                        <button class="text-green-600 hover:text-green-800 text-sm"
                                onclick="window.open('/api/forms/${form.id}/preview', '_blank')">
                            👁️ Voir
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = formsHTML;
    }

    updateRecentActivity(recentActivity) {
        const container = document.getElementById('recent-activity-list');
        if (!container || !recentActivity) return;

        if (recentActivity.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Aucune activité récente</p>';
            return;
        }

        const activitiesHTML = recentActivity.map(activity => `
            <div class="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    ${this.getActivityIcon(activity.type)}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">${activity.description}</p>
                    <p class="text-sm text-gray-500">${activity.formTitle}</p>
                    <p class="text-xs text-gray-400">${this.formatDate(activity.timestamp)}</p>
                </div>
                ${activity.value ? `<div class="flex-shrink-0 text-sm font-medium text-gray-900">${activity.value}</div>` : ''}
            </div>
        `).join('');

        container.innerHTML = activitiesHTML;
    }

    getActivityIcon(type) {
        const icons = {
            'submission': '📝',
            'view': '👁️',
            'share': '🔗',
            'export': '📤',
            'edit': '✏️'
        };
        return icons[type] || '📋';
    }

    async updateCharts(chartsData) {
        if (!this.realTimeChartsService || !chartsData) return;

        try {
            // Graphique des vues et soumissions dans le temps
            if (chartsData.viewsOverTime && chartsData.submissionsOverTime) {
                await this.updateTimeSeriesChart(chartsData.viewsOverTime, chartsData.submissionsOverTime);
            }

            // Graphique en secteurs des sources de trafic
            if (chartsData.trafficSources) {
                await this.updateTrafficChart(chartsData.trafficSources);
            }

            // Graphique des appareils
            if (chartsData.deviceStats) {
                await this.updateDeviceChart(chartsData.deviceStats);
            }

            // Graphique de conversion
            if (chartsData.conversionFunnel) {
                await this.updateConversionChart(chartsData.conversionFunnel);
            }

            // Heatmap des heures d'activité
            if (chartsData.activityHeatmap) {
                await this.updateActivityHeatmap(chartsData.activityHeatmap);
            }

        } catch (error) {
            console.error('❌ Erreur mise à jour graphiques:', error);
        }
    }

    async updateTimeSeriesChart(viewsData, submissionsData) {
        const chartContainer = document.getElementById('time-series-chart');
        if (!chartContainer) return;

        const options = {
            chart: {
                type: 'line',
                height: 350,
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                },
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true
                    }
                }
            },
            series: [
                {
                    name: 'Vues',
                    data: viewsData.map(item => ({
                        x: new Date(item.date).getTime(),
                        y: item.count
                    })),
                    color: '#3B82F6'
                },
                {
                    name: 'Soumissions',
                    data: submissionsData.map(item => ({
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
            },
            markers: {
                size: 4,
                hover: {
                    size: 6
                }
            }
        };

        this.charts.timeSeries = await this.realTimeChartsService.createChart(chartContainer, options);
    }

    async updateTrafficChart(trafficData) {
        const chartContainer = document.getElementById('traffic-sources-chart');
        if (!chartContainer) return;

        const labels = Object.keys(trafficData);
        const values = Object.values(trafficData).map(item => item.count);
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

        const options = {
            chart: {
                type: 'donut',
                height: 300
            },
            series: values,
            labels: labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
            colors: colors,
            legend: {
                position: 'bottom'
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Total',
                                formatter: () => values.reduce((a, b) => a + b, 0)
                            }
                        }
                    }
                }
            },
            tooltip: {
                y: {
                    formatter: (value, { seriesIndex }) => {
                        const total = values.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${value} (${percentage}%)`;
                    }
                }
            }
        };

        this.charts.traffic = await this.realTimeChartsService.createChart(chartContainer, options);
    }

    async updateDeviceChart(deviceData) {
        const chartContainer = document.getElementById('device-stats-chart');
        if (!chartContainer) return;

        const categories = Object.keys(deviceData);
        const values = Object.values(deviceData).map(item => item.count);

        const options = {
            chart: {
                type: 'bar',
                height: 300
            },
            series: [{
                name: 'Utilisateurs',
                data: values
            }],
            xaxis: {
                categories: categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1))
            },
            colors: ['#3B82F6'],
            plotOptions: {
                bar: {
                    borderRadius: 8,
                    horizontal: false,
                    columnWidth: '55%'
                }
            },
            dataLabels: {
                enabled: true
            },
            tooltip: {
                y: {
                    formatter: (value) => `${value} utilisateurs`
                }
            }
        };

        this.charts.devices = await this.realTimeChartsService.createChart(chartContainer, options);
    }

    async updateConversionChart(conversionData) {
        const chartContainer = document.getElementById('conversion-funnel-chart');
        if (!chartContainer) return;

        const options = {
            chart: {
                type: 'bar',
                height: 300
            },
            series: [{
                name: 'Utilisateurs',
                data: conversionData.map(item => item.count)
            }],
            xaxis: {
                categories: conversionData.map(item => item.stage)
            },
            colors: ['#10B981'],
            plotOptions: {
                bar: {
                    borderRadius: 8,
                    horizontal: true,
                    distributed: true
                }
            },
            dataLabels: {
                enabled: true,
                formatter: (val, opts) => {
                    const percentage = conversionData[opts.dataPointIndex].percentage;
                    return `${val} (${percentage.toFixed(1)}%)`;
                }
            },
            tooltip: {
                y: {
                    formatter: (value, { dataPointIndex }) => {
                        const percentage = conversionData[dataPointIndex].percentage;
                        return `${value} utilisateurs (${percentage.toFixed(1)}%)`;
                    }
                }
            }
        };

        this.charts.conversion = await this.realTimeChartsService.createChart(chartContainer, options);
    }

    async updateActivityHeatmap(heatmapData) {
        const chartContainer = document.getElementById('activity-heatmap-chart');
        if (!chartContainer) return;

        // Transformer les données pour la heatmap
        const series = [];
        const hours = Array.from({length: 24}, (_, i) => i);
        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

        days.forEach((day, dayIndex) => {
            hours.forEach(hour => {
                const value = heatmapData[dayIndex]?.[hour] || 0;
                series.push({
                    x: `${hour}:00`,
                    y: day,
                    value: value
                });
            });
        });

        const options = {
            chart: {
                type: 'heatmap',
                height: 300
            },
            series: [{
                name: 'Activité',
                data: series.map(item => ({
                    x: item.x,
                    y: item.value
                }))
            }],
            xaxis: {
                categories: hours.map(h => `${h}:00`)
            },
            yaxis: {
                categories: days
            },
            colors: ['#3B82F6'],
            tooltip: {
                y: {
                    formatter: (value) => `${value} actions`
                }
            }
        };

        this.charts.heatmap = await this.realTimeChartsService.createChart(chartContainer, options);
    }

    setupEventListeners() {
        // Filtres de période
        document.querySelectorAll('[data-period]').forEach(button => {
            button.addEventListener('click', (e) => {
                // Mise à jour visuelle
                document.querySelectorAll('[data-period]').forEach(b => 
                    b.classList.remove('bg-blue-600', 'text-white'));
                e.target.classList.add('bg-blue-600', 'text-white');
                
                // Mise à jour des données
                this.currentPeriod = e.target.dataset.period;
                this.loadAnalyticsData();
            });
        });

        // Sélecteur de formulaire
        const formSelector = document.getElementById('form-selector');
        if (formSelector) {
            formSelector.addEventListener('change', (e) => {
                this.selectedFormId = e.target.value || null;
                this.loadAnalyticsData();
            });
        }

        // Export des données
        document.getElementById('export-analytics')?.addEventListener('click', () => {
            this.exportAnalytics();
        });

        // Rafraîchissement manuel
        document.getElementById('refresh-analytics')?.addEventListener('click', () => {
            this.loadAnalyticsData();
        });
    }

    setupFilters() {
        // Charger la liste des formulaires pour le sélecteur
        this.loadFormsList();
    }

    async loadFormsList() {
        try {
            const response = await this.apiService.getForms({ limit: 100 });
            if (response.success) {
                const formSelector = document.getElementById('form-selector');
                if (formSelector) {
                    const optionsHTML = [
                        '<option value="">Tous les formulaires</option>',
                        ...response.data.forms.map(form => 
                            `<option value="${form.id}" ${form.id === this.selectedFormId ? 'selected' : ''}>
                                ${form.title}
                            </option>`
                        )
                    ].join('');
                    
                    formSelector.innerHTML = optionsHTML;
                }
            }
        } catch (error) {
            console.error('❌ Erreur chargement formulaires:', error);
        }
    }

    async exportAnalytics() {
        try {
            const response = await this.apiService.exportAnalytics({
                period: this.currentPeriod,
                formId: this.selectedFormId
            });

            if (response.success) {
                const blob = new Blob([JSON.stringify(response.data, null, 2)], {
                    type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `analytics_${this.currentPeriod}_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                
                this.showSuccess('Export terminé avec succès');
            }
        } catch (error) {
            console.error('❌ Erreur export:', error);
            this.showError('Erreur lors de l\'export');
        }
    }

    startAutoRefresh() {
        // Rafraîchir toutes les 5 minutes
        this.refreshInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.loadAnalyticsData();
            }
        }, 5 * 60 * 1000);
    }

    initializeCharts() {
        // Les graphiques seront initialisés lors du chargement des données
        console.log('📊 Préparation des conteneurs de graphiques...');
    }

    formatDuration(seconds) {
        if (!seconds) return '0s';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
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
        window.analyticsDashboard = new AnalyticsDashboard();
    });
} else {
    window.analyticsDashboard = new AnalyticsDashboard();
}

// Nettoyage lors du déchargement de la page
window.addEventListener('beforeunload', () => {
    if (window.analyticsDashboard) {
        window.analyticsDashboard.destroy();
    }
});

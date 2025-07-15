/**
 * 📊 FormEase - Service de Graphiques Temps Réel
 * Service pour gérer les graphiques dynamiques avec ApexCharts
 */

class RealTimeChartsService {
    constructor() {
        this.charts = new Map();
        this.api = window.apiService || new ApiService();
        this.updateInterval = null;
        this.isUpdating = false;
        
        console.log('📊 Service de graphiques temps réel initialisé');
    }

    /**
     * Initialiser tous les graphiques de la page
     */
    async initializeCharts() {
        try {
            // Détecter et initialiser les graphiques selon la page
            const chartContainers = document.querySelectorAll('[data-chart-type]');
            
            for (const container of chartContainers) {
                const chartType = container.dataset.chartType;
                const chartId = container.id;
                
                console.log(`📈 Initialisation du graphique: ${chartId} (${chartType})`);
                await this.createChart(chartId, chartType);
            }
            
            // Démarrer les mises à jour automatiques
            this.startRealTimeUpdates();
            
        } catch (error) {
            console.error('❌ Erreur d\'initialisation des graphiques:', error);
        }
    }

    /**
     * Créer un graphique spécifique
     */
    async createChart(containerId, chartType, customOptions = {}) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.warn(`⚠️ Container ${containerId} non trouvé`);
                return;
            }

            // Charger les données initiales
            const data = await this.getChartData(chartType);
            
            // Configuration du graphique selon le type
            const options = this.getChartOptions(chartType, data, customOptions);
            
            // Créer le graphique ApexCharts
            const chart = new ApexCharts(container, options);
            await chart.render();
            
            // Stocker la référence
            this.charts.set(containerId, {
                chart,
                type: chartType,
                container,
                lastUpdate: Date.now()
            });
            
            console.log(`✅ Graphique ${containerId} créé avec succès`);
            
        } catch (error) {
            console.error(`❌ Erreur création graphique ${containerId}:`, error);
        }
    }

    /**
     * Obtenir les données pour un type de graphique
     */
    async getChartData(chartType) {
        try {
            switch (chartType) {
                case 'dashboard-overview':
                    return await this.api.getDashboardMetrics('30d');
                
                case 'forms-submissions':
                    return await this.api.getAnalyticsChartData('submissions', '30d');
                
                case 'conversion-funnel':
                    return await this.api.getAnalyticsChartData('conversion', '30d');
                
                case 'response-timeline':
                    return await this.api.getAnalyticsChartData('timeline', '7d');
                
                case 'email-performance':
                    return await this.api.getEmailStats();
                
                case 'qr-code-scans':
                    return await this.api.getQRCodeStats();
                
                case 'user-analytics':
                    return await this.api.getAnalyticsChartData('users', '30d');
                
                default:
                    console.warn(`⚠️ Type de graphique non reconnu: ${chartType}`);
                    return { data: [] };
            }
        } catch (error) {
            console.error(`❌ Erreur récupération données ${chartType}:`, error);
            return { data: [] };
        }
    }

    /**
     * Configuration des options de graphique par type
     */
    getChartOptions(chartType, data, customOptions = {}) {
        const baseOptions = {
            chart: {
                fontFamily: 'Inter, sans-serif',
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: false,
                        zoom: false,
                        zoomin: false,
                        zoomout: false,
                        pan: false,
                        reset: false
                    }
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            theme: {
                mode: 'light',
                palette: 'palette1'
            },
            colors: ['#0ea5e9', '#22c55e', '#f97316', '#ef4444', '#8b5cf6'],
            responsive: [{
                breakpoint: 768,
                options: {
                    chart: {
                        height: 300
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        };

        let specificOptions = {};

        switch (chartType) {
            case 'dashboard-overview':
                specificOptions = this.getDashboardOverviewOptions(data);
                break;
            
            case 'forms-submissions':
                specificOptions = this.getFormsSubmissionsOptions(data);
                break;
            
            case 'conversion-funnel':
                specificOptions = this.getConversionFunnelOptions(data);
                break;
            
            case 'response-timeline':
                specificOptions = this.getResponseTimelineOptions(data);
                break;
            
            case 'email-performance':
                specificOptions = this.getEmailPerformanceOptions(data);
                break;
            
            case 'qr-code-scans':
                specificOptions = this.getQRCodeScansOptions(data);
                break;
            
            case 'user-analytics':
                specificOptions = this.getUserAnalyticsOptions(data);
                break;
        }

        return {
            ...baseOptions,
            ...specificOptions,
            ...customOptions
        };
    }

    /**
     * Options pour le graphique overview du dashboard
     */
    getDashboardOverviewOptions(data) {
        return {
            chart: {
                type: 'area',
                height: 350,
                sparkline: {
                    enabled: false
                }
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.1
                }
            },
            series: [{
                name: 'Formulaires créés',
                data: data.data?.formsCreated || [0, 5, 10, 15, 20, 25, 30]
            }, {
                name: 'Réponses reçues',
                data: data.data?.responsesReceived || [0, 15, 30, 45, 60, 75, 90]
            }],
            xaxis: {
                categories: data.data?.dates || this.getLast7Days(),
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            tooltip: {
                shared: true,
                intersect: false
            },
            legend: {
                position: 'top'
            }
        };
    }

    /**
     * Options pour le graphique des soumissions de formulaires
     */
    getFormsSubmissionsOptions(data) {
        return {
            chart: {
                type: 'bar',
                height: 400
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 4
                }
            },
            series: [{
                name: 'Soumissions',
                data: data.data?.submissions || [10, 25, 15, 30, 20, 35, 25]
            }],
            xaxis: {
                categories: data.data?.formNames || ['Formulaire 1', 'Formulaire 2', 'Formulaire 3'],
                labels: {
                    rotate: -45,
                    maxHeight: 120
                }
            },
            yaxis: {
                title: {
                    text: 'Nombre de soumissions'
                }
            },
            tooltip: {
                y: {
                    formatter: function(val) {
                        return val + ' soumissions';
                    }
                }
            }
        };
    }

    /**
     * Options pour le funnel de conversion
     */
    getConversionFunnelOptions(data) {
        return {
            chart: {
                type: 'donut',
                height: 350
            },
            series: data.data?.conversionSteps || [100, 75, 50, 25],
            labels: ['Vues', 'Démarrages', 'Completions', 'Conversions'],
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%'
                    }
                }
            },
            tooltip: {
                y: {
                    formatter: function(val) {
                        return val + '%';
                    }
                }
            }
        };
    }

    /**
     * Options pour la timeline des réponses
     */
    getResponseTimelineOptions(data) {
        return {
            chart: {
                type: 'line',
                height: 300,
                sparkline: {
                    enabled: false
                }
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            series: [{
                name: 'Réponses par heure',
                data: data.data?.hourlyResponses || [0, 2, 5, 8, 12, 15, 18, 20, 17, 14, 10, 6]
            }],
            xaxis: {
                categories: Array.from({length: 24}, (_, i) => `${i}h`),
                labels: {
                    style: {
                        fontSize: '10px'
                    }
                }
            },
            tooltip: {
                y: {
                    formatter: function(val) {
                        return val + ' réponses';
                    }
                }
            }
        };
    }

    /**
     * Options pour les performances email
     */
    getEmailPerformanceOptions(data) {
        return {
            chart: {
                type: 'radialBar',
                height: 350
            },
            plotOptions: {
                radialBar: {
                    hollow: {
                        size: '70%'
                    },
                    dataLabels: {
                        name: {
                            fontSize: '16px'
                        },
                        value: {
                            fontSize: '14px',
                            formatter: function(val) {
                                return parseInt(val) + '%';
                            }
                        }
                    }
                }
            },
            series: [
                data.data?.deliveryRate || 95,
                data.data?.openRate || 25,
                data.data?.clickRate || 5
            ],
            labels: ['Taux de livraison', 'Taux d\'ouverture', 'Taux de clic']
        };
    }

    /**
     * Options pour les scans de QR codes
     */
    getQRCodeScansOptions(data) {
        return {
            chart: {
                type: 'area',
                height: 250,
                sparkline: {
                    enabled: true
                }
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.4,
                    opacityTo: 0.1
                }
            },
            series: [{
                name: 'Scans',
                data: data.data?.dailyScans || [10, 15, 12, 18, 25, 20, 30]
            }],
            tooltip: {
                fixed: {
                    enabled: false
                },
                x: {
                    show: false
                },
                y: {
                    title: {
                        formatter: function() {
                            return 'Scans: ';
                        }
                    }
                }
            }
        };
    }

    /**
     * Options pour l'analytics utilisateur
     */
    getUserAnalyticsOptions(data) {
        return {
            chart: {
                type: 'bar',
                height: 350
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                    barHeight: '50%'
                }
            },
            series: [{
                name: 'Utilisateurs',
                data: data.data?.usersByPlan || [
                    {x: 'Gratuit', y: 150},
                    {x: 'Premium', y: 45},
                    {x: 'Enterprise', y: 12}
                ]
            }],
            xaxis: {
                type: 'numeric'
            },
            tooltip: {
                y: {
                    formatter: function(val) {
                        return val + ' utilisateurs';
                    }
                }
            }
        };
    }

    /**
     * Mettre à jour tous les graphiques
     */
    async updateAllCharts() {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        console.log('🔄 Mise à jour des graphiques...');

        try {
            for (const [chartId, chartInfo] of this.charts) {
                await this.updateChart(chartId);
            }
        } catch (error) {
            console.error('❌ Erreur mise à jour graphiques:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Mettre à jour un graphique spécifique
     */
    async updateChart(chartId) {
        try {
            const chartInfo = this.charts.get(chartId);
            if (!chartInfo) return;

            // Charger les nouvelles données
            const newData = await this.getChartData(chartInfo.type);
            
            // Mettre à jour le graphique
            const options = this.getChartOptions(chartInfo.type, newData);
            await chartInfo.chart.updateOptions(options, true);
            
            chartInfo.lastUpdate = Date.now();
            
            console.log(`✅ Graphique ${chartId} mis à jour`);
            
        } catch (error) {
            console.error(`❌ Erreur mise à jour ${chartId}:`, error);
        }
    }

    /**
     * Démarrer les mises à jour temps réel
     */
    startRealTimeUpdates() {
        // Mise à jour toutes les 2 minutes
        this.updateInterval = setInterval(() => {
            this.updateAllCharts();
        }, 120000);
        
        console.log('⏰ Mises à jour temps réel démarrées');
    }

    /**
     * Arrêter les mises à jour temps réel
     */
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏹️ Mises à jour temps réel arrêtées');
        }
    }

    /**
     * Détruire tous les graphiques
     */
    destroyAllCharts() {
        for (const [chartId, chartInfo] of this.charts) {
            if (chartInfo.chart) {
                chartInfo.chart.destroy();
            }
        }
        this.charts.clear();
        this.stopRealTimeUpdates();
        
        console.log('🗑️ Tous les graphiques détruits');
    }

    /**
     * Redimensionner tous les graphiques (responsive)
     */
    resizeAllCharts() {
        for (const [chartId, chartInfo] of this.charts) {
            if (chartInfo.chart) {
                chartInfo.chart.resize();
            }
        }
    }

    /**
     * Utilitaire: obtenir les 7 derniers jours
     */
    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }));
        }
        return days;
    }

    /**
     * Exporter un graphique en image
     */
    async exportChart(chartId, format = 'png') {
        const chartInfo = this.charts.get(chartId);
        if (!chartInfo || !chartInfo.chart) {
            console.error(`❌ Graphique ${chartId} non trouvé`);
            return;
        }

        try {
            const dataURL = await chartInfo.chart.dataURI({
                type: format,
                quality: 1
            });
            
            // Télécharger l'image
            const link = document.createElement('a');
            link.href = dataURL.imgURI;
            link.download = `${chartId}_${Date.now()}.${format}`;
            link.click();
            
            console.log(`📊 Graphique ${chartId} exporté en ${format}`);
            
        } catch (error) {
            console.error(`❌ Erreur export ${chartId}:`, error);
        }
    }
}

// Gestion des événements de redimensionnement
window.addEventListener('resize', () => {
    if (window.realTimeChartsService) {
        window.realTimeChartsService.resizeAllCharts();
    }
});

// Nettoyage avant déchargement de la page
window.addEventListener('beforeunload', () => {
    if (window.realTimeChartsService) {
        window.realTimeChartsService.destroyAllCharts();
    }
});

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que ApexCharts soit chargé
    if (typeof ApexCharts !== 'undefined') {
        window.realTimeChartsService = new RealTimeChartsService();
        
        // Initialiser les graphiques après un court délai
        setTimeout(() => {
            window.realTimeChartsService.initializeCharts();
        }, 500);
    } else {
        console.warn('⚠️ ApexCharts non disponible - Graphiques désactivés');
    }
});

console.log('📊 Service de graphiques temps réel prêt');

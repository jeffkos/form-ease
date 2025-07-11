/**
 * 📊 DashboardManager.js - FormEase Sprint 3 Phase 4
 * 
 * Gestionnaire de tableaux de bord et visualisations temps réel
 * Interface unifiée pour la gestion des dashboards analytics
 * 
 * Fonctionnalités :
 * - Tableaux de bord personnalisables
 * - Widgets interactifs et temps réel
 * - Layouts adaptatifs et responsive
 * - Export et partage de dashboards
 * - Alertes et notifications visuelles
 * - Filtres et drill-down avancés
 * - Synchronisation multi-écrans
 * 
 * @version 3.0.0
 * @author FormEase Team
 * @since Sprint 3 Phase 4
 */

class DashboardManager {
    constructor(analyticsEngine, reportBuilder, metricsCollector) {
        this.analytics = analyticsEngine || window.analyticsEngine;
        this.reports = reportBuilder || window.reportBuilder;
        this.metrics = metricsCollector || window.metricsCollector;
        
        this.dashboards = new Map();
        this.widgets = new Map();
        this.layouts = new Map();
        this.activeSubscriptions = new Map();
        this.realTimeUpdates = new Map();
        
        this.config = {
            realTimeUpdates: true,
            updateInterval: 5000, // 5 secondes
            maxWidgets: 20,
            autoSave: true,
            responsive: true,
            animations: true,
            defaultTheme: 'modern'
        };
        
        this.widgetTypes = {
            kpi: 'kpi',
            chart: 'chart',
            table: 'table',
            gauge: 'gauge',
            counter: 'counter',
            map: 'map',
            timeline: 'timeline',
            calendar: 'calendar',
            alert: 'alert',
            iframe: 'iframe'
        };
        
        this.chartTypes = {
            line: 'line',
            bar: 'bar',
            pie: 'pie',
            doughnut: 'doughnut',
            radar: 'radar',
            area: 'area',
            scatter: 'scatter',
            bubble: 'bubble',
            heatmap: 'heatmap',
            treemap: 'treemap'
        };
        
        this.layoutTypes = {
            grid: 'grid',
            masonry: 'masonry',
            flex: 'flex',
            tabs: 'tabs',
            carousel: 'carousel'
        };
        
        this.themes = {
            modern: {
                primaryColor: '#4F46E5',
                secondaryColor: '#10B981',
                backgroundColor: '#F9FAFB',
                cardBackground: '#FFFFFF',
                textColor: '#111827',
                borderColor: '#E5E7EB'
            },
            dark: {
                primaryColor: '#6366F1',
                secondaryColor: '#34D399',
                backgroundColor: '#111827',
                cardBackground: '#1F2937',
                textColor: '#F9FAFB',
                borderColor: '#374151'
            },
            minimal: {
                primaryColor: '#000000',
                secondaryColor: '#6B7280',
                backgroundColor: '#FFFFFF',
                cardBackground: '#FFFFFF',
                textColor: '#000000',
                borderColor: '#E5E7EB'
            }
        };
        
        this.permissions = {
            view: 'view',
            edit: 'edit',
            admin: 'admin'
        };
        
        this.init();
    }
    
    /**
     * Initialisation du gestionnaire de dashboards
     */
    init() {
        this.setupDefaultDashboards();
        this.setupDefaultWidgets();
        this.setupDefaultLayouts();
        this.startRealTimeUpdates();
        this.setupEventListeners();
        this.loadUserDashboards();
        console.log('📊 DashboardManager v3.0 initialisé');
    }
    
    /**
     * Configuration des dashboards par défaut
     */
    setupDefaultDashboards() {
        // Dashboard : Vue d'ensemble exécutive
        this.dashboards.set('executive-overview', {
            id: 'executive-overview',
            name: 'Vue d\'Ensemble Exécutive',
            description: 'KPIs principaux et métriques business',
            category: 'business',
            layout: this.layoutTypes.grid,
            theme: 'modern',
            public: true,
            permissions: {
                view: ['all'],
                edit: ['admin', 'executive']
            },
            widgets: [
                'kpi-total-forms',
                'kpi-total-submissions',
                'kpi-conversion-rate',
                'chart-growth-trend',
                'table-top-forms',
                'gauge-system-health'
            ],
            gridConfig: {
                columns: 4,
                rows: 3,
                gap: 20
            },
            filters: {
                dateRange: '30d',
                userSegment: 'all'
            },
            autoRefresh: true,
            created: new Date(),
            modified: new Date()
        });
        
        // Dashboard : Performance technique
        this.dashboards.set('technical-performance', {
            id: 'technical-performance',
            name: 'Performance Technique',
            description: 'Métriques système et performance',
            category: 'technical',
            layout: this.layoutTypes.grid,
            theme: 'dark',
            public: false,
            permissions: {
                view: ['admin', 'developer'],
                edit: ['admin']
            },
            widgets: [
                'chart-response-times',
                'gauge-cpu-usage',
                'gauge-memory-usage',
                'chart-error-rates',
                'table-api-endpoints',
                'timeline-system-events',
                'heatmap-user-activity',
                'alert-system-status'
            ],
            gridConfig: {
                columns: 4,
                rows: 4,
                gap: 15
            },
            filters: {
                dateRange: '24h',
                environment: 'production'
            },
            autoRefresh: true,
            created: new Date(),
            modified: new Date()
        });
        
        // Dashboard : Analytics utilisateur
        this.dashboards.set('user-analytics', {
            id: 'user-analytics',
            name: 'Analytics Utilisateur',
            description: 'Comportement et satisfaction utilisateur',
            category: 'user',
            layout: this.layoutTypes.masonry,
            theme: 'modern',
            public: true,
            permissions: {
                view: ['all'],
                edit: ['admin', 'marketing']
            },
            widgets: [
                'chart-user-journey',
                'pie-device-types',
                'chart-session-duration',
                'map-user-locations',
                'table-user-segments',
                'calendar-activity-heatmap',
                'counter-active-users',
                'gauge-satisfaction-score'
            ],
            masonryConfig: {
                columns: 3,
                gap: 20
            },
            filters: {
                dateRange: '7d',
                deviceType: 'all'
            },
            autoRefresh: true,
            created: new Date(),
            modified: new Date()
        });
        
        // Dashboard : Temps réel
        this.dashboards.set('real-time-monitoring', {
            id: 'real-time-monitoring',
            name: 'Monitoring Temps Réel',
            description: 'Surveillance en direct des activités',
            category: 'monitoring',
            layout: this.layoutTypes.flex,
            theme: 'dark',
            public: false,
            permissions: {
                view: ['admin', 'operator'],
                edit: ['admin']
            },
            widgets: [
                'counter-live-users',
                'chart-live-events',
                'table-recent-activities',
                'alert-live-alerts',
                'gauge-server-load',
                'timeline-live-timeline'
            ],
            flexConfig: {
                direction: 'column',
                wrap: true
            },
            filters: {
                realTime: true
            },
            autoRefresh: true,
            refreshInterval: 1000, // 1 seconde
            created: new Date(),
            modified: new Date()
        });
        
        console.log('📋 Dashboards par défaut configurés :', this.dashboards.size);
    }
    
    /**
     * Configuration des widgets par défaut
     */
    setupDefaultWidgets() {
        // Widget KPI : Total des formulaires
        this.widgets.set('kpi-total-forms', {
            id: 'kpi-total-forms',
            type: this.widgetTypes.kpi,
            title: 'Total Formulaires',
            description: 'Nombre total de formulaires créés',
            dataSource: 'analytics.kpis.totalForms',
            config: {
                format: 'number',
                trend: true,
                target: 1000,
                comparison: '30d'
            },
            size: { width: 1, height: 1 },
            refreshInterval: 30000
        });
        
        // Widget KPI : Total des soumissions
        this.widgets.set('kpi-total-submissions', {
            id: 'kpi-total-submissions',
            type: this.widgetTypes.kpi,
            title: 'Total Soumissions',
            description: 'Nombre total de soumissions',
            dataSource: 'analytics.kpis.totalSubmissions',
            config: {
                format: 'number',
                trend: true,
                target: 5000,
                comparison: '30d'
            },
            size: { width: 1, height: 1 },
            refreshInterval: 10000
        });
        
        // Widget KPI : Taux de conversion
        this.widgets.set('kpi-conversion-rate', {
            id: 'kpi-conversion-rate',
            type: this.widgetTypes.kpi,
            title: 'Taux de Conversion',
            description: 'Pourcentage de conversion des formulaires',
            dataSource: 'analytics.kpis.conversionRate',
            config: {
                format: 'percentage',
                trend: true,
                target: 85,
                comparison: '7d'
            },
            size: { width: 1, height: 1 },
            refreshInterval: 15000
        });
        
        // Widget Chart : Tendance de croissance
        this.widgets.set('chart-growth-trend', {
            id: 'chart-growth-trend',
            type: this.widgetTypes.chart,
            title: 'Tendance de Croissance',
            description: 'Évolution des soumissions dans le temps',
            chartType: this.chartTypes.line,
            dataSource: 'analytics.trends.submissions',
            config: {
                timeRange: '30d',
                granularity: 'day',
                smoothing: true,
                annotations: true
            },
            size: { width: 2, height: 2 },
            refreshInterval: 60000
        });
        
        // Widget Table : Top formulaires
        this.widgets.set('table-top-forms', {
            id: 'table-top-forms',
            type: this.widgetTypes.table,
            title: 'Top 10 Formulaires',
            description: 'Formulaires les plus performants',
            dataSource: 'analytics.forms.topPerforming',
            config: {
                columns: ['name', 'submissions', 'conversion', 'satisfaction'],
                sortBy: 'submissions',
                sortOrder: 'desc',
                pagination: false,
                maxRows: 10
            },
            size: { width: 2, height: 2 },
            refreshInterval: 300000
        });
        
        // Widget Gauge : Santé système
        this.widgets.set('gauge-system-health', {
            id: 'gauge-system-health',
            type: this.widgetTypes.gauge,
            title: 'Santé Système',
            description: 'Score global de santé du système',
            dataSource: 'analytics.system.healthScore',
            config: {
                min: 0,
                max: 100,
                unit: '%',
                thresholds: [
                    { value: 85, color: '#10B981', label: 'Excellent' },
                    { value: 70, color: '#F59E0B', label: 'Bon' },
                    { value: 50, color: '#EF4444', label: 'Critique' }
                ]
            },
            size: { width: 1, height: 1 },
            refreshInterval: 5000
        });
        
        // Widget Chart : Temps de réponse
        this.widgets.set('chart-response-times', {
            id: 'chart-response-times',
            type: this.widgetTypes.chart,
            title: 'Temps de Réponse API',
            description: 'Performance des APIs en temps réel',
            chartType: this.chartTypes.area,
            dataSource: 'analytics.performance.apiResponseTimes',
            config: {
                timeRange: '1h',
                granularity: 'minute',
                realTime: true,
                yAxis: {
                    min: 0,
                    max: 1000,
                    unit: 'ms'
                }
            },
            size: { width: 2, height: 1 },
            refreshInterval: 5000
        });
        
        // Widget Alert : Statut système
        this.widgets.set('alert-system-status', {
            id: 'alert-system-status',
            type: this.widgetTypes.alert,
            title: 'Alertes Système',
            description: 'Alertes et notifications en cours',
            dataSource: 'analytics.alerts.active',
            config: {
                maxAlerts: 5,
                autoHide: false,
                severityFilter: ['critical', 'high', 'medium'],
                groupBy: 'severity'
            },
            size: { width: 2, height: 1 },
            refreshInterval: 2000
        });
        
        // Widget Counter : Utilisateurs en direct
        this.widgets.set('counter-live-users', {
            id: 'counter-live-users',
            type: this.widgetTypes.counter,
            title: 'Utilisateurs Actifs',
            description: 'Nombre d\'utilisateurs en ligne',
            dataSource: 'analytics.realTime.activeUsers',
            config: {
                format: 'number',
                animated: true,
                duration: 2000,
                prefix: '',
                suffix: ' en ligne'
            },
            size: { width: 1, height: 1 },
            refreshInterval: 5000
        });
        
        console.log('🧩 Widgets par défaut configurés :', this.widgets.size);
    }
    
    /**
     * Configuration des layouts par défaut
     */
    setupDefaultLayouts() {
        // Layout Grid standard
        this.layouts.set('standard-grid', {
            id: 'standard-grid',
            name: 'Grille Standard',
            type: this.layoutTypes.grid,
            config: {
                columns: 4,
                rows: 'auto',
                gap: 20,
                responsive: {
                    mobile: { columns: 1 },
                    tablet: { columns: 2 },
                    desktop: { columns: 4 }
                }
            }
        });
        
        // Layout Masonry
        this.layouts.set('masonry-flow', {
            id: 'masonry-flow',
            name: 'Masonry Flow',
            type: this.layoutTypes.masonry,
            config: {
                columns: 3,
                gap: 20,
                responsive: {
                    mobile: { columns: 1 },
                    tablet: { columns: 2 },
                    desktop: { columns: 3 }
                }
            }
        });
        
        // Layout Flex
        this.layouts.set('flex-vertical', {
            id: 'flex-vertical',
            name: 'Flex Vertical',
            type: this.layoutTypes.flex,
            config: {
                direction: 'column',
                wrap: true,
                gap: 15,
                justify: 'flex-start',
                align: 'stretch'
            }
        });
        
        console.log('📐 Layouts par défaut configurés :', this.layouts.size);
    }
    
    /**
     * Création d'un nouveau dashboard
     */
    createDashboard(config) {
        const dashboardId = config.id || 'dash_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const dashboard = {
            id: dashboardId,
            name: config.name || `Dashboard ${dashboardId}`,
            description: config.description || '',
            category: config.category || 'custom',
            layout: config.layout || this.layoutTypes.grid,
            theme: config.theme || this.config.defaultTheme,
            public: config.public || false,
            permissions: config.permissions || {
                view: ['owner'],
                edit: ['owner']
            },
            widgets: config.widgets || [],
            gridConfig: config.gridConfig || { columns: 4, rows: 'auto', gap: 20 },
            filters: config.filters || {},
            autoRefresh: config.autoRefresh !== false,
            refreshInterval: config.refreshInterval || this.config.updateInterval,
            created: new Date(),
            modified: new Date(),
            owner: config.owner || 'current-user'
        };
        
        this.dashboards.set(dashboardId, dashboard);
        
        if (this.config.autoSave) {
            this.saveDashboard(dashboardId);
        }
        
        console.log('✅ Dashboard créé :', dashboardId);
        return dashboard;
    }
    
    /**
     * Création d'un widget
     */
    createWidget(config) {
        const widgetId = config.id || 'widget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const widget = {
            id: widgetId,
            type: config.type || this.widgetTypes.kpi,
            title: config.title || `Widget ${widgetId}`,
            description: config.description || '',
            dataSource: config.dataSource || 'analytics.custom',
            config: config.config || {},
            size: config.size || { width: 1, height: 1 },
            position: config.position || { x: 0, y: 0 },
            refreshInterval: config.refreshInterval || this.config.updateInterval,
            visible: config.visible !== false,
            created: new Date(),
            modified: new Date()
        };
        
        this.widgets.set(widgetId, widget);
        
        console.log('✅ Widget créé :', widgetId);
        return widget;
    }
    
    /**
     * Rendu d'un dashboard
     */
    async renderDashboard(dashboardId, containerId) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) {
            throw new Error(`Dashboard ${dashboardId} introuvable`);
        }
        
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} introuvable`);
        }
        
        console.log(`📊 Rendu du dashboard : ${dashboard.name}`);
        
        // Appliquer le thème
        this.applyTheme(container, dashboard.theme);
        
        // Créer la structure du dashboard
        container.innerHTML = '';
        container.className = `dashboard-container layout-${dashboard.layout}`;
        
        // Créer l'en-tête
        const header = this.createDashboardHeader(dashboard);
        container.appendChild(header);
        
        // Créer la zone de contenu
        const content = document.createElement('div');
        content.className = 'dashboard-content';
        
        // Appliquer le layout
        this.applyLayout(content, dashboard);
        
        // Rendre les widgets
        await this.renderWidgets(content, dashboard);
        
        container.appendChild(content);
        
        // Configurer les mises à jour temps réel
        if (dashboard.autoRefresh) {
            this.setupDashboardRefresh(dashboardId);
        }
        
        console.log(`✅ Dashboard ${dashboardId} rendu dans ${containerId}`);
    }
    
    /**
     * Rendu des widgets d'un dashboard
     */
    async renderWidgets(container, dashboard) {
        for (const widgetId of dashboard.widgets) {
            const widget = this.widgets.get(widgetId);
            if (widget && widget.visible) {
                try {
                    const widgetElement = await this.renderWidget(widget, dashboard);
                    container.appendChild(widgetElement);
                } catch (error) {
                    console.error(`Erreur rendu widget ${widgetId}:`, error);
                    const errorWidget = this.createErrorWidget(widget, error);
                    container.appendChild(errorWidget);
                }
            }
        }
    }
    
    /**
     * Rendu d'un widget individuel
     */
    async renderWidget(widget, dashboard) {
        const widgetElement = document.createElement('div');
        widgetElement.className = `widget widget-${widget.type}`;
        widgetElement.id = `widget-${widget.id}`;
        widgetElement.style.gridColumn = `span ${widget.size.width}`;
        widgetElement.style.gridRow = `span ${widget.size.height}`;
        
        // En-tête du widget
        const header = document.createElement('div');
        header.className = 'widget-header';
        header.innerHTML = `
            <h3 class="widget-title">${widget.title}</h3>
            <div class="widget-actions">
                <button class="widget-action" data-action="refresh" title="Actualiser">🔄</button>
                <button class="widget-action" data-action="fullscreen" title="Plein écran">⛶</button>
                <button class="widget-action" data-action="settings" title="Paramètres">⚙️</button>
            </div>
        `;
        widgetElement.appendChild(header);
        
        // Corps du widget
        const body = document.createElement('div');
        body.className = 'widget-body';
        
        // Charger les données et rendre le contenu
        try {
            const data = await this.loadWidgetData(widget, dashboard);
            const content = await this.renderWidgetContent(widget, data);
            body.appendChild(content);
        } catch (error) {
            body.innerHTML = `<div class="widget-error">Erreur: ${error.message}</div>`;
        }
        
        widgetElement.appendChild(body);
        
        // Configurer les événements
        this.setupWidgetEvents(widgetElement, widget);
        
        return widgetElement;
    }
    
    /**
     * Chargement des données d'un widget
     */
    async loadWidgetData(widget, dashboard) {
        const dataSource = widget.dataSource;
        
        try {
            // Simulation de chargement de données
            if (dataSource.startsWith('analytics.kpis.')) {
                const kpiName = dataSource.replace('analytics.kpis.', '');
                const kpis = this.analytics?.getKPIs() || {};
                return kpis[kpiName] || { value: 0, target: 100 };
            }
            
            if (dataSource.startsWith('analytics.trends.')) {
                return this.generateTrendData(widget);
            }
            
            if (dataSource.startsWith('analytics.forms.')) {
                return this.generateFormsData(widget);
            }
            
            if (dataSource.startsWith('analytics.system.')) {
                return this.generateSystemData(widget);
            }
            
            if (dataSource.startsWith('analytics.realTime.')) {
                return this.generateRealTimeData(widget);
            }
            
            if (dataSource.startsWith('analytics.alerts.')) {
                return this.generateAlertsData(widget);
            }
            
            // Données par défaut
            return this.generateMockData(widget);
            
        } catch (error) {
            console.error(`Erreur chargement données widget ${widget.id}:`, error);
            throw error;
        }
    }
    
    /**
     * Rendu du contenu d'un widget
     */
    async renderWidgetContent(widget, data) {
        const content = document.createElement('div');
        content.className = 'widget-content';
        
        switch (widget.type) {
            case this.widgetTypes.kpi:
                content.appendChild(this.renderKPIWidget(widget, data));
                break;
                
            case this.widgetTypes.chart:
                content.appendChild(await this.renderChartWidget(widget, data));
                break;
                
            case this.widgetTypes.table:
                content.appendChild(this.renderTableWidget(widget, data));
                break;
                
            case this.widgetTypes.gauge:
                content.appendChild(this.renderGaugeWidget(widget, data));
                break;
                
            case this.widgetTypes.counter:
                content.appendChild(this.renderCounterWidget(widget, data));
                break;
                
            case this.widgetTypes.alert:
                content.appendChild(this.renderAlertWidget(widget, data));
                break;
                
            default:
                content.innerHTML = `<div class="widget-placeholder">Widget type ${widget.type} non supporté</div>`;
        }
        
        return content;
    }
    
    /**
     * Rendu d'un widget KPI
     */
    renderKPIWidget(widget, data) {
        const kpi = document.createElement('div');
        kpi.className = 'kpi-widget';
        
        const value = data.value || 0;
        const target = data.target || 100;
        const trend = this.calculateTrend(value, target);
        const status = this.getKPIStatus(value, target);
        
        kpi.innerHTML = `
            <div class="kpi-value ${status}">${this.formatValue(value, widget.config.format)}</div>
            <div class="kpi-target">Objectif: ${this.formatValue(target, widget.config.format)}</div>
            <div class="kpi-trend ${trend >= 0 ? 'positive' : 'negative'}">
                <span class="trend-icon">${trend >= 0 ? '↗' : '↘'}</span>
                <span class="trend-value">${Math.abs(trend).toFixed(1)}%</span>
            </div>
            <div class="kpi-progress">
                <div class="progress-bar" style="width: ${Math.min((value / target) * 100, 100)}%"></div>
            </div>
        `;
        
        return kpi;
    }
    
    /**
     * Rendu d'un widget Chart
     */
    async renderChartWidget(widget, data) {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-widget';
        
        if (!window.Chart) {
            chartContainer.innerHTML = '<div class="chart-loading">Chargement Chart.js...</div>';
            return chartContainer;
        }
        
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: widget.chartType,
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: widget.chartType !== 'pie' && widget.chartType !== 'doughnut' ? {
                    y: {
                        beginAtZero: true
                    }
                } : {}
            }
        });
        
        return chartContainer;
    }
    
    /**
     * Rendu d'un widget Table
     */
    renderTableWidget(widget, data) {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-widget';
        
        const table = document.createElement('table');
        table.className = 'widget-table';
        
        // En-tête
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        for (const column of widget.config.columns) {
            const th = document.createElement('th');
            th.textContent = column;
            headerRow.appendChild(th);
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Corps
        const tbody = document.createElement('tbody');
        
        for (const row of data.slice(0, widget.config.maxRows || 10)) {
            const tr = document.createElement('tr');
            
            for (const column of widget.config.columns) {
                const td = document.createElement('td');
                td.textContent = row[column] || '';
                tr.appendChild(td);
            }
            
            tbody.appendChild(tr);
        }
        
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        return tableContainer;
    }
    
    /**
     * Rendu d'un widget Gauge
     */
    renderGaugeWidget(widget, data) {
        const gauge = document.createElement('div');
        gauge.className = 'gauge-widget';
        
        const value = data.value || 0;
        const min = widget.config.min || 0;
        const max = widget.config.max || 100;
        const percentage = ((value - min) / (max - min)) * 100;
        
        gauge.innerHTML = `
            <div class="gauge-container">
                <svg viewBox="0 0 100 50" class="gauge-svg">
                    <path d="M 10 40 A 30 30 0 0 1 90 40" stroke="#e5e7eb" stroke-width="8" fill="none"/>
                    <path d="M 10 40 A 30 30 0 0 1 90 40" stroke="#4f46e5" stroke-width="8" fill="none"
                          stroke-dasharray="${(percentage * 0.628)} 100"
                          stroke-dashoffset="0"/>
                </svg>
                <div class="gauge-value">${this.formatValue(value, widget.config.format)}</div>
                <div class="gauge-unit">${widget.config.unit || ''}</div>
            </div>
        `;
        
        return gauge;
    }
    
    /**
     * Rendu d'un widget Counter
     */
    renderCounterWidget(widget, data) {
        const counter = document.createElement('div');
        counter.className = 'counter-widget';
        
        const value = data.value || 0;
        
        counter.innerHTML = `
            <div class="counter-value" data-target="${value}">0</div>
            <div class="counter-label">${widget.title}</div>
        `;
        
        // Animation du compteur
        if (widget.config.animated) {
            this.animateCounter(counter.querySelector('.counter-value'), value, widget.config.duration || 2000);
        }
        
        return counter;
    }
    
    /**
     * Rendu d'un widget Alert
     */
    renderAlertWidget(widget, data) {
        const alertContainer = document.createElement('div');
        alertContainer.className = 'alert-widget';
        
        if (!data || data.length === 0) {
            alertContainer.innerHTML = '<div class="no-alerts">Aucune alerte active</div>';
            return alertContainer;
        }
        
        for (const alert of data.slice(0, widget.config.maxAlerts || 5)) {
            const alertElement = document.createElement('div');
            alertElement.className = `alert-item severity-${alert.severity}`;
            
            alertElement.innerHTML = `
                <div class="alert-icon">${this.getAlertIcon(alert.severity)}</div>
                <div class="alert-content">
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-time">${this.formatTime(alert.timestamp)}</div>
                </div>
                <div class="alert-actions">
                    <button class="alert-dismiss" data-alert-id="${alert.id}">×</button>
                </div>
            `;
            
            alertContainer.appendChild(alertElement);
        }
        
        return alertContainer;
    }
    
    /**
     * Configuration des mises à jour temps réel
     */
    setupDashboardRefresh(dashboardId) {
        if (this.activeSubscriptions.has(dashboardId)) {
            clearInterval(this.activeSubscriptions.get(dashboardId));
        }
        
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) return;
        
        const intervalId = setInterval(async () => {
            await this.refreshDashboard(dashboardId);
        }, dashboard.refreshInterval);
        
        this.activeSubscriptions.set(dashboardId, intervalId);
    }
    
    /**
     * Actualisation d'un dashboard
     */
    async refreshDashboard(dashboardId) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) return;
        
        const container = document.getElementById(`dashboard-${dashboardId}`);
        if (!container) return;
        
        // Actualiser chaque widget visible
        for (const widgetId of dashboard.widgets) {
            const widget = this.widgets.get(widgetId);
            if (widget && widget.visible) {
                await this.refreshWidget(widgetId, dashboard);
            }
        }
    }
    
    /**
     * Actualisation d'un widget
     */
    async refreshWidget(widgetId, dashboard) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;
        
        const widgetElement = document.getElementById(`widget-${widgetId}`);
        if (!widgetElement) return;
        
        try {
            const data = await this.loadWidgetData(widget, dashboard);
            const content = await this.renderWidgetContent(widget, data);
            
            const body = widgetElement.querySelector('.widget-body');
            if (body) {
                body.innerHTML = '';
                body.appendChild(content);
            }
            
        } catch (error) {
            console.error(`Erreur actualisation widget ${widgetId}:`, error);
        }
    }
    
    /**
     * Démarrage des mises à jour temps réel
     */
    startRealTimeUpdates() {
        if (!this.config.realTimeUpdates) return;
        
        // Simuler des mises à jour de données en temps réel
        setInterval(() => {
            this.updateRealTimeData();
        }, this.config.updateInterval);
        
        console.log('🔄 Mises à jour temps réel démarrées');
    }
    
    /**
     * Mise à jour des données temps réel
     */
    updateRealTimeData() {
        // Simuler des changements de données
        this.realTimeUpdates.set('activeUsers', Math.floor(Math.random() * 100) + 50);
        this.realTimeUpdates.set('apiCalls', Math.floor(Math.random() * 1000) + 500);
        this.realTimeUpdates.set('systemLoad', Math.random() * 100);
        this.realTimeUpdates.set('errorRate', Math.random() * 5);
        
        // Diffuser les mises à jour aux dashboards
        this.broadcastRealTimeUpdates();
    }
    
    /**
     * Diffusion des mises à jour
     */
    broadcastRealTimeUpdates() {
        for (const [dashboardId, dashboard] of this.dashboards.entries()) {
            if (dashboard.autoRefresh && dashboard.refreshInterval <= 5000) {
                // Actualiser seulement les widgets temps réel
                this.refreshRealTimeWidgets(dashboardId);
            }
        }
    }
    
    /**
     * Actualisation des widgets temps réel
     */
    refreshRealTimeWidgets(dashboardId) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) return;
        
        for (const widgetId of dashboard.widgets) {
            const widget = this.widgets.get(widgetId);
            if (widget && widget.dataSource.includes('realTime')) {
                this.refreshWidget(widgetId, dashboard);
            }
        }
    }
    
    /**
     * Configuration des événements
     */
    setupEventListeners() {
        // Événements globaux pour les actions de widgets
        document.addEventListener('click', (event) => {
            const action = event.target.dataset.action;
            if (action) {
                this.handleWidgetAction(event.target, action);
            }
        });
        
        // Responsive design
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    /**
     * Gestion des actions de widgets
     */
    handleWidgetAction(element, action) {
        const widgetElement = element.closest('.widget');
        if (!widgetElement) return;
        
        const widgetId = widgetElement.id.replace('widget-', '');
        
        switch (action) {
            case 'refresh':
                this.refreshWidget(widgetId);
                break;
                
            case 'fullscreen':
                this.toggleWidgetFullscreen(widgetElement);
                break;
                
            case 'settings':
                this.openWidgetSettings(widgetId);
                break;
        }
    }
    
    /**
     * Basculer en plein écran
     */
    toggleWidgetFullscreen(widgetElement) {
        if (widgetElement.classList.contains('fullscreen')) {
            widgetElement.classList.remove('fullscreen');
            document.body.classList.remove('widget-fullscreen');
        } else {
            widgetElement.classList.add('fullscreen');
            document.body.classList.add('widget-fullscreen');
        }
    }
    
    /**
     * Gestion du responsive
     */
    handleResize() {
        if (!this.config.responsive) return;
        
        // Réajuster les layouts pour la nouvelle taille d'écran
        for (const [dashboardId, dashboard] of this.dashboards.entries()) {
            const container = document.getElementById(`dashboard-${dashboardId}`);
            if (container) {
                this.applyResponsiveLayout(container, dashboard);
            }
        }
    }
    
    /**
     * Application du thème
     */
    applyTheme(container, themeName) {
        const theme = this.themes[themeName] || this.themes.modern;
        
        container.style.setProperty('--primary-color', theme.primaryColor);
        container.style.setProperty('--secondary-color', theme.secondaryColor);
        container.style.setProperty('--background-color', theme.backgroundColor);
        container.style.setProperty('--card-background', theme.cardBackground);
        container.style.setProperty('--text-color', theme.textColor);
        container.style.setProperty('--border-color', theme.borderColor);
        
        container.className = `dashboard-container theme-${themeName}`;
    }
    
    /**
     * Application du layout
     */
    applyLayout(container, dashboard) {
        switch (dashboard.layout) {
            case this.layoutTypes.grid:
                this.applyGridLayout(container, dashboard.gridConfig);
                break;
                
            case this.layoutTypes.masonry:
                this.applyMasonryLayout(container, dashboard.masonryConfig);
                break;
                
            case this.layoutTypes.flex:
                this.applyFlexLayout(container, dashboard.flexConfig);
                break;
        }
    }
    
    /**
     * Application du layout grid
     */
    applyGridLayout(container, config) {
        container.style.display = 'grid';
        container.style.gridTemplateColumns = `repeat(${config.columns}, 1fr)`;
        container.style.gap = `${config.gap}px`;
        container.style.padding = `${config.gap}px`;
    }
    
    /**
     * Création de l'en-tête du dashboard
     */
    createDashboardHeader(dashboard) {
        const header = document.createElement('div');
        header.className = 'dashboard-header';
        
        header.innerHTML = `
            <div class="dashboard-title">
                <h1>${dashboard.name}</h1>
                <p>${dashboard.description}</p>
            </div>
            <div class="dashboard-actions">
                <button class="dashboard-action" data-action="refresh">🔄 Actualiser</button>
                <button class="dashboard-action" data-action="export">📥 Exporter</button>
                <button class="dashboard-action" data-action="share">🔗 Partager</button>
                <button class="dashboard-action" data-action="settings">⚙️ Paramètres</button>
            </div>
        `;
        
        return header;
    }
    
    /**
     * Sauvegarde d'un dashboard
     */
    saveDashboard(dashboardId) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) return;
        
        try {
            const saved = JSON.parse(localStorage.getItem('formease-dashboards') || '{}');
            saved[dashboardId] = dashboard;
            localStorage.setItem('formease-dashboards', JSON.stringify(saved));
            
            console.log(`💾 Dashboard ${dashboardId} sauvegardé`);
        } catch (error) {
            console.error('Erreur sauvegarde dashboard :', error);
        }
    }
    
    /**
     * Chargement des dashboards utilisateur
     */
    loadUserDashboards() {
        try {
            const saved = JSON.parse(localStorage.getItem('formease-dashboards') || '{}');
            
            for (const [id, dashboard] of Object.entries(saved)) {
                this.dashboards.set(id, {
                    ...dashboard,
                    created: new Date(dashboard.created),
                    modified: new Date(dashboard.modified)
                });
            }
            
            console.log(`📂 ${Object.keys(saved).length} dashboards utilisateur chargés`);
        } catch (error) {
            console.error('Erreur chargement dashboards :', error);
        }
    }
    
    /**
     * Fonctions utilitaires et de génération de données
     */
    formatValue(value, format) {
        switch (format) {
            case 'percentage':
                return `${value.toFixed(1)}%`;
            case 'currency':
                return `$${value.toLocaleString()}`;
            case 'number':
                return value.toLocaleString();
            default:
                return value.toString();
        }
    }
    
    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    }
    
    calculateTrend(current, target) {
        return ((current - target) / target) * 100;
    }
    
    getKPIStatus(value, target) {
        const percentage = (value / target) * 100;
        if (percentage >= 100) return 'excellent';
        if (percentage >= 80) return 'good';
        if (percentage >= 60) return 'warning';
        return 'critical';
    }
    
    getAlertIcon(severity) {
        switch (severity) {
            case 'critical': return '🔴';
            case 'high': return '🟠';
            case 'medium': return '🟡';
            case 'low': return '🔵';
            default: return 'ℹ️';
        }
    }
    
    animateCounter(element, target, duration) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 16);
    }
    
    // Générateurs de données mock
    generateTrendData(widget) {
        const days = 30;
        const labels = [];
        const data = [];
        
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString());
            data.push(Math.floor(Math.random() * 100) + 50);
        }
        
        return {
            labels,
            datasets: [{
                label: 'Tendance',
                data,
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.3
            }]
        };
    }
    
    generateFormsData(widget) {
        return [
            { name: 'Contact Form', submissions: 1250, conversion: 85.5, satisfaction: 4.2 },
            { name: 'Newsletter', submissions: 980, conversion: 78.3, satisfaction: 4.0 },
            { name: 'Registration', submissions: 750, conversion: 82.1, satisfaction: 4.1 },
            { name: 'Feedback', submissions: 650, conversion: 91.2, satisfaction: 4.5 },
            { name: 'Survey', submissions: 580, conversion: 76.8, satisfaction: 3.9 }
        ];
    }
    
    generateSystemData(widget) {
        return {
            value: 85 + Math.random() * 10,
            timestamp: new Date()
        };
    }
    
    generateRealTimeData(widget) {
        return {
            value: this.realTimeUpdates.get('activeUsers') || Math.floor(Math.random() * 100) + 50,
            timestamp: new Date()
        };
    }
    
    generateAlertsData(widget) {
        return [
            {
                id: 'alert-1',
                severity: 'high',
                message: 'Taux d\'erreur API élevé détecté',
                timestamp: new Date(Date.now() - 5 * 60000)
            },
            {
                id: 'alert-2',
                severity: 'medium',
                message: 'Utilisation mémoire au-dessus de 80%',
                timestamp: new Date(Date.now() - 15 * 60000)
            }
        ];
    }
    
    generateMockData(widget) {
        switch (widget.type) {
            case this.widgetTypes.kpi:
                return { value: Math.floor(Math.random() * 100), target: 100 };
            case this.widgetTypes.counter:
                return { value: Math.floor(Math.random() * 1000) };
            case this.widgetTypes.gauge:
                return { value: Math.random() * 100 };
            default:
                return {};
        }
    }
    
    createErrorWidget(widget, error) {
        const errorElement = document.createElement('div');
        errorElement.className = 'widget widget-error';
        errorElement.innerHTML = `
            <div class="widget-header">
                <h3>${widget.title}</h3>
            </div>
            <div class="widget-body">
                <div class="error-message">
                    <span class="error-icon">⚠️</span>
                    <span>Erreur de chargement</span>
                </div>
            </div>
        `;
        return errorElement;
    }
    
    /**
     * API publique
     */
    getDashboards() {
        return Array.from(this.dashboards.values());
    }
    
    getWidgets() {
        return Array.from(this.widgets.values());
    }
    
    getLayouts() {
        return Array.from(this.layouts.values());
    }
}

// Export pour compatibilité navigateur
window.DashboardManager = DashboardManager;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.dashboardManager && window.analyticsEngine) {
        window.dashboardManager = new DashboardManager(
            window.analyticsEngine,
            window.reportBuilder,
            window.metricsCollector
        );
        console.log('📊 DashboardManager initialisé globalement');
    }
});

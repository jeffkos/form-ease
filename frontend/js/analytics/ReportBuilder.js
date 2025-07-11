/**
 * 📈 ReportBuilder.js - FormEase Sprint 3 Phase 4
 * 
 * Constructeur de rapports et visualisations avancées
 * Génère des rapports personnalisés avec graphiques et exports
 * 
 * Fonctionnalités :
 * - Templates de rapports prédéfinis
 * - Constructeur visuel de rapports
 * - Graphiques interactifs (Chart.js)
 * - Export multi-formats (PDF, Excel, CSV)
 * - Rapports automatisés et planifiés
 * - Comparaisons temporelles
 * - Analyse de cohortes
 * 
 * @version 3.0.0
 * @author FormEase Team
 * @since Sprint 3 Phase 4
 */

class ReportBuilder {
    constructor(analyticsEngine) {
        this.analytics = analyticsEngine || window.analyticsEngine;
        this.reports = new Map();
        this.templates = new Map();
        this.scheduledReports = new Map();
        this.visualizations = new Map();
        
        this.chartTypes = {
            line: 'line',
            bar: 'bar',
            pie: 'pie',
            doughnut: 'doughnut',
            radar: 'radar',
            area: 'area',
            scatter: 'scatter',
            heatmap: 'heatmap'
        };
        
        this.exportFormats = {
            pdf: 'pdf',
            excel: 'excel',
            csv: 'csv',
            json: 'json',
            png: 'png',
            svg: 'svg'
        };
        
        this.reportCategories = {
            business: 'business',
            technical: 'technical',
            user: 'user',
            form: 'form',
            integration: 'integration',
            workflow: 'workflow'
        };
        
        this.init();
    }
    
    /**
     * Initialisation du constructeur de rapports
     */
    init() {
        this.loadChartLibrary();
        this.setupDefaultTemplates();
        this.initializeCanvas();
        this.startScheduledReports();
        console.log('📈 ReportBuilder v3.0 initialisé');
    }
    
    /**
     * Chargement de la librairie de graphiques
     */
    loadChartLibrary() {
        if (!window.Chart) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                console.log('📊 Chart.js chargé');
                this.chartLibraryLoaded = true;
            };
            document.head.appendChild(script);
        } else {
            this.chartLibraryLoaded = true;
        }
    }
    
    /**
     * Configuration des templates de rapports
     */
    setupDefaultTemplates() {
        // Template : Rapport exécutif mensuel
        this.templates.set('executive-monthly', {
            id: 'executive-monthly',
            name: 'Rapport Exécutif Mensuel',
            description: 'Vue d\'ensemble des performances business mensuelles',
            category: this.reportCategories.business,
            period: '30d',
            sections: [
                {
                    id: 'kpi-overview',
                    type: 'kpi-grid',
                    title: 'KPIs Principaux',
                    metrics: ['totalForms', 'totalSubmissions', 'conversionRate', 'userRetention']
                },
                {
                    id: 'growth-chart',
                    type: 'chart',
                    title: 'Croissance des Soumissions',
                    chartType: this.chartTypes.line,
                    dataSource: 'submissions-trend',
                    timeframe: '30d'
                },
                {
                    id: 'top-forms',
                    type: 'table',
                    title: 'Top 10 Formulaires',
                    dataSource: 'form-performance',
                    columns: ['name', 'submissions', 'conversion', 'satisfaction']
                },
                {
                    id: 'user-segments',
                    type: 'chart',
                    title: 'Répartition Utilisateurs',
                    chartType: this.chartTypes.doughnut,
                    dataSource: 'user-segments'
                }
            ],
            styling: {
                theme: 'professional',
                colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
                layout: 'grid-2x2'
            }
        });
        
        // Template : Rapport technique
        this.templates.set('technical-weekly', {
            id: 'technical-weekly',
            name: 'Rapport Technique Hebdomadaire',
            description: 'Métriques techniques et performance système',
            category: this.reportCategories.technical,
            period: '7d',
            sections: [
                {
                    id: 'system-health',
                    type: 'health-dashboard',
                    title: 'Santé du Système',
                    metrics: ['systemUptime', 'averageResponseTime', 'errorRate', 'memoryUsage']
                },
                {
                    id: 'performance-trend',
                    type: 'chart',
                    title: 'Tendance Performance',
                    chartType: this.chartTypes.area,
                    dataSource: 'performance-metrics',
                    timeframe: '7d'
                },
                {
                    id: 'error-analysis',
                    type: 'chart',
                    title: 'Analyse des Erreurs',
                    chartType: this.chartTypes.bar,
                    dataSource: 'error-breakdown'
                },
                {
                    id: 'api-usage',
                    type: 'heatmap',
                    title: 'Utilisation API',
                    dataSource: 'api-calls-heatmap'
                }
            ],
            styling: {
                theme: 'dark',
                colors: ['#3B82F6', '#8B5CF6', '#06B6D4', '#84CC16'],
                layout: 'vertical'
            }
        });
        
        // Template : Analyse utilisateur
        this.templates.set('user-behavior', {
            id: 'user-behavior',
            name: 'Analyse Comportement Utilisateur',
            description: 'Patterns d\'utilisation et satisfaction utilisateur',
            category: this.reportCategories.user,
            period: '14d',
            sections: [
                {
                    id: 'user-journey',
                    type: 'funnel',
                    title: 'Parcours Utilisateur',
                    dataSource: 'user-funnel'
                },
                {
                    id: 'session-analytics',
                    type: 'chart',
                    title: 'Analytics de Session',
                    chartType: this.chartTypes.line,
                    dataSource: 'session-duration'
                },
                {
                    id: 'feature-usage',
                    type: 'chart',
                    title: 'Utilisation des Fonctionnalités',
                    chartType: this.chartTypes.radar,
                    dataSource: 'feature-adoption'
                },
                {
                    id: 'satisfaction-trends',
                    type: 'chart',
                    title: 'Tendances Satisfaction',
                    chartType: this.chartTypes.line,
                    dataSource: 'satisfaction-scores'
                }
            ],
            styling: {
                theme: 'modern',
                colors: ['#F59E0B', '#EF4444', '#10B981', '#6366F1'],
                layout: 'dashboard'
            }
        });
        
        // Template : Performance formulaires
        this.templates.set('form-analytics', {
            id: 'form-analytics',
            name: 'Analytics Formulaires',
            description: 'Performance détaillée des formulaires',
            category: this.reportCategories.form,
            period: '30d',
            sections: [
                {
                    id: 'form-metrics',
                    type: 'metrics-grid',
                    title: 'Métriques Formulaires',
                    dataSource: 'form-aggregations'
                },
                {
                    id: 'conversion-funnel',
                    type: 'funnel',
                    title: 'Tunnel de Conversion',
                    dataSource: 'form-conversion'
                },
                {
                    id: 'completion-time',
                    type: 'chart',
                    title: 'Temps de Completion',
                    chartType: this.chartTypes.histogram,
                    dataSource: 'completion-times'
                },
                {
                    id: 'abandonment-points',
                    type: 'heatmap',
                    title: 'Points d\'Abandon',
                    dataSource: 'abandonment-analysis'
                }
            ],
            styling: {
                theme: 'clean',
                colors: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B'],
                layout: 'stacked'
            }
        });
        
        console.log('📋 Templates de rapports configurés :', this.templates.size);
    }
    
    /**
     * Création d'un nouveau rapport
     */
    createReport(config) {
        const reportId = 'rpt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const report = {
            id: reportId,
            name: config.name || `Rapport ${reportId}`,
            description: config.description || '',
            template: config.template || null,
            category: config.category || this.reportCategories.business,
            period: config.period || '30d',
            status: 'draft',
            created: new Date(),
            modified: new Date(),
            sections: config.sections || [],
            styling: {
                theme: 'default',
                colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
                layout: 'vertical',
                ...config.styling
            },
            filters: config.filters || {},
            schedule: config.schedule || null,
            recipients: config.recipients || []
        };
        
        this.reports.set(reportId, report);
        console.log('✅ Rapport créé :', reportId);
        
        return report;
    }
    
    /**
     * Génération d'un rapport depuis un template
     */
    generateFromTemplate(templateId, customConfig = {}) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template ${templateId} introuvable`);
        }
        
        const reportConfig = {
            ...template,
            name: customConfig.name || template.name,
            period: customConfig.period || template.period,
            ...customConfig
        };
        
        return this.createReport(reportConfig);
    }
    
    /**
     * Génération des données d'un rapport
     */
    async generateReportData(reportId) {
        const report = this.reports.get(reportId);
        if (!report) {
            throw new Error(`Rapport ${reportId} introuvable`);
        }
        
        console.log(`📊 Génération des données pour le rapport : ${report.name}`);
        
        const reportData = {
            id: reportId,
            name: report.name,
            generated: new Date(),
            period: report.period,
            sections: []
        };
        
        // Générer chaque section
        for (const section of report.sections) {
            try {
                const sectionData = await this.generateSectionData(section, report);
                reportData.sections.push(sectionData);
            } catch (error) {
                console.error(`Erreur génération section ${section.id}:`, error);
                reportData.sections.push({
                    ...section,
                    error: error.message,
                    data: null
                });
            }
        }
        
        return reportData;
    }
    
    /**
     * Génération des données d'une section
     */
    async generateSectionData(section, report) {
        const sectionData = {
            id: section.id,
            type: section.type,
            title: section.title,
            generated: new Date()
        };
        
        switch (section.type) {
            case 'kpi-grid':
                sectionData.data = this.generateKPIGridData(section);
                break;
                
            case 'chart':
                sectionData.data = await this.generateChartData(section, report.period);
                break;
                
            case 'table':
                sectionData.data = this.generateTableData(section, report.period);
                break;
                
            case 'health-dashboard':
                sectionData.data = this.generateHealthDashboardData(section);
                break;
                
            case 'funnel':
                sectionData.data = this.generateFunnelData(section, report.period);
                break;
                
            case 'heatmap':
                sectionData.data = this.generateHeatmapData(section, report.period);
                break;
                
            case 'metrics-grid':
                sectionData.data = this.generateMetricsGridData(section, report.period);
                break;
                
            default:
                throw new Error(`Type de section non supporté : ${section.type}`);
        }
        
        return sectionData;
    }
    
    /**
     * Génération des données KPI Grid
     */
    generateKPIGridData(section) {
        const kpis = this.analytics.getKPIs();
        const data = [];
        
        for (const metricName of section.metrics) {
            const kpi = kpis[metricName];
            if (kpi) {
                data.push({
                    name: metricName,
                    value: kpi.value,
                    target: kpi.target,
                    type: kpi.type,
                    status: this.getKPIStatus(kpi),
                    trend: this.calculateKPITrend(metricName),
                    formatted: this.formatKPIValue(kpi)
                });
            }
        }
        
        return { kpis: data };
    }
    
    /**
     * Génération des données de graphique
     */
    async generateChartData(section, period) {
        const dataSource = section.dataSource;
        let data = {};
        
        switch (dataSource) {
            case 'submissions-trend':
                data = this.getSubmissionsTrend(period);
                break;
                
            case 'performance-metrics':
                data = this.getPerformanceMetrics(period);
                break;
                
            case 'error-breakdown':
                data = this.getErrorBreakdown(period);
                break;
                
            case 'user-segments':
                data = this.getUserSegments();
                break;
                
            case 'session-duration':
                data = this.getSessionDuration(period);
                break;
                
            case 'feature-adoption':
                data = this.getFeatureAdoption(period);
                break;
                
            case 'satisfaction-scores':
                data = this.getSatisfactionScores(period);
                break;
                
            default:
                data = this.generateMockChartData(section.chartType);
        }
        
        return {
            type: section.chartType,
            data: data,
            options: this.getChartOptions(section.chartType)
        };
    }
    
    /**
     * Génération des données de tableau
     */
    generateTableData(section, period) {
        const dataSource = section.dataSource;
        let data = [];
        
        switch (dataSource) {
            case 'form-performance':
                data = this.getTopForms(period);
                break;
                
            case 'user-activity':
                data = this.getUserActivity(period);
                break;
                
            case 'integration-status':
                data = this.getIntegrationStatus();
                break;
                
            default:
                data = this.generateMockTableData(section.columns);
        }
        
        return {
            columns: section.columns,
            rows: data,
            total: data.length
        };
    }
    
    /**
     * Génération du dashboard de santé
     */
    generateHealthDashboardData(section) {
        const kpis = this.analytics.getKPIs();
        const healthMetrics = [];
        
        for (const metricName of section.metrics) {
            const kpi = kpis[metricName];
            if (kpi) {
                healthMetrics.push({
                    name: metricName,
                    value: kpi.value,
                    status: this.getHealthStatus(kpi),
                    trend: this.calculateKPITrend(metricName),
                    threshold: kpi.target
                });
            }
        }
        
        return {
            metrics: healthMetrics,
            overallHealth: this.calculateOverallHealth(healthMetrics)
        };
    }
    
    /**
     * Génération des données funnel
     */
    generateFunnelData(section, period) {
        const dataSource = section.dataSource;
        
        switch (dataSource) {
            case 'user-funnel':
                return this.getUserFunnel(period);
                
            case 'form-conversion':
                return this.getFormConversion(period);
                
            default:
                return this.generateMockFunnelData();
        }
    }
    
    /**
     * Génération des données heatmap
     */
    generateHeatmapData(section, period) {
        const dataSource = section.dataSource;
        
        switch (dataSource) {
            case 'api-calls-heatmap':
                return this.getAPICallsHeatmap(period);
                
            case 'abandonment-analysis':
                return this.getAbandonmentHeatmap(period);
                
            default:
                return this.generateMockHeatmapData();
        }
    }
    
    /**
     * Génération de la grille de métriques
     */
    generateMetricsGridData(section, period) {
        const metrics = this.analytics.getMetrics({ period });
        const data = [];
        
        for (const [id, metric] of Object.entries(metrics)) {
            data.push({
                id: id,
                name: metric.name,
                type: metric.type,
                value: this.getMetricValue(metric),
                change: this.getMetricChange(metric, period),
                trend: this.getMetricTrend(metric)
            });
        }
        
        return { metrics: data };
    }
    
    /**
     * Rendu visuel d'un rapport
     */
    async renderReport(reportId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} introuvable`);
        }
        
        const reportData = await this.generateReportData(reportId);
        const report = this.reports.get(reportId);
        
        // Appliquer le style du rapport
        this.applyReportStyling(container, report.styling);
        
        // Vider le container
        container.innerHTML = '';
        
        // Créer l'en-tête du rapport
        const header = this.createReportHeader(reportData);
        container.appendChild(header);
        
        // Créer les sections
        for (const sectionData of reportData.sections) {
            const sectionElement = await this.renderSection(sectionData, report.styling);
            container.appendChild(sectionElement);
        }
        
        console.log(`📊 Rapport ${reportId} rendu dans ${containerId}`);
    }
    
    /**
     * Rendu d'une section
     */
    async renderSection(sectionData, styling) {
        const section = document.createElement('div');
        section.className = `report-section section-${sectionData.type}`;
        section.innerHTML = `<h3 class="section-title">${sectionData.title}</h3>`;
        
        if (sectionData.error) {
            section.innerHTML += `<div class="section-error">Erreur: ${sectionData.error}</div>`;
            return section;
        }
        
        const content = document.createElement('div');
        content.className = 'section-content';
        
        switch (sectionData.type) {
            case 'kpi-grid':
                content.appendChild(this.renderKPIGrid(sectionData.data));
                break;
                
            case 'chart':
                content.appendChild(await this.renderChart(sectionData.data));
                break;
                
            case 'table':
                content.appendChild(this.renderTable(sectionData.data));
                break;
                
            case 'health-dashboard':
                content.appendChild(this.renderHealthDashboard(sectionData.data));
                break;
                
            case 'funnel':
                content.appendChild(this.renderFunnel(sectionData.data));
                break;
                
            case 'heatmap':
                content.appendChild(this.renderHeatmap(sectionData.data));
                break;
                
            case 'metrics-grid':
                content.appendChild(this.renderMetricsGrid(sectionData.data));
                break;
        }
        
        section.appendChild(content);
        return section;
    }
    
    /**
     * Rendu d'une grille KPI
     */
    renderKPIGrid(data) {
        const grid = document.createElement('div');
        grid.className = 'kpi-grid';
        
        for (const kpi of data.kpis) {
            const kpiCard = document.createElement('div');
            kpiCard.className = `kpi-card status-${kpi.status}`;
            
            kpiCard.innerHTML = `
                <div class="kpi-value">${kpi.formatted}</div>
                <div class="kpi-name">${kpi.name}</div>
                <div class="kpi-target">Objectif: ${kpi.target}</div>
                <div class="kpi-trend ${kpi.trend >= 0 ? 'positive' : 'negative'}">
                    ${kpi.trend >= 0 ? '↗' : '↘'} ${Math.abs(kpi.trend).toFixed(1)}%
                </div>
            `;
            
            grid.appendChild(kpiCard);
        }
        
        return grid;
    }
    
    /**
     * Rendu d'un graphique
     */
    async renderChart(chartData) {
        if (!this.chartLibraryLoaded) {
            const placeholder = document.createElement('div');
            placeholder.innerHTML = 'Chargement du graphique...';
            return placeholder;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        
        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: chartData.type,
            data: chartData.data,
            options: chartData.options
        });
        
        return canvas;
    }
    
    /**
     * Rendu d'un tableau
     */
    renderTable(data) {
        const table = document.createElement('table');
        table.className = 'report-table';
        
        // En-tête
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        for (const column of data.columns) {
            const th = document.createElement('th');
            th.textContent = column;
            headerRow.appendChild(th);
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Corps
        const tbody = document.createElement('tbody');
        
        for (const row of data.rows) {
            const tr = document.createElement('tr');
            
            for (const column of data.columns) {
                const td = document.createElement('td');
                td.textContent = row[column] || '';
                tr.appendChild(td);
            }
            
            tbody.appendChild(tr);
        }
        
        table.appendChild(tbody);
        return table;
    }
    
    /**
     * Export d'un rapport
     */
    async exportReport(reportId, format, options = {}) {
        const reportData = await this.generateReportData(reportId);
        const report = this.reports.get(reportId);
        
        console.log(`📥 Export du rapport ${reportId} en format ${format}`);
        
        switch (format) {
            case this.exportFormats.json:
                return this.exportToJSON(reportData);
                
            case this.exportFormats.csv:
                return this.exportToCSV(reportData);
                
            case this.exportFormats.pdf:
                return await this.exportToPDF(reportData, report, options);
                
            case this.exportFormats.excel:
                return await this.exportToExcel(reportData, report, options);
                
            default:
                throw new Error(`Format d'export non supporté : ${format}`);
        }
    }
    
    /**
     * Export JSON
     */
    exportToJSON(reportData) {
        return {
            data: JSON.stringify(reportData, null, 2),
            filename: `rapport_${reportData.id}_${this.formatDate(new Date())}.json`,
            mimeType: 'application/json'
        };
    }
    
    /**
     * Export CSV
     */
    exportToCSV(reportData) {
        const csvData = [];
        csvData.push(['Section', 'Métrique', 'Valeur', 'Type']);
        
        for (const section of reportData.sections) {
            if (section.data && section.data.kpis) {
                for (const kpi of section.data.kpis) {
                    csvData.push([section.title, kpi.name, kpi.value, kpi.type]);
                }
            }
        }
        
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        
        return {
            data: csvContent,
            filename: `rapport_${reportData.id}_${this.formatDate(new Date())}.csv`,
            mimeType: 'text/csv'
        };
    }
    
    /**
     * Planification d'un rapport
     */
    scheduleReport(reportId, schedule) {
        const report = this.reports.get(reportId);
        if (!report) {
            throw new Error(`Rapport ${reportId} introuvable`);
        }
        
        const scheduleId = 'sched_' + Date.now();
        
        const scheduledReport = {
            id: scheduleId,
            reportId: reportId,
            schedule: schedule, // cron expression
            recipients: schedule.recipients || [],
            format: schedule.format || 'pdf',
            enabled: true,
            created: new Date(),
            lastRun: null,
            nextRun: this.calculateNextRun(schedule.cron)
        };
        
        this.scheduledReports.set(scheduleId, scheduledReport);
        report.schedule = scheduleId;
        
        console.log(`⏰ Rapport ${reportId} planifié : ${schedule.cron}`);
        return scheduledReport;
    }
    
    /**
     * Démarrage des rapports planifiés
     */
    startScheduledReports() {
        setInterval(() => {
            this.processScheduledReports();
        }, 60000); // Vérifier toutes les minutes
        
        console.log('⏰ Système de rapports planifiés démarré');
    }
    
    /**
     * Traitement des rapports planifiés
     */
    async processScheduledReports() {
        const now = new Date();
        
        for (const scheduled of this.scheduledReports.values()) {
            if (scheduled.enabled && scheduled.nextRun <= now) {
                try {
                    await this.executeScheduledReport(scheduled);
                    scheduled.lastRun = now;
                    scheduled.nextRun = this.calculateNextRun(scheduled.schedule.cron);
                } catch (error) {
                    console.error(`Erreur rapport planifié ${scheduled.id}:`, error);
                }
            }
        }
    }
    
    /**
     * Exécution d'un rapport planifié
     */
    async executeScheduledReport(scheduled) {
        console.log(`📊 Exécution rapport planifié : ${scheduled.reportId}`);
        
        const exportResult = await this.exportReport(
            scheduled.reportId, 
            scheduled.format
        );
        
        // Envoyer le rapport aux destinataires
        await this.sendReportToRecipients(exportResult, scheduled.recipients);
    }
    
    /**
     * Envoi du rapport aux destinataires
     */
    async sendReportToRecipients(exportResult, recipients) {
        if (window.notificationRouter) {
            for (const recipient of recipients) {
                await window.notificationRouter.sendNotification({
                    template: 'report-delivery',
                    recipient: recipient,
                    variables: {
                        filename: exportResult.filename,
                        data: exportResult.data
                    },
                    attachments: [{
                        filename: exportResult.filename,
                        content: exportResult.data,
                        mimeType: exportResult.mimeType
                    }]
                });
            }
        }
    }
    
    /**
     * Initialisation du canvas
     */
    initializeCanvas() {
        this.canvas = {
            reports: [],
            selectedReport: null,
            previewMode: false,
            gridSize: 20
        };
    }
    
    /**
     * Fonctions utilitaires
     */
    getKPIStatus(kpi) {
        if (!kpi.target) return 'neutral';
        
        const percentage = (kpi.value / kpi.target) * 100;
        
        if (percentage >= 100) return 'excellent';
        if (percentage >= 80) return 'good';
        if (percentage >= 60) return 'warning';
        return 'critical';
    }
    
    getHealthStatus(kpi) {
        return this.getKPIStatus(kpi);
    }
    
    calculateKPITrend(metricName) {
        // Simulation du calcul de tendance
        return (Math.random() - 0.5) * 20;
    }
    
    formatKPIValue(kpi) {
        if (kpi.type === 'rate' || kpi.value < 1) {
            return (kpi.value * 100).toFixed(1) + '%';
        }
        
        if (kpi.value >= 1000000) {
            return (kpi.value / 1000000).toFixed(1) + 'M';
        }
        
        if (kpi.value >= 1000) {
            return (kpi.value / 1000).toFixed(1) + 'K';
        }
        
        return kpi.value.toFixed(0);
    }
    
    calculateOverallHealth(metrics) {
        const scores = metrics.map(m => {
            switch (m.status) {
                case 'excellent': return 100;
                case 'good': return 80;
                case 'warning': return 60;
                case 'critical': return 20;
                default: return 50;
            }
        });
        
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
    
    getMetricValue(metric) {
        if (metric.type === 'counter') return metric.value;
        if (metric.type === 'gauge') return metric.value;
        if (metric.type === 'histogram' && metric.values) {
            return metric.values.reduce((sum, v) => sum + v.value, 0) / metric.values.length;
        }
        return 0;
    }
    
    getMetricChange(metric, period) {
        return (Math.random() - 0.5) * 30; // Simulation
    }
    
    getMetricTrend(metric) {
        return Math.random() > 0.5 ? 'up' : 'down';
    }
    
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    calculateNextRun(cronExpression) {
        // Simulation simple du calcul de prochaine exécution
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // Dans 24h
    }
    
    applyReportStyling(container, styling) {
        container.className = `report-container theme-${styling.theme}`;
        container.style.setProperty('--report-layout', styling.layout);
    }
    
    createReportHeader(reportData) {
        const header = document.createElement('div');
        header.className = 'report-header';
        header.innerHTML = `
            <h1>${reportData.name}</h1>
            <div class="report-meta">
                <span>Généré le: ${reportData.generated.toLocaleString()}</span>
                <span>Période: ${reportData.period}</span>
            </div>
        `;
        return header;
    }
    
    // Méthodes de génération de données mock pour les démos
    getSubmissionsTrend(period) {
        const days = parseInt(period.replace('d', ''));
        const labels = [];
        const data = [];
        
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString());
            data.push(Math.floor(Math.random() * 100) + 50);
        }
        
        return { labels, datasets: [{ label: 'Soumissions', data, borderColor: '#4F46E5' }] };
    }
    
    getPerformanceMetrics(period) {
        return this.getSubmissionsTrend(period); // Simplifié
    }
    
    getErrorBreakdown(period) {
        return {
            labels: ['400 Bad Request', '404 Not Found', '500 Server Error', '503 Service Unavailable'],
            datasets: [{
                label: 'Erreurs',
                data: [45, 23, 12, 8],
                backgroundColor: ['#EF4444', '#F59E0B', '#EC4899', '#8B5CF6']
            }]
        };
    }
    
    getUserSegments() {
        return {
            labels: ['Nouveaux', 'Actifs', 'Power Users', 'Premium'],
            datasets: [{
                data: [30, 45, 15, 10],
                backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444']
            }]
        };
    }
    
    getSessionDuration(period) {
        return this.getSubmissionsTrend(period);
    }
    
    getFeatureAdoption(period) {
        return {
            labels: ['AI Generation', 'Workflows', 'Intégrations', 'Analytics', 'Templates'],
            datasets: [{
                label: 'Adoption',
                data: [85, 70, 60, 45, 90],
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderColor: '#4F46E5'
            }]
        };
    }
    
    getSatisfactionScores(period) {
        return this.getSubmissionsTrend(period);
    }
    
    getTopForms(period) {
        return [
            { name: 'Contact Form', submissions: 1250, conversion: 85.5, satisfaction: 4.2 },
            { name: 'Newsletter', submissions: 980, conversion: 78.3, satisfaction: 4.0 },
            { name: 'Registration', submissions: 750, conversion: 82.1, satisfaction: 4.1 }
        ];
    }
    
    getUserActivity(period) {
        return [
            { user: 'John Doe', logins: 25, forms: 12, lastActivity: '2h ago' },
            { user: 'Jane Smith', logins: 18, forms: 8, lastActivity: '1d ago' }
        ];
    }
    
    getIntegrationStatus() {
        return [
            { name: 'Slack', status: 'active', lastSync: '5m ago', errors: 0 },
            { name: 'Salesforce', status: 'warning', lastSync: '1h ago', errors: 2 }
        ];
    }
    
    getUserFunnel(period) {
        return {
            steps: ['Visite', 'Inscription', 'Premier Form', 'Form Soumis'],
            values: [1000, 650, 420, 380],
            rates: [100, 65, 64.6, 90.5]
        };
    }
    
    getFormConversion(period) {
        return this.getUserFunnel(period);
    }
    
    getAPICallsHeatmap(period) {
        return {
            hours: Array.from({length: 24}, (_, i) => i),
            days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
            data: Array.from({length: 7}, () => 
                Array.from({length: 24}, () => Math.floor(Math.random() * 100))
            )
        };
    }
    
    getAbandonmentHeatmap(period) {
        return this.getAPICallsHeatmap(period);
    }
    
    generateMockChartData(type) {
        return {
            labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'],
            datasets: [{
                label: 'Données',
                data: [12, 19, 3, 5, 2],
                backgroundColor: '#4F46E5'
            }]
        };
    }
    
    generateMockTableData(columns) {
        return columns.map((col, i) => ({ [col]: `Valeur ${i + 1}` }));
    }
    
    generateMockFunnelData() {
        return this.getUserFunnel('30d');
    }
    
    generateMockHeatmapData() {
        return this.getAPICallsHeatmap('7d');
    }
    
    getChartOptions(type) {
        const baseOptions = {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: false }
            }
        };
        
        switch (type) {
            case 'line':
                return {
                    ...baseOptions,
                    scales: {
                        y: { beginAtZero: true }
                    }
                };
            case 'radar':
                return {
                    ...baseOptions,
                    scales: {
                        r: { beginAtZero: true, max: 100 }
                    }
                };
            default:
                return baseOptions;
        }
    }
    
    renderHealthDashboard(data) {
        const dashboard = document.createElement('div');
        dashboard.className = 'health-dashboard';
        
        const overallScore = document.createElement('div');
        overallScore.className = 'overall-health';
        overallScore.innerHTML = `
            <div class="health-score">${data.overallHealth.toFixed(1)}</div>
            <div class="health-label">Score Santé Global</div>
        `;
        dashboard.appendChild(overallScore);
        
        const metricsGrid = document.createElement('div');
        metricsGrid.className = 'health-metrics';
        
        for (const metric of data.metrics) {
            const metricCard = document.createElement('div');
            metricCard.className = `health-metric status-${metric.status}`;
            metricCard.innerHTML = `
                <div class="metric-name">${metric.name}</div>
                <div class="metric-value">${metric.value}</div>
                <div class="metric-status">${metric.status}</div>
            `;
            metricsGrid.appendChild(metricCard);
        }
        
        dashboard.appendChild(metricsGrid);
        return dashboard;
    }
    
    renderFunnel(data) {
        const funnel = document.createElement('div');
        funnel.className = 'funnel-chart';
        
        for (let i = 0; i < data.steps.length; i++) {
            const step = document.createElement('div');
            step.className = 'funnel-step';
            step.style.width = `${(data.values[i] / data.values[0]) * 100}%`;
            step.innerHTML = `
                <span class="step-name">${data.steps[i]}</span>
                <span class="step-value">${data.values[i]}</span>
                <span class="step-rate">${data.rates[i].toFixed(1)}%</span>
            `;
            funnel.appendChild(step);
        }
        
        return funnel;
    }
    
    renderHeatmap(data) {
        const heatmap = document.createElement('div');
        heatmap.className = 'heatmap';
        heatmap.innerHTML = '<div class="heatmap-placeholder">Heatmap Placeholder</div>';
        return heatmap;
    }
    
    renderMetricsGrid(data) {
        const grid = document.createElement('div');
        grid.className = 'metrics-grid';
        
        for (const metric of data.metrics) {
            const card = document.createElement('div');
            card.className = 'metric-card';
            card.innerHTML = `
                <div class="metric-name">${metric.name}</div>
                <div class="metric-value">${metric.value}</div>
                <div class="metric-change ${metric.change >= 0 ? 'positive' : 'negative'}">
                    ${metric.change >= 0 ? '+' : ''}${metric.change.toFixed(1)}%
                </div>
            `;
            grid.appendChild(card);
        }
        
        return grid;
    }
    
    /**
     * API publique
     */
    getReports() {
        return Array.from(this.reports.values());
    }
    
    getTemplates() {
        return Array.from(this.templates.values());
    }
    
    getScheduledReports() {
        return Array.from(this.scheduledReports.values());
    }
}

// Export pour compatibilité navigateur
window.ReportBuilder = ReportBuilder;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.reportBuilder && window.analyticsEngine) {
        window.reportBuilder = new ReportBuilder(window.analyticsEngine);
        console.log('📈 ReportBuilder initialisé globalement');
    }
});

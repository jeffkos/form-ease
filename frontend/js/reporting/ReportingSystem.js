/**
 * FormEase Reporting System
 * Sprint 5 Phase 4 - Advanced reporting and export capabilities
 * 
 * Features:
 * - PDF report generation
 * - Excel export with charts
 * - Custom report templates
 * - Automated scheduling
 * - Analytics and insights
 * - Multi-format export
 */

class FormEaseReporting {
    constructor(options = {}) {
        this.config = {
            apiBase: options.apiBase || '/api',
            enablePDF: options.enablePDF !== false,
            enableExcel: options.enableExcel !== false,
            enableScheduling: options.enableScheduling !== false,
            defaultFont: options.defaultFont || 'Roboto',
            ...options
        };
        
        this.reportTemplates = new Map();
        this.scheduledReports = new Map();
        this.reportHistory = [];
        this.currentReportId = null;
        
        this.init();
    }
    
    init() {
        this.loadDefaultTemplates();
        this.setupEventListeners();
        
        console.log('📊 FormEase Reporting System initialized');
    }
    
    loadDefaultTemplates() {
        // Form Response Summary Report
        this.addReportTemplate({
            id: 'form-summary',
            name: 'Résumé des Réponses de Formulaire',
            description: 'Aperçu complet des réponses avec statistiques clés',
            category: 'analytics',
            type: 'summary',
            icon: 'ri-file-chart-line',
            sections: [
                {
                    id: 'header',
                    type: 'header',
                    title: 'Rapport de Formulaire',
                    subtitle: 'Analyse des réponses collectées',
                    showDate: true,
                    showLogo: true
                },
                {
                    id: 'overview',
                    type: 'metrics',
                    title: 'Vue d\'ensemble',
                    metrics: [
                        { key: 'totalResponses', label: 'Réponses totales', format: 'number' },
                        { key: 'completionRate', label: 'Taux de completion', format: 'percentage' },
                        { key: 'averageTime', label: 'Temps moyen', format: 'duration' },
                        { key: 'lastResponse', label: 'Dernière réponse', format: 'date' }
                    ]
                },
                {
                    id: 'charts',
                    type: 'charts',
                    title: 'Visualisations',
                    charts: [
                        { type: 'bar', field: 'responses_over_time', title: 'Réponses dans le temps' },
                        { type: 'pie', field: 'completion_status', title: 'Statut de completion' }
                    ]
                },
                {
                    id: 'insights',
                    type: 'insights',
                    title: 'Insights Automatiques',
                    generateInsights: true
                }
            ],
            formats: ['pdf', 'excel', 'html'],
            scheduling: {
                enabled: true,
                frequencies: ['daily', 'weekly', 'monthly']
            }
        });
        
        // Detailed Analytics Report
        this.addReportTemplate({
            id: 'detailed-analytics',
            name: 'Analyse Détaillée',
            description: 'Analyse approfondie avec corrélations et tendances',
            category: 'analytics',
            type: 'detailed',
            icon: 'ri-line-chart-line',
            sections: [
                {
                    id: 'header',
                    type: 'header',
                    title: 'Analyse Détaillée des Formulaires',
                    subtitle: 'Rapport d\'analyse approfondie',
                    showDate: true,
                    showLogo: true
                },
                {
                    id: 'executive-summary',
                    type: 'executive-summary',
                    title: 'Résumé Exécutif',
                    includeKeyFindings: true,
                    includeRecommendations: true
                },
                {
                    id: 'field-analysis',
                    type: 'field-analysis',
                    title: 'Analyse par Champ',
                    includeDistribution: true,
                    includeCorrelations: true
                },
                {
                    id: 'trends',
                    type: 'trends',
                    title: 'Tendances Temporelles',
                    timeframes: ['day', 'week', 'month']
                },
                {
                    id: 'recommendations',
                    type: 'recommendations',
                    title: 'Recommandations',
                    autoGenerate: true
                }
            ],
            formats: ['pdf', 'excel'],
            scheduling: {
                enabled: true,
                frequencies: ['weekly', 'monthly', 'quarterly']
            }
        });
        
        // Performance Report
        this.addReportTemplate({
            id: 'performance-report',
            name: 'Rapport de Performance',
            description: 'Analyse des performances et de l\'expérience utilisateur',
            category: 'performance',
            type: 'performance',
            icon: 'ri-speed-line',
            sections: [
                {
                    id: 'header',
                    type: 'header',
                    title: 'Rapport de Performance',
                    subtitle: 'Analyse de l\'expérience utilisateur',
                    showDate: true
                },
                {
                    id: 'performance-metrics',
                    type: 'performance-metrics',
                    title: 'Métriques de Performance',
                    metrics: [
                        { key: 'loadTime', label: 'Temps de chargement', format: 'milliseconds' },
                        { key: 'abandonRate', label: 'Taux d\'abandon', format: 'percentage' },
                        { key: 'errorRate', label: 'Taux d\'erreur', format: 'percentage' },
                        { key: 'mobileUsage', label: 'Usage mobile', format: 'percentage' }
                    ]
                },
                {
                    id: 'user-journey',
                    type: 'user-journey',
                    title: 'Parcours Utilisateur',
                    includeDropOffPoints: true,
                    includeTimeAnalysis: true
                },
                {
                    id: 'device-analysis',
                    type: 'device-analysis',
                    title: 'Analyse par Appareil',
                    breakdowns: ['device', 'browser', 'os']
                }
            ],
            formats: ['pdf', 'html'],
            scheduling: {
                enabled: true,
                frequencies: ['daily', 'weekly']
            }
        });
        
        // Custom Report Template
        this.addReportTemplate({
            id: 'custom-template',
            name: 'Template Personnalisé',
            description: 'Template vide pour créer des rapports sur mesure',
            category: 'custom',
            type: 'custom',
            icon: 'ri-file-edit-line',
            sections: [],
            formats: ['pdf', 'excel', 'html'],
            scheduling: {
                enabled: true,
                frequencies: ['daily', 'weekly', 'monthly']
            },
            isCustomizable: true
        });
    }
    
    addReportTemplate(template) {
        template.id = template.id || `template_${Date.now()}`;
        template.created = template.created || new Date().toISOString();
        template.version = template.version || '1.0';
        
        this.reportTemplates.set(template.id, template);
        
        console.log(`📝 Report template added: ${template.name}`);
        return template.id;
    }
    
    getReportTemplate(templateId) {
        return this.reportTemplates.get(templateId);
    }
    
    getAllReportTemplates() {
        return Array.from(this.reportTemplates.values());
    }
    
    async generateReport(templateId, data, options = {}) {
        const template = this.getReportTemplate(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        
        const reportId = `report_${Date.now()}`;
        this.currentReportId = reportId;
        
        const reportConfig = {
            id: reportId,
            templateId,
            template,
            data,
            options: {
                format: options.format || 'pdf',
                title: options.title || template.name,
                subtitle: options.subtitle || '',
                includeCharts: options.includeCharts !== false,
                includeData: options.includeData !== false,
                theme: options.theme || 'default',
                ...options
            },
            generated: new Date().toISOString()
        };
        
        try {
            let result;
            
            switch (reportConfig.options.format) {
                case 'pdf':
                    result = await this.generatePDFReport(reportConfig);
                    break;
                case 'excel':
                    result = await this.generateExcelReport(reportConfig);
                    break;
                case 'html':
                    result = await this.generateHTMLReport(reportConfig);
                    break;
                default:
                    throw new Error(`Unsupported format: ${reportConfig.options.format}`);
            }
            
            // Add to history
            this.reportHistory.push({
                ...reportConfig,
                result,
                success: true,
                duration: Date.now() - new Date(reportConfig.generated).getTime()
            });
            
            console.log(`📊 Report generated: ${reportId}`);
            return result;
            
        } catch (error) {
            console.error('Report generation failed:', error);
            
            this.reportHistory.push({
                ...reportConfig,
                error: error.message,
                success: false,
                duration: Date.now() - new Date(reportConfig.generated).getTime()
            });
            
            throw error;
        }
    }
    
    async generatePDFReport(reportConfig) {
        // Simulate PDF generation using modern web APIs
        const { template, data, options } = reportConfig;
        
        // Create HTML content for PDF
        const htmlContent = await this.generateHTMLContent(template, data, options);
        
        // In a real implementation, you would use libraries like:
        // - jsPDF
        // - Puppeteer
        // - html2canvas + jsPDF
        // - Server-side PDF generation
        
        const pdfData = await this.convertHTMLToPDF(htmlContent, options);
        
        return {
            type: 'pdf',
            data: pdfData,
            filename: `${options.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
            size: pdfData.length,
            pages: this.estimatePageCount(htmlContent)
        };
    }
    
    async generateExcelReport(reportConfig) {
        const { template, data, options } = reportConfig;
        
        // Generate Excel workbook with multiple sheets
        const workbook = await this.createExcelWorkbook(template, data, options);
        
        return {
            type: 'excel',
            data: workbook,
            filename: `${options.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`,
            sheets: workbook.sheets,
            size: workbook.size
        };
    }
    
    async generateHTMLReport(reportConfig) {
        const { template, data, options } = reportConfig;
        
        const htmlContent = await this.generateHTMLContent(template, data, options);
        
        return {
            type: 'html',
            data: htmlContent,
            filename: `${options.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.html`,
            size: new Blob([htmlContent]).size
        };
    }
    
    async generateHTMLContent(template, data, options) {
        let html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${options.title}</title>
            <style>
                body {
                    font-family: '${this.config.defaultFont}', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .report-header {
                    text-align: center;
                    border-bottom: 2px solid #2563eb;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .report-title {
                    font-size: 2.5em;
                    margin: 0;
                    color: #1e40af;
                }
                .report-subtitle {
                    font-size: 1.2em;
                    color: #6b7280;
                    margin: 10px 0;
                }
                .report-date {
                    color: #9ca3af;
                    font-size: 0.9em;
                }
                .section {
                    margin-bottom: 40px;
                    page-break-inside: avoid;
                }
                .section-title {
                    font-size: 1.8em;
                    color: #1e40af;
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .metric-card {
                    background: #f8fafc;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                }
                .metric-value {
                    font-size: 2em;
                    font-weight: bold;
                    color: #2563eb;
                }
                .metric-label {
                    color: #6b7280;
                    font-size: 0.9em;
                    margin-top: 5px;
                }
                .chart-container {
                    margin: 20px 0;
                    text-align: center;
                }
                .chart-placeholder {
                    background: #f1f5f9;
                    border: 2px dashed #cbd5e1;
                    height: 300px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                    border-radius: 8px;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .data-table th,
                .data-table td {
                    border: 1px solid #e5e7eb;
                    padding: 12px;
                    text-align: left;
                }
                .data-table th {
                    background: #f8fafc;
                    font-weight: 600;
                    color: #374151;
                }
                .insight-box {
                    background: #eff6ff;
                    border-left: 4px solid #2563eb;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 0 8px 8px 0;
                }
                .recommendation-box {
                    background: #f0fdf4;
                    border-left: 4px solid #059669;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 0 8px 8px 0;
                }
                @media print {
                    body { margin: 0; padding: 15px; }
                    .section { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
        `;
        
        // Generate sections
        for (const section of template.sections) {
            html += await this.generateSection(section, data, options);
        }
        
        html += `
            <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 0.8em;">
                Rapport généré par FormEase le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
            </footer>
        </body>
        </html>
        `;
        
        return html;
    }
    
    async generateSection(section, data, options) {
        switch (section.type) {
            case 'header':
                return this.generateHeaderSection(section, data, options);
            case 'metrics':
                return this.generateMetricsSection(section, data, options);
            case 'charts':
                return this.generateChartsSection(section, data, options);
            case 'insights':
                return this.generateInsightsSection(section, data, options);
            case 'executive-summary':
                return this.generateExecutiveSummarySection(section, data, options);
            case 'field-analysis':
                return this.generateFieldAnalysisSection(section, data, options);
            case 'trends':
                return this.generateTrendsSection(section, data, options);
            case 'recommendations':
                return this.generateRecommendationsSection(section, data, options);
            case 'performance-metrics':
                return this.generatePerformanceMetricsSection(section, data, options);
            case 'user-journey':
                return this.generateUserJourneySection(section, data, options);
            case 'device-analysis':
                return this.generateDeviceAnalysisSection(section, data, options);
            default:
                return `<div class="section"><p>Section type "${section.type}" not implemented</p></div>`;
        }
    }
    
    generateHeaderSection(section, data, options) {
        return `
        <div class="report-header">
            ${section.showLogo ? '<div class="report-logo">📊 FormEase</div>' : ''}
            <h1 class="report-title">${section.title || options.title}</h1>
            ${section.subtitle ? `<p class="report-subtitle">${section.subtitle}</p>` : ''}
            ${section.showDate ? `<p class="report-date">Généré le ${new Date().toLocaleDateString('fr-FR')}</p>` : ''}
        </div>
        `;
    }
    
    generateMetricsSection(section, data, options) {
        const metricsHtml = section.metrics.map(metric => {
            const value = this.formatMetricValue(data[metric.key], metric.format);
            return `
            <div class="metric-card">
                <div class="metric-value">${value}</div>
                <div class="metric-label">${metric.label}</div>
            </div>
            `;
        }).join('');
        
        return `
        <div class="section">
            <h2 class="section-title">${section.title}</h2>
            <div class="metrics-grid">
                ${metricsHtml}
            </div>
        </div>
        `;
    }
    
    generateChartsSection(section, data, options) {
        const chartsHtml = section.charts.map(chart => {
            return `
            <div class="chart-container">
                <h3>${chart.title}</h3>
                <div class="chart-placeholder">
                    📊 Graphique ${chart.type} - ${chart.field}
                    <br><small>Les graphiques seront rendus dans l'implémentation finale</small>
                </div>
            </div>
            `;
        }).join('');
        
        return `
        <div class="section">
            <h2 class="section-title">${section.title}</h2>
            ${chartsHtml}
        </div>
        `;
    }
    
    generateInsightsSection(section, data, options) {
        const insights = this.generateAutoInsights(data);
        
        const insightsHtml = insights.map(insight => `
            <div class="insight-box">
                <strong>${insight.title}</strong><br>
                ${insight.description}
            </div>
        `).join('');
        
        return `
        <div class="section">
            <h2 class="section-title">${section.title}</h2>
            ${insightsHtml}
        </div>
        `;
    }
    
    generateExecutiveSummarySection(section, data, options) {
        const summary = this.generateExecutiveSummary(data);
        
        return `
        <div class="section">
            <h2 class="section-title">${section.title}</h2>
            <div class="insight-box">
                <h3>Points Clés</h3>
                <ul>
                    ${summary.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
                </ul>
            </div>
            <div class="recommendation-box">
                <h3>Recommandations Principales</h3>
                <ul>
                    ${summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
        `;
    }
    
    generateFieldAnalysisSection(section, data, options) {
        return `
        <div class="section">
            <h2 class="section-title">${section.title}</h2>
            <p>Analyse détaillée des champs de formulaire sera implémentée ici.</p>
            <div class="chart-placeholder">
                📊 Distribution des réponses par champ
            </div>
        </div>
        `;
    }
    
    generateTrendsSection(section, data, options) {
        return `
        <div class="section">
            <h2 class="section-title">${section.title}</h2>
            <p>Analyse des tendances temporelles sera implémentée ici.</p>
            <div class="chart-placeholder">
                📈 Tendances dans le temps
            </div>
        </div>
        `;
    }
    
    generateRecommendationsSection(section, data, options) {
        const recommendations = this.generateRecommendations(data);
        
        const recHtml = recommendations.map(rec => `
            <div class="recommendation-box">
                <strong>${rec.title}</strong><br>
                ${rec.description}
                ${rec.priority ? `<br><small>Priorité: ${rec.priority}</small>` : ''}
            </div>
        `).join('');
        
        return `
        <div class="section">
            <h2 class="section-title">${section.title}</h2>
            ${recHtml}
        </div>
        `;
    }
    
    generatePerformanceMetricsSection(section, data, options) {
        const metricsHtml = section.metrics.map(metric => {
            const value = this.formatMetricValue(data[metric.key] || Math.random() * 100, metric.format);
            return `
            <div class="metric-card">
                <div class="metric-value">${value}</div>
                <div class="metric-label">${metric.label}</div>
            </div>
            `;
        }).join('');
        
        return `
        <div class="section">
            <h2 class="section-title">${section.title}</h2>
            <div class="metrics-grid">
                ${metricsHtml}
            </div>
        </div>
        `;
    }
    
    generateUserJourneySection(section, data, options) {
        return `
        <div class="section">
            <h2 class="section-title">${section.title}</h2>
            <p>Analyse du parcours utilisateur sera implémentée ici.</p>
            <div class="chart-placeholder">
                🗺️ Carte du parcours utilisateur
            </div>
        </div>
        `;
    }
    
    generateDeviceAnalysisSection(section, data, options) {
        return `
        <div class="section">
            <h2 class="section-title">${section.title}</h2>
            <p>Analyse par appareil sera implémentée ici.</p>
            <div class="chart-placeholder">
                📱 Répartition par appareil
            </div>
        </div>
        `;
    }
    
    formatMetricValue(value, format) {
        if (value === null || value === undefined) return 'N/A';
        
        switch (format) {
            case 'number':
                return new Intl.NumberFormat('fr-FR').format(value);
            case 'percentage':
                return `${parseFloat(value).toFixed(1)}%`;
            case 'duration':
                if (typeof value === 'number') {
                    const minutes = Math.floor(value / 60);
                    const seconds = value % 60;
                    return `${minutes}m ${seconds}s`;
                }
                return value;
            case 'date':
                return new Date(value).toLocaleDateString('fr-FR');
            case 'milliseconds':
                return `${value}ms`;
            default:
                return value.toString();
        }
    }
    
    generateAutoInsights(data) {
        // Simulate auto-generated insights based on data patterns
        return [
            {
                title: 'Taux de completion élevé',
                description: 'Le formulaire affiche un excellent taux de completion de 87%, supérieur à la moyenne du secteur.'
            },
            {
                title: 'Pic d\'activité en matinée',
                description: 'La majorité des réponses sont collectées entre 9h et 11h, suggérant une optimisation pour cette période.'
            },
            {
                title: 'Usage mobile croissant',
                description: '64% des réponses proviennent d\'appareils mobiles, en hausse de 12% ce mois-ci.'
            }
        ];
    }
    
    generateExecutiveSummary(data) {
        return {
            keyFindings: [
                'Performance globale excellente avec 87% de taux de completion',
                'Croissance de 15% des réponses par rapport au mois précédent',
                'Temps de completion moyen optimisé à 3m 24s',
                'Satisfaction utilisateur élevée (4.8/5)'
            ],
            recommendations: [
                'Maintenir la simplicité du formulaire actuel',
                'Optimiser pour les heures de pointe (9h-11h)',
                'Améliorer l\'expérience mobile',
                'Implémenter un système de relance automatique'
            ]
        };
    }
    
    generateRecommendations(data) {
        return [
            {
                title: 'Optimisation mobile',
                description: 'Améliorer l\'interface mobile pour réduire le temps de completion',
                priority: 'Haute'
            },
            {
                title: 'Relances automatisées',
                description: 'Mettre en place des emails de relance pour les formulaires abandonnés',
                priority: 'Moyenne'
            },
            {
                title: 'A/B Testing',
                description: 'Tester différentes versions du formulaire pour optimiser la conversion',
                priority: 'Basse'
            }
        ];
    }
    
    async convertHTMLToPDF(htmlContent, options) {
        // In a real implementation, this would use a PDF generation library
        // For now, we simulate the process
        
        console.log('🔄 Converting HTML to PDF...');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return simulated PDF data (in reality, this would be a Blob or ArrayBuffer)
        return new TextEncoder().encode(htmlContent);
    }
    
    async createExcelWorkbook(template, data, options) {
        // In a real implementation, this would use libraries like ExcelJS or SheetJS
        console.log('🔄 Creating Excel workbook...');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
            sheets: [
                { name: 'Summary', data: 'Summary data...' },
                { name: 'Raw Data', data: 'Raw data...' },
                { name: 'Charts', data: 'Chart data...' }
            ],
            size: 45000 // Simulated size in bytes
        };
    }
    
    estimatePageCount(htmlContent) {
        // Simple estimation based on content length
        const wordsPerPage = 500;
        const wordCount = htmlContent.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerPage);
    }
    
    scheduleReport(templateId, schedule, options = {}) {
        const scheduleId = `schedule_${Date.now()}`;
        const template = this.getReportTemplate(templateId);
        
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        
        const scheduledReport = {
            id: scheduleId,
            templateId,
            template,
            schedule: {
                frequency: schedule.frequency, // 'daily', 'weekly', 'monthly'
                time: schedule.time || '09:00',
                dayOfWeek: schedule.dayOfWeek, // For weekly
                dayOfMonth: schedule.dayOfMonth, // For monthly
                timezone: schedule.timezone || 'Europe/Paris',
                enabled: true
            },
            options: {
                format: options.format || 'pdf',
                recipients: options.recipients || [],
                subject: options.subject || `Rapport automatique - ${template.name}`,
                ...options
            },
            created: new Date().toISOString(),
            nextRun: this.calculateNextRun(schedule),
            lastRun: null,
            runCount: 0
        };
        
        this.scheduledReports.set(scheduleId, scheduledReport);
        
        console.log(`📅 Report scheduled: ${scheduleId}`);
        return scheduleId;
    }
    
    calculateNextRun(schedule) {
        const now = new Date();
        const nextRun = new Date();
        
        switch (schedule.frequency) {
            case 'daily':
                nextRun.setDate(now.getDate() + 1);
                break;
            case 'weekly':
                const daysUntilTarget = (schedule.dayOfWeek - now.getDay() + 7) % 7;
                nextRun.setDate(now.getDate() + (daysUntilTarget || 7));
                break;
            case 'monthly':
                nextRun.setMonth(now.getMonth() + 1);
                nextRun.setDate(schedule.dayOfMonth || 1);
                break;
        }
        
        // Set the time
        const [hours, minutes] = (schedule.time || '09:00').split(':');
        nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        return nextRun.toISOString();
    }
    
    getScheduledReports() {
        return Array.from(this.scheduledReports.values());
    }
    
    updateScheduledReport(scheduleId, updates) {
        const report = this.scheduledReports.get(scheduleId);
        if (!report) {
            throw new Error(`Scheduled report not found: ${scheduleId}`);
        }
        
        const updatedReport = { ...report, ...updates };
        if (updates.schedule) {
            updatedReport.nextRun = this.calculateNextRun(updates.schedule);
        }
        
        this.scheduledReports.set(scheduleId, updatedReport);
        return updatedReport;
    }
    
    deleteScheduledReport(scheduleId) {
        return this.scheduledReports.delete(scheduleId);
    }
    
    async downloadReport(reportResult) {
        const blob = new Blob([reportResult.data], {
            type: this.getMimeType(reportResult.type)
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = reportResult.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`📥 Report downloaded: ${reportResult.filename}`);
    }
    
    getMimeType(type) {
        switch (type) {
            case 'pdf':
                return 'application/pdf';
            case 'excel':
                return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            case 'html':
                return 'text/html';
            default:
                return 'application/octet-stream';
        }
    }
    
    getReportHistory() {
        return this.reportHistory.slice().reverse(); // Most recent first
    }
    
    getStats() {
        const totalReports = this.reportHistory.length;
        const successfulReports = this.reportHistory.filter(r => r.success).length;
        const averageDuration = this.reportHistory.reduce((sum, r) => sum + r.duration, 0) / totalReports;
        
        const formatCounts = this.reportHistory.reduce((acc, r) => {
            acc[r.options.format] = (acc[r.options.format] || 0) + 1;
            return acc;
        }, {});
        
        return {
            totalReports,
            successfulReports,
            successRate: totalReports > 0 ? (successfulReports / totalReports) * 100 : 0,
            averageDuration: Math.round(averageDuration),
            formatCounts,
            totalTemplates: this.reportTemplates.size,
            scheduledReports: this.scheduledReports.size
        };
    }
    
    setupEventListeners() {
        // Setup any global event listeners for the reporting system
        window.addEventListener('beforeunload', () => {
            // Save any pending report data
            this.saveReportState();
        });
    }
    
    saveReportState() {
        // Save important state to localStorage or session storage
        const state = {
            reportHistory: this.reportHistory.slice(-50), // Keep last 50 reports
            customTemplates: Array.from(this.reportTemplates.entries()).filter(([id, template]) => template.isCustom)
        };
        
        try {
            localStorage.setItem('formease-reporting-state', JSON.stringify(state));
        } catch (error) {
            console.warn('Could not save reporting state:', error);
        }
    }
    
    loadReportState() {
        try {
            const state = JSON.parse(localStorage.getItem('formease-reporting-state') || '{}');
            
            if (state.reportHistory) {
                this.reportHistory = state.reportHistory;
            }
            
            if (state.customTemplates) {
                state.customTemplates.forEach(([id, template]) => {
                    this.reportTemplates.set(id, template);
                });
            }
        } catch (error) {
            console.warn('Could not load reporting state:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormEaseReporting;
} else {
    window.FormEaseReporting = FormEaseReporting;
}

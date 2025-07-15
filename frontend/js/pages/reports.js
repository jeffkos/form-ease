/**
 * Reports Page - Script dynamique
 * Gère la génération et la gestion des rapports analytiques
 */

class ReportsPage {
    constructor() {
        this.reports = [];
        this.filteredReports = [];
        this.templates = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            status: 'all',
            type: 'all',
            dateRange: '30d',
            search: ''
        };
        this.sortConfig = {
            field: 'createdDate',
            direction: 'desc'
        };
        this.charts = {};
    }

    async init() {
        try {
            console.log('🚀 Initialisation Reports Page...');
            
            // Initialisation des services
            if (!window.apiService) {
                console.error('❌ ApiService non disponible');
                return;
            }

            // Chargement initial des données
            await this.loadReports();
            await this.loadTemplates();
            
            // Configuration des événements
            this.setupEventListeners();
            
            // Rendu initial
            this.renderStats();
            this.renderReports();
            this.renderTemplates();
            this.initCharts();

            console.log('✅ Reports Page initialisée avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showError('Erreur lors du chargement des données');
        }
    }

    async loadReports() {
        try {
            console.log('📊 Chargement des rapports...');
            
            // Simulation de données pour le développement
            this.reports = this.generateMockReports();
            this.applyFilters();
            
            // TODO: Remplacer par un appel API réel
            // const response = await window.apiService.get('/reports', {
            //     params: this.filters
            // });
            // this.reports = response.data.reports || [];
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des rapports:', error);
            throw error;
        }
    }

    async loadTemplates() {
        try {
            console.log('📋 Chargement des templates...');
            
            // Templates prédéfinis
            this.templates = [
                {
                    id: 'weekly-summary',
                    name: 'Résumé Hebdomadaire',
                    description: 'Vue d\'ensemble des performances de la semaine',
                    type: 'summary',
                    icon: 'ri-calendar-week-line',
                    popular: true
                },
                {
                    id: 'monthly-analytics',
                    name: 'Analytics Mensuel',
                    description: 'Analyse détaillée des métriques du mois',
                    type: 'analytics',
                    icon: 'ri-bar-chart-box-line',
                    popular: true
                },
                {
                    id: 'form-performance',
                    name: 'Performance des Formulaires',
                    description: 'Analyse comparative des formulaires',
                    type: 'performance',
                    icon: 'ri-file-list-3-line',
                    popular: false
                },
                {
                    id: 'conversion-report',
                    name: 'Rapport de Conversion',
                    description: 'Taux de conversion et optimisations',
                    type: 'conversion',
                    icon: 'ri-exchange-line',
                    popular: true
                },
                {
                    id: 'custom-report',
                    name: 'Rapport Personnalisé',
                    description: 'Créer un rapport sur mesure',
                    type: 'custom',
                    icon: 'ri-settings-3-line',
                    popular: false
                }
            ];
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des templates:', error);
        }
    }

    generateMockReports() {
        const statuses = ['completed', 'pending', 'failed', 'scheduled'];
        const types = ['summary', 'analytics', 'performance', 'conversion', 'custom'];
        const formats = ['PDF', 'Excel', 'CSV', 'PowerPoint'];
        
        const data = [];
        
        for (let i = 0; i < 25; i++) {
            const createdDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const type = types[Math.floor(Math.random() * types.length)];
            const format = formats[Math.floor(Math.random() * formats.length)];
            
            data.push({
                id: `report-${i + 1}`,
                name: `Rapport ${type} ${i + 1}`,
                description: `Analyse ${type} générée automatiquement`,
                type: type,
                status: status,
                format: format,
                createdDate: createdDate,
                completedDate: status === 'completed' ? new Date(createdDate.getTime() + Math.random() * 24 * 60 * 60 * 1000) : null,
                scheduledDate: status === 'scheduled' ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
                size: status === 'completed' ? `${Math.floor(Math.random() * 50) + 5} MB` : null,
                downloadCount: status === 'completed' ? Math.floor(Math.random() * 20) : 0,
                createdBy: 'Utilisateur Test',
                tags: ['analytics', 'monthly', 'performance'].slice(0, Math.floor(Math.random() * 3) + 1),
                isRecurring: Math.random() > 0.7,
                nextSchedule: Math.random() > 0.7 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null
            });
        }
        
        return data.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    }

    setupEventListeners() {
        // Filtres
        const statusFilter = document.getElementById('status-filter');
        const typeFilter = document.getElementById('type-filter');
        const dateRangeFilter = document.getElementById('date-range-filter');
        const searchInput = document.getElementById('reports-search');

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
                this.renderStats();
                this.renderReports();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.applyFilters();
                this.renderStats();
                this.renderReports();
            });
        }

        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', (e) => {
                this.filters.dateRange = e.target.value;
                this.applyFilters();
                this.renderStats();
                this.renderReports();
            });
        }

        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filters.search = e.target.value.toLowerCase();
                    this.applyFilters();
                    this.renderStats();
                    this.renderReports();
                }, 300);
            });
        }

        // Boutons d'action
        const generateBtn = document.getElementById('generate-report');
        const scheduleBtn = document.getElementById('schedule-report');
        const refreshBtn = document.getElementById('refresh-reports');

        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.showGenerateModal());
        }

        if (scheduleBtn) {
            scheduleBtn.addEventListener('click', () => this.showScheduleModal());
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
    }

    applyFilters() {
        this.filteredReports = this.reports.filter(report => {
            // Filtre par statut
            if (this.filters.status !== 'all' && report.status !== this.filters.status) {
                return false;
            }

            // Filtre par type
            if (this.filters.type !== 'all' && report.type !== this.filters.type) {
                return false;
            }

            // Filtre par période
            const dateLimit = this.getDateLimit(this.filters.dateRange);
            if (report.createdDate < dateLimit) {
                return false;
            }

            // Filtre par recherche
            if (this.filters.search && 
                !report.name.toLowerCase().includes(this.filters.search) &&
                !report.description.toLowerCase().includes(this.filters.search) &&
                !report.tags.some(tag => tag.toLowerCase().includes(this.filters.search))) {
                return false;
            }

            return true;
        });

        // Réinitialiser la page
        this.currentPage = 1;
    }

    getDateLimit(range) {
        const now = new Date();
        switch (range) {
            case '7d':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case '30d':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case '90d':
                return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            case '365d':
                return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            default:
                return new Date(0);
        }
    }

    renderStats() {
        const stats = this.calculateStats();

        // Mise à jour des éléments de statistiques
        this.updateElement('total-reports', stats.total);
        this.updateElement('completed-reports', stats.completed);
        this.updateElement('scheduled-reports', stats.scheduled);
        this.updateElement('total-downloads', stats.totalDownloads);
    }

    calculateStats() {
        const data = this.filteredReports;
        const total = data.length;
        const completed = data.filter(r => r.status === 'completed').length;
        const scheduled = data.filter(r => r.status === 'scheduled').length;
        const totalDownloads = data.reduce((sum, r) => sum + r.downloadCount, 0);

        return {
            total,
            completed,
            scheduled,
            totalDownloads
        };
    }

    renderReports() {
        const container = document.getElementById('reports-list');
        if (!container) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredReports.slice(startIndex, endIndex);

        container.innerHTML = pageData.map(report => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <i class="ri-file-text-line text-blue-600"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${report.name}</div>
                            <div class="text-sm text-gray-500">${report.description}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${this.getTypeBadge(report.type)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${this.getStatusBadge(report.status)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${this.formatDate(report.createdDate)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${report.size || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${report.downloadCount}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        ${report.status === 'completed' ? 
                            `<button onclick="reportsPage.downloadReport('${report.id}')" 
                                     class="text-blue-600 hover:text-blue-900">
                                <i class="ri-download-line"></i>
                             </button>` : ''}
                        <button onclick="reportsPage.viewReport('${report.id}')" 
                                class="text-gray-600 hover:text-gray-900">
                            <i class="ri-eye-line"></i>
                        </button>
                        <button onclick="reportsPage.duplicateReport('${report.id}')" 
                                class="text-green-600 hover:text-green-900">
                            <i class="ri-file-copy-line"></i>
                        </button>
                        <button onclick="reportsPage.deleteReport('${report.id}')" 
                                class="text-red-600 hover:text-red-900">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.renderPagination();
    }

    renderTemplates() {
        const container = document.getElementById('report-templates');
        if (!container) return;

        container.innerHTML = this.templates.map(template => `
            <div class="tremor-Card bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                 onclick="reportsPage.selectTemplate('${template.id}')">
                <div class="p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center">
                            <div class="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="${template.icon} text-blue-600 text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="font-semibold text-gray-900">${template.name}</h3>
                                <p class="text-sm text-gray-500">${template.description}</p>
                            </div>
                        </div>
                        ${template.popular ? 
                            '<span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Populaire</span>' : ''}
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-500 capitalize">${template.type}</span>
                        <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Utiliser →
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getTypeBadge(type) {
        const badges = {
            summary: '<span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Résumé</span>',
            analytics: '<span class="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Analytics</span>',
            performance: '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Performance</span>',
            conversion: '<span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Conversion</span>',
            custom: '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Personnalisé</span>'
        };
        return badges[type] || badges.custom;
    }

    getStatusBadge(status) {
        const badges = {
            completed: '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Terminé</span>',
            pending: '<span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">En cours</span>',
            failed: '<span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Échoué</span>',
            scheduled: '<span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Programmé</span>'
        };
        return badges[status] || badges.pending;
    }

    renderPagination() {
        const container = document.getElementById('pagination-container');
        if (!container) return;

        const totalPages = Math.ceil(this.filteredReports.length / this.itemsPerPage);
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredReports.length);

        // Mise à jour des informations de pagination
        this.updateElement('page-start', startItem);
        this.updateElement('page-end', endItem);
        this.updateElement('total-items', this.filteredReports.length);

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Bouton précédent
        if (this.currentPage > 1) {
            paginationHTML += `
                <button onclick="reportsPage.changePage(${this.currentPage - 1})" 
                        class="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-l-md">
                    Précédent
                </button>
            `;
        }

        // Boutons de pages
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button onclick="reportsPage.changePage(${i})" 
                        class="px-3 py-2 text-sm ${i === this.currentPage ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'} border border-gray-300">
                    ${i}
                </button>
            `;
        }

        // Bouton suivant
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button onclick="reportsPage.changePage(${this.currentPage + 1})" 
                        class="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-r-md">
                    Suivant
                </button>
            `;
        }

        container.innerHTML = paginationHTML;
    }

    changePage(page) {
        this.currentPage = page;
        this.renderReports();
    }

    initCharts() {
        // Initialisation du graphique de performance des rapports
        if (typeof ApexCharts === 'undefined') {
            console.warn('⚠️ ApexCharts non disponible');
            return;
        }

        this.initReportsChart();
    }

    initReportsChart() {
        const chartElement = document.getElementById('reports-chart');
        if (!chartElement) return;

        const options = {
            chart: {
                type: 'line',
                height: 300,
                toolbar: {
                    show: false
                }
            },
            series: [{
                name: 'Rapports générés',
                data: this.generateChartData()
            }],
            xaxis: {
                type: 'datetime'
            },
            colors: ['#0ea5e9'],
            stroke: {
                curve: 'smooth',
                width: 2
            },
            grid: {
                borderColor: '#e5e7eb'
            },
            legend: {
                position: 'top'
            }
        };

        this.charts.reports = new ApexCharts(chartElement, options);
        this.charts.reports.render();
    }

    generateChartData() {
        const data = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const dayReports = this.reports.filter(report => {
                const reportDate = new Date(report.createdDate);
                return reportDate.toDateString() === date.toDateString();
            });
            
            data.push({
                x: date.getTime(),
                y: dayReports.length
            });
        }
        return data;
    }

    async refreshData() {
        try {
            console.log('🔄 Actualisation des données...');
            await this.loadReports();
            this.renderStats();
            this.renderReports();
            if (this.charts.reports) {
                this.charts.reports.updateSeries([{
                    name: 'Rapports générés',
                    data: this.generateChartData()
                }]);
            }
            this.showSuccess('Données actualisées avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'actualisation:', error);
            this.showError('Erreur lors de l\'actualisation des données');
        }
    }

    showGenerateModal() {
        console.log('➕ Ouverture du modal de génération');
        // TODO: Implémenter le modal de génération de rapport
        this.showInfo('Modal de génération de rapport à implémenter');
    }

    showScheduleModal() {
        console.log('📅 Ouverture du modal de planification');
        // TODO: Implémenter le modal de planification
        this.showInfo('Modal de planification à implémenter');
    }

    selectTemplate(templateId) {
        console.log('📋 Template sélectionné:', templateId);
        const template = this.templates.find(t => t.id === templateId);
        if (template) {
            // TODO: Ouvrir le modal de génération avec le template pré-sélectionné
            this.showInfo(`Template "${template.name}" sélectionné`);
        }
    }

    downloadReport(reportId) {
        console.log('💾 Téléchargement rapport:', reportId);
        const report = this.reports.find(r => r.id === reportId);
        if (report && report.status === 'completed') {
            // Simuler le téléchargement
            report.downloadCount++;
            this.renderReports();
            this.showSuccess(`Rapport "${report.name}" téléchargé`);
        }
    }

    viewReport(reportId) {
        console.log('👁️ Affichage rapport:', reportId);
        const report = this.reports.find(r => r.id === reportId);
        if (report) {
            this.showInfo(`Affichage du rapport "${report.name}"`);
        }
    }

    duplicateReport(reportId) {
        console.log('📄 Duplication rapport:', reportId);
        const report = this.reports.find(r => r.id === reportId);
        if (report) {
            const newReport = {
                ...report,
                id: `report-${Date.now()}`,
                name: `${report.name} (copie)`,
                status: 'pending',
                createdDate: new Date(),
                completedDate: null,
                downloadCount: 0
            };
            
            this.reports.unshift(newReport);
            this.applyFilters();
            this.renderStats();
            this.renderReports();
            this.showSuccess('Rapport dupliqué avec succès');
        }
    }

    deleteReport(reportId) {
        console.log('🗑️ Suppression rapport:', reportId);
        const report = this.reports.find(r => r.id === reportId);
        if (report && confirm(`Êtes-vous sûr de vouloir supprimer "${report.name}" ?`)) {
            this.reports = this.reports.filter(r => r.id !== reportId);
            this.applyFilters();
            this.renderStats();
            this.renderReports();
            this.showSuccess('Rapport supprimé');
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    formatDate(date) {
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
let reportsPage;

// Fonction d'initialisation appelée par l'auto-loader
window.initReports = function() {
    reportsPage = new ReportsPage();
    reportsPage.init();
};

// Auto-initialisation si le DOM est déjà chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initReports);
} else {
    window.initReports();
}

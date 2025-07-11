/**
 * Visualization Dashboard
 * Sprint 5 Phase 3 - Interactive Dashboard System
 * 
 * Creates responsive dashboards with multiple visualizations
 */

class VisualizationDashboard {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            id: 'dashboard-' + Math.random().toString(36).substr(2, 9),
            title: 'Analytics Dashboard',
            layout: 'grid', // 'grid', 'masonry', 'flex'
            columns: 3,
            gap: 24,
            responsive: true,
            exportEnabled: true,
            filterEnabled: true,
            ...options
        };
        
        this.charts = new Map();
        this.filters = new Map();
        this.layouts = new Map();
        this.visualizationSystem = options.visualizationSystem;
        
        this.init();
    }
    
    init() {
        this.setupContainer();
        this.createLayout();
        this.setupEventListeners();
        
        console.log(`📊 Dashboard "${this.options.title}" initialized`);
    }
    
    setupContainer() {
        if (typeof this.container === 'string') {
            this.container = document.querySelector(this.container);
        }
        
        this.container.className = 'visualization-dashboard h-full bg-gray-50 dark:bg-gray-900';
        this.container.setAttribute('data-dashboard-id', this.options.id);
    }
    
    createLayout() {
        this.container.innerHTML = `
            <div class="dashboard-layout h-full flex flex-col">
                <!-- Dashboard Header -->
                <div class="dashboard-header bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
                                <i class="ri-dashboard-line text-blue-600 dark:text-blue-400 text-xl"></i>
                            </div>
                            <div>
                                <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
                                    ${this.options.title}
                                </h1>
                                <p class="text-sm text-gray-500 dark:text-gray-400">
                                    Analyse en temps réel des données
                                </p>
                            </div>
                        </div>
                        
                        <div class="flex items-center space-x-3">
                            <!-- Time Range Selector -->
                            <select id="timeRange" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="7d">7 derniers jours</option>
                                <option value="30d">30 derniers jours</option>
                                <option value="90d">3 derniers mois</option>
                                <option value="1y">1 an</option>
                            </select>
                            
                            <!-- Export Button -->
                            <button id="exportDashboard" class="tremor-button-secondary flex items-center">
                                <i class="ri-download-line mr-2"></i>
                                Exporter
                            </button>
                            
                            <!-- Settings Button -->
                            <button id="dashboardSettings" class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                <i class="ri-settings-3-line text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Filters Bar -->
                <div id="filtersBar" class="filters-bar bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 hidden">
                    <div class="flex items-center space-x-4">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Filtres:</span>
                        <div id="filtersContainer" class="flex items-center space-x-3 flex-1">
                            <!-- Dynamic filters will be added here -->
                        </div>
                        <button id="clearAllFilters" class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                            <i class="ri-close-circle-line mr-1"></i>
                            Effacer tout
                        </button>
                    </div>
                </div>
                
                <!-- Dashboard Content -->
                <div class="dashboard-content flex-1 overflow-auto tremor-scrollbar">
                    <div class="p-6">
                        <!-- Quick Stats -->
                        <div id="quickStats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <!-- Quick stats cards will be generated -->
                        </div>
                        
                        <!-- Charts Grid -->
                        <div id="chartsGrid" class="dashboard-grid">
                            <!-- Charts will be dynamically added here -->
                        </div>
                        
                        <!-- Empty State -->
                        <div id="emptyState" class="text-center py-16">
                            <div class="mx-auto max-w-md">
                                <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                    <i class="ri-bar-chart-line text-gray-400 text-2xl"></i>
                                </div>
                                <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    Dashboard vide
                                </h3>
                                <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    Commencez par ajouter des graphiques à votre dashboard.
                                </p>
                                <div class="mt-6">
                                    <button id="addFirstChart" class="tremor-button-primary">
                                        <i class="ri-add-line mr-2"></i>
                                        Ajouter un graphique
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.setupGridLayout();
        this.checkEmptyState();
    }
    
    setupGridLayout() {
        const grid = this.container.querySelector('#chartsGrid');
        
        switch (this.options.layout) {
            case 'grid':
                grid.className = `dashboard-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${this.options.columns} gap-${this.options.gap / 4}`;
                break;
            case 'masonry':
                grid.className = 'dashboard-grid masonry-layout';
                break;
            case 'flex':
                grid.className = 'dashboard-grid flex flex-wrap gap-6';
                break;
        }
    }
    
    setupEventListeners() {
        // Export dashboard
        const exportBtn = this.container.querySelector('#exportDashboard');
        exportBtn?.addEventListener('click', () => this.exportDashboard());
        
        // Dashboard settings
        const settingsBtn = this.container.querySelector('#dashboardSettings');
        settingsBtn?.addEventListener('click', () => this.openSettings());
        
        // Time range change
        const timeRange = this.container.querySelector('#timeRange');
        timeRange?.addEventListener('change', (e) => this.updateTimeRange(e.target.value));
        
        // Clear all filters
        const clearFilters = this.container.querySelector('#clearAllFilters');
        clearFilters?.addEventListener('click', () => this.clearAllFilters());
        
        // Add first chart
        const addFirstChart = this.container.querySelector('#addFirstChart');
        addFirstChart?.addEventListener('click', () => this.showAddChartDialog());
    }
    
    // ==========================================
    // Chart Management
    // ==========================================
    
    addChart(config) {
        const {
            id = 'chart-' + Date.now(),
            type,
            title,
            datasetId,
            position = 'auto',
            size = 'medium',
            options = {}
        } = config;
        
        // Create chart container
        const chartContainer = this.createChartContainer(id, title, size);
        
        // Add to grid
        const grid = this.container.querySelector('#chartsGrid');
        if (position === 'auto') {
            grid.appendChild(chartContainer);
        } else {
            // Handle specific positioning
            this.insertChartAtPosition(grid, chartContainer, position);
        }
        
        // Create the actual chart
        const chartElement = chartContainer.querySelector('.chart-content');
        
        if (this.visualizationSystem && datasetId) {
            const chart = this.visualizationSystem.createChart({
                id,
                type,
                datasetId,
                container: chartElement,
                options
            });
            
            this.charts.set(id, {
                id,
                type,
                title,
                chart,
                container: chartContainer,
                datasetId,
                config
            });
        }
        
        this.checkEmptyState();
        this.saveLayout();
        
        return id;
    }
    
    createChartContainer(id, title, size) {
        const sizeClasses = {
            small: 'col-span-1 row-span-1',
            medium: 'col-span-1 md:col-span-2 row-span-2',
            large: 'col-span-1 md:col-span-2 lg:col-span-3 row-span-3',
            wide: 'col-span-1 md:col-span-2 lg:col-span-3 row-span-1'
        };
        
        const container = document.createElement('div');
        container.className = `chart-container tremor-card ${sizeClasses[size] || sizeClasses.medium}`;
        container.setAttribute('data-chart-id', id);
        
        container.innerHTML = `
            <div class="chart-wrapper h-full flex flex-col">
                <!-- Chart Header -->
                <div class="chart-header flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                        ${title || 'Graphique'}
                    </h3>
                    <div class="flex items-center space-x-2">
                        <button class="chart-action-btn p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded" 
                                data-action="fullscreen" title="Plein écran">
                            <i class="ri-fullscreen-line text-sm"></i>
                        </button>
                        <button class="chart-action-btn p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded" 
                                data-action="settings" title="Paramètres">
                            <i class="ri-settings-3-line text-sm"></i>
                        </button>
                        <button class="chart-action-btn p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded" 
                                data-action="export" title="Exporter">
                            <i class="ri-download-line text-sm"></i>
                        </button>
                        <button class="chart-action-btn p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded" 
                                data-action="remove" title="Supprimer">
                            <i class="ri-close-line text-sm"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Chart Content -->
                <div class="chart-content flex-1 p-4">
                    <!-- Chart will be rendered here -->
                </div>
            </div>
        `;
        
        // Add event listeners for chart actions
        this.setupChartActions(container, id);
        
        return container;
    }
    
    setupChartActions(container, chartId) {
        const actionButtons = container.querySelectorAll('.chart-action-btn');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = button.getAttribute('data-action');
                this.handleChartAction(chartId, action);
            });
        });
    }
    
    handleChartAction(chartId, action) {
        const chartInfo = this.charts.get(chartId);
        if (!chartInfo) return;
        
        switch (action) {
            case 'fullscreen':
                this.openChartFullscreen(chartId);
                break;
            case 'settings':
                this.openChartSettings(chartId);
                break;
            case 'export':
                this.exportChart(chartId);
                break;
            case 'remove':
                this.removeChart(chartId);
                break;
        }
    }
    
    removeChart(chartId) {
        const chartInfo = this.charts.get(chartId);
        if (chartInfo) {
            // Remove from visualization system
            if (this.visualizationSystem) {
                this.visualizationSystem.removeChart(chartId);
            }
            
            // Remove container from DOM
            chartInfo.container.remove();
            
            // Remove from local tracking
            this.charts.delete(chartId);
            
            this.checkEmptyState();
            this.saveLayout();
        }
    }
    
    // ==========================================
    // Filter Management
    // ==========================================
    
    addFilter(config) {
        const {
            id = 'filter-' + Date.now(),
            type,
            field,
            label,
            options = {}
        } = config;
        
        const filterElement = this.createFilterElement(id, type, field, label, options);
        
        const filtersContainer = this.container.querySelector('#filtersContainer');
        filtersContainer.appendChild(filterElement);
        
        // Show filters bar
        const filtersBar = this.container.querySelector('#filtersBar');
        filtersBar.classList.remove('hidden');
        
        this.filters.set(id, {
            id,
            type,
            field,
            label,
            element: filterElement,
            value: null
        });
        
        return id;
    }
    
    createFilterElement(id, type, field, label, options) {
        const element = document.createElement('div');
        element.className = 'filter-element flex items-center space-x-2';
        element.setAttribute('data-filter-id', id);
        
        switch (type) {
            case 'select':
                element.innerHTML = `
                    <label class="text-sm text-gray-600 dark:text-gray-400">${label}:</label>
                    <select class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option value="">Tous</option>
                        ${options.values?.map(value => `<option value="${value}">${value}</option>`).join('') || ''}
                    </select>
                `;
                break;
            case 'daterange':
                element.innerHTML = `
                    <label class="text-sm text-gray-600 dark:text-gray-400">${label}:</label>
                    <input type="date" class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <span class="text-gray-400">à</span>
                    <input type="date" class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                `;
                break;
            case 'search':
                element.innerHTML = `
                    <label class="text-sm text-gray-600 dark:text-gray-400">${label}:</label>
                    <input type="text" placeholder="Rechercher..." class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                `;
                break;
        }
        
        // Add change event listeners
        const inputs = element.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateFilter(id, this.getFilterValue(element, type));
            });
        });
        
        return element;
    }
    
    getFilterValue(element, type) {
        switch (type) {
            case 'select':
                return element.querySelector('select').value;
            case 'daterange':
                const inputs = element.querySelectorAll('input[type="date"]');
                return {
                    start: inputs[0].value,
                    end: inputs[1].value
                };
            case 'search':
                return element.querySelector('input[type="text"]').value;
            default:
                return null;
        }
    }
    
    updateFilter(filterId, value) {
        const filter = this.filters.get(filterId);
        if (filter) {
            filter.value = value;
            this.applyFilters();
        }
    }
    
    applyFilters() {
        // Apply all active filters to all charts
        const activeFilters = Array.from(this.filters.values())
            .filter(filter => filter.value && filter.value !== '');
        
        // This would integrate with the data visualization system
        // to filter data and refresh charts
        console.log('Applying filters:', activeFilters);
        
        // Refresh all charts with filtered data
        this.charts.forEach((chartInfo, chartId) => {
            if (this.visualizationSystem) {
                // Apply filters and refresh chart
                // Implementation depends on how filtering is handled in the main system
            }
        });
    }
    
    clearAllFilters() {
        this.filters.forEach(filter => {
            const inputs = filter.element.querySelectorAll('input, select');
            inputs.forEach(input => {
                if (input.type === 'select') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });
            filter.value = null;
        });
        
        this.applyFilters();
    }
    
    // ==========================================
    // Quick Stats
    // ==========================================
    
    updateQuickStats(stats) {
        const quickStatsContainer = this.container.querySelector('#quickStats');
        
        if (!stats || stats.length === 0) {
            quickStatsContainer.style.display = 'none';
            return;
        }
        
        quickStatsContainer.style.display = 'grid';
        quickStatsContainer.innerHTML = '';
        
        stats.forEach(stat => {
            const statCard = this.createStatCard(stat);
            quickStatsContainer.appendChild(statCard);
        });
    }
    
    createStatCard(stat) {
        const {
            title,
            value,
            change,
            changeType = 'neutral',
            icon = 'ri-bar-chart-line',
            color = 'blue'
        } = stat;
        
        const colorClasses = {
            blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
            green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
            yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
            red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
        };
        
        const changeClasses = {
            positive: 'text-green-600 dark:text-green-400',
            negative: 'text-red-600 dark:text-red-400',
            neutral: 'text-gray-600 dark:text-gray-400'
        };
        
        const card = document.createElement('div');
        card.className = 'tremor-card p-6';
        
        card.innerHTML = `
            <div class="flex items-center">
                <div class="p-3 rounded-lg ${colorClasses[color] || colorClasses.blue}">
                    <i class="${icon} text-xl"></i>
                </div>
                <div class="ml-4 flex-1">
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">
                        ${value}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        ${title}
                    </div>
                    ${change ? `
                        <div class="text-xs ${changeClasses[changeType]} mt-1">
                            <i class="ri-arrow-${changeType === 'positive' ? 'up' : changeType === 'negative' ? 'down' : 'right'}-line mr-1"></i>
                            ${change}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        return card;
    }
    
    // ==========================================
    // Layout Management
    // ==========================================
    
    saveLayout() {
        const layout = {
            dashboardId: this.options.id,
            charts: Array.from(this.charts.values()).map(chart => ({
                id: chart.id,
                type: chart.type,
                title: chart.title,
                datasetId: chart.datasetId,
                config: chart.config,
                position: this.getChartPosition(chart.container)
            })),
            filters: Array.from(this.filters.values()).map(filter => ({
                id: filter.id,
                type: filter.type,
                field: filter.field,
                label: filter.label
            }))
        };
        
        localStorage.setItem(`dashboard-layout-${this.options.id}`, JSON.stringify(layout));
    }
    
    loadLayout(layoutData) {
        if (layoutData.charts) {
            layoutData.charts.forEach(chartConfig => {
                this.addChart(chartConfig);
            });
        }
        
        if (layoutData.filters) {
            layoutData.filters.forEach(filterConfig => {
                this.addFilter(filterConfig);
            });
        }
    }
    
    getChartPosition(container) {
        const grid = this.container.querySelector('#chartsGrid');
        const children = Array.from(grid.children);
        return children.indexOf(container);
    }
    
    // ==========================================
    // Utility Methods
    // ==========================================
    
    checkEmptyState() {
        const emptyState = this.container.querySelector('#emptyState');
        const hasCharts = this.charts.size > 0;
        
        if (hasCharts) {
            emptyState.style.display = 'none';
        } else {
            emptyState.style.display = 'block';
        }
    }
    
    updateTimeRange(range) {
        console.log('Time range updated:', range);
        // Implementation for updating all charts with new time range
        this.applyFilters();
    }
    
    exportDashboard() {
        console.log('Exporting dashboard...');
        // Implementation for dashboard export
    }
    
    exportChart(chartId) {
        console.log('Exporting chart:', chartId);
        // Implementation for single chart export
    }
    
    openSettings() {
        console.log('Opening dashboard settings...');
        // Implementation for settings modal
    }
    
    openChartSettings(chartId) {
        console.log('Opening chart settings:', chartId);
        // Implementation for chart settings modal
    }
    
    openChartFullscreen(chartId) {
        console.log('Opening chart fullscreen:', chartId);
        // Implementation for fullscreen chart view
    }
    
    showAddChartDialog() {
        console.log('Showing add chart dialog...');
        // Implementation for add chart modal
    }
    
    insertChartAtPosition(grid, chartContainer, position) {
        const children = grid.children;
        if (position >= children.length) {
            grid.appendChild(chartContainer);
        } else {
            grid.insertBefore(chartContainer, children[position]);
        }
    }
}

// ==========================================
// Export
// ==========================================

if (typeof window !== 'undefined') {
    window.VisualizationDashboard = VisualizationDashboard;
}

export default VisualizationDashboard;

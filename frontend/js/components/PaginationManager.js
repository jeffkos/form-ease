/**
 * 📄 Pagination Manager - Pagination intelligente avec lazy loading
 * Performance optimisée pour gros volumes de données
 */

class PaginationManager {
    constructor() {
        this.containers = new Map();
        this.cache = new Map();
        this.config = {
            defaultPageSize: 20,
            maxPageSize: 100,
            prefetchPages: 2,
            cacheExpiry: 300000, // 5 minutes
            enableVirtualScrolling: true,
            enableInfiniteScroll: false,
            loadingStrategy: 'eager', // 'eager', 'lazy', 'on-demand'
            animationDuration: 300
        };
        
        this.observers = new Map();
        this.loadingStates = new Map();
        this.setupIntersectionObserver();
    }

    /**
     * 🔧 Initialiser une pagination
     */
    initialize(containerId, options = {}) {
        const config = {
            ...this.config,
            ...options,
            containerId,
            currentPage: 1,
            totalItems: 0,
            totalPages: 0,
            pageSize: options.pageSize || this.config.defaultPageSize,
            data: [],
            filteredData: [],
            sortConfig: null,
            filters: new Map(),
            renderFunction: options.renderFunction || this.defaultRenderFunction,
            loadFunction: options.loadFunction || this.defaultLoadFunction,
            onPageChange: options.onPageChange || (() => {}),
            onDataLoad: options.onDataLoad || (() => {}),
            serverSide: options.serverSide || false,
            enableSearch: options.enableSearch !== false,
            enableSort: options.enableSort !== false,
            enableExport: options.enableExport || false,
            customControls: options.customControls || []
        };

        this.containers.set(containerId, config);
        this.renderPaginationUI(containerId);
        
        // Chargement initial
        if (config.serverSide) {
            this.loadServerData(containerId, 1);
        } else if (options.data) {
            this.setData(containerId, options.data);
        }

        return this;
    }

    /**
     * 📊 Définir les données (mode client)
     */
    setData(containerId, data) {
        const config = this.containers.get(containerId);
        if (!config) return this;

        config.data = Array.isArray(data) ? data : [];
        config.filteredData = [...config.data];
        config.totalItems = config.filteredData.length;
        config.totalPages = Math.ceil(config.totalItems / config.pageSize);
        
        this.applyFiltersAndSort(containerId);
        this.renderPage(containerId);
        this.updatePaginationControls(containerId);

        config.onDataLoad({ totalItems: config.totalItems, totalPages: config.totalPages });
        
        return this;
    }

    /**
     * 🌐 Charger des données serveur
     */
    async loadServerData(containerId, page = 1, useCache = true) {
        const config = this.containers.get(containerId);
        if (!config || !config.serverSide) return;

        const cacheKey = this.generateCacheKey(containerId, page, config);
        
        // Vérifier le cache
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheExpiry) {
                this.processServerResponse(containerId, cached.data, page);
                return cached.data;
            }
        }

        this.setLoadingState(containerId, true);

        try {
            const params = this.buildServerParams(containerId, page);
            const response = await config.loadFunction(params);
            
            // Mise en cache
            this.cache.set(cacheKey, {
                data: response,
                timestamp: Date.now()
            });

            this.processServerResponse(containerId, response, page);
            return response;

        } catch (error) {
            this.handleLoadError(containerId, error);
            throw error;
        } finally {
            this.setLoadingState(containerId, false);
        }
    }

    /**
     * 🔄 Traiter la réponse serveur
     */
    processServerResponse(containerId, response, page) {
        const config = this.containers.get(containerId);
        if (!config) return;

        const data = response.data || response.items || response;
        const meta = response.meta || response.pagination || {};

        config.currentPage = page;
        config.totalItems = meta.total || response.total || data.length;
        config.totalPages = meta.totalPages || Math.ceil(config.totalItems / config.pageSize);
        config.filteredData = data;

        this.renderPage(containerId);
        this.updatePaginationControls(containerId);
        
        config.onPageChange({ 
            page, 
            totalPages: config.totalPages, 
            totalItems: config.totalItems,
            data: config.filteredData
        });

        // Préchargement des pages suivantes
        if (this.config.loadingStrategy === 'eager') {
            this.prefetchPages(containerId, page);
        }
    }

    /**
     * 📄 Aller à une page
     */
    goToPage(containerId, page) {
        const config = this.containers.get(containerId);
        if (!config || page < 1 || page > config.totalPages) return;

        if (config.serverSide) {
            this.loadServerData(containerId, page);
        } else {
            config.currentPage = page;
            this.renderPage(containerId);
            this.updatePaginationControls(containerId);
            
            config.onPageChange({ 
                page, 
                totalPages: config.totalPages, 
                totalItems: config.totalItems,
                data: this.getCurrentPageData(containerId)
            });
        }

        // Animation de scroll vers le haut
        const container = document.getElementById(containerId);
        if (container && window.AnimationManager) {
            container.scrollIntoView({ behavior: 'smooth' });
        }

        return this;
    }

    /**
     * 📊 Obtenir les données de la page actuelle
     */
    getCurrentPageData(containerId) {
        const config = this.containers.get(containerId);
        if (!config) return [];

        if (config.serverSide) {
            return config.filteredData;
        }

        const startIndex = (config.currentPage - 1) * config.pageSize;
        const endIndex = startIndex + config.pageSize;
        return config.filteredData.slice(startIndex, endIndex);
    }

    /**
     * 🔍 Appliquer des filtres
     */
    applyFilter(containerId, filterFunction, immediate = true) {
        const config = this.containers.get(containerId);
        if (!config || config.serverSide) return this;

        config.filteredData = config.data.filter(filterFunction);
        config.totalItems = config.filteredData.length;
        config.totalPages = Math.ceil(config.totalItems / config.pageSize);
        config.currentPage = 1; // Retour à la première page

        if (immediate) {
            this.renderPage(containerId);
            this.updatePaginationControls(containerId);
        }

        return this;
    }

    /**
     * 🔀 Appliquer un tri
     */
    applySort(containerId, sortFunction, direction = 'asc') {
        const config = this.containers.get(containerId);
        if (!config) return this;

        if (config.serverSide) {
            config.sortConfig = { sortFunction, direction };
            this.loadServerData(containerId, 1, false);
        } else {
            config.filteredData.sort((a, b) => {
                const result = sortFunction(a, b);
                return direction === 'desc' ? -result : result;
            });
            
            config.currentPage = 1;
            this.renderPage(containerId);
            this.updatePaginationControls(containerId);
        }

        return this;
    }

    /**
     * 🔍 Recherche textuelle
     */
    search(containerId, query, searchFields = []) {
        const config = this.containers.get(containerId);
        if (!config) return this;

        if (!query || query.trim().length === 0) {
            config.filteredData = [...config.data];
        } else {
            const searchTerm = query.toLowerCase();
            config.filteredData = config.data.filter(item => {
                if (searchFields.length === 0) {
                    // Recherche dans tous les champs
                    return Object.values(item).some(value => 
                        String(value).toLowerCase().includes(searchTerm)
                    );
                } else {
                    // Recherche dans les champs spécifiés
                    return searchFields.some(field => 
                        String(item[field] || '').toLowerCase().includes(searchTerm)
                    );
                }
            });
        }

        config.totalItems = config.filteredData.length;
        config.totalPages = Math.ceil(config.totalItems / config.pageSize);
        config.currentPage = 1;

        this.renderPage(containerId);
        this.updatePaginationControls(containerId);

        return this;
    }

    /**
     * 📏 Changer la taille de page
     */
    setPageSize(containerId, pageSize) {
        const config = this.containers.get(containerId);
        if (!config || pageSize < 1 || pageSize > this.config.maxPageSize) return this;

        const currentItem = (config.currentPage - 1) * config.pageSize + 1;
        config.pageSize = pageSize;
        config.totalPages = Math.ceil(config.totalItems / config.pageSize);
        config.currentPage = Math.ceil(currentItem / config.pageSize);

        if (config.serverSide) {
            this.loadServerData(containerId, config.currentPage, false);
        } else {
            this.renderPage(containerId);
            this.updatePaginationControls(containerId);
        }

        return this;
    }

    /**
     * 🎨 Rendu de l'interface pagination
     */
    renderPaginationUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const config = this.containers.get(containerId);
        if (!config) return;

        container.innerHTML = `
            <div class="pagination-container">
                <!-- Header avec contrôles -->
                <div class="pagination-header mb-4">
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <!-- Recherche -->
                        ${config.enableSearch ? `
                            <div class="flex-1 max-w-md">
                                <div class="relative">
                                    <input type="text" 
                                           id="${containerId}-search"
                                           placeholder="Rechercher..."
                                           class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                           oninput="PaginationManager.handleSearch('${containerId}', this.value)">
                                    <div class="absolute left-3 top-2.5 text-gray-400">
                                        <i class="ri-search-line"></i>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Contrôles de pagination -->
                        <div class="flex items-center space-x-4">
                            <!-- Taille de page -->
                            <div class="flex items-center space-x-2">
                                <span class="text-sm text-gray-600">Afficher:</span>
                                <select id="${containerId}-page-size" 
                                        class="px-3 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                        onchange="PaginationManager.setPageSize('${containerId}', parseInt(this.value))">
                                    <option value="10" ${config.pageSize === 10 ? 'selected' : ''}>10</option>
                                    <option value="20" ${config.pageSize === 20 ? 'selected' : ''}>20</option>
                                    <option value="50" ${config.pageSize === 50 ? 'selected' : ''}>50</option>
                                    <option value="100" ${config.pageSize === 100 ? 'selected' : ''}>100</option>
                                </select>
                            </div>

                            <!-- Export -->
                            ${config.enableExport ? `
                                <button onclick="PaginationManager.exportData('${containerId}')" 
                                        class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                    <i class="ri-download-line mr-1"></i>
                                    Exporter
                                </button>
                            ` : ''}

                            <!-- Contrôles personnalisés -->
                            ${config.customControls.map(control => control.html).join('')}
                        </div>
                    </div>
                </div>

                <!-- Zone de chargement -->
                <div id="${containerId}-loading" class="loading-overlay hidden">
                    <div class="flex items-center justify-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span class="ml-3 text-gray-600">Chargement...</span>
                    </div>
                </div>

                <!-- Zone de contenu -->
                <div id="${containerId}-content" class="pagination-content min-h-[200px]">
                    <!-- Les données seront rendues ici -->
                </div>

                <!-- Contrôles de pagination -->
                <div id="${containerId}-controls" class="pagination-controls mt-6">
                    <!-- Les contrôles seront générés ici -->
                </div>

                <!-- Informations -->
                <div id="${containerId}-info" class="pagination-info mt-4 text-center text-sm text-gray-600">
                    <!-- Les informations seront affichées ici -->
                </div>
            </div>
        `;

        // Initialiser le skeleton loader
        if (window.SkeletonLoader) {
            SkeletonLoader.prepare(`${containerId}-content`, 'Table');
        }
    }

    /**
     * 📄 Rendu de la page actuelle
     */
    renderPage(containerId) {
        const config = this.containers.get(containerId);
        if (!config) return;

        const contentContainer = document.getElementById(`${containerId}-content`);
        if (!contentContainer) return;

        const pageData = this.getCurrentPageData(containerId);
        
        // Animation de sortie
        if (window.AnimationManager) {
            AnimationManager.stateTransition(contentContainer, 'visible', 'fadeOut')
                .then(() => {
                    // Rendu du contenu
                    contentContainer.innerHTML = config.renderFunction(pageData, config);
                    
                    // Animation d'entrée
                    AnimationManager.stateTransition(contentContainer, 'hidden', 'fadeIn');
                });
        } else {
            contentContainer.innerHTML = config.renderFunction(pageData, config);
        }

        this.updatePaginationInfo(containerId);
    }

    /**
     * 🎛️ Mise à jour des contrôles de pagination
     */
    updatePaginationControls(containerId) {
        const config = this.containers.get(containerId);
        if (!config) return;

        const controlsContainer = document.getElementById(`${containerId}-controls`);
        if (!controlsContainer) return;

        const { currentPage, totalPages } = config;
        
        // Générer les numéros de page à afficher
        const pageNumbers = this.generatePageNumbers(currentPage, totalPages);

        controlsContainer.innerHTML = `
            <nav class="flex items-center justify-center space-x-2">
                <!-- Première page -->
                <button onclick="PaginationManager.goToPage('${containerId}', 1)" 
                        ${currentPage === 1 ? 'disabled' : ''}
                        class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="ri-skip-back-line"></i>
                </button>

                <!-- Page précédente -->
                <button onclick="PaginationManager.goToPage('${containerId}', ${currentPage - 1})" 
                        ${currentPage === 1 ? 'disabled' : ''}
                        class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="ri-arrow-left-line"></i>
                    Précédent
                </button>

                <!-- Numéros de page -->
                ${pageNumbers.map(page => {
                    if (page === '...') {
                        return '<span class="px-3 py-2 text-sm text-gray-500">...</span>';
                    }
                    return `
                        <button onclick="PaginationManager.goToPage('${containerId}', ${page})" 
                                class="px-3 py-2 text-sm border rounded-lg transition-colors ${
                                    page === currentPage 
                                        ? 'bg-blue-600 text-white border-blue-600' 
                                        : 'border-gray-300 hover:bg-gray-50'
                                }">
                            ${page}
                        </button>
                    `;
                }).join('')}

                <!-- Page suivante -->
                <button onclick="PaginationManager.goToPage('${containerId}', ${currentPage + 1})" 
                        ${currentPage === totalPages ? 'disabled' : ''}
                        class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Suivant
                    <i class="ri-arrow-right-line"></i>
                </button>

                <!-- Dernière page -->
                <button onclick="PaginationManager.goToPage('${containerId}', ${totalPages})" 
                        ${currentPage === totalPages ? 'disabled' : ''}
                        class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="ri-skip-forward-line"></i>
                </button>
            </nav>

            <!-- Aller à la page -->
            <div class="mt-4 flex items-center justify-center space-x-2">
                <span class="text-sm text-gray-600">Aller à la page:</span>
                <input type="number" 
                       id="${containerId}-goto"
                       min="1" 
                       max="${totalPages}" 
                       value="${currentPage}"
                       class="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                       onkeypress="if(event.key==='Enter') PaginationManager.goToPage('${containerId}', parseInt(this.value))">
                <button onclick="PaginationManager.goToPage('${containerId}', parseInt(document.getElementById('${containerId}-goto').value))" 
                        class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                    OK
                </button>
            </div>
        `;
    }

    /**
     * 📊 Mise à jour des informations
     */
    updatePaginationInfo(containerId) {
        const config = this.containers.get(containerId);
        if (!config) return;

        const infoContainer = document.getElementById(`${containerId}-info`);
        if (!infoContainer) return;

        const startItem = (config.currentPage - 1) * config.pageSize + 1;
        const endItem = Math.min(config.currentPage * config.pageSize, config.totalItems);

        infoContainer.innerHTML = `
            Affichage ${startItem.toLocaleString()} à ${endItem.toLocaleString()} 
            sur ${config.totalItems.toLocaleString()} éléments
            ${config.totalPages > 1 ? `(page ${config.currentPage} sur ${config.totalPages})` : ''}
        `;
    }

    /**
     * 🔢 Générer les numéros de page
     */
    generatePageNumbers(currentPage, totalPages, maxVisible = 7) {
        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages = [];
        const sidePages = Math.floor((maxVisible - 3) / 2);

        // Toujours afficher la première page
        pages.push(1);

        let startPage = Math.max(2, currentPage - sidePages);
        let endPage = Math.min(totalPages - 1, currentPage + sidePages);

        // Ajuster pour garder le bon nombre de pages
        if (currentPage - 1 <= sidePages) {
            endPage = Math.min(totalPages - 1, maxVisible - 2);
        }
        if (totalPages - currentPage <= sidePages) {
            startPage = Math.max(2, totalPages - maxVisible + 2);
        }

        // Ellipsis à gauche
        if (startPage > 2) {
            pages.push('...');
        }

        // Pages du milieu
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        // Ellipsis à droite
        if (endPage < totalPages - 1) {
            pages.push('...');
        }

        // Toujours afficher la dernière page
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    }

    /**
     * 🔧 Méthodes utilitaires
     */
    generateCacheKey(containerId, page, config) {
        const filters = Array.from(config.filters.entries());
        const sort = config.sortConfig ? `${config.sortConfig.sortFunction}_${config.sortConfig.direction}` : '';
        return `${containerId}_${page}_${config.pageSize}_${JSON.stringify(filters)}_${sort}`;
    }

    buildServerParams(containerId, page) {
        const config = this.containers.get(containerId);
        return {
            page,
            pageSize: config.pageSize,
            filters: Object.fromEntries(config.filters),
            sort: config.sortConfig,
            search: config.searchQuery || ''
        };
    }

    applyFiltersAndSort(containerId) {
        const config = this.containers.get(containerId);
        if (!config || config.serverSide) return;

        let data = [...config.data];

        // Appliquer les filtres
        config.filters.forEach((filterFn, key) => {
            data = data.filter(filterFn);
        });

        // Appliquer le tri
        if (config.sortConfig) {
            data.sort((a, b) => {
                const result = config.sortConfig.sortFunction(a, b);
                return config.sortConfig.direction === 'desc' ? -result : result;
            });
        }

        config.filteredData = data;
        config.totalItems = data.length;
        config.totalPages = Math.ceil(config.totalItems / config.pageSize);
    }

    async prefetchPages(containerId, currentPage) {
        const config = this.containers.get(containerId);
        if (!config || !config.serverSide) return;

        const pagesToPrefetch = [];
        for (let i = 1; i <= this.config.prefetchPages; i++) {
            const nextPage = currentPage + i;
            if (nextPage <= config.totalPages) {
                pagesToPrefetch.push(nextPage);
            }
        }

        // Préchargement en arrière-plan
        pagesToPrefetch.forEach(page => {
            setTimeout(() => {
                this.loadServerData(containerId, page, true);
            }, 100 * page);
        });
    }

    setLoadingState(containerId, isLoading) {
        this.loadingStates.set(containerId, isLoading);
        
        const loadingElement = document.getElementById(`${containerId}-loading`);
        const contentElement = document.getElementById(`${containerId}-content`);
        
        if (loadingElement && contentElement) {
            if (isLoading) {
                loadingElement.classList.remove('hidden');
                if (window.SkeletonLoader) {
                    SkeletonLoader.show(`${containerId}-content`, 'Table');
                }
            } else {
                loadingElement.classList.add('hidden');
                if (window.SkeletonLoader) {
                    SkeletonLoader.hide(`${containerId}-content`);
                }
            }
        }
    }

    handleLoadError(containerId, error) {
        console.error('Pagination load error:', error);
        
        if (window.ErrorHandler) {
            ErrorHandler.handleError({
                type: 'NETWORK',
                message: 'Erreur lors du chargement des données',
                originalError: error,
                context: { containerId }
            });
        }

        const contentElement = document.getElementById(`${containerId}-content`);
        if (contentElement) {
            contentElement.innerHTML = `
                <div class="text-center py-8">
                    <i class="ri-error-warning-line text-4xl text-red-500 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
                    <p class="text-gray-600 mb-4">Impossible de charger les données</p>
                    <button onclick="PaginationManager.retry('${containerId}')" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Réessayer
                    </button>
                </div>
            `;
        }
    }

    retry(containerId) {
        const config = this.containers.get(containerId);
        if (!config) return;

        if (config.serverSide) {
            this.loadServerData(containerId, config.currentPage, false);
        } else {
            this.renderPage(containerId);
        }
    }

    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const containerId = entry.target.dataset.containerId;
                    const config = this.containers.get(containerId);
                    
                    if (config && config.enableInfiniteScroll && config.currentPage < config.totalPages) {
                        this.goToPage(containerId, config.currentPage + 1);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '100px'
        });
    }

    /**
     * 🎭 Méthodes d'interface publique
     */
    handleSearch(containerId, query) {
        const config = this.containers.get(containerId);
        if (!config) return;

        config.searchQuery = query;

        if (config.serverSide) {
            clearTimeout(config.searchTimeout);
            config.searchTimeout = setTimeout(() => {
                this.loadServerData(containerId, 1, false);
            }, 300);
        } else {
            this.search(containerId, query);
        }
    }

    exportData(containerId, format = 'csv') {
        const config = this.containers.get(containerId);
        if (!config) return;

        const data = config.filteredData;
        const filename = `export_${containerId}_${new Date().toISOString().split('T')[0]}`;

        switch (format) {
            case 'csv':
                this.exportToCSV(data, filename);
                break;
            case 'json':
                this.exportToJSON(data, filename);
                break;
            case 'excel':
                this.exportToExcel(data, filename);
                break;
        }
    }

    exportToCSV(data, filename) {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(','))
        ].join('\n');

        this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    }

    exportToJSON(data, filename) {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * 🎨 Fonctions de rendu par défaut
     */
    defaultRenderFunction(data, config) {
        if (data.length === 0) {
            return `
                <div class="text-center py-8">
                    <i class="ri-inbox-line text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune donnée</h3>
                    <p class="text-gray-600">Aucun élément à afficher</p>
                </div>
            `;
        }

        const headers = Object.keys(data[0]);
        
        return `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            ${headers.map(header => `
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ${header}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${data.map(row => `
                            <tr class="hover:bg-gray-50">
                                ${headers.map(header => `
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${row[header] || '—'}
                                    </td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async defaultLoadFunction(params) {
        // Fonction de chargement par défaut (à remplacer)
        console.warn('Default load function called. Please provide a custom loadFunction.');
        return {
            data: [],
            total: 0,
            page: params.page,
            pageSize: params.pageSize
        };
    }

    /**
     * 📊 Statistiques et nettoyage
     */
    getStats(containerId = null) {
        if (containerId) {
            const config = this.containers.get(containerId);
            return config ? {
                currentPage: config.currentPage,
                totalPages: config.totalPages,
                totalItems: config.totalItems,
                pageSize: config.pageSize,
                isLoading: this.loadingStates.get(containerId) || false,
                cacheSize: Array.from(this.cache.keys()).filter(key => key.startsWith(containerId)).length
            } : null;
        }

        return {
            totalContainers: this.containers.size,
            totalCacheEntries: this.cache.size,
            loadingContainers: Array.from(this.loadingStates.entries()).filter(([_, loading]) => loading).length
        };
    }

    cleanup(containerId = null) {
        if (containerId) {
            this.containers.delete(containerId);
            this.loadingStates.delete(containerId);
            
            // Nettoyer le cache pour ce conteneur
            Array.from(this.cache.keys())
                .filter(key => key.startsWith(containerId))
                .forEach(key => this.cache.delete(key));
        } else {
            this.containers.clear();
            this.cache.clear();
            this.loadingStates.clear();
        }
    }
}

// Instance globale
window.PaginationManager = new PaginationManager();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaginationManager;
}

/**
 * 📄 UTILISATION EXEMPLES:
 * 
 * // Pagination côté client
 * PaginationManager.initialize('my-table', {
 *     data: myData,
 *     pageSize: 25,
 *     renderFunction: (data) => myCustomRenderer(data),
 *     enableSearch: true,
 *     enableSort: true
 * });
 * 
 * // Pagination côté serveur
 * PaginationManager.initialize('server-table', {
 *     serverSide: true,
 *     pageSize: 20,
 *     loadFunction: async (params) => {
 *         const response = await fetch('/api/data', {
 *             method: 'POST',
 *             body: JSON.stringify(params)
 *         });
 *         return response.json();
 *     }
 * });
 * 
 * // Navigation
 * PaginationManager.goToPage('my-table', 3);
 * 
 * // Filtrage
 * PaginationManager.applyFilter('my-table', item => item.status === 'active');
 * 
 * // Recherche
 * PaginationManager.search('my-table', 'john', ['name', 'email']);
 */

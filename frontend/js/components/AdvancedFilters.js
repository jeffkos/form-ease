/**
 * 🔍 Advanced Filters Manager - Système de filtrage avancé
 * Multi-critères, sauvegarde, et recherche sémantique
 */

class AdvancedFilters {
    constructor() {
        this.filters = new Map();
        this.savedFilters = new Map();
        this.activeFilters = new Map();
        this.searchHistory = [];
        this.filterSubscribers = new Map();
        this.debounceTimeout = null;
        this.config = {
            debounceDelay: 300,
            maxHistoryItems: 50,
            maxSavedFilters: 20,
            enableSemanticSearch: true,
            storagePrefix: 'formease_filters_'
        };

        this.filterTypes = {
            TEXT: 'text',
            SELECT: 'select',
            MULTISELECT: 'multiselect',
            DATE: 'date',
            DATERANGE: 'daterange',
            NUMBER: 'number',
            NUMBERRANGE: 'numberrange',
            BOOLEAN: 'boolean',
            TAGS: 'tags',
            CUSTOM: 'custom'
        };

        this.operators = {
            TEXT: ['contains', 'equals', 'startsWith', 'endsWith', 'notContains', 'isEmpty', 'isNotEmpty'],
            SELECT: ['equals', 'notEquals', 'in', 'notIn'],
            MULTISELECT: ['containsAny', 'containsAll', 'isEmpty', 'isNotEmpty'],
            DATE: ['equals', 'before', 'after', 'between'],
            NUMBER: ['equals', 'greaterThan', 'lessThan', 'between'],
            BOOLEAN: ['equals'],
            TAGS: ['hasTag', 'hasAnyTag', 'hasAllTags', 'noTags']
        };

        this.initializeFromStorage();
        this.setupEventListeners();
    }

    /**
     * 🔧 Définir un filtre
     */
    defineFilter(key, config) {
        this.filters.set(key, {
            key,
            label: config.label || key,
            type: config.type || this.filterTypes.TEXT,
            options: config.options || [],
            placeholder: config.placeholder || `Filtrer par ${config.label || key}`,
            defaultOperator: config.defaultOperator || this.getDefaultOperator(config.type),
            validation: config.validation || null,
            transform: config.transform || null,
            searchable: config.searchable !== false,
            sortable: config.sortable !== false,
            required: config.required || false,
            group: config.group || 'general',
            description: config.description || '',
            component: config.component || null
        });

        this.renderFilterIfActive(key);
        return this;
    }

    /**
     * 🎯 Appliquer un filtre
     */
    applyFilter(key, value, operator = null) {
        const filterConfig = this.filters.get(key);
        if (!filterConfig) {
            console.warn(`Filter ${key} not defined`);
            return this;
        }

        // Validation de la valeur
        if (filterConfig.validation && !filterConfig.validation(value)) {
            this.showValidationError(key, value);
            return this;
        }

        // Transformation de la valeur
        if (filterConfig.transform) {
            value = filterConfig.transform(value);
        }

        // Opérateur par défaut
        if (!operator) {
            operator = filterConfig.defaultOperator;
        }

        // Stockage du filtre actif
        this.activeFilters.set(key, {
            key,
            value,
            operator,
            timestamp: new Date(),
            config: filterConfig
        });

        this.updateUI(key);
        this.notifySubscribers();
        this.addToHistory(key, value, operator);

        return this;
    }

    /**
     * 🗑️ Supprimer un filtre
     */
    removeFilter(key) {
        this.activeFilters.delete(key);
        this.updateUI(key);
        this.notifySubscribers();
        return this;
    }

    /**
     * 🧹 Effacer tous les filtres
     */
    clearAllFilters() {
        this.activeFilters.clear();
        this.updateAllUI();
        this.notifySubscribers();
        return this;
    }

    /**
     * 🔍 Recherche textuelle globale
     */
    globalSearch(query, options = {}) {
        const searchConfig = {
            debounce: options.debounce !== false,
            semantic: options.semantic && this.config.enableSemanticSearch,
            fields: options.fields || this.getSearchableFields(),
            fuzzy: options.fuzzy || false,
            highlights: options.highlights !== false
        };

        if (searchConfig.debounce) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                this.executeSearch(query, searchConfig);
            }, this.config.debounceDelay);
        } else {
            this.executeSearch(query, searchConfig);
        }

        return this;
    }

    /**
     * 🔍 Exécuter la recherche
     */
    executeSearch(query, config) {
        if (!query || query.trim().length === 0) {
            this.removeFilter('_global_search');
            return;
        }

        const searchTerms = this.parseSearchQuery(query);
        
        this.applyFilter('_global_search', {
            query: query.trim(),
            terms: searchTerms,
            config: config
        }, 'globalSearch');

        this.addToHistory('_global_search', query);
    }

    /**
     * 📝 Parser la requête de recherche
     */
    parseSearchQuery(query) {
        const terms = [];
        const regex = /([a-zA-Z]+):\s*"([^"]+)"|([a-zA-Z]+):\s*(\S+)|"([^"]+)"|(\S+)/g;
        let match;

        while ((match = regex.exec(query)) !== null) {
            if (match[1] && match[2]) {
                // field:"value with spaces"
                terms.push({ field: match[1], value: match[2], quoted: true });
            } else if (match[3] && match[4]) {
                // field:value
                terms.push({ field: match[3], value: match[4], quoted: false });
            } else if (match[5]) {
                // "quoted text"
                terms.push({ value: match[5], quoted: true });
            } else if (match[6]) {
                // unquoted word
                terms.push({ value: match[6], quoted: false });
            }
        }

        return terms;
    }

    /**
     * 💾 Sauvegarder un ensemble de filtres
     */
    saveFilterSet(name, description = '') {
        if (this.savedFilters.size >= this.config.maxSavedFilters) {
            throw new Error(`Maximum ${this.config.maxSavedFilters} saved filters allowed`);
        }

        const filterSet = {
            name,
            description,
            filters: Object.fromEntries(this.activeFilters),
            created: new Date(),
            lastUsed: new Date()
        };

        this.savedFilters.set(name, filterSet);
        this.saveToStorage();
        this.updateSavedFiltersUI();

        return filterSet;
    }

    /**
     * 📂 Charger un ensemble de filtres
     */
    loadFilterSet(name) {
        const filterSet = this.savedFilters.get(name);
        if (!filterSet) {
            console.warn(`Saved filter set "${name}" not found`);
            return null;
        }

        this.clearAllFilters();
        
        Object.entries(filterSet.filters).forEach(([key, filter]) => {
            this.applyFilter(key, filter.value, filter.operator);
        });

        filterSet.lastUsed = new Date();
        this.saveToStorage();
        this.updateSavedFiltersUI();

        return filterSet;
    }

    /**
     * 🗑️ Supprimer un ensemble de filtres sauvegardé
     */
    deleteSavedFilterSet(name) {
        this.savedFilters.delete(name);
        this.saveToStorage();
        this.updateSavedFiltersUI();
        return this;
    }

    /**
     * 🔄 S'abonner aux changements de filtres
     */
    subscribe(callback, options = {}) {
        const id = 'sub_' + Math.random().toString(36).substr(2, 9);
        
        this.filterSubscribers.set(id, {
            callback,
            immediate: options.immediate !== false,
            debounce: options.debounce !== false,
            filters: options.filters || null // filtrer par clés spécifiques
        });

        // Appel immédiat si demandé
        if (options.immediate !== false) {
            callback(this.getFilterResult());
        }

        // Retourner une fonction de désabonnement
        return () => {
            this.filterSubscribers.delete(id);
        };
    }

    /**
     * 📢 Notifier les abonnés
     */
    notifySubscribers() {
        const result = this.getFilterResult();
        
        this.filterSubscribers.forEach((subscription, id) => {
            try {
                // Filtrer par clés si spécifié
                if (subscription.filters) {
                    const hasRelevantChanges = subscription.filters.some(key => 
                        this.activeFilters.has(key)
                    );
                    if (!hasRelevantChanges) return;
                }

                if (subscription.debounce) {
                    clearTimeout(subscription.timeout);
                    subscription.timeout = setTimeout(() => {
                        subscription.callback(result);
                    }, this.config.debounceDelay);
                } else {
                    subscription.callback(result);
                }
            } catch (error) {
                console.error('Filter subscriber error:', error);
                this.filterSubscribers.delete(id);
            }
        });
    }

    /**
     * 📊 Obtenir le résultat des filtres
     */
    getFilterResult() {
        const activeFiltersObj = Object.fromEntries(this.activeFilters);
        
        return {
            filters: activeFiltersObj,
            count: this.activeFilters.size,
            isEmpty: this.activeFilters.size === 0,
            query: this.buildQuery(),
            summary: this.buildSummary(),
            timestamp: new Date()
        };
    }

    /**
     * 🔨 Construire la requête
     */
    buildQuery() {
        const conditions = [];
        
        this.activeFilters.forEach((filter, key) => {
            if (key === '_global_search') {
                conditions.push(this.buildGlobalSearchCondition(filter));
            } else {
                conditions.push(this.buildFilterCondition(filter));
            }
        });

        return {
            conditions,
            sql: conditions.length > 0 ? conditions.join(' AND ') : '',
            mongo: this.buildMongoQuery(conditions),
            elasticsearch: this.buildElasticsearchQuery(conditions)
        };
    }

    /**
     * 🔍 Condition de recherche globale
     */
    buildGlobalSearchCondition(filter) {
        const { terms, config } = filter.value;
        const conditions = [];

        terms.forEach(term => {
            if (term.field) {
                // Recherche par champ spécifique
                conditions.push(`${term.field} LIKE '%${term.value}%'`);
            } else {
                // Recherche globale
                const searchableFields = config.fields || this.getSearchableFields();
                const fieldConditions = searchableFields.map(field => 
                    `${field} LIKE '%${term.value}%'`
                );
                conditions.push(`(${fieldConditions.join(' OR ')})`);
            }
        });

        return conditions.join(' AND ');
    }

    /**
     * 🔨 Condition de filtre standard
     */
    buildFilterCondition(filter) {
        const { key, value, operator } = filter;
        
        switch (operator) {
            case 'equals':
                return `${key} = '${value}'`;
            case 'notEquals':
                return `${key} != '${value}'`;
            case 'contains':
                return `${key} LIKE '%${value}%'`;
            case 'notContains':
                return `${key} NOT LIKE '%${value}%'`;
            case 'startsWith':
                return `${key} LIKE '${value}%'`;
            case 'endsWith':
                return `${key} LIKE '%${value}'`;
            case 'greaterThan':
                return `${key} > ${value}`;
            case 'lessThan':
                return `${key} < ${value}`;
            case 'between':
                return `${key} BETWEEN ${value.min} AND ${value.max}`;
            case 'in':
                return `${key} IN (${value.map(v => `'${v}'`).join(', ')})`;
            case 'isEmpty':
                return `(${key} IS NULL OR ${key} = '')`;
            case 'isNotEmpty':
                return `(${key} IS NOT NULL AND ${key} != '')`;
            default:
                return `${key} = '${value}'`;
        }
    }

    /**
     * 📄 Construire le résumé
     */
    buildSummary() {
        const summary = [];
        
        this.activeFilters.forEach((filter, key) => {
            if (key === '_global_search') {
                summary.push(`Recherche: "${filter.value.query}"`);
            } else {
                const config = filter.config;
                const operatorLabel = this.getOperatorLabel(filter.operator);
                summary.push(`${config.label} ${operatorLabel} ${this.formatValue(filter.value, config.type)}`);
            }
        });

        return summary.join(', ');
    }

    /**
     * 🎨 Interface utilisateur
     */
    renderFilterUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="advanced-filters">
                <div class="filters-header mb-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-gray-900">Filtres avancés</h3>
                        <div class="flex items-center space-x-2">
                            <button onclick="AdvancedFilters.showSavedFilters()" 
                                    class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                                📂 Filtres sauvegardés
                            </button>
                            <button onclick="AdvancedFilters.clearAllFilters()" 
                                    class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                                🗑️ Effacer tout
                            </button>
                        </div>
                    </div>
                    
                    <!-- Recherche globale -->
                    <div class="mt-4">
                        <div class="relative">
                            <input type="text" 
                                   id="global-search-input"
                                   placeholder="Recherche globale (ex: nom:John status:active \"phrase exacte\")"
                                   class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   oninput="AdvancedFilters.globalSearch(this.value)">
                            <div class="absolute left-3 top-2.5 text-gray-400">
                                <i class="ri-search-line"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filtres actifs -->
                <div id="active-filters" class="mb-4"></div>

                <!-- Filtres disponibles -->
                <div id="available-filters" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>

                <!-- Actions -->
                <div class="filters-actions mt-6 pt-4 border-t border-gray-200">
                    <div class="flex items-center justify-between">
                        <div id="filter-summary" class="text-sm text-gray-600"></div>
                        <div class="flex items-center space-x-2">
                            <button onclick="AdvancedFilters.showSaveDialog()" 
                                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                💾 Sauvegarder les filtres
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderAvailableFilters();
        this.updateActiveFiltersUI();
        this.updateFilterSummary();
    }

    renderAvailableFilters() {
        const container = document.getElementById('available-filters');
        if (!container) return;

        const filtersByGroup = new Map();
        
        this.filters.forEach((filter, key) => {
            const group = filter.group || 'general';
            if (!filtersByGroup.has(group)) {
                filtersByGroup.set(group, []);
            }
            filtersByGroup.get(group).push({ key, ...filter });
        });

        container.innerHTML = Array.from(filtersByGroup.entries()).map(([group, filters]) => `
            <div class="filter-group">
                <h4 class="text-sm font-medium text-gray-700 mb-2 capitalize">${group}</h4>
                <div class="space-y-2">
                    ${filters.map(filter => this.renderFilterComponent(filter)).join('')}
                </div>
            </div>
        `).join('');
    }

    renderFilterComponent(filter) {
        const isActive = this.activeFilters.has(filter.key);
        const activeFilter = this.activeFilters.get(filter.key);

        switch (filter.type) {
            case this.filterTypes.TEXT:
                return `
                    <div class="filter-component ${isActive ? 'filter-active' : ''}">
                        <label class="block text-xs font-medium text-gray-600 mb-1">${filter.label}</label>
                        <input type="text" 
                               id="filter-${filter.key}"
                               placeholder="${filter.placeholder}"
                               value="${isActive ? activeFilter.value : ''}"
                               class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                               oninput="AdvancedFilters.applyFilter('${filter.key}', this.value)">
                        ${filter.description ? `<p class="text-xs text-gray-500 mt-1">${filter.description}</p>` : ''}
                    </div>
                `;

            case this.filterTypes.SELECT:
                return `
                    <div class="filter-component ${isActive ? 'filter-active' : ''}">
                        <label class="block text-xs font-medium text-gray-600 mb-1">${filter.label}</label>
                        <select id="filter-${filter.key}"
                                class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                onchange="AdvancedFilters.applyFilter('${filter.key}', this.value)">
                            <option value="">Tous</option>
                            ${filter.options.map(option => `
                                <option value="${option.value}" ${isActive && activeFilter.value === option.value ? 'selected' : ''}>
                                    ${option.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                `;

            case this.filterTypes.DATERANGE:
                return `
                    <div class="filter-component ${isActive ? 'filter-active' : ''}">
                        <label class="block text-xs font-medium text-gray-600 mb-1">${filter.label}</label>
                        <div class="grid grid-cols-2 gap-2">
                            <input type="date" 
                                   id="filter-${filter.key}-start"
                                   class="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                   onchange="AdvancedFilters.applyDateRange('${filter.key}')">
                            <input type="date" 
                                   id="filter-${filter.key}-end"
                                   class="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                   onchange="AdvancedFilters.applyDateRange('${filter.key}')">
                        </div>
                    </div>
                `;

            case this.filterTypes.BOOLEAN:
                return `
                    <div class="filter-component ${isActive ? 'filter-active' : ''}">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" 
                                   id="filter-${filter.key}"
                                   ${isActive && activeFilter.value ? 'checked' : ''}
                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                   onchange="AdvancedFilters.applyFilter('${filter.key}', this.checked)">
                            <span class="text-sm text-gray-700">${filter.label}</span>
                        </label>
                    </div>
                `;

            default:
                return `
                    <div class="filter-component">
                        <span class="text-xs text-gray-500">Type de filtre non supporté: ${filter.type}</span>
                    </div>
                `;
        }
    }

    applyDateRange(key) {
        const startInput = document.getElementById(`filter-${key}-start`);
        const endInput = document.getElementById(`filter-${key}-end`);
        
        if (startInput.value || endInput.value) {
            this.applyFilter(key, {
                start: startInput.value,
                end: endInput.value
            }, 'between');
        } else {
            this.removeFilter(key);
        }
    }

    updateActiveFiltersUI() {
        const container = document.getElementById('active-filters');
        if (!container) return;

        if (this.activeFilters.size === 0) {
            container.innerHTML = '';
            return;
        }

        const activeFiltersHtml = Array.from(this.activeFilters.entries()).map(([key, filter]) => {
            if (key === '_global_search') {
                return `
                    <div class="active-filter">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            🔍 Recherche: "${filter.value.query}"
                            <button onclick="AdvancedFilters.removeFilter('${key}')" 
                                    class="ml-2 text-blue-600 hover:text-blue-800">
                                <i class="ri-close-line"></i>
                            </button>
                        </span>
                    </div>
                `;
            } else {
                return `
                    <div class="active-filter">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                            ${filter.config.label}: ${this.formatValue(filter.value, filter.config.type)}
                            <button onclick="AdvancedFilters.removeFilter('${key}')" 
                                    class="ml-2 text-gray-600 hover:text-gray-800">
                                <i class="ri-close-line"></i>
                            </button>
                        </span>
                    </div>
                `;
            }
        }).join('');

        container.innerHTML = `
            <div class="flex flex-wrap gap-2">
                ${activeFiltersHtml}
            </div>
        `;
    }

    updateFilterSummary() {
        const container = document.getElementById('filter-summary');
        if (!container) return;

        const summary = this.buildSummary();
        container.textContent = summary || 'Aucun filtre actif';
    }

    /**
     * 🔧 Méthodes utilitaires
     */
    getDefaultOperator(type) {
        const defaults = {
            [this.filterTypes.TEXT]: 'contains',
            [this.filterTypes.SELECT]: 'equals',
            [this.filterTypes.MULTISELECT]: 'containsAny',
            [this.filterTypes.DATE]: 'equals',
            [this.filterTypes.DATERANGE]: 'between',
            [this.filterTypes.NUMBER]: 'equals',
            [this.filterTypes.NUMBERRANGE]: 'between',
            [this.filterTypes.BOOLEAN]: 'equals',
            [this.filterTypes.TAGS]: 'hasTag'
        };
        return defaults[type] || 'equals';
    }

    getOperatorLabel(operator) {
        const labels = {
            equals: '=',
            notEquals: '≠',
            contains: 'contient',
            notContains: 'ne contient pas',
            startsWith: 'commence par',
            endsWith: 'finit par',
            greaterThan: '>',
            lessThan: '<',
            between: 'entre',
            in: 'dans',
            isEmpty: 'est vide',
            isNotEmpty: 'n\'est pas vide'
        };
        return labels[operator] || operator;
    }

    formatValue(value, type) {
        if (value === null || value === undefined) return '';
        
        switch (type) {
            case this.filterTypes.DATERANGE:
                return `${value.start || '...'} - ${value.end || '...'}`;
            case this.filterTypes.NUMBERRANGE:
                return `${value.min} - ${value.max}`;
            case this.filterTypes.MULTISELECT:
                return Array.isArray(value) ? value.join(', ') : value;
            case this.filterTypes.BOOLEAN:
                return value ? 'Oui' : 'Non';
            default:
                return String(value);
        }
    }

    getSearchableFields() {
        return Array.from(this.filters.values())
            .filter(filter => filter.searchable)
            .map(filter => filter.key);
    }

    /**
     * 💾 Persistance
     */
    saveToStorage() {
        try {
            const data = {
                savedFilters: Object.fromEntries(this.savedFilters),
                searchHistory: this.searchHistory.slice(-this.config.maxHistoryItems)
            };
            localStorage.setItem(this.config.storagePrefix + 'data', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save filters to storage:', error);
        }
    }

    initializeFromStorage() {
        try {
            const data = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'data') || '{}');
            
            if (data.savedFilters) {
                this.savedFilters = new Map(Object.entries(data.savedFilters));
            }
            
            if (data.searchHistory) {
                this.searchHistory = data.searchHistory;
            }
        } catch (error) {
            console.warn('Failed to load filters from storage:', error);
        }
    }

    addToHistory(key, value, operator = null) {
        const historyItem = {
            key,
            value,
            operator,
            timestamp: new Date()
        };

        this.searchHistory.unshift(historyItem);
        
        // Limiter l'historique
        if (this.searchHistory.length > this.config.maxHistoryItems) {
            this.searchHistory = this.searchHistory.slice(0, this.config.maxHistoryItems);
        }

        this.saveToStorage();
    }

    /**
     * 🎭 Méthodes d'interface
     */
    showSavedFilters() {
        // Créer une modal pour afficher les filtres sauvegardés
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div class="p-6">
                    <h3 class="text-lg font-semibold mb-4">Filtres sauvegardés</h3>
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                        ${Array.from(this.savedFilters.entries()).map(([name, filterSet]) => `
                            <div class="flex items-center justify-between p-3 border border-gray-200 rounded">
                                <div>
                                    <div class="font-medium">${name}</div>
                                    <div class="text-sm text-gray-600">${filterSet.description}</div>
                                    <div class="text-xs text-gray-500">
                                        ${Object.keys(filterSet.filters).length} filtres
                                    </div>
                                </div>
                                <div class="flex space-x-2">
                                    <button onclick="AdvancedFilters.loadFilterSet('${name}'); this.closest('.fixed').remove()" 
                                            class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                                        Charger
                                    </button>
                                    <button onclick="AdvancedFilters.deleteSavedFilterSet('${name}'); this.closest('.p-3').remove()" 
                                            class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                        ${this.savedFilters.size === 0 ? '<p class="text-gray-500 text-center py-4">Aucun filtre sauvegardé</p>' : ''}
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button onclick="this.closest('.fixed').remove()" 
                                class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showSaveDialog() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div class="p-6">
                    <h3 class="text-lg font-semibold mb-4">Sauvegarder les filtres actuels</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                            <input type="text" id="save-filter-name" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                   placeholder="Ex: Mes formulaires favoris">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
                            <textarea id="save-filter-description" 
                                      class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                      rows="2" placeholder="Description du jeu de filtres"></textarea>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end space-x-3">
                        <button onclick="this.closest('.fixed').remove()" 
                                class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                            Annuler
                        </button>
                        <button onclick="AdvancedFilters.saveCurrentFilters(); this.closest('.fixed').remove()" 
                                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                            Sauvegarder
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('save-filter-name').focus();
    }

    saveCurrentFilters() {
        const name = document.getElementById('save-filter-name').value.trim();
        const description = document.getElementById('save-filter-description').value.trim();
        
        if (!name) {
            alert('Veuillez saisir un nom pour ce jeu de filtres');
            return;
        }
        
        if (this.activeFilters.size === 0) {
            alert('Aucun filtre actif à sauvegarder');
            return;
        }

        try {
            this.saveFilterSet(name, description);
            if (window.ErrorHandler) {
                ErrorHandler.showNotification({
                    type: 'success',
                    title: 'Filtres sauvegardés',
                    message: `Le jeu de filtres "${name}" a été sauvegardé`,
                    duration: 3000
                });
            }
        } catch (error) {
            if (window.ErrorHandler) {
                ErrorHandler.showNotification({
                    type: 'error',
                    title: 'Erreur de sauvegarde',
                    message: error.message,
                    duration: 5000
                });
            }
        }
    }

    /**
     * 🔧 Méthodes de mise à jour UI
     */
    updateUI(key) {
        this.updateActiveFiltersUI();
        this.updateFilterSummary();
        this.renderFilterIfActive(key);
    }

    updateAllUI() {
        this.updateActiveFiltersUI();
        this.updateFilterSummary();
        this.renderAvailableFilters();
    }

    renderFilterIfActive(key) {
        const element = document.getElementById(`filter-${key}`);
        if (element) {
            const isActive = this.activeFilters.has(key);
            const filterComponent = element.closest('.filter-component');
            if (filterComponent) {
                filterComponent.classList.toggle('filter-active', isActive);
            }
        }
    }

    updateSavedFiltersUI() {
        // Mettre à jour l'affichage des filtres sauvegardés si modal ouverte
        const modal = document.querySelector('.fixed .bg-white');
        if (modal && modal.querySelector('h3').textContent === 'Filtres sauvegardés') {
            // Recharger le contenu de la modal
            this.showSavedFilters();
            modal.closest('.fixed').remove();
        }
    }

    showValidationError(key, value) {
        if (window.ErrorHandler) {
            ErrorHandler.showNotification({
                type: 'error',
                title: 'Valeur invalide',
                message: `La valeur "${value}" n'est pas valide pour le filtre "${key}"`,
                duration: 3000
            });
        }
    }

    setupEventListeners() {
        // Gérer les raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'f':
                        e.preventDefault();
                        const searchInput = document.getElementById('global-search-input');
                        if (searchInput) {
                            searchInput.focus();
                        }
                        break;
                    case 'k':
                        e.preventDefault();
                        this.clearAllFilters();
                        break;
                }
            }
        });
    }

    /**
     * 📊 Statistiques et debug
     */
    getStats() {
        return {
            definedFilters: this.filters.size,
            activeFilters: this.activeFilters.size,
            savedFilterSets: this.savedFilters.size,
            subscribers: this.filterSubscribers.size,
            historyItems: this.searchHistory.length,
            lastActivity: this.activeFilters.size > 0 ? 
                Math.max(...Array.from(this.activeFilters.values()).map(f => f.timestamp)) :
                null
        };
    }

    // Construire requêtes pour différents backends
    buildMongoQuery(conditions) {
        // À implémenter selon les besoins
        return { $and: conditions };
    }

    buildElasticsearchQuery(conditions) {
        // À implémenter selon les besoins
        return {
            bool: {
                must: conditions
            }
        };
    }
}

// Instance globale
window.AdvancedFilters = new AdvancedFilters();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedFilters;
}

/**
 * 🔍 UTILISATION EXEMPLES:
 * 
 * // Définir des filtres
 * AdvancedFilters
 *     .defineFilter('name', {
 *         label: 'Nom',
 *         type: 'text',
 *         placeholder: 'Rechercher par nom...'
 *     })
 *     .defineFilter('status', {
 *         label: 'Statut',
 *         type: 'select',
 *         options: [
 *             { value: 'active', label: 'Actif' },
 *             { value: 'inactive', label: 'Inactif' }
 *         ]
 *     });
 * 
 * // S'abonner aux changements
 * AdvancedFilters.subscribe((result) => {
 *     console.log('Filtres appliqués:', result);
 *     // Mettre à jour les données
 * });
 * 
 * // Recherche globale
 * AdvancedFilters.globalSearch('nom:John status:active "phrase exacte"');
 * 
 * // Rendu de l'interface
 * AdvancedFilters.renderFilterUI('filters-container');
 */

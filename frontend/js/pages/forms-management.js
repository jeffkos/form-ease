/**
 * 📝 FormEase - Gestion des Formulaires
 * Script de dynamisation pour la page de gestion des formulaires
 */

class FormsManagement {
    constructor() {
        this.apiService = window.ApiService;
        this.dynamicPageService = window.DynamicPageService;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.selectedForms = new Set();
        this.sortBy = 'created_at';
        this.sortOrder = 'desc';
        
        this.init();
    }

    async init() {
        try {
            await this.loadForms();
            this.setupEventListeners();
            this.setupFilters();
            this.setupSearch();
            this.setupBulkActions();
            this.startAutoRefresh();
            
            console.log('✅ Gestion des formulaires initialisée');
        } catch (error) {
            console.error('❌ Erreur initialisation gestion formulaires:', error);
            this.showError('Erreur lors du chargement de la page');
        }
    }

    async loadForms() {
        try {
            const container = document.getElementById('forms-list-container');
            if (container) {
                container.innerHTML = this.getLoadingHTML();
            }

            const response = await this.apiService.getForms({
                page: this.currentPage,
                limit: this.itemsPerPage,
                filter: this.currentFilter,
                search: this.searchQuery,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder
            });

            if (response.success) {
                this.renderForms(response.data.forms);
                this.renderPagination(response.data.pagination);
                this.updateStats(response.data.stats);
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('❌ Erreur chargement formulaires:', error);
            this.showError('Erreur lors du chargement des formulaires');
        }
    }

    renderForms(forms) {
        const container = document.getElementById('forms-list-container');
        if (!container) return;

        if (forms.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }

        const formsHTML = forms.map(form => this.getFormCardHTML(form)).join('');
        container.innerHTML = formsHTML;

        // Ajouter les event listeners
        this.attachFormEventListeners();
    }

    getFormCardHTML(form) {
        const statusBadge = this.getStatusBadge(form.status);
        const lastResponse = form.lastResponse ? 
            `Dernière réponse: ${this.formatDate(form.lastResponse)}` : 
            'Aucune réponse';

        return `
            <div class="tremor-Card bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-all duration-200" 
                 data-form-id="${form.id}">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-start space-x-3">
                        <input type="checkbox" 
                               class="form-checkbox h-4 w-4 text-blue-600 mt-1"
                               data-form-checkbox="${form.id}"
                               ${this.selectedForms.has(form.id) ? 'checked' : ''}>
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-900 mb-2">${form.title}</h3>
                            <p class="text-gray-600 text-sm mb-2">${form.description || 'Aucune description'}</p>
                            <div class="flex items-center space-x-4 text-sm text-gray-500">
                                <span>📝 ${form.fieldsCount || 0} champs</span>
                                <span>📊 ${form.responsesCount || 0} réponses</span>
                                <span>👁️ ${form.viewsCount || 0} vues</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col items-end space-y-2">
                        ${statusBadge}
                        <div class="flex space-x-2">
                            <button class="text-blue-600 hover:text-blue-800 text-sm"
                                    data-action="edit" data-form-id="${form.id}">
                                Modifier
                            </button>
                            <button class="text-green-600 hover:text-green-800 text-sm"
                                    data-action="view" data-form-id="${form.id}">
                                Voir
                            </button>
                            <button class="text-gray-600 hover:text-gray-800 text-sm"
                                    data-action="duplicate" data-form-id="${form.id}">
                                Dupliquer
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="border-t pt-4">
                    <div class="flex items-center justify-between text-sm text-gray-500">
                        <span>Créé: ${this.formatDate(form.createdAt)}</span>
                        <span>${lastResponse}</span>
                        <div class="flex items-center space-x-2">
                            <button class="text-blue-600 hover:text-blue-800"
                                    data-action="analytics" data-form-id="${form.id}">
                                📊 Analytics
                            </button>
                            <button class="text-orange-600 hover:text-orange-800"
                                    data-action="share" data-form-id="${form.id}">
                                🔗 Partager
                            </button>
                            <button class="text-red-600 hover:text-red-800"
                                    data-action="delete" data-form-id="${form.id}">
                                🗑️ Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusBadge(status) {
        const statusConfig = {
            'active': { color: 'green', text: 'Actif' },
            'draft': { color: 'yellow', text: 'Brouillon' },
            'archived': { color: 'gray', text: 'Archivé' },
            'paused': { color: 'orange', text: 'En pause' }
        };

        const config = statusConfig[status] || statusConfig.draft;
        return `
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800">
                ${config.text}
            </span>
        `;
    }

    attachFormEventListeners() {
        // Checkboxes de sélection
        document.querySelectorAll('[data-form-checkbox]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const formId = e.target.dataset.formCheckbox;
                if (e.target.checked) {
                    this.selectedForms.add(formId);
                } else {
                    this.selectedForms.delete(formId);
                }
                this.updateBulkActionsVisibility();
            });
        });

        // Actions sur les formulaires
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.target.dataset.action;
                const formId = e.target.dataset.formId;
                this.handleFormAction(action, formId);
            });
        });
    }

    async handleFormAction(action, formId) {
        try {
            switch (action) {
                case 'edit':
                    window.location.href = `/frontend/pages/forms/builder.html?id=${formId}`;
                    break;
                
                case 'view':
                    window.open(`/api/forms/${formId}/preview`, '_blank');
                    break;
                
                case 'duplicate':
                    await this.duplicateForm(formId);
                    break;
                
                case 'analytics':
                    window.location.href = `/frontend/pages/analytics/dashboard.html?form=${formId}`;
                    break;
                
                case 'share':
                    this.showShareModal(formId);
                    break;
                
                case 'delete':
                    await this.deleteForm(formId);
                    break;
                
                default:
                    console.warn('Action non reconnue:', action);
            }
        } catch (error) {
            console.error(`❌ Erreur action ${action}:`, error);
            this.showError(`Erreur lors de l'action ${action}`);
        }
    }

    async duplicateForm(formId) {
        if (!confirm('Voulez-vous vraiment dupliquer ce formulaire ?')) return;

        try {
            const response = await this.apiService.duplicateForm(formId);
            if (response.success) {
                this.showSuccess('Formulaire dupliqué avec succès');
                await this.loadForms();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('❌ Erreur duplication:', error);
            this.showError('Erreur lors de la duplication');
        }
    }

    async deleteForm(formId) {
        if (!confirm('Voulez-vous vraiment supprimer ce formulaire ? Cette action est irréversible.')) return;

        try {
            const response = await this.apiService.deleteForm(formId);
            if (response.success) {
                this.showSuccess('Formulaire supprimé avec succès');
                await this.loadForms();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            this.showError('Erreur lors de la suppression');
        }
    }

    showShareModal(formId) {
        const modal = document.getElementById('share-modal');
        if (!modal) return;

        const shareUrl = `${window.location.origin}/form/${formId}`;
        const embedCode = `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0"></iframe>`;

        document.getElementById('share-url').value = shareUrl;
        document.getElementById('embed-code').value = embedCode;
        
        modal.classList.remove('hidden');
    }

    setupFilters() {
        const filterButtons = document.querySelectorAll('[data-filter]');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Mettre à jour l'état actif
                filterButtons.forEach(b => b.classList.remove('bg-blue-600', 'text-white'));
                e.target.classList.add('bg-blue-600', 'text-white');
                
                // Appliquer le filtre
                this.currentFilter = e.target.dataset.filter;
                this.currentPage = 1;
                this.loadForms();
            });
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('search-forms');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchQuery = e.target.value;
                    this.currentPage = 1;
                    this.loadForms();
                }, 500);
            });
        }
    }

    setupBulkActions() {
        // Sélectionner tout
        const selectAllCheckbox = document.getElementById('select-all-forms');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('[data-form-checkbox]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                    const formId = checkbox.dataset.formCheckbox;
                    if (e.target.checked) {
                        this.selectedForms.add(formId);
                    } else {
                        this.selectedForms.delete(formId);
                    }
                });
                this.updateBulkActionsVisibility();
            });
        }

        // Actions en lot
        document.getElementById('bulk-delete')?.addEventListener('click', () => {
            this.bulkDelete();
        });

        document.getElementById('bulk-archive')?.addEventListener('click', () => {
            this.bulkArchive();
        });

        document.getElementById('bulk-export')?.addEventListener('click', () => {
            this.bulkExport();
        });
    }

    updateBulkActionsVisibility() {
        const bulkActions = document.getElementById('bulk-actions');
        const selectedCount = document.getElementById('selected-count');
        
        if (bulkActions && selectedCount) {
            if (this.selectedForms.size > 0) {
                bulkActions.classList.remove('hidden');
                selectedCount.textContent = this.selectedForms.size;
            } else {
                bulkActions.classList.add('hidden');
            }
        }
    }

    async bulkDelete() {
        if (this.selectedForms.size === 0) return;
        
        if (!confirm(`Voulez-vous vraiment supprimer ${this.selectedForms.size} formulaire(s) ? Cette action est irréversible.`)) return;

        try {
            const formIds = Array.from(this.selectedForms);
            const response = await this.apiService.bulkDeleteForms(formIds);
            
            if (response.success) {
                this.showSuccess(`${formIds.length} formulaire(s) supprimé(s) avec succès`);
                this.selectedForms.clear();
                await this.loadForms();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('❌ Erreur suppression en lot:', error);
            this.showError('Erreur lors de la suppression en lot');
        }
    }

    async bulkArchive() {
        if (this.selectedForms.size === 0) return;

        try {
            const formIds = Array.from(this.selectedForms);
            const response = await this.apiService.bulkArchiveForms(formIds);
            
            if (response.success) {
                this.showSuccess(`${formIds.length} formulaire(s) archivé(s) avec succès`);
                this.selectedForms.clear();
                await this.loadForms();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('❌ Erreur archivage en lot:', error);
            this.showError('Erreur lors de l\'archivage en lot');
        }
    }

    async bulkExport() {
        if (this.selectedForms.size === 0) return;

        try {
            const formIds = Array.from(this.selectedForms);
            const response = await this.apiService.exportForms(formIds);
            
            if (response.success) {
                // Télécharger le fichier
                const blob = new Blob([JSON.stringify(response.data, null, 2)], {
                    type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `formulaires_export_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                
                this.showSuccess(`${formIds.length} formulaire(s) exporté(s) avec succès`);
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('❌ Erreur export en lot:', error);
            this.showError('Erreur lors de l\'export en lot');
        }
    }

    renderPagination(pagination) {
        const container = document.getElementById('pagination-container');
        if (!container || !pagination) return;

        const totalPages = Math.ceil(pagination.total / pagination.limit);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <div class="flex items-center justify-between mt-6">
                <div class="text-sm text-gray-700">
                    Affichage de ${pagination.offset + 1} à ${Math.min(pagination.offset + pagination.limit, pagination.total)} 
                    sur ${pagination.total} formulaires
                </div>
                <div class="flex space-x-1">
        `;

        // Bouton précédent
        paginationHTML += `
            <button class="px-3 py-2 text-sm bg-white border rounded-md hover:bg-gray-50 ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                    data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''}>
                Précédent
            </button>
        `;

        // Numéros de page
        for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(totalPages, this.currentPage + 2); i++) {
            paginationHTML += `
                <button class="px-3 py-2 text-sm border rounded-md ${i === this.currentPage ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}"
                        data-page="${i}">
                    ${i}
                </button>
            `;
        }

        // Bouton suivant
        paginationHTML += `
            <button class="px-3 py-2 text-sm bg-white border rounded-md hover:bg-gray-50 ${this.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                    data-page="${this.currentPage + 1}" ${this.currentPage === totalPages ? 'disabled' : ''}>
                Suivant
            </button>
        `;

        paginationHTML += `
                </div>
            </div>
        `;

        container.innerHTML = paginationHTML;

        // Ajouter les event listeners
        container.querySelectorAll('[data-page]').forEach(button => {
            button.addEventListener('click', (e) => {
                if (button.disabled) return;
                this.currentPage = parseInt(e.target.dataset.page);
                this.loadForms();
            });
        });
    }

    updateStats(stats) {
        if (!stats) return;

        // Mettre à jour les statistiques générales
        const totalFormsEl = document.getElementById('total-forms-count');
        const activeFormsEl = document.getElementById('active-forms-count');
        const totalResponsesEl = document.getElementById('total-responses-count');
        const conversionRateEl = document.getElementById('conversion-rate');

        if (totalFormsEl) totalFormsEl.textContent = stats.totalForms || 0;
        if (activeFormsEl) activeFormsEl.textContent = stats.activeForms || 0;
        if (totalResponsesEl) totalResponsesEl.textContent = stats.totalResponses || 0;
        if (conversionRateEl) conversionRateEl.textContent = `${(stats.conversionRate || 0).toFixed(1)}%`;
    }

    setupEventListeners() {
        // Tri
        document.querySelectorAll('[data-sort]').forEach(button => {
            button.addEventListener('click', (e) => {
                const sortBy = e.target.dataset.sort;
                if (this.sortBy === sortBy) {
                    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortBy = sortBy;
                    this.sortOrder = 'desc';
                }
                this.loadForms();
            });
        });

        // Nouveau formulaire
        document.getElementById('create-form-btn')?.addEventListener('click', () => {
            window.location.href = '/frontend/pages/forms/builder.html';
        });

        // Import/Export
        document.getElementById('export-all-btn')?.addEventListener('click', () => {
            this.exportAllForms();
        });

        document.getElementById('import-forms-btn')?.addEventListener('click', () => {
            document.getElementById('import-file-input')?.click();
        });

        // Fermer les modals
        document.querySelectorAll('[data-modal-close]').forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.add('hidden');
            });
        });
    }

    async exportAllForms() {
        try {
            const response = await this.apiService.exportAllForms();
            if (response.success) {
                const blob = new Blob([JSON.stringify(response.data, null, 2)], {
                    type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tous_formulaires_${new Date().toISOString().split('T')[0]}.json`;
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
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.loadForms();
            }
        }, 5 * 60 * 1000);
    }

    getLoadingHTML() {
        return `
            <div class="flex items-center justify-center p-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="ml-3 text-gray-600">Chargement des formulaires...</span>
            </div>
        `;
    }

    getEmptyStateHTML() {
        return `
            <div class="text-center py-12">
                <div class="mx-auto h-12 w-12 text-gray-400">
                    📝
                </div>
                <h3 class="mt-2 text-sm font-medium text-gray-900">Aucun formulaire</h3>
                <p class="mt-1 text-sm text-gray-500">Commencez par créer votre premier formulaire.</p>
                <div class="mt-6">
                    <button class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            onclick="window.location.href='/frontend/pages/forms/builder.html'">
                        <span class="mr-2">+</span>
                        Créer un formulaire
                    </button>
                </div>
            </div>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return 'Non défini';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
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
}

// Initialiser quand la page est chargée
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.formsManagement = new FormsManagement();
    });
} else {
    window.formsManagement = new FormsManagement();
}

/**
 * QR Codes Page - Script dynamique
 * Gère la génération et la gestion des codes QR pour les formulaires
 */

class QRCodesPage {
    constructor() {
        this.qrCodes = [];
        this.filteredCodes = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.filters = {
            form: 'all',
            status: 'all',
            dateRange: '30d',
            search: ''
        };
        this.sortConfig = {
            field: 'createdDate',
            direction: 'desc'
        };
    }

    async init() {
        try {
            console.log('🚀 Initialisation QR Codes Page...');
            
            // Initialisation des services
            if (!window.apiService) {
                console.error('❌ ApiService non disponible');
                return;
            }

            // Chargement initial des données
            await this.loadQRCodes();
            
            // Configuration des événements
            this.setupEventListeners();
            
            // Rendu initial
            this.renderStats();
            this.renderQRCodeGrid();

            console.log('✅ QR Codes Page initialisée avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showError('Erreur lors du chargement des données');
        }
    }

    async loadQRCodes() {
        try {
            console.log('📱 Chargement des codes QR...');
            
            // Simulation de données pour le développement
            this.qrCodes = this.generateMockQRCodes();
            this.applyFilters();
            
            // TODO: Remplacer par un appel API réel
            // const response = await window.apiService.get('/qr-codes', {
            //     params: this.filters
            // });
            // this.qrCodes = response.data.qrCodes || [];
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des QR codes:', error);
            throw error;
        }
    }

    generateMockQRCodes() {
        const forms = [
            { id: 'contact-form', name: 'Formulaire de Contact', type: 'contact' },
            { id: 'newsletter', name: 'Newsletter', type: 'newsletter' },
            { id: 'survey', name: 'Sondage Satisfaction', type: 'survey' },
            { id: 'registration', name: 'Inscription Événement', type: 'registration' },
            { id: 'feedback', name: 'Feedback Produit', type: 'feedback' }
        ];
        
        const statuses = ['active', 'inactive', 'expired'];
        const locations = ['Event A', 'Store B', 'Website', 'Email Campaign', 'Print Media'];
        
        const data = [];
        
        for (let i = 0; i < 24; i++) {
            const form = forms[Math.floor(Math.random() * forms.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const location = locations[Math.floor(Math.random() * locations.length)];
            const createdDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
            
            data.push({
                id: `qr-${i + 1}`,
                formId: form.id,
                formName: form.name,
                formType: form.type,
                qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://formease.com/form/${form.id}`)}`,
                shortUrl: `https://fease.co/${Math.random().toString(36).substr(2, 8)}`,
                status: status,
                location: location,
                createdDate: createdDate,
                scans: Math.floor(Math.random() * 500) + 10,
                uniqueScans: Math.floor(Math.random() * 300) + 5,
                lastScanDate: status === 'active' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
                conversionRate: Math.floor(Math.random() * 50) + 10,
                description: `QR Code pour ${form.name} - ${location}`,
                customization: {
                    color: ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
                    logo: Math.random() > 0.5,
                    style: ['square', 'rounded', 'dots'][Math.floor(Math.random() * 3)]
                }
            });
        }
        
        return data.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    }

    setupEventListeners() {
        // Filtres
        const formFilter = document.getElementById('form-filter');
        const statusFilter = document.getElementById('status-filter');
        const dateRangeFilter = document.getElementById('date-range-filter');
        const searchInput = document.getElementById('qr-search');

        if (formFilter) {
            formFilter.addEventListener('change', (e) => {
                this.filters.form = e.target.value;
                this.applyFilters();
                this.renderStats();
                this.renderQRCodeGrid();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
                this.renderStats();
                this.renderQRCodeGrid();
            });
        }

        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', (e) => {
                this.filters.dateRange = e.target.value;
                this.applyFilters();
                this.renderStats();
                this.renderQRCodeGrid();
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
                    this.renderQRCodeGrid();
                }, 300);
            });
        }

        // Boutons d'action
        const generateBtn = document.getElementById('generate-qr');
        const refreshBtn = document.getElementById('refresh-qr');
        const exportBtn = document.getElementById('export-qr');

        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.showGenerateModal());
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
    }

    applyFilters() {
        this.filteredCodes = this.qrCodes.filter(qr => {
            // Filtre par formulaire
            if (this.filters.form !== 'all' && qr.formId !== this.filters.form) {
                return false;
            }

            // Filtre par statut
            if (this.filters.status !== 'all' && qr.status !== this.filters.status) {
                return false;
            }

            // Filtre par période
            const dateLimit = this.getDateLimit(this.filters.dateRange);
            if (qr.createdDate < dateLimit) {
                return false;
            }

            // Filtre par recherche
            if (this.filters.search && 
                !qr.formName.toLowerCase().includes(this.filters.search) &&
                !qr.location.toLowerCase().includes(this.filters.search) &&
                !qr.description.toLowerCase().includes(this.filters.search)) {
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
        this.updateElement('total-qr-codes', stats.total);
        this.updateElement('active-qr-codes', stats.active);
        this.updateElement('total-scans', stats.totalScans);
        this.updateElement('avg-conversion', `${stats.avgConversion}%`);
    }

    calculateStats() {
        const data = this.filteredCodes;
        const total = data.length;
        const active = data.filter(qr => qr.status === 'active').length;
        const totalScans = data.reduce((sum, qr) => sum + qr.scans, 0);
        const avgConversion = data.length > 0 ? Math.round(data.reduce((sum, qr) => sum + qr.conversionRate, 0) / data.length) : 0;

        return {
            total,
            active,
            totalScans,
            avgConversion
        };
    }

    renderQRCodeGrid() {
        const container = document.getElementById('qr-codes-grid');
        if (!container) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredCodes.slice(startIndex, endIndex);

        container.innerHTML = pageData.map(qr => `
            <div class="tremor-Card bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div class="p-6">
                    <!-- En-tête avec statut -->
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-900 mb-1">${qr.formName}</h3>
                            <p class="text-sm text-gray-500">${qr.location}</p>
                        </div>
                        ${this.getStatusBadge(qr.status)}
                    </div>

                    <!-- QR Code Image -->
                    <div class="flex justify-center mb-4">
                        <div class="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <img src="${qr.qrCodeUrl}" alt="QR Code ${qr.formName}" 
                                 class="w-28 h-28 object-contain">
                        </div>
                    </div>

                    <!-- Statistiques -->
                    <div class="grid grid-cols-2 gap-4 mb-4 text-center">
                        <div>
                            <div class="text-2xl font-bold text-gray-900">${qr.scans}</div>
                            <div class="text-xs text-gray-500">Scans</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-gray-900">${qr.conversionRate}%</div>
                            <div class="text-xs text-gray-500">Conversion</div>
                        </div>
                    </div>

                    <!-- URL courte -->
                    <div class="mb-4">
                        <div class="text-xs text-gray-500 mb-1">URL courte</div>
                        <div class="flex items-center bg-gray-50 rounded px-3 py-2">
                            <input type="text" value="${qr.shortUrl}" readonly 
                                   class="flex-1 bg-transparent text-sm text-gray-700 border-none outline-none">
                            <button onclick="qrCodesPage.copyToClipboard('${qr.shortUrl}')" 
                                    class="text-blue-600 hover:text-blue-800 ml-2">
                                <i class="ri-file-copy-line"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex space-x-2">
                        <button onclick="qrCodesPage.viewAnalytics('${qr.id}')" 
                                class="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                            <i class="ri-bar-chart-line mr-1"></i>Analytics
                        </button>
                        <button onclick="qrCodesPage.downloadQR('${qr.id}')" 
                                class="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                            <i class="ri-download-line mr-1"></i>Download
                        </button>
                    </div>

                    <!-- Menu actions -->
                    <div class="flex justify-center mt-3">
                        <div class="relative">
                            <button onclick="qrCodesPage.toggleActionsMenu('${qr.id}')" 
                                    class="text-gray-500 hover:text-gray-700">
                                <i class="ri-more-line"></i>
                            </button>
                            <div id="actions-menu-${qr.id}" class="hidden absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                <button onclick="qrCodesPage.editQR('${qr.id}')" 
                                        class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                    <i class="ri-edit-line mr-2"></i>Modifier
                                </button>
                                <button onclick="qrCodesPage.duplicateQR('${qr.id}')" 
                                        class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                    <i class="ri-file-copy-line mr-2"></i>Dupliquer
                                </button>
                                <button onclick="qrCodesPage.toggleStatus('${qr.id}')" 
                                        class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                    <i class="ri-toggle-line mr-2"></i>${qr.status === 'active' ? 'Désactiver' : 'Activer'}
                                </button>
                                <button onclick="qrCodesPage.deleteQR('${qr.id}')" 
                                        class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                    <i class="ri-delete-bin-line mr-2"></i>Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.renderPagination();
    }

    getStatusBadge(status) {
        const badges = {
            active: '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Actif</span>',
            inactive: '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inactif</span>',
            expired: '<span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Expiré</span>'
        };
        return badges[status] || badges.inactive;
    }

    renderPagination() {
        const container = document.getElementById('pagination-container');
        if (!container) return;

        const totalPages = Math.ceil(this.filteredCodes.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Bouton précédent
        if (this.currentPage > 1) {
            paginationHTML += `
                <button onclick="qrCodesPage.changePage(${this.currentPage - 1})" 
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
                <button onclick="qrCodesPage.changePage(${i})" 
                        class="px-3 py-2 text-sm ${i === this.currentPage ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'} border border-gray-300">
                    ${i}
                </button>
            `;
        }

        // Bouton suivant
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button onclick="qrCodesPage.changePage(${this.currentPage + 1})" 
                        class="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-r-md">
                    Suivant
                </button>
            `;
        }

        container.innerHTML = paginationHTML;
    }

    changePage(page) {
        this.currentPage = page;
        this.renderQRCodeGrid();
    }

    async refreshData() {
        try {
            console.log('🔄 Actualisation des données...');
            await this.loadQRCodes();
            this.renderStats();
            this.renderQRCodeGrid();
            this.showSuccess('Données actualisées avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'actualisation:', error);
            this.showError('Erreur lors de l\'actualisation des données');
        }
    }

    showGenerateModal() {
        console.log('➕ Ouverture du modal de génération');
        // TODO: Implémenter le modal de génération de QR code
        this.showInfo('Modal de génération de QR code à implémenter');
    }

    exportData() {
        try {
            console.log('📤 Export des données...');
            
            const csvData = this.generateCSV();
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            link.href = URL.createObjectURL(blob);
            link.download = `qr-codes-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            this.showSuccess('Export réalisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'export:', error);
            this.showError('Erreur lors de l\'export');
        }
    }

    generateCSV() {
        const headers = ['Formulaire', 'Location', 'Statut', 'URL Courte', 'Scans', 'Conversion', 'Date création'];
        const rows = this.filteredCodes.map(qr => [
            qr.formName,
            qr.location,
            qr.status,
            qr.shortUrl,
            qr.scans,
            `${qr.conversionRate}%`,
            this.formatDate(qr.createdDate)
        ]);

        return [headers, ...rows].map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showSuccess('URL copiée dans le presse-papiers');
        }).catch(() => {
            this.showError('Erreur lors de la copie');
        });
    }

    viewAnalytics(qrId) {
        console.log('📊 Analytics pour QR:', qrId);
        // TODO: Rediriger vers la page d'analytics du QR code
        this.showInfo(`Analytics du QR code ${qrId}`);
    }

    downloadQR(qrId) {
        console.log('💾 Téléchargement QR:', qrId);
        const qr = this.qrCodes.find(q => q.id === qrId);
        if (qr) {
            // Créer un lien de téléchargement
            const link = document.createElement('a');
            link.href = qr.qrCodeUrl;
            link.download = `qr-code-${qr.formId}.png`;
            link.click();
            this.showSuccess('QR Code téléchargé');
        }
    }

    toggleActionsMenu(qrId) {
        const menu = document.getElementById(`actions-menu-${qrId}`);
        if (menu) {
            menu.classList.toggle('hidden');
            
            // Fermer les autres menus
            document.querySelectorAll('[id^="actions-menu-"]').forEach(otherMenu => {
                if (otherMenu.id !== `actions-menu-${qrId}`) {
                    otherMenu.classList.add('hidden');
                }
            });
        }
    }

    editQR(qrId) {
        console.log('✏️ Édition QR:', qrId);
        this.toggleActionsMenu(qrId);
        // TODO: Ouvrir le modal d'édition
        this.showInfo(`Édition du QR code ${qrId}`);
    }

    duplicateQR(qrId) {
        console.log('📄 Duplication QR:', qrId);
        this.toggleActionsMenu(qrId);
        // TODO: Implémenter la duplication
        this.showInfo(`QR code ${qrId} dupliqué`);
    }

    toggleStatus(qrId) {
        console.log('🔄 Toggle status QR:', qrId);
        this.toggleActionsMenu(qrId);
        
        const qr = this.qrCodes.find(q => q.id === qrId);
        if (qr) {
            qr.status = qr.status === 'active' ? 'inactive' : 'active';
            this.applyFilters();
            this.renderStats();
            this.renderQRCodeGrid();
            this.showSuccess(`QR code ${qr.status === 'active' ? 'activé' : 'désactivé'}`);
        }
    }

    deleteQR(qrId) {
        console.log('🗑️ Suppression QR:', qrId);
        this.toggleActionsMenu(qrId);
        
        if (confirm('Êtes-vous sûr de vouloir supprimer ce QR code ?')) {
            this.qrCodes = this.qrCodes.filter(qr => qr.id !== qrId);
            this.applyFilters();
            this.renderStats();
            this.renderQRCodeGrid();
            this.showSuccess('QR code supprimé');
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
            year: 'numeric'
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
let qrCodesPage;

// Fonction d'initialisation appelée par l'auto-loader
window.initQrCodes = function() {
    qrCodesPage = new QRCodesPage();
    qrCodesPage.init();
};

// Auto-initialisation si le DOM est déjà chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initQrCodes);
} else {
    window.initQrCodes();
}

// Fermer les menus en cliquant ailleurs
document.addEventListener('click', function(event) {
    if (!event.target.closest('[id^="actions-menu-"]') && !event.target.closest('button[onclick*="toggleActionsMenu"]')) {
        document.querySelectorAll('[id^="actions-menu-"]').forEach(menu => {
            menu.classList.add('hidden');
        });
    }
});

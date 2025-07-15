// ==========================================
// EMAIL TRACKING - DYNAMIQUE
// Système de suivi des emails avancé
// ==========================================

class EmailTrackingManager {
    constructor() {
        this.currentFilters = {
            status: 'all',
            date_range: '7d',
            form_id: 'all',
            search: ''
        };
        this.currentPage = 1;
        this.pageSize = 20;
        this.updateInterval = 30000; // 30 secondes
        this.charts = {};
        
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation Email Tracking Manager...');
        
        this.setupEventListeners();
        await this.loadEmailStatistics();
        await this.loadEmailList();
        this.setupRealTimeUpdates();
        this.initializeCharts();
        
        console.log('✅ Email Tracking Manager initialisé');
    }

    setupEventListeners() {
        // Filtres
        const statusFilter = document.getElementById('status-filter');
        const dateRangeFilter = document.getElementById('date-range-filter');
        const formFilter = document.getElementById('form-filter');
        const searchInput = document.getElementById('email-search');
        const refreshBtn = document.getElementById('refresh-emails');
        const exportBtn = document.getElementById('export-emails');

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.currentPage = 1;
                this.loadEmailList();
            });
        }

        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', (e) => {
                this.currentFilters.date_range = e.target.value;
                this.currentPage = 1;
                this.loadEmailStatistics();
                this.loadEmailList();
            });
        }

        if (formFilter) {
            formFilter.addEventListener('change', (e) => {
                this.currentFilters.form_id = e.target.value;
                this.currentPage = 1;
                this.loadEmailList();
            });
        }

        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value;
                    this.currentPage = 1;
                    this.loadEmailList();
                }, 500);
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadEmailStatistics();
                this.loadEmailList();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportEmailData();
            });
        }

        // Actions groupées
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="mark-read"]')) {
                const emailId = e.target.dataset.emailId;
                this.markAsRead(emailId);
            } else if (e.target.matches('[data-action="mark-unread"]')) {
                const emailId = e.target.dataset.emailId;
                this.markAsUnread(emailId);
            } else if (e.target.matches('[data-action="delete-email"]')) {
                const emailId = e.target.dataset.emailId;
                this.deleteEmail(emailId);
            } else if (e.target.matches('[data-action="view-details"]')) {
                const emailId = e.target.dataset.emailId;
                this.showEmailDetails(emailId);
            }
        });
    }

    async loadEmailStatistics() {
        try {
            const params = new URLSearchParams({
                date_range: this.currentFilters.date_range
            });

            const stats = await window.apiService.get(`/emails/statistics?${params}`);
            this.updateStatisticsDisplay(stats);
            this.updateCharts(stats);
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            this.showError('Impossible de charger les statistiques des emails');
        }
    }

    updateStatisticsDisplay(stats) {
        // Statistiques principales
        this.updateStat('total-emails', stats.total_emails || 0);
        this.updateStat('sent-emails', stats.sent_emails || 0);
        this.updateStat('delivered-emails', stats.delivered_emails || 0);
        this.updateStat('opened-emails', stats.opened_emails || 0);
        this.updateStat('clicked-emails', stats.clicked_emails || 0);
        this.updateStat('bounced-emails', stats.bounced_emails || 0);

        // Taux
        const deliveryRate = stats.sent_emails > 0 ? ((stats.delivered_emails / stats.sent_emails) * 100).toFixed(1) : 0;
        const openRate = stats.delivered_emails > 0 ? ((stats.opened_emails / stats.delivered_emails) * 100).toFixed(1) : 0;
        const clickRate = stats.opened_emails > 0 ? ((stats.clicked_emails / stats.opened_emails) * 100).toFixed(1) : 0;
        const bounceRate = stats.sent_emails > 0 ? ((stats.bounced_emails / stats.sent_emails) * 100).toFixed(1) : 0;

        this.updateStat('delivery-rate', `${deliveryRate}%`);
        this.updateStat('open-rate', `${openRate}%`);
        this.updateStat('click-rate', `${clickRate}%`);
        this.updateStat('bounce-rate', `${bounceRate}%`);
    }

    updateStat(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    async loadEmailList() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                status: this.currentFilters.status !== 'all' ? this.currentFilters.status : '',
                form_id: this.currentFilters.form_id !== 'all' ? this.currentFilters.form_id : '',
                search: this.currentFilters.search,
                date_range: this.currentFilters.date_range
            });

            const response = await window.apiService.get(`/emails?${params}`);
            this.renderEmailList(response.emails || []);
            this.updatePagination(response.pagination || {});
        } catch (error) {
            console.error('Erreur lors du chargement des emails:', error);
            this.showError('Impossible de charger la liste des emails');
        }
    }

    renderEmailList(emails) {
        const container = document.getElementById('emails-list');
        if (!container) return;

        if (emails.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = emails.map(email => this.getEmailRow(email)).join('');
    }

    getEmailRow(email) {
        const statusClass = this.getStatusClass(email.status);
        const statusIcon = this.getStatusIcon(email.status);
        const formattedDate = new Date(email.sent_at).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="tremor-Card p-4 mb-3 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4 flex-1">
                        <div class="flex items-center space-x-2">
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusClass}">
                                <i class="${statusIcon} mr-1"></i>
                                ${this.getStatusText(email.status)}
                            </span>
                        </div>
                        
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-tremor-content-strong truncate">
                                ${email.recipient_email}
                            </p>
                            <p class="text-xs text-tremor-content-subtle">
                                ${email.subject || 'Sans objet'}
                            </p>
                        </div>
                        
                        <div class="text-right">
                            <p class="text-sm text-tremor-content">
                                ${email.form_title || 'Formulaire supprimé'}
                            </p>
                            <p class="text-xs text-tremor-content-subtle">
                                ${formattedDate}
                            </p>
                        </div>
                        
                        <div class="flex items-center space-x-2">
                            ${email.opened_at ? `<i class="ri-eye-line text-tremor-brand" title="Ouvert le ${new Date(email.opened_at).toLocaleDateString('fr-FR')}"></i>` : ''}
                            ${email.clicked_at ? `<i class="ri-mouse-line text-tremor-brand" title="Cliqué le ${new Date(email.clicked_at).toLocaleDateString('fr-FR')}"></i>` : ''}
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-2 ml-4">
                        <button class="tremor-Button tremor-Button-secondary tremor-Button-xs" 
                                data-action="view-details" data-email-id="${email.id}">
                            <i class="ri-eye-line"></i>
                        </button>
                        
                        ${email.status === 'unread' ? `
                            <button class="tremor-Button tremor-Button-secondary tremor-Button-xs" 
                                    data-action="mark-read" data-email-id="${email.id}" title="Marquer comme lu">
                                <i class="ri-check-line"></i>
                            </button>
                        ` : `
                            <button class="tremor-Button tremor-Button-secondary tremor-Button-xs" 
                                    data-action="mark-unread" data-email-id="${email.id}" title="Marquer comme non lu">
                                <i class="ri-close-line"></i>
                            </button>
                        `}
                        
                        <button class="tremor-Button tremor-Button-secondary tremor-Button-xs text-red-600 hover:bg-red-50" 
                                data-action="delete-email" data-email-id="${email.id}" title="Supprimer">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>
                
                ${email.tracking_data ? this.getTrackingDetails(email.tracking_data) : ''}
            </div>
        `;
    }

    getTrackingDetails(trackingData) {
        if (!trackingData || Object.keys(trackingData).length === 0) return '';

        return `
            <div class="mt-3 pt-3 border-t border-tremor-border">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    ${trackingData.ip ? `
                        <div>
                            <span class="text-tremor-content-subtle">IP:</span>
                            <span class="font-mono">${trackingData.ip}</span>
                        </div>
                    ` : ''}
                    ${trackingData.user_agent ? `
                        <div>
                            <span class="text-tremor-content-subtle">Navigateur:</span>
                            <span class="truncate">${this.getBrowserName(trackingData.user_agent)}</span>
                        </div>
                    ` : ''}
                    ${trackingData.location ? `
                        <div>
                            <span class="text-tremor-content-subtle">Localisation:</span>
                            <span>${trackingData.location}</span>
                        </div>
                    ` : ''}
                    ${trackingData.device ? `
                        <div>
                            <span class="text-tremor-content-subtle">Appareil:</span>
                            <span>${trackingData.device}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        const classes = {
            sent: 'bg-blue-100 text-blue-800',
            delivered: 'bg-green-100 text-green-800',
            opened: 'bg-purple-100 text-purple-800',
            clicked: 'bg-orange-100 text-orange-800',
            bounced: 'bg-red-100 text-red-800',
            failed: 'bg-red-100 text-red-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    getStatusIcon(status) {
        const icons = {
            sent: 'ri-send-plane-line',
            delivered: 'ri-checkbox-circle-line',
            opened: 'ri-eye-line',
            clicked: 'ri-mouse-line',
            bounced: 'ri-error-warning-line',
            failed: 'ri-close-circle-line'
        };
        return icons[status] || 'ri-question-line';
    }

    getStatusText(status) {
        const texts = {
            sent: 'Envoyé',
            delivered: 'Livré',
            opened: 'Ouvert',
            clicked: 'Cliqué',
            bounced: 'Rejeté',
            failed: 'Échec'
        };
        return texts[status] || 'Inconnu';
    }

    getBrowserName(userAgent) {
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Autre';
    }

    getEmptyState() {
        return `
            <div class="text-center py-8">
                <i class="ri-mail-line text-4xl text-tremor-content-subtle mb-4"></i>
                <h3 class="tremor-Title mb-2">Aucun email trouvé</h3>
                <p class="tremor-Text text-tremor-content-subtle">
                    ${this.currentFilters.search ? 'Aucun email ne correspond à votre recherche.' : 'Aucun email n\'a été envoyé récemment.'}
                </p>
            </div>
        `;
    }

    updatePagination(pagination) {
        const container = document.getElementById('pagination-container');
        if (!container || !pagination.total_pages) return;

        const totalPages = pagination.total_pages;
        const currentPage = pagination.current_page || this.currentPage;

        let paginationHTML = '';

        if (totalPages > 1) {
            paginationHTML = `
                <div class="flex items-center justify-between">
                    <div class="text-sm text-tremor-content-subtle">
                        Page ${currentPage} sur ${totalPages} (${pagination.total_items || 0} emails)
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="tremor-Button tremor-Button-secondary tremor-Button-sm" 
                                onclick="emailTrackingManager.goToPage(${currentPage - 1})"
                                ${currentPage <= 1 ? 'disabled' : ''}>
                            <i class="ri-arrow-left-line"></i>
                            Précédent
                        </button>
                        <button class="tremor-Button tremor-Button-secondary tremor-Button-sm"
                                onclick="emailTrackingManager.goToPage(${currentPage + 1})"
                                ${currentPage >= totalPages ? 'disabled' : ''}>
                            Suivant
                            <i class="ri-arrow-right-line"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        container.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadEmailList();
    }

    async markAsRead(emailId) {
        try {
            await window.apiService.patch(`/emails/${emailId}/mark-read`);
            this.loadEmailList();
            this.showSuccess('Email marqué comme lu');
        } catch (error) {
            console.error('Erreur lors du marquage comme lu:', error);
            this.showError('Impossible de marquer l\'email comme lu');
        }
    }

    async markAsUnread(emailId) {
        try {
            await window.apiService.patch(`/emails/${emailId}/mark-unread`);
            this.loadEmailList();
            this.showSuccess('Email marqué comme non lu');
        } catch (error) {
            console.error('Erreur lors du marquage comme non lu:', error);
            this.showError('Impossible de marquer l\'email comme non lu');
        }
    }

    async deleteEmail(emailId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet email ?')) return;

        try {
            await window.apiService.delete(`/emails/${emailId}`);
            this.loadEmailList();
            this.showSuccess('Email supprimé avec succès');
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            this.showError('Impossible de supprimer l\'email');
        }
    }

    async showEmailDetails(emailId) {
        try {
            const email = await window.apiService.get(`/emails/${emailId}`);
            this.openEmailModal(email);
        } catch (error) {
            console.error('Erreur lors du chargement des détails:', error);
            this.showError('Impossible de charger les détails de l\'email');
        }
    }

    openEmailModal(email) {
        const modal = document.getElementById('email-details-modal');
        if (!modal) return;

        // Remplir les détails
        document.getElementById('modal-email-subject').textContent = email.subject || 'Sans objet';
        document.getElementById('modal-email-recipient').textContent = email.recipient_email;
        document.getElementById('modal-email-status').textContent = this.getStatusText(email.status);
        document.getElementById('modal-email-sent-at').textContent = new Date(email.sent_at).toLocaleString('fr-FR');
        
        if (email.opened_at) {
            document.getElementById('modal-email-opened-at').textContent = new Date(email.opened_at).toLocaleString('fr-FR');
        }
        
        if (email.clicked_at) {
            document.getElementById('modal-email-clicked-at').textContent = new Date(email.clicked_at).toLocaleString('fr-FR');
        }

        // Afficher le modal
        modal.classList.remove('hidden');
    }

    async exportEmailData() {
        try {
            const params = new URLSearchParams({
                status: this.currentFilters.status !== 'all' ? this.currentFilters.status : '',
                form_id: this.currentFilters.form_id !== 'all' ? this.currentFilters.form_id : '',
                search: this.currentFilters.search,
                date_range: this.currentFilters.date_range,
                export: 'csv'
            });

            const response = await window.apiService.get(`/emails/export?${params}`, {
                responseType: 'blob'
            });

            // Créer et télécharger le fichier
            const blob = new Blob([response], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `emails_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showSuccess('Export terminé avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            this.showError('Impossible d\'exporter les données');
        }
    }

    initializeCharts() {
        this.initializeDeliveryChart();
        this.initializeEngagementChart();
    }

    initializeDeliveryChart() {
        const container = document.getElementById('delivery-chart');
        if (!container) return;

        this.charts.delivery = new ApexCharts(container, {
            chart: {
                type: 'donut',
                height: 200,
                toolbar: { show: false }
            },
            series: [0, 0, 0],
            labels: ['Livrés', 'Rejetés', 'En attente'],
            colors: ['#10b981', '#ef4444', '#f59e0b'],
            legend: {
                position: 'bottom'
            },
            dataLabels: {
                enabled: false
            }
        });

        this.charts.delivery.render();
    }

    initializeEngagementChart() {
        const container = document.getElementById('engagement-chart');
        if (!container) return;

        this.charts.engagement = new ApexCharts(container, {
            chart: {
                type: 'bar',
                height: 200,
                toolbar: { show: false }
            },
            series: [{
                name: 'Emails',
                data: [0, 0, 0]
            }],
            xaxis: {
                categories: ['Ouverts', 'Cliqués', 'Convertis']
            },
            colors: ['#6366f1'],
            dataLabels: {
                enabled: false
            }
        });

        this.charts.engagement.render();
    }

    updateCharts(stats) {
        if (this.charts.delivery) {
            this.charts.delivery.updateSeries([
                stats.delivered_emails || 0,
                stats.bounced_emails || 0,
                (stats.sent_emails || 0) - (stats.delivered_emails || 0) - (stats.bounced_emails || 0)
            ]);
        }

        if (this.charts.engagement) {
            this.charts.engagement.updateSeries([{
                name: 'Emails',
                data: [
                    stats.opened_emails || 0,
                    stats.clicked_emails || 0,
                    stats.converted_emails || 0
                ]
            }]);
        }
    }

    setupRealTimeUpdates() {
        setInterval(() => {
            this.loadEmailStatistics();
        }, this.updateInterval);
    }

    showSuccess(message) {
        window.dynamicPageService?.showNotification?.(message, 'success');
    }

    showError(message) {
        window.dynamicPageService?.showNotification?.(message, 'error');
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('email-tracking')) {
        window.emailTrackingManager = new EmailTrackingManager();
    }
});

// Fonction d'initialisation pour l'auto-loader
window.initEmailTracking = function() {
    console.log('🚀 Initialisation Email Tracking via auto-loader...');
    if (!window.emailTrackingManager) {
        window.emailTrackingManager = new EmailTrackingManager();
    }
};

// Export pour utilisation externe
window.EmailTrackingManager = EmailTrackingManager;

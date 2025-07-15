/**
 * Extension du PublicFormManager - Navigation Multi-Pages
 */

Object.assign(PublicFormManager.prototype, {

    /**
     * Initialiser la navigation multi-pages
     */
    initializeMultiPageNavigation() {
        console.log('📄 Initialisation navigation multi-pages');
        
        this.startTime = Date.now(); // Pour tracking du temps
        
        // Afficher les contrôles de navigation
        const navigationContainer = document.getElementById('form-navigation');
        const progressContainer = document.getElementById('progress-container');
        
        if (navigationContainer) {
            navigationContainer.classList.remove('hidden');
        }
        
        if (progressContainer) {
            progressContainer.classList.remove('hidden');
        }
        
        // Créer les indicateurs de page
        this.createPageIndicators();
        
        // Mettre à jour l'affichage initial
        this.updateNavigationState();
        this.updateProgressBar();
        
        // Gérer les raccourcis clavier
        this.setupKeyboardNavigation();
    },

    /**
     * Créer les indicateurs de page
     */
    createPageIndicators() {
        const container = document.getElementById('page-indicators');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (let i = 1; i <= this.totalPages; i++) {
            const indicator = document.createElement('div');
            indicator.className = `w-3 h-3 rounded-full transition-colors cursor-pointer ${
                i === this.currentPage ? 'bg-blue-600' : 'bg-gray-300'
            }`;
            indicator.dataset.page = i;
            indicator.title = `Page ${i}`;
            
            indicator.addEventListener('click', () => {
                if (this.canNavigateToPage(i)) {
                    this.goToPage(i);
                }
            });
            
            container.appendChild(indicator);
        }
    },

    /**
     * Vérifier si on peut naviguer vers une page
     */
    canNavigateToPage(targetPage) {
        // On peut toujours aller vers une page précédente
        if (targetPage < this.currentPage) {
            return true;
        }
        
        // Pour aller vers une page suivante, valider les pages intermédiaires
        for (let page = this.currentPage; page < targetPage; page++) {
            if (!this.validatePage(page)) {
                return false;
            }
        }
        
        return true;
    },

    /**
     * Aller à la page suivante
     */
    nextPage() {
        if (this.currentPage >= this.totalPages) {
            return;
        }
        
        // Valider la page actuelle
        if (!this.validateCurrentPage()) {
            this.showPageError('Veuillez corriger les erreurs avant de continuer.');
            return;
        }
        
        this.goToPage(this.currentPage + 1);
    },

    /**
     * Aller à la page précédente
     */
    previousPage() {
        if (this.currentPage <= 1) {
            return;
        }
        
        this.goToPage(this.currentPage - 1);
    },

    /**
     * Aller à une page spécifique
     */
    goToPage(pageNumber) {
        if (pageNumber < 1 || pageNumber > this.totalPages) {
            return;
        }
        
        console.log(`📄 Navigation: Page ${this.currentPage} -> ${pageNumber}`);
        
        // Masquer la page actuelle
        const currentPageElement = document.querySelector(`.form-page[data-page="${this.currentPage}"]`);
        if (currentPageElement) {
            currentPageElement.classList.remove('active');
        }
        
        // Afficher la nouvelle page
        const targetPageElement = document.querySelector(`.form-page[data-page="${pageNumber}"]`);
        if (targetPageElement) {
            targetPageElement.classList.add('active');
        }
        
        // Mettre à jour l'état
        this.currentPage = pageNumber;
        this.updateNavigationState();
        this.updateProgressBar();
        this.updatePageIndicators();
        
        // Faire défiler vers le haut
        this.scrollToTop();
        
        // Focus sur le premier champ de la nouvelle page
        this.focusFirstField();
        
        // Tracking de navigation
        this.trackPageNavigation(pageNumber);
    },

    /**
     * Valider la page actuelle
     */
    validateCurrentPage() {
        return this.validatePage(this.currentPage);
    },

    /**
     * Valider une page spécifique
     */
    validatePage(pageNumber) {
        const pageElement = document.querySelector(`.form-page[data-page="${pageNumber}"]`);
        if (!pageElement) return true;
        
        const fields = pageElement.querySelectorAll('input, select, textarea');
        let isValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    },

    /**
     * Mettre à jour l'état de navigation
     */
    updateNavigationState() {
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        const submitContainer = document.getElementById('submit-container');
        
        // Bouton précédent
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        // Bouton suivant et soumission
        if (this.currentPage >= this.totalPages) {
            // Dernière page: masquer "suivant", afficher "soumettre"
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitContainer) submitContainer.style.display = 'block';
        } else {
            // Pas la dernière page: afficher "suivant", masquer "soumettre"
            if (nextBtn) {
                nextBtn.style.display = 'flex';
                nextBtn.textContent = 'Suivant';
            }
            if (submitContainer) submitContainer.style.display = 'none';
        }
    },

    /**
     * Mettre à jour la barre de progression
     */
    updateProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar) {
            const percentage = (this.currentPage / this.totalPages) * 100;
            progressBar.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${this.currentPage} sur ${this.totalPages}`;
        }
    },

    /**
     * Mettre à jour les indicateurs de page
     */
    updatePageIndicators() {
        const indicators = document.querySelectorAll('#page-indicators > div');
        
        indicators.forEach((indicator, index) => {
            const pageNumber = index + 1;
            
            if (pageNumber === this.currentPage) {
                indicator.className = 'w-3 h-3 rounded-full transition-colors cursor-pointer bg-blue-600';
            } else if (pageNumber < this.currentPage) {
                indicator.className = 'w-3 h-3 rounded-full transition-colors cursor-pointer bg-green-600';
            } else {
                indicator.className = 'w-3 h-3 rounded-full transition-colors cursor-pointer bg-gray-300';
            }
        });
    },

    /**
     * Faire défiler vers le haut
     */
    scrollToTop() {
        const headerElement = document.getElementById('form-header');
        if (headerElement) {
            headerElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        } else {
            window.scrollTo({ 
                top: 0, 
                behavior: 'smooth' 
            });
        }
    },

    /**
     * Focus sur le premier champ de la page
     */
    focusFirstField() {
        setTimeout(() => {
            const currentPageElement = document.querySelector(`.form-page[data-page="${this.currentPage}"]`);
            if (currentPageElement) {
                const firstField = currentPageElement.querySelector('input:not([type="hidden"]), select, textarea');
                if (firstField && !firstField.disabled) {
                    firstField.focus();
                }
            }
        }, 300); // Délai pour laisser l'animation se terminer
    },

    /**
     * Configurer la navigation au clavier
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + flèches pour naviguer
            if ((e.ctrlKey || e.metaKey)) {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.previousPage();
                } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (this.currentPage < this.totalPages) {
                        this.nextPage();
                    }
                }
            }
            
            // Échap pour aller à la première page
            if (e.key === 'Escape') {
                this.goToPage(1);
            }
            
            // Entrée pour page suivante (si pas dans un textarea)
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                if (this.currentPage < this.totalPages) {
                    e.preventDefault();
                    this.nextPage();
                }
            }
        });
    },

    /**
     * Afficher une erreur de page
     */
    showPageError(message) {
        this.showGlobalError(message);
        
        // Faire défiler vers le premier champ en erreur
        setTimeout(() => {
            const firstError = document.querySelector('.form-input.error');
            if (firstError) {
                firstError.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                firstError.focus();
            }
        }, 100);
    },

    /**
     * Sauvegarder le progrès de navigation
     */
    saveNavigationProgress() {
        const progressData = {
            formId: this.formId,
            currentPage: this.currentPage,
            responses: this.responses,
            timestamp: new Date().toISOString()
        };
        
        // Sauvegarder dans localStorage pour récupération
        localStorage.setItem(`formease_progress_${this.formId}`, JSON.stringify(progressData));
    },

    /**
     * Restaurer le progrès de navigation
     */
    restoreNavigationProgress() {
        try {
            const savedProgress = localStorage.getItem(`formease_progress_${this.formId}`);
            if (savedProgress) {
                const progressData = JSON.parse(savedProgress);
                
                // Vérifier que les données ne sont pas trop anciennes (24h)
                const savedTime = new Date(progressData.timestamp);
                const now = new Date();
                const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    this.responses = progressData.responses || {};
                    
                    // Proposer de reprendre où on s'était arrêté
                    if (progressData.currentPage > 1) {
                        this.showProgressRestoreModal(progressData.currentPage);
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Erreur restauration progrès:', error);
        }
    },

    /**
     * Afficher la modal de restauration de progrès
     */
    showProgressRestoreModal(savedPage) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-md mx-4">
                <div class="text-center">
                    <i class="ri-time-line text-4xl text-blue-600 mb-4"></i>
                    <h3 class="text-lg font-semibold mb-2">Reprendre où vous vous étiez arrêté ?</h3>
                    <p class="text-gray-600 mb-6">
                        Nous avons trouvé une session précédente de ce formulaire à la page ${savedPage}.
                    </p>
                    <div class="flex space-x-3">
                        <button id="restore-progress" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Reprendre
                        </button>
                        <button id="start-fresh" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                            Recommencer
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Événements
        modal.querySelector('#restore-progress').addEventListener('click', () => {
            this.goToPage(savedPage);
            this.restoreFieldValues();
            modal.remove();
        });
        
        modal.querySelector('#start-fresh').addEventListener('click', () => {
            localStorage.removeItem(`formease_progress_${this.formId}`);
            this.responses = {};
            modal.remove();
        });
        
        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    /**
     * Restaurer les valeurs des champs
     */
    restoreFieldValues() {
        Object.keys(this.responses).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const value = this.responses[fieldId];
            
            if (field && value !== null && value !== undefined) {
                if (field.type === 'checkbox' || field.type === 'radio') {
                    if (Array.isArray(value)) {
                        // Checkboxes multiples
                        value.forEach(val => {
                            const checkbox = document.querySelector(`input[name="${fieldId}[]"][value="${val}"]`);
                            if (checkbox) checkbox.checked = true;
                        });
                    } else {
                        // Radio ou checkbox unique
                        const input = document.querySelector(`input[name="${fieldId}"][value="${value}"]`);
                        if (input) input.checked = true;
                    }
                } else {
                    field.value = value;
                    
                    // Déclencher l'événement change pour les éléments spéciaux
                    field.dispatchEvent(new Event('change'));
                }
            }
        });
    },

    /**
     * Tracking de navigation de page
     */
    async trackPageNavigation(pageNumber) {
        try {
            await fetch(`/api/analytics/forms/${this.formId}/page-view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    page: pageNumber,
                    timestamp: new Date().toISOString(),
                    timeOnPreviousPage: this.getTimeOnCurrentPage()
                })
            });
        } catch (error) {
            console.warn('⚠️ Erreur tracking navigation:', error);
        }
        
        // Réinitialiser le timer de page
        this.pageStartTime = Date.now();
    },

    /**
     * Obtenir le temps passé sur la page actuelle
     */
    getTimeOnCurrentPage() {
        if (this.pageStartTime) {
            return Math.round((Date.now() - this.pageStartTime) / 1000);
        }
        return 0;
    },

    /**
     * Gestion du redimensionnement pour la navigation
     */
    handleResize() {
        // Ajuster l'affichage sur mobile
        const navigationContainer = document.getElementById('form-navigation');
        if (navigationContainer && window.innerWidth < 768) {
            // Navigation mobile simplifiée
            this.updateMobileNavigation();
        }
    },

    /**
     * Mettre à jour la navigation mobile
     */
    updateMobileNavigation() {
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        
        // Simplifier les textes sur mobile
        if (prevBtn) {
            const text = prevBtn.querySelector('span');
            if (text && window.innerWidth < 768) {
                text.textContent = 'Préc.';
            } else if (text) {
                text.textContent = 'Précédent';
            }
        }
        
        if (nextBtn) {
            const text = nextBtn.querySelector('span');
            if (text && window.innerWidth < 768) {
                text.textContent = 'Suiv.';
            } else if (text) {
                text.textContent = 'Suivant';
            }
        }
    },

    /**
     * Nettoyer les données de progression à la soumission
     */
    cleanupProgress() {
        localStorage.removeItem(`formease_progress_${this.formId}`);
    }
});

// Extension pour gérer la sauvegarde automatique
Object.assign(PublicFormManager.prototype, {
    
    /**
     * Activer la sauvegarde automatique
     */
    enableAutoSave() {
        // Sauvegarder toutes les 30 secondes
        this.autoSaveInterval = setInterval(() => {
            if (this.totalPages > 1) {
                this.saveNavigationProgress();
            }
        }, 30000);
        
        // Sauvegarder aussi avant de quitter la page
        window.addEventListener('beforeunload', () => {
            if (this.totalPages > 1) {
                this.saveNavigationProgress();
            }
        });
    },

    /**
     * Désactiver la sauvegarde automatique
     */
    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
});

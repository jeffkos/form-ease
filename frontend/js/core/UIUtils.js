/**
 * 🎨 UI UTILS - UTILITAIRES D'INTERFACE UTILISATEUR
 * 
 * Collection d'utilitaires pour améliorer l'expérience utilisateur
 * Gestion des loadings, animations, et interactions Tremor UI
 */

class UIUtils {
    constructor() {
        this.loadingStates = new Map();
        this.modalStack = [];
        this.tooltips = new Map();
        
        this.init();
    }

    /**
     * Initialisation des utilitaires UI
     */
    init() {
        this.initializeGlobalStyles();
        this.addGlobalEventListeners();
        console.log('🎨 UIUtils initialisé');
    }

    // ========================
    // GESTION DES ÉTATS DE CHARGEMENT
    // ========================

    /**
     * Afficher un indicateur de chargement
     * @param {string|Element} target - Sélecteur CSS ou élément DOM
     * @param {string} message - Message de chargement (optionnel)
     * @param {string} size - Taille (sm, md, lg)
     */
    showLoading(target, message = 'Chargement...', size = 'md') {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const loadingId = this.generateId();
        
        const loadingHTML = this.createLoadingHTML(message, size);
        
        // Créer le conteneur de chargement
        const loadingContainer = document.createElement('div');
        loadingContainer.innerHTML = loadingHTML;
        loadingContainer.className = 'formease-loading-overlay';
        loadingContainer.setAttribute('data-loading-id', loadingId);
        
        // Positionner relativement à l'élément
        element.style.position = 'relative';
        element.appendChild(loadingContainer);
        
        // Stocker l'état
        this.loadingStates.set(loadingId, {
            element,
            container: loadingContainer,
            timestamp: Date.now()
        });
        
        return loadingId;
    }

    /**
     * Masquer un indicateur de chargement
     * @param {string} loadingId - ID du chargement
     */
    hideLoading(loadingId) {
        const loadingState = this.loadingStates.get(loadingId);
        if (!loadingState) return;

        const { container } = loadingState;
        
        // Animation de disparition
        container.style.opacity = '0';
        setTimeout(() => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }, 150);
        
        this.loadingStates.delete(loadingId);
    }

    /**
     * Masquer tous les chargements d'un élément
     * @param {string|Element} target - Sélecteur CSS ou élément DOM
     */
    hideAllLoading(target) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const loadingOverlays = element.querySelectorAll('.formease-loading-overlay');
        loadingOverlays.forEach(overlay => {
            const loadingId = overlay.getAttribute('data-loading-id');
            if (loadingId) {
                this.hideLoading(loadingId);
            }
        });
    }

    /**
     * Créer le HTML pour l'indicateur de chargement
     * @param {string} message - Message
     * @param {string} size - Taille
     * @returns {string} - HTML
     */
    createLoadingHTML(message, size) {
        const sizeClasses = {
            sm: 'w-4 h-4',
            md: 'w-6 h-6',
            lg: 'w-8 h-8'
        };

        const textSizeClasses = {
            sm: 'text-xs',
            md: 'text-sm',
            lg: 'text-base'
        };

        return `
            <div class="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div class="text-center">
                    <div class="${sizeClasses[size]} border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                    <p class="${textSizeClasses[size]} text-gray-600">${message}</p>
                </div>
            </div>
        `;
    }

    // ========================
    // SYSTÈME DE NOTIFICATIONS TREMOR
    // ========================

    /**
     * Afficher une notification Tremor
     * @param {string} message - Message
     * @param {string} type - Type (success, error, warning, info)
     * @param {number} duration - Durée en ms (0 = permanent)
     * @param {object} options - Options supplémentaires
     */
    showNotification(message, type = 'info', duration = 5000, options = {}) {
        const notification = this.createNotification(message, type, options);
        document.body.appendChild(notification);

        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);

        // Auto-suppression
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }

        return notification;
    }

    /**
     * Créer un élément de notification
     * @param {string} message - Message
     * @param {string} type - Type
     * @param {object} options - Options
     * @returns {Element} - Élément de notification
     */
    createNotification(message, type, options = {}) {
        const notification = document.createElement('div');
        
        const typeConfig = {
            success: {
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                textColor: 'text-green-800',
                iconColor: 'text-green-600',
                icon: 'ri-check-circle-line'
            },
            error: {
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                textColor: 'text-red-800',
                iconColor: 'text-red-600',
                icon: 'ri-error-warning-line'
            },
            warning: {
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200',
                textColor: 'text-yellow-800',
                iconColor: 'text-yellow-600',
                icon: 'ri-alert-line'
            },
            info: {
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                textColor: 'text-blue-800',
                iconColor: 'text-blue-600',
                icon: 'ri-information-line'
            }
        };

        const config = typeConfig[type] || typeConfig.info;

        notification.className = `
            fixed top-4 right-4 z-50 min-w-80 max-w-96 p-4 rounded-lg border transition-all duration-300
            ${config.bgColor} ${config.borderColor} ${config.textColor}
            transform translate-x-full opacity-0
        `;

        notification.innerHTML = `
            <div class="flex items-start">
                <i class="${config.icon} ${config.iconColor} mr-3 mt-0.5 text-lg"></i>
                <div class="flex-1">
                    <p class="font-medium">${message}</p>
                    ${options.description ? `<p class="text-sm mt-1 opacity-75">${options.description}</p>` : ''}
                </div>
                <button class="ml-3 opacity-50 hover:opacity-100 transition-opacity" onclick="this.parentElement.parentElement.remove()">
                    <i class="ri-close-line text-lg"></i>
                </button>
            </div>
        `;

        return notification;
    }

    /**
     * Supprimer une notification
     * @param {Element} notification - Élément de notification
     */
    removeNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // ========================
    // GESTION DES MODALES TREMOR
    // ========================

    /**
     * Afficher une modale
     * @param {object} config - Configuration de la modale
     * @returns {Element} - Élément de la modale
     */
    showModal(config) {
        const modal = this.createModal(config);
        document.body.appendChild(modal);
        
        // Ajouter à la pile des modales
        this.modalStack.push(modal);
        
        // Gérer l'ESC pour fermer
        this.handleModalEscape(modal);
        
        // Animation d'ouverture
        setTimeout(() => {
            modal.style.opacity = '1';
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.transform = 'scale(1)';
            }
        }, 10);
        
        return modal;
    }

    /**
     * Créer un élément de modale
     * @param {object} config - Configuration
     * @returns {Element} - Élément de modale
     */
    createModal(config) {
        const {
            title = 'Titre',
            content = '',
            size = 'md',
            closable = true,
            actions = []
        } = config;
        
        const sizeClasses = {
            sm: 'max-w-md',
            md: 'max-w-lg',
            lg: 'max-w-2xl',
            xl: 'max-w-4xl'
        };
        
        const modal = document.createElement('div');
        modal.className = `
            fixed inset-0 z-50 flex items-center justify-center p-4
            bg-black/50 backdrop-blur-sm opacity-0 transition-all duration-300
        `;
        
        const actionsHTML = actions.map(action => `
            <button 
                class="px-4 py-2 rounded-lg font-medium transition-colors ${action.className || 'bg-gray-100 hover:bg-gray-200 text-gray-800'}"
                onclick="${action.onclick || ''}"
            >
                ${action.icon ? `<i class="${action.icon} mr-2"></i>` : ''}
                ${action.label}
            </button>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-content bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} transform scale-95 transition-transform duration-300">
                <div class="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                    ${closable ? `
                        <button class="text-gray-400 hover:text-gray-600 transition-colors" onclick="this.closest('.fixed').remove()">
                            <i class="ri-close-line text-xl"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="p-6">
                    ${content}
                </div>
                ${actions.length > 0 ? `
                    <div class="flex justify-end space-x-3 p-6 border-t border-gray-200">
                        ${actionsHTML}
                    </div>
                ` : ''}
            </div>
        `;
        
        return modal;
    }

    /**
     * Fermer la dernière modale
     */
    closeLastModal() {
        if (this.modalStack.length > 0) {
            const modal = this.modalStack.pop();
            this.closeModal(modal);
        }
    }

    /**
     * Fermer une modale spécifique
     * @param {Element} modal - Élément de modale
     */
    closeModal(modal) {
        modal.style.opacity = '0';
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.transform = 'scale(0.95)';
        }
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
        
        // Retirer de la pile
        const index = this.modalStack.indexOf(modal);
        if (index > -1) {
            this.modalStack.splice(index, 1);
        }
    }

    /**
     * Gérer l'échappement pour fermer les modales
     * @param {Element} modal - Élément de modale
     */
    handleModalEscape(modal) {
        const escapeHandler = (event) => {
            if (event.key === 'Escape' && this.modalStack[this.modalStack.length - 1] === modal) {
                this.closeModal(modal);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        
        document.addEventListener('keydown', escapeHandler);
    }

    // ========================
    // ANIMATIONS ET TRANSITIONS
    // ========================

    /**
     * Animer un élément avec une classe CSS
     * @param {string|Element} target - Sélecteur ou élément
     * @param {string} animation - Classe d'animation
     * @param {number} duration - Durée en ms
     */
    animate(target, animation, duration = 300) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        element.classList.add(animation);
        
        setTimeout(() => {
            element.classList.remove(animation);
        }, duration);
    }

    /**
     * Faire clignoter un élément
     * @param {string|Element} target - Sélecteur ou élément
     * @param {number} times - Nombre de clignotements
     */
    blink(target, times = 3) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        let count = 0;
        const interval = setInterval(() => {
            element.style.opacity = element.style.opacity === '0.5' ? '1' : '0.5';
            count++;
            
            if (count >= times * 2) {
                clearInterval(interval);
                element.style.opacity = '1';
            }
        }, 150);
    }

    /**
     * Effet de pulsation
     * @param {string|Element} target - Sélecteur ou élément
     * @param {number} duration - Durée en ms
     */
    pulse(target, duration = 1000) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        element.style.animation = `pulse ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    // ========================
    // UTILITAIRES TREMOR
    // ========================

    /**
     * Mettre à jour un graphique Tremor
     * @param {string} chartId - ID du graphique
     * @param {object} newData - Nouvelles données
     */
    updateTremorChart(chartId, newData) {
        const chartElement = document.getElementById(chartId);
        if (!chartElement) return;

        // Logique de mise à jour selon le type de graphique
        // À implémenter selon les besoins spécifiques
        console.log('📊 Mise à jour du graphique:', chartId, newData);
    }

    /**
     * Créer un tooltip Tremor
     * @param {string|Element} target - Élément cible
     * @param {string} content - Contenu du tooltip
     * @param {string} position - Position (top, bottom, left, right)
     */
    createTooltip(target, content, position = 'top') {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const tooltipId = this.generateId();
        
        element.addEventListener('mouseenter', () => {
            this.showTooltip(element, content, position, tooltipId);
        });
        
        element.addEventListener('mouseleave', () => {
            this.hideTooltip(tooltipId);
        });
    }

    /**
     * Afficher un tooltip
     * @param {Element} target - Élément cible
     * @param {string} content - Contenu
     * @param {string} position - Position
     * @param {string} tooltipId - ID du tooltip
     */
    showTooltip(target, content, position, tooltipId) {
        const tooltip = document.createElement('div');
        tooltip.className = `
            absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg
            pointer-events-none transition-opacity duration-200
        `;
        tooltip.innerHTML = content;
        tooltip.setAttribute('data-tooltip-id', tooltipId);
        
        document.body.appendChild(tooltip);
        
        // Positionner le tooltip
        this.positionTooltip(tooltip, target, position);
        
        this.tooltips.set(tooltipId, tooltip);
    }

    /**
     * Masquer un tooltip
     * @param {string} tooltipId - ID du tooltip
     */
    hideTooltip(tooltipId) {
        const tooltip = this.tooltips.get(tooltipId);
        if (tooltip && tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
            this.tooltips.delete(tooltipId);
        }
    }

    /**
     * Positionner un tooltip
     * @param {Element} tooltip - Élément tooltip
     * @param {Element} target - Élément cible
     * @param {string} position - Position
     */
    positionTooltip(tooltip, target, position) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - 5;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = targetRect.bottom + 5;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.left - tooltipRect.width - 5;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.right + 5;
                break;
        }
        
        tooltip.style.top = `${top + window.scrollY}px`;
        tooltip.style.left = `${left + window.scrollX}px`;
    }

    // ========================
    // MÉTHODES UTILITAIRES
    // ========================

    /**
     * Générer un ID unique
     * @returns {string} - ID unique
     */
    generateId() {
        return 'ui_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Débouncer une fonction
     * @param {Function} func - Fonction à débouncer
     * @param {number} wait - Délai d'attente
     * @returns {Function} - Fonction débouncée
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Copier du texte dans le presse-papiers
     * @param {string} text - Texte à copier
     * @returns {Promise<boolean>} - Succès de l'opération
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copié dans le presse-papiers !', 'success', 2000);
            return true;
        } catch (error) {
            console.error('Erreur de copie:', error);
            this.showNotification('Erreur lors de la copie', 'error');
            return false;
        }
    }

    /**
     * Initialiser les styles globaux
     */
    initializeGlobalStyles() {
        if (!document.getElementById('formease-ui-styles')) {
            const styles = document.createElement('style');
            styles.id = 'formease-ui-styles';
            styles.textContent = `
                .formease-loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(2px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    transition: opacity 0.15s ease;
                }
                
                .pulse {
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .formease-app * {
                    transition: opacity 0.15s ease, transform 0.15s ease;
                }
            `;
            document.head.appendChild(styles);
        }
    }

    /**
     * Ajouter les event listeners globaux
     */
    addGlobalEventListeners() {
        // Fermer les modales en cliquant à l'extérieur
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('fixed') && this.modalStack.length > 0) {
                this.closeLastModal();
            }
        });
    }
}

// Export pour utilisation globale
window.UIUtils = UIUtils;

console.log('🎨 UIUtils disponible globalement');

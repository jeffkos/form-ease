/**
 * 🔔 NOTIFICATION SYSTEM - SYSTÈME DE NOTIFICATIONS AVANCÉ
 * 
 * Système de notifications intégré avec Tremor UI et gestion d'état
 * Supporte les notifications push, les toasts et les alertes persistantes
 */

class NotificationSystem {
    constructor() {
        this.notifications = new Map();
        this.container = null;
        this.config = {
            position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
            maxNotifications: 5,
            defaultDuration: 5000,
            stackSpacing: 8,
            animationDuration: 300
        };
        
        this.init();
    }

    /**
     * Initialisation du système de notifications
     */
    init() {
        this.createContainer();
        this.setupEventListeners();
        
        // Intégration avec StateService si disponible
        if (window.stateService) {
            this.integrateWithStateService();
        }
        
        console.log('🔔 NotificationSystem initialisé');
    }

    // ========================
    // MÉTHODES PRINCIPALES
    // ========================

    /**
     * Afficher une notification
     * @param {string} message - Message principal
     * @param {string} type - Type (success, error, warning, info)
     * @param {object} options - Options avancées
     * @returns {string} - ID de la notification
     */
    show(message, type = 'info', options = {}) {
        const notificationId = this.generateId();
        
        const notification = {
            id: notificationId,
            message,
            type,
            title: options.title || null,
            description: options.description || null,
            duration: options.duration !== undefined ? options.duration : this.config.defaultDuration,
            persistent: options.persistent || false,
            actions: options.actions || [],
            icon: options.icon || this.getDefaultIcon(type),
            timestamp: Date.now(),
            element: null
        };
        
        // Créer l'élément DOM
        notification.element = this.createElement(notification);
        
        // Ajouter au conteneur
        this.container.appendChild(notification.element);
        
        // Stocker la notification
        this.notifications.set(notificationId, notification);
        
        // Gérer la limite de notifications
        this.enforceMaxNotifications();
        
        // Animation d'entrée
        this.animateIn(notification.element);
        
        // Auto-suppression
        if (notification.duration > 0 && !notification.persistent) {
            setTimeout(() => {
                this.hide(notificationId);
            }, notification.duration);
        }
        
        // Notifier StateService si disponible
        if (window.stateService) {
            window.stateService.addNotification(message, type, notification.duration);
        }
        
        console.log(`🔔 Notification affichée: ${type} - ${message}`);
        return notificationId;
    }

    /**
     * Masquer une notification
     * @param {string} notificationId - ID de la notification
     */
    hide(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (!notification) return;

        this.animateOut(notification.element, () => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(notificationId);
            this.repositionNotifications();
        });
    }

    /**
     * Masquer toutes les notifications
     */
    hideAll() {
        Array.from(this.notifications.keys()).forEach(id => {
            this.hide(id);
        });
    }

    /**
     * Afficher une notification de succès
     * @param {string} message - Message
     * @param {object} options - Options
     * @returns {string} - ID de la notification
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    /**
     * Afficher une notification d'erreur
     * @param {string} message - Message
     * @param {object} options - Options
     * @returns {string} - ID de la notification
     */
    error(message, options = {}) {
        return this.show(message, 'error', {
            ...options,
            duration: options.duration || 8000 // Plus long pour les erreurs
        });
    }

    /**
     * Afficher une notification d'avertissement
     * @param {string} message - Message
     * @param {object} options - Options
     * @returns {string} - ID de la notification
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    /**
     * Afficher une notification d'information
     * @param {string} message - Message
     * @param {object} options - Options
     * @returns {string} - ID de la notification
     */
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    /**
     * Afficher une notification persistante avec actions
     * @param {string} message - Message
     * @param {Array} actions - Actions disponibles
     * @param {object} options - Options
     * @returns {string} - ID de la notification
     */
    confirm(message, actions, options = {}) {
        return this.show(message, options.type || 'info', {
            ...options,
            persistent: true,
            actions
        });
    }

    // ========================
    // CRÉATION D'ÉLÉMENTS
    // ========================

    /**
     * Créer le conteneur principal
     */
    createContainer() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.id = 'formease-notifications';
        this.container.className = this.getContainerClasses();
        
        document.body.appendChild(this.container);
    }

    /**
     * Créer un élément de notification
     * @param {object} notification - Données de notification
     * @returns {Element} - Élément DOM
     */
    createElement(notification) {
        const element = document.createElement('div');
        element.className = this.getNotificationClasses(notification.type);
        element.setAttribute('data-notification-id', notification.id);
        
        element.innerHTML = this.getNotificationHTML(notification);
        
        // Ajouter les event listeners
        this.attachEventListeners(element, notification);
        
        return element;
    }

    /**
     * Obtenir les classes CSS du conteneur
     * @returns {string} - Classes CSS
     */
    getContainerClasses() {
        const positionClasses = {
            'top-right': 'top-4 right-4',
            'top-left': 'top-4 left-4',
            'bottom-right': 'bottom-4 right-4',
            'bottom-left': 'bottom-4 left-4',
            'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
            'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
        };
        
        return `fixed ${positionClasses[this.config.position]} z-50 pointer-events-none`;
    }

    /**
     * Obtenir les classes CSS de notification
     * @param {string} type - Type de notification
     * @returns {string} - Classes CSS
     */
    getNotificationClasses(type) {
        const baseClasses = `
            mb-${this.config.stackSpacing} max-w-sm w-full pointer-events-auto
            bg-white rounded-lg shadow-lg border transition-all duration-${this.config.animationDuration}
            transform translate-x-full opacity-0
        `;
        
        const typeClasses = {
            success: 'border-green-200',
            error: 'border-red-200',
            warning: 'border-yellow-200',
            info: 'border-blue-200'
        };
        
        return `${baseClasses} ${typeClasses[type] || typeClasses.info}`;
    }

    /**
     * Obtenir le HTML de la notification
     * @param {object} notification - Données de notification
     * @returns {string} - HTML
     */
    getNotificationHTML(notification) {
        const { type, title, message, description, actions, icon } = notification;
        
        const colorConfig = this.getColorConfig(type);
        
        return `
            <div class="p-4">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <i class="${icon} text-lg ${colorConfig.iconColor}"></i>
                    </div>
                    <div class="ml-3 flex-1">
                        ${title ? `<h4 class="text-sm font-medium text-gray-900 mb-1">${title}</h4>` : ''}
                        <p class="text-sm ${title ? 'text-gray-600' : 'text-gray-900'}">${message}</p>
                        ${description ? `<p class="text-xs text-gray-500 mt-1">${description}</p>` : ''}
                        ${actions.length > 0 ? this.getActionsHTML(actions) : ''}
                    </div>
                    <div class="ml-4 flex-shrink-0">
                        <button class="notification-close text-gray-400 hover:text-gray-600 transition-colors">
                            <i class="ri-close-line text-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Obtenir le HTML des actions
     * @param {Array} actions - Actions
     * @returns {string} - HTML
     */
    getActionsHTML(actions) {
        const actionsHTML = actions.map((action, index) => `
            <button 
                class="notification-action text-xs px-3 py-1 rounded transition-colors ${action.className || 'bg-gray-100 hover:bg-gray-200 text-gray-700'}"
                data-action-index="${index}"
            >
                ${action.icon ? `<i class="${action.icon} mr-1"></i>` : ''}
                ${action.label}
            </button>
        `).join('');
        
        return `<div class="mt-3 space-x-2">${actionsHTML}</div>`;
    }

    /**
     * Obtenir la configuration de couleurs pour un type
     * @param {string} type - Type de notification
     * @returns {object} - Configuration de couleurs
     */
    getColorConfig(type) {
        const configs = {
            success: {
                iconColor: 'text-green-600',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200'
            },
            error: {
                iconColor: 'text-red-600',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200'
            },
            warning: {
                iconColor: 'text-yellow-600',
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200'
            },
            info: {
                iconColor: 'text-blue-600',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200'
            }
        };
        
        return configs[type] || configs.info;
    }

    /**
     * Obtenir l'icône par défaut pour un type
     * @param {string} type - Type de notification
     * @returns {string} - Classe d'icône
     */
    getDefaultIcon(type) {
        const icons = {
            success: 'ri-check-circle-line',
            error: 'ri-error-warning-line',
            warning: 'ri-alert-line',
            info: 'ri-information-line'
        };
        
        return icons[type] || icons.info;
    }

    // ========================
    // GESTION DES ÉVÉNEMENTS
    // ========================

    /**
     * Attacher les event listeners à une notification
     * @param {Element} element - Élément de notification
     * @param {object} notification - Données de notification
     */
    attachEventListeners(element, notification) {
        // Bouton de fermeture
        const closeButton = element.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hide(notification.id);
            });
        }
        
        // Actions personnalisées
        const actionButtons = element.querySelectorAll('.notification-action');
        actionButtons.forEach((button) => {
            button.addEventListener('click', (event) => {
                const actionIndex = parseInt(button.getAttribute('data-action-index'));
                const action = notification.actions[actionIndex];
                
                if (action && action.handler) {
                    action.handler(notification.id, action);
                }
                
                // Fermer la notification après action si spécifié
                if (action && action.closeAfter !== false) {
                    this.hide(notification.id);
                }
            });
        });
        
        // Hover pour pauser l'auto-suppression
        element.addEventListener('mouseenter', () => {
            element.setAttribute('data-hovered', 'true');
        });
        
        element.addEventListener('mouseleave', () => {
            element.removeAttribute('data-hovered');
        });
    }

    /**
     * Configuration des event listeners globaux
     */
    setupEventListeners() {
        // Gérer l'événement ESC pour fermer les notifications persistantes
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hideAll();
            }
        });
    }

    // ========================
    // ANIMATIONS
    // ========================

    /**
     * Animation d'entrée
     * @param {Element} element - Élément à animer
     */
    animateIn(element) {
        setTimeout(() => {
            element.style.transform = 'translateX(0)';
            element.style.opacity = '1';
        }, 10);
    }

    /**
     * Animation de sortie
     * @param {Element} element - Élément à animer
     * @param {Function} callback - Callback après animation
     */
    animateOut(element, callback) {
        element.style.transform = 'translateX(100%)';
        element.style.opacity = '0';
        
        setTimeout(() => {
            if (callback) callback();
        }, this.config.animationDuration);
    }

    /**
     * Repositionner les notifications après suppression
     */
    repositionNotifications() {
        // Les notifications se repositionnent automatiquement grâce aux classes CSS
        // Cette méthode peut être étendue pour des animations plus complexes
    }

    // ========================
    // GESTION DE L'ÉTAT
    // ========================

    /**
     * Intégration avec StateService
     */
    integrateWithStateService() {
        // Écouter les changements d'état pour afficher automatiquement des notifications
        window.stateService.subscribe('errors', (errors) => {
            if (errors && errors.length > 0) {
                const latestError = errors[errors.length - 1];
                this.error(latestError.message, {
                    title: 'Erreur',
                    description: 'Une erreur s\'est produite'
                });
            }
        });
    }

    /**
     * Gérer la limite maximale de notifications
     */
    enforceMaxNotifications() {
        const notificationArray = Array.from(this.notifications.values());
        
        if (notificationArray.length > this.config.maxNotifications) {
            // Supprimer les plus anciennes notifications non-persistantes
            const sortedNotifications = notificationArray
                .filter(n => !n.persistent)
                .sort((a, b) => a.timestamp - b.timestamp);
            
            const toRemove = sortedNotifications.slice(0, notificationArray.length - this.config.maxNotifications);
            toRemove.forEach(notification => {
                this.hide(notification.id);
            });
        }
    }

    // ========================
    // MÉTHODES UTILITAIRES
    // ========================

    /**
     * Générer un ID unique
     * @returns {string} - ID unique
     */
    generateId() {
        return 'notification_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Configurer le système
     * @param {object} newConfig - Nouvelle configuration
     */
    configure(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Recréer le conteneur si la position a changé
        if (newConfig.position && this.container) {
            this.container.className = this.getContainerClasses();
        }
    }

    /**
     * Obtenir les statistiques
     * @returns {object} - Statistiques
     */
    getStats() {
        return {
            activeNotifications: this.notifications.size,
            persistentNotifications: Array.from(this.notifications.values()).filter(n => n.persistent).length,
            position: this.config.position,
            maxNotifications: this.config.maxNotifications
        };
    }

    /**
     * Vider toutes les notifications
     */
    clear() {
        this.notifications.clear();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export pour utilisation globale
window.NotificationSystem = NotificationSystem;

console.log('🔔 NotificationSystem disponible globalement');

/**
 * 🚨 Error Handler Avancé - Gestion d'erreurs contextuelle et gracieuse
 * Intégré avec Tremor pour notifications élégantes
 */

class ErrorHandler {
    constructor() {
        this.errors = new Map();
        this.retryAttempts = new Map();
        this.offlineQueue = [];
        this.isOnline = navigator.onLine;
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            offlineRetryInterval: 5000,
            errorDisplayDuration: 5000,
            debugMode: localStorage.getItem('formease_debug') === 'true'
        };
        
        this.initializeErrorTypes();
        this.setupNetworkMonitoring();
        this.setupGlobalErrorHandling();
        this.createErrorContainer();
    }

    /**
     * 🎯 Types d'erreurs et leurs configurations
     */
    initializeErrorTypes() {
        this.errorTypes = {
            NETWORK: {
                icon: '🌐',
                title: 'Problème de connexion',
                color: 'yellow',
                retryable: true,
                suggestions: [
                    'Vérifiez votre connexion internet',
                    'Réessayez dans quelques secondes',
                    'Contactez le support si le problème persiste'
                ]
            },
            SERVER: {
                icon: '🔧',
                title: 'Erreur serveur',
                color: 'red',
                retryable: true,
                suggestions: [
                    'Le serveur rencontre un problème temporaire',
                    'Vos données sont sauvegardées',
                    'Réessayez dans quelques minutes'
                ]
            },
            VALIDATION: {
                icon: '⚠️',
                title: 'Données invalides',
                color: 'amber',
                retryable: false,
                suggestions: [
                    'Vérifiez les champs obligatoires',
                    'Corrigez le format des données',
                    'Consultez l\'aide contextuelle'
                ]
            },
            AUTHENTICATION: {
                icon: '🔐',
                title: 'Session expirée',
                color: 'blue',
                retryable: false,
                suggestions: [
                    'Votre session a expiré',
                    'Reconnectez-vous pour continuer',
                    'Vos données non sauvegardées seront perdues'
                ]
            },
            PERMISSION: {
                icon: '🚫',
                title: 'Accès refusé',
                color: 'red',
                retryable: false,
                suggestions: [
                    'Vous n\'avez pas les permissions nécessaires',
                    'Contactez un administrateur',
                    'Vérifiez votre profil utilisateur'
                ]
            },
            CLIENT: {
                icon: '💻',
                title: 'Erreur de l\'application',
                color: 'purple',
                retryable: true,
                suggestions: [
                    'Rechargez la page',
                    'Videz le cache du navigateur',
                    'Contactez le support technique'
                ]
            }
        };
    }

    /**
     * 🌐 Surveillance de la connexion réseau
     */
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNotification({
                type: 'success',
                title: '✅ Connexion rétablie',
                message: 'Reprise des opérations automatique',
                duration: 3000
            });
            this.processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification({
                type: 'warning',
                title: '📡 Mode hors ligne',
                message: 'Les actions seront mises en file d\'attente',
                duration: 0 // Persistant
            });
        });
    }

    /**
     * 🔧 Gestion globale des erreurs
     */
    setupGlobalErrorHandling() {
        // Erreurs JavaScript non capturées
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'CLIENT',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                stack: event.error?.stack,
                context: 'global'
            });
        });

        // Promesses rejetées non capturées
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'CLIENT',
                message: event.reason?.message || 'Promise rejection',
                stack: event.reason?.stack,
                context: 'promise'
            });
        });

        // Erreurs de ressources (images, scripts, etc.)
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'NETWORK',
                    message: `Failed to load resource: ${event.target.src || event.target.href}`,
                    element: event.target.tagName,
                    context: 'resource'
                });
            }
        }, true);
    }

    /**
     * 🎨 Créer le conteneur pour les notifications d'erreur
     */
    createErrorContainer() {
        if (document.getElementById('error-container')) return;

        const container = document.createElement('div');
        container.id = 'error-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-md';
        document.body.appendChild(container);
    }

    /**
     * 🚨 Gérer une erreur
     */
    handleError(error, context = {}) {
        const errorId = this.generateErrorId();
        const processedError = this.processError(error, context);
        
        // Stocker l'erreur
        this.errors.set(errorId, {
            ...processedError,
            timestamp: new Date(),
            id: errorId
        });

        // Log pour debug
        if (this.config.debugMode) {
            console.group(`🚨 FormEase Error [${errorId}]`);
            console.error('Error:', processedError);
            console.error('Context:', context);
            console.error('Stack:', error.stack);
            console.groupEnd();
        }

        // Afficher la notification
        this.displayError(processedError, errorId);

        // Tenter une récupération automatique si possible
        if (processedError.retryable) {
            this.scheduleRetry(errorId, processedError, context);
        }

        // Envoyer à l'analytics
        this.trackError(processedError, context);

        return errorId;
    }

    /**
     * 🔍 Traiter et classifier l'erreur
     */
    processError(error, context) {
        let errorType = 'CLIENT';
        let message = error.message || 'Une erreur inattendue s\'est produite';

        // Classification automatique
        if (error.status) {
            if (error.status >= 500) errorType = 'SERVER';
            else if (error.status === 401 || error.status === 403) errorType = 'AUTHENTICATION';
            else if (error.status === 404) errorType = 'NETWORK';
            else if (error.status >= 400) errorType = 'VALIDATION';
        } else if (error.code === 'NETWORK_ERROR' || !this.isOnline) {
            errorType = 'NETWORK';
        } else if (error.type) {
            errorType = error.type.toUpperCase();
        }

        // Utiliser le type fourni si valide
        if (error.type && this.errorTypes[error.type.toUpperCase()]) {
            errorType = error.type.toUpperCase();
        }

        const errorConfig = this.errorTypes[errorType];
        
        return {
            type: errorType,
            message: message,
            originalError: error,
            context: context,
            retryable: errorConfig.retryable,
            config: errorConfig,
            userMessage: this.getUserFriendlyMessage(error, errorType)
        };
    }

    /**
     * 💬 Message utilisateur amical
     */
    getUserFriendlyMessage(error, errorType) {
        const config = this.errorTypes[errorType];
        
        const templates = {
            NETWORK: 'Impossible de se connecter au serveur. Vérifiez votre connexion.',
            SERVER: 'Le serveur rencontre un problème temporaire. Réessayez dans quelques minutes.',
            VALIDATION: 'Veuillez corriger les informations saisies.',
            AUTHENTICATION: 'Votre session a expiré. Reconnectez-vous pour continuer.',
            PERMISSION: 'Vous n\'avez pas les permissions pour effectuer cette action.',
            CLIENT: 'L\'application a rencontré un problème. Rechargez la page.'
        };

        return error.userMessage || templates[errorType] || templates.CLIENT;
    }

    /**
     * 🎨 Afficher l'erreur avec Tremor
     */
    displayError(error, errorId) {
        const container = document.getElementById('error-container');
        if (!container) return;

        const errorElement = document.createElement('div');
        errorElement.id = `error-${errorId}`;
        errorElement.className = `
            bg-white dark:bg-gray-800 
            border-l-4 border-${error.config.color}-500 
            rounded-lg shadow-lg p-4 
            transform transition-all duration-300 ease-out
            translate-x-full opacity-0
        `;

        const actionsHtml = this.generateErrorActions(error, errorId);
        
        errorElement.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <span class="text-2xl">${error.config.icon}</span>
                </div>
                <div class="ml-3 flex-1">
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                        ${error.config.title}
                    </h3>
                    <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        ${error.userMessage}
                    </p>
                    ${error.config.suggestions.length > 0 ? `
                        <div class="mt-2">
                            <details class="text-xs text-gray-600 dark:text-gray-400">
                                <summary class="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                                    💡 Suggestions
                                </summary>
                                <ul class="mt-1 ml-4 list-disc space-y-1">
                                    ${error.config.suggestions.map(s => `<li>${s}</li>`).join('')}
                                </ul>
                            </details>
                        </div>
                    ` : ''}
                    ${actionsHtml}
                </div>
                <div class="ml-4 flex-shrink-0">
                    <button 
                        onclick="window.ErrorHandler.dismissError('${errorId}')"
                        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <span class="sr-only">Fermer</span>
                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        container.appendChild(errorElement);

        // Animation d'apparition
        requestAnimationFrame(() => {
            errorElement.classList.remove('translate-x-full', 'opacity-0');
        });

        // Auto-dismiss pour certains types
        if (this.config.errorDisplayDuration > 0 && !error.retryable) {
            setTimeout(() => {
                this.dismissError(errorId);
            }, this.config.errorDisplayDuration);
        }
    }

    /**
     * 🎯 Générer les actions pour l'erreur
     */
    generateErrorActions(error, errorId) {
        let actions = [];

        if (error.retryable) {
            actions.push(`
                <button 
                    onclick="window.ErrorHandler.retryError('${errorId}')"
                    class="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-${error.config.color}-700 bg-${error.config.color}-100 hover:bg-${error.config.color}-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${error.config.color}-500"
                >
                    🔄 Réessayer
                </button>
            `);
        }

        if (error.type === 'AUTHENTICATION') {
            actions.push(`
                <button 
                    onclick="window.location.reload()"
                    class="mt-2 ml-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    🔐 Se reconnecter
                </button>
            `);
        }

        if (this.config.debugMode) {
            actions.push(`
                <button 
                    onclick="window.ErrorHandler.showErrorDetails('${errorId}')"
                    class="mt-2 ml-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                    🔍 Détails
                </button>
            `);
        }

        return actions.length > 0 ? `<div class="mt-3">${actions.join('')}</div>` : '';
    }

    /**
     * 🔄 Programmer un retry automatique
     */
    scheduleRetry(errorId, error, context) {
        const attempts = this.retryAttempts.get(errorId) || 0;
        
        if (attempts >= this.config.maxRetries) {
            this.showPermanentError(error, errorId);
            return;
        }

        const delay = this.config.retryDelay * Math.pow(2, attempts); // Backoff exponentiel
        
        setTimeout(() => {
            if (this.errors.has(errorId)) { // Vérifier que l'erreur n'a pas été résolue
                this.retryError(errorId);
            }
        }, delay);
    }

    /**
     * 🔄 Réessayer une erreur
     */
    retryError(errorId) {
        const error = this.errors.get(errorId);
        if (!error) return;

        const attempts = this.retryAttempts.get(errorId) || 0;
        this.retryAttempts.set(errorId, attempts + 1);

        // Callback de retry si fourni dans le contexte
        if (error.context.retryCallback) {
            try {
                error.context.retryCallback()
                    .then(() => {
                        this.resolveError(errorId);
                    })
                    .catch((newError) => {
                        this.scheduleRetry(errorId, error, error.context);
                    });
            } catch (e) {
                this.scheduleRetry(errorId, error, error.context);
            }
        } else {
            // Retry générique (reload)
            window.location.reload();
        }
    }

    /**
     * ✅ Résoudre une erreur
     */
    resolveError(errorId) {
        this.errors.delete(errorId);
        this.retryAttempts.delete(errorId);
        this.dismissError(errorId);
        
        this.showNotification({
            type: 'success',
            title: '✅ Problème résolu',
            message: 'L\'opération a été effectuée avec succès',
            duration: 3000
        });
    }

    /**
     * ❌ Rejeter une erreur définitivement
     */
    dismissError(errorId) {
        const errorElement = document.getElementById(`error-${errorId}`);
        if (errorElement) {
            errorElement.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                errorElement.remove();
            }, 300);
        }
    }

    /**
     * 🔍 Afficher les détails d'une erreur
     */
    showErrorDetails(errorId) {
        const error = this.errors.get(errorId);
        if (!error) return;

        const details = {
            ID: errorId,
            Type: error.type,
            Message: error.message,
            Timestamp: error.timestamp.toISOString(),
            Context: error.context,
            'User Agent': navigator.userAgent,
            'URL': window.location.href,
            'Online': this.isOnline
        };

        console.group(`🔍 Error Details [${errorId}]`);
        console.table(details);
        if (error.originalError.stack) {
            console.error('Stack Trace:', error.originalError.stack);
        }
        console.groupEnd();

        // Copier les détails dans le presse-papiers
        navigator.clipboard.writeText(JSON.stringify(details, null, 2))
            .then(() => {
                this.showNotification({
                    type: 'info',
                    title: '📋 Détails copiés',
                    message: 'Les détails de l\'erreur ont été copiés',
                    duration: 2000
                });
            });
    }

    /**
     * 📱 Notification simple avec Tremor
     */
    showNotification({ type, title, message, duration = 4000 }) {
        const colors = {
            success: 'green',
            error: 'red',
            warning: 'yellow',
            info: 'blue'
        };

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const notificationId = this.generateErrorId();
        const container = document.getElementById('error-container');
        
        const notification = document.createElement('div');
        notification.id = `notification-${notificationId}`;
        notification.className = `
            bg-white dark:bg-gray-800 
            border-l-4 border-${colors[type]}-500 
            rounded-lg shadow-lg p-4 
            transform transition-all duration-300 ease-out
            translate-x-full opacity-0
        `;

        notification.innerHTML = `
            <div class="flex items-center">
                <span class="text-lg mr-3">${icons[type]}</span>
                <div class="flex-1">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">${title}</h4>
                    <p class="text-xs text-gray-600 dark:text-gray-300">${message}</p>
                </div>
                <button 
                    onclick="this.parentElement.parentElement.remove()"
                    class="ml-2 text-gray-400 hover:text-gray-600"
                >
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        `;

        container.appendChild(notification);

        requestAnimationFrame(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        });

        if (duration > 0) {
            setTimeout(() => {
                notification.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    }

    /**
     * 📊 Suivre les erreurs pour analytics
     */
    trackError(error, context) {
        // Envoyer à votre service d'analytics
        if (window.analytics) {
            window.analytics.track('Error Occurred', {
                errorType: error.type,
                errorMessage: error.message,
                context: context,
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 🔧 Méthodes utilitaires
     */
    generateErrorId() {
        return 'err_' + Math.random().toString(36).substr(2, 9);
    }

    showPermanentError(error, errorId) {
        // Marquer comme erreur permanente
        const errorElement = document.getElementById(`error-${errorId}`);
        if (errorElement) {
            errorElement.classList.add('border-red-500');
            const retryButton = errorElement.querySelector('button');
            if (retryButton) {
                retryButton.disabled = true;
                retryButton.textContent = '❌ Échec définitif';
                retryButton.className = retryButton.className.replace('hover:bg-', 'bg-gray-300 cursor-not-allowed ');
            }
        }
    }

    /**
     * 📋 Gestion de la file d'attente hors ligne
     */
    addToOfflineQueue(operation) {
        this.offlineQueue.push({
            operation,
            timestamp: new Date(),
            id: this.generateErrorId()
        });
    }

    processOfflineQueue() {
        if (this.isOnline && this.offlineQueue.length > 0) {
            const queue = [...this.offlineQueue];
            this.offlineQueue = [];
            
            queue.forEach(item => {
                try {
                    item.operation();
                } catch (error) {
                    this.handleError(error, { context: 'offline_queue_retry' });
                }
            });
        }
    }

    /**
     * 📊 Statistiques des erreurs
     */
    getErrorStats() {
        const errorsByType = {};
        this.errors.forEach(error => {
            errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
        });

        return {
            totalErrors: this.errors.size,
            errorsByType,
            isOnline: this.isOnline,
            offlineQueueSize: this.offlineQueue.length,
            debugMode: this.config.debugMode
        };
    }
}

// Instance globale
window.ErrorHandler = new ErrorHandler();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}

/**
 * 🚨 UTILISATION EXEMPLES:
 * 
 * // Gérer une erreur API
 * try {
 *     await api.call();
 * } catch (error) {
 *     ErrorHandler.handleError(error, {
 *         retryCallback: () => api.call()
 *     });
 * }
 * 
 * // Gérer une erreur de validation
 * ErrorHandler.handleError({
 *     type: 'VALIDATION',
 *     message: 'Email invalide'
 * });
 * 
 * // Notification simple
 * ErrorHandler.showNotification({
 *     type: 'success',
 *     title: 'Succès !',
 *     message: 'Opération terminée'
 * });
 */

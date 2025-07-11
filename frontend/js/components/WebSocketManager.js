/**
 * 🌐 WebSocket Manager - Gestion des connexions temps réel
 * Notifications live, collaboration et indicateurs de présence
 */

class WebSocketManager {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.heartbeatInterval = 30000;
        this.heartbeatTimer = null;
        this.isConnected = false;
        this.isReconnecting = false;
        this.subscriptions = new Map();
        this.messageQueue = [];
        this.userPresence = new Map();
        
        this.config = {
            url: this.getWebSocketUrl(),
            protocols: ['formease-v1'],
            debug: localStorage.getItem('formease_debug') === 'true'
        };

        this.eventHandlers = {
            connected: [],
            disconnected: [],
            error: [],
            message: [],
            presenceUpdate: [],
            notification: []
        };

        this.initialize();
    }

    /**
     * 🔗 Initialiser la connexion WebSocket
     */
    initialize() {
        if (typeof WebSocket === 'undefined') {
            console.warn('WebSocket not supported in this browser');
            return;
        }

        this.connect();
        this.setupEventListeners();
    }

    /**
     * 🌐 Établir la connexion WebSocket
     */
    connect() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            this.socket = new WebSocket(this.config.url, this.config.protocols);
            this.setupSocketEventHandlers();
        } catch (error) {
            this.handleError('Connection failed', error);
        }
    }

    /**
     * 🔧 Configuration des événements WebSocket
     */
    setupSocketEventHandlers() {
        this.socket.onopen = (event) => {
            this.isConnected = true;
            this.isReconnecting = false;
            this.reconnectAttempts = 0;
            
            this.log('WebSocket connected');
            this.startHeartbeat();
            this.processMessageQueue();
            this.authenticate();
            
            this.emit('connected', { event });
            this.showConnectionStatus('connected');
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                this.log('Invalid message format:', event.data);
            }
        };

        this.socket.onclose = (event) => {
            this.isConnected = false;
            this.stopHeartbeat();
            
            this.log('WebSocket disconnected:', event.code, event.reason);
            this.emit('disconnected', { event });
            this.showConnectionStatus('disconnected');
            
            if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.scheduleReconnect();
            }
        };

        this.socket.onerror = (error) => {
            this.log('WebSocket error:', error);
            this.emit('error', { error });
            this.handleError('WebSocket error', error);
        };
    }

    /**
     * 📨 Traitement des messages entrants
     */
    handleMessage(data) {
        this.log('Message received:', data);

        switch (data.type) {
            case 'pong':
                // Réponse au heartbeat
                break;
            
            case 'auth_success':
                this.handleAuthSuccess(data);
                break;
            
            case 'auth_error':
                this.handleAuthError(data);
                break;
            
            case 'notification':
                this.handleNotification(data);
                break;
            
            case 'presence_update':
                this.handlePresenceUpdate(data);
                break;
            
            case 'form_update':
                this.handleFormUpdate(data);
                break;
            
            case 'collaboration':
                this.handleCollaboration(data);
                break;
            
            case 'system_message':
                this.handleSystemMessage(data);
                break;
            
            default:
                this.emit('message', data);
                break;
        }
    }

    /**
     * 🔐 Authentification
     */
    authenticate() {
        const token = localStorage.getItem('formease_token') || sessionStorage.getItem('formease_token');
        const user = JSON.parse(localStorage.getItem('formease_user') || '{}');
        
        this.send({
            type: 'auth',
            token: token,
            user: {
                id: user.id,
                name: user.name || 'Utilisateur',
                avatar: user.avatar,
                role: user.role || 'user'
            },
            clientInfo: {
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                url: window.location.href
            }
        });
    }

    /**
     * 💗 Système de heartbeat
     */
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.send({ type: 'ping' });
            }
        }, this.heartbeatInterval);
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * 🔄 Reconnexion automatique
     */
    scheduleReconnect() {
        if (this.isReconnecting) return;
        
        this.isReconnecting = true;
        this.reconnectAttempts++;
        
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }

    /**
     * 📤 Envoyer un message
     */
    send(data) {
        if (!this.isConnected || this.socket.readyState !== WebSocket.OPEN) {
            this.messageQueue.push(data);
            this.log('Message queued:', data);
            return false;
        }

        try {
            this.socket.send(JSON.stringify(data));
            this.log('Message sent:', data);
            return true;
        } catch (error) {
            this.handleError('Send failed', error);
            return false;
        }
    }

    /**
     * 📬 Traiter la file d'attente des messages
     */
    processMessageQueue() {
        while (this.messageQueue.length > 0 && this.isConnected) {
            const message = this.messageQueue.shift();
            this.send(message);
        }
    }

    /**
     * 🔔 Gestion des notifications
     */
    handleNotification(data) {
        this.emit('notification', data);
        
        // Affichage avec ErrorHandler pour cohérence
        if (window.ErrorHandler) {
            ErrorHandler.showNotification({
                type: data.level || 'info',
                title: data.title || 'Notification',
                message: data.message,
                duration: data.persistent ? 0 : 5000
            });
        }

        // Notification browser si autorisé
        if (data.browser && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(data.title, {
                body: data.message,
                icon: '/favicon.ico',
                tag: data.id
            });
        }
    }

    /**
     * 👥 Gestion de la présence utilisateur
     */
    handlePresenceUpdate(data) {
        this.userPresence.set(data.userId, {
            ...data.user,
            status: data.status,
            lastSeen: data.timestamp,
            location: data.location
        });

        this.emit('presenceUpdate', {
            userId: data.userId,
            user: data.user,
            status: data.status,
            allUsers: Array.from(this.userPresence.values())
        });

        this.updatePresenceIndicators();
    }

    /**
     * 📝 Gestion des mises à jour de formulaires
     */
    handleFormUpdate(data) {
        // Invalider le cache pour ce formulaire
        if (window.DataCache) {
            DataCache.invalidate(`form_${data.formId}`);
        }

        // Notification de changement
        this.emit('form_update', data);

        // Animation pour indiquer la mise à jour
        if (window.AnimationManager) {
            const formElement = document.querySelector(`[data-form-id="${data.formId}"]`);
            if (formElement) {
                AnimationManager.microInteraction(formElement, 'glow');
            }
        }
    }

    /**
     * 🤝 Gestion de la collaboration
     */
    handleCollaboration(data) {
        switch (data.action) {
            case 'cursor_move':
                this.updateCursor(data);
                break;
            case 'selection_change':
                this.updateSelection(data);
                break;
            case 'field_edit':
                this.handleFieldEdit(data);
                break;
            case 'user_typing':
                this.showTypingIndicator(data);
                break;
        }

        this.emit('collaboration', data);
    }

    /**
     * ⚙️ Messages système
     */
    handleSystemMessage(data) {
        switch (data.event) {
            case 'maintenance_mode':
                this.handleMaintenanceMode(data);
                break;
            case 'server_restart':
                this.handleServerRestart(data);
                break;
            case 'feature_update':
                this.handleFeatureUpdate(data);
                break;
        }
    }

    /**
     * 🎯 API Publique - Notifications
     */
    
    // Envoyer une notification à tous les utilisateurs connectés
    broadcastNotification(title, message, level = 'info') {
        return this.send({
            type: 'broadcast_notification',
            title,
            message,
            level,
            timestamp: new Date().toISOString()
        });
    }

    // Envoyer une notification privée
    sendPrivateNotification(userId, title, message) {
        return this.send({
            type: 'private_notification',
            targetUserId: userId,
            title,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 🎯 API Publique - Collaboration
     */
    
    // Rejoindre une session de collaboration
    joinCollaboration(formId, fieldId = null) {
        return this.send({
            type: 'join_collaboration',
            formId,
            fieldId,
            timestamp: new Date().toISOString()
        });
    }

    // Quitter une session de collaboration
    leaveCollaboration(formId, fieldId = null) {
        return this.send({
            type: 'leave_collaboration',
            formId,
            fieldId,
            timestamp: new Date().toISOString()
        });
    }

    // Signaler une modification en temps réel
    broadcastEdit(formId, fieldId, value, cursor = null) {
        return this.send({
            type: 'collaboration',
            action: 'field_edit',
            formId,
            fieldId,
            value,
            cursor,
            timestamp: new Date().toISOString()
        });
    }

    // Signaler l'indicateur de frappe
    broadcastTyping(formId, fieldId, isTyping = true) {
        return this.send({
            type: 'collaboration',
            action: 'user_typing',
            formId,
            fieldId,
            isTyping,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 🎯 API Publique - Présence
     */
    
    // Mettre à jour le statut de présence
    updatePresence(status, location = null) {
        return this.send({
            type: 'presence_update',
            status, // 'online', 'away', 'busy', 'offline'
            location, // URL ou identifiant de page
            timestamp: new Date().toISOString()
        });
    }

    // Obtenir la liste des utilisateurs en ligne
    getOnlineUsers() {
        return Array.from(this.userPresence.values())
            .filter(user => user.status === 'online');
    }

    // Obtenir les utilisateurs sur une page spécifique
    getUsersOnPage(location) {
        return Array.from(this.userPresence.values())
            .filter(user => user.location === location);
    }

    /**
     * 🎯 API Publique - Subscriptions
     */
    
    // S'abonner à un événement
    on(event, callback) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(callback);
        
        return () => {
            const index = this.eventHandlers[event].indexOf(callback);
            if (index > -1) {
                this.eventHandlers[event].splice(index, 1);
            }
        };
    }

    // Émettre un événement
    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this.log('Event handler error:', error);
                }
            });
        }
    }

    /**
     * 🔧 Méthodes utilitaires
     */
    
    getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = process.env.NODE_ENV === 'development' ? ':4001' : '';
        return `${protocol}//${host}${port}/ws`;
    }

    handleAuthSuccess(data) {
        this.log('Authentication successful');
        this.updatePresence('online', window.location.pathname);
    }

    handleAuthError(data) {
        this.log('Authentication failed:', data.message);
        if (window.ErrorHandler) {
            ErrorHandler.handleError({
                type: 'AUTHENTICATION',
                message: data.message || 'WebSocket authentication failed'
            });
        }
    }

    handleMaintenanceMode(data) {
        if (window.ErrorHandler) {
            ErrorHandler.showNotification({
                type: 'warning',
                title: '🔧 Maintenance programmée',
                message: data.message || 'Le système sera temporairement indisponible',
                duration: 0
            });
        }
    }

    handleServerRestart(data) {
        if (window.ErrorHandler) {
            ErrorHandler.showNotification({
                type: 'info',
                title: '🔄 Redémarrage serveur',
                message: 'Reconnexion automatique en cours...',
                duration: 3000
            });
        }
    }

    handleFeatureUpdate(data) {
        if (window.ErrorHandler) {
            ErrorHandler.showNotification({
                type: 'success',
                title: '✨ Nouvelle fonctionnalité',
                message: data.message,
                duration: 8000
            });
        }
    }

    updatePresenceIndicators() {
        // Mettre à jour les indicateurs visuels de présence
        const onlineUsers = this.getOnlineUsers();
        const presenceElement = document.getElementById('presence-indicators');
        
        if (presenceElement) {
            presenceElement.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="flex -space-x-2">
                        ${onlineUsers.slice(0, 5).map(user => `
                            <div class="relative">
                                <img src="${user.avatar || '/default-avatar.png'}" 
                                     alt="${user.name}" 
                                     class="w-8 h-8 rounded-full border-2 border-white">
                                <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                        `).join('')}
                    </div>
                    ${onlineUsers.length > 5 ? `
                        <span class="text-sm text-gray-600">+${onlineUsers.length - 5} autres</span>
                    ` : ''}
                    <span class="text-sm text-gray-600">${onlineUsers.length} en ligne</span>
                </div>
            `;
        }
    }

    updateCursor(data) {
        // Afficher le curseur d'un autre utilisateur
        const cursorElement = document.getElementById(`cursor-${data.userId}`) || 
                             this.createCursorElement(data.userId, data.user);
        
        cursorElement.style.left = data.x + 'px';
        cursorElement.style.top = data.y + 'px';
        cursorElement.style.display = 'block';
    }

    createCursorElement(userId, user) {
        const cursor = document.createElement('div');
        cursor.id = `cursor-${userId}`;
        cursor.className = 'fixed pointer-events-none z-50 transition-all duration-100';
        cursor.innerHTML = `
            <div class="relative">
                <svg width="20" height="20" viewBox="0 0 20 20" class="text-blue-500">
                    <path fill="currentColor" d="M2 2l16 6-6 2-2 6z"/>
                </svg>
                <div class="absolute top-5 left-5 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    ${user.name}
                </div>
            </div>
        `;
        document.body.appendChild(cursor);
        return cursor;
    }

    showTypingIndicator(data) {
        const fieldElement = document.querySelector(`[data-field-id="${data.fieldId}"]`);
        if (fieldElement) {
            const indicator = document.createElement('div');
            indicator.className = 'absolute -top-6 left-0 text-xs text-blue-600 animate-pulse';
            indicator.textContent = `${data.user.name} tape...`;
            
            fieldElement.style.position = 'relative';
            fieldElement.appendChild(indicator);
            
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 3000);
        }
    }

    showConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status') || 
                             this.createConnectionStatusElement();
        
        const statusConfig = {
            connected: { color: 'green', icon: '🟢', text: 'Connecté' },
            disconnected: { color: 'red', icon: '🔴', text: 'Déconnecté' },
            reconnecting: { color: 'yellow', icon: '🟡', text: 'Reconnexion...' }
        };
        
        const config = statusConfig[status] || statusConfig.disconnected;
        
        statusElement.innerHTML = `
            <div class="flex items-center space-x-2 text-sm text-${config.color}-600">
                <span>${config.icon}</span>
                <span>${config.text}</span>
            </div>
        `;
    }

    createConnectionStatusElement() {
        const status = document.createElement('div');
        status.id = 'connection-status';
        status.className = 'fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-2 border';
        document.body.appendChild(status);
        return status;
    }

    handleError(message, error) {
        this.log('Error:', message, error);
        
        if (window.ErrorHandler) {
            ErrorHandler.handleError({
                type: 'NETWORK',
                message: message,
                originalError: error
            });
        }
    }

    log(...args) {
        if (this.config.debug) {
            console.log('[WebSocketManager]', ...args);
        }
    }

    /**
     * 🧹 Nettoyage
     */
    disconnect() {
        this.updatePresence('offline');
        this.stopHeartbeat();
        
        if (this.socket) {
            this.socket.close(1000, 'Client disconnect');
            this.socket = null;
        }
        
        this.isConnected = false;
        this.userPresence.clear();
        this.messageQueue = [];
    }

    /**
     * 📊 Statistiques
     */
    getStats() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            queuedMessages: this.messageQueue.length,
            onlineUsers: this.getOnlineUsers().length,
            totalUsers: this.userPresence.size,
            subscriptions: Object.keys(this.eventHandlers).reduce((acc, key) => {
                acc[key] = this.eventHandlers[key].length;
                return acc;
            }, {})
        };
    }

    /**
     * 🔧 Configuration des événements de page
     */
    setupEventListeners() {
        // Mettre à jour la présence lors du changement de page
        window.addEventListener('beforeunload', () => {
            this.updatePresence('offline');
        });

        // Gérer la visibilité de la page
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.updatePresence('away');
            } else {
                this.updatePresence('online', window.location.pathname);
            }
        });

        // Gérer les changements de focus
        window.addEventListener('focus', () => {
            this.updatePresence('online', window.location.pathname);
        });

        window.addEventListener('blur', () => {
            this.updatePresence('away');
        });
    }
}

// Instance globale
window.WebSocketManager = new WebSocketManager();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketManager;
}

/**
 * 🌐 UTILISATION EXEMPLES:
 * 
 * // Écouter les notifications
 * WebSocketManager.on('notification', (data) => {
 *     console.log('Nouvelle notification:', data);
 * });
 * 
 * // Rejoindre une collaboration
 * WebSocketManager.joinCollaboration('form-123', 'field-email');
 * 
 * // Envoyer une notification
 * WebSocketManager.broadcastNotification('Info', 'Nouveau formulaire créé');
 * 
 * // Mettre à jour la présence
 * WebSocketManager.updatePresence('busy', '/forms/edit/123');
 * 
 * // Signaler une modification
 * WebSocketManager.broadcastEdit('form-123', 'field-email', 'user@example.com');
 */
